import { FREE_QUOTA, PRO_QUOTA } from "@/config"
import { db } from "@/db"
import { DiscordClient } from "@/lib/discord-client"
import { WebhookClient, WebhookPayload } from "@/lib/webhook-client"
import { CATEGORY_NAME_VALIDATOR } from "@/lib/validators/category-validator"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"

const REQUEST_VALIDATOR = z
  .object({
    category: CATEGORY_NAME_VALIDATOR,
    fields: z.record(z.string().or(z.number()).or(z.boolean())).optional(),
    description: z.string().min(1, "Description must not be empty").max(1000, "Description must be less than 1000 characters").optional(),
  })
  .strict()
  .refine((data) => {
    if (data.fields) {
      return Object.keys(data.fields).length <= 10
    }
    return true
  }, "Maximum 10 fields allowed")

export const POST = async (req: NextRequest) => {
  try {
    // Rate limiting check
    const ip = req.headers.get("x-forwarded-for") || req.ip
    const rateLimitKey = `rate_limit:${ip}`
    const rateLimit = await db.rateLimit.findUnique({
      where: { key: rateLimitKey },
    })

    if (rateLimit && rateLimit.count >= 100 && rateLimit.resetAt > new Date()) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Update rate limit
    await db.rateLimit.upsert({
      where: { key: rateLimitKey },
      create: {
        key: rateLimitKey,
        count: 1,
        resetAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
      update: {
        count: { increment: 1 },
      },
    })
    const authHeader = req.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "Invalid auth header format. Expected: 'Bearer [API_KEY]'",
        },
        { status: 401 }
      )
    }

    const apiKey = authHeader.split(" ")[1]

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json({ message: "Invalid API key" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { apiKey },
      include: { 
        EventCategories: {
          select: {
            id: true,
            name: true,
            emoji: true,
            color: true
          }
        } 
      },
    })

    if (!user) {
      return NextResponse.json({ message: "Invalid API key" }, { status: 401 })
    }

    if (!user.discordId) {
      return NextResponse.json(
        {
          message: "Please enter your discord ID in your account settings",
        },
        { status: 403 }
      )
    }

    // ACTUAL LOGIC
    const currentData = new Date()
    const currentMonth = currentData.getMonth() + 1
    const currentYear = currentData.getFullYear()

    const quota = await db.quota.findUnique({
      where: {
        userId: user.id,
        month: currentMonth,
        year: currentYear,
      },
    })

    const quotaLimit =
      user.plan === "FREE"
        ? FREE_QUOTA.maxEventsPerMonth
        : PRO_QUOTA.maxEventsPerMonth

    if (quota && quota.count >= quotaLimit) {
      return NextResponse.json(
        {
          message:
            "Monthly quota reached. Please upgrade your plan for more events",
        },
        { status: 429 }
      )
    }

    const discord = new DiscordClient(process.env.DISCORD_BOT_TOKEN)

    const dmChannel = await discord.createDM(user.discordId)

    let requestData: unknown

    try {
      requestData = await req.json()
    } catch (err) {
      return NextResponse.json(
        {
          message: "Invalid JSON request body",
        },
        { status: 400 }
      )
    }

    const validationResult = REQUEST_VALIDATOR.parse(requestData)

    const category = user.EventCategories.find(
      (cat) => cat.name === validationResult.category
    )

    if (!category) {
      return NextResponse.json(
        {
          message: `You dont have a category named "${validationResult.category}"`,
        },
        { status: 404 }
      )
    }

    const eventData = {
      title: `${category.emoji || "🔔"} ${
        category.name.charAt(0).toUpperCase() + category.name.slice(1)
      }`,
      description:
        validationResult.description ||
        `A new ${category.name} event has occurred!`,
      color: category.color,
      timestamp: new Date().toISOString(),
      fields: Object.entries(validationResult.fields || {}).map(
        ([key, value]) => {
          return {
            name: key,
            value: String(value),
            inline: true,
          }
        }
      ),
    }

    const event = await db.event.create({
      data: {
        name: category.name,
        formattedMessage: `${eventData.title}\n\n${eventData.description}`,
        userId: user.id,
        fields: validationResult.fields || {},
        eventCategoryId: category.id,
      },
    })

    // Find all active webhooks that should receive this event
    const webhooks = await db.webhook.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
        eventCategories: {
          has: category.name,
        },
      },
    });

    // Process webhooks in parallel with Discord notification
    const webhookPromises = webhooks.map(async (webhook) => {
      try {
        // Create webhook payload
        const webhookPayload: WebhookPayload = {
          id: crypto.randomUUID(),
          event: {
            id: event.id,
            name: event.name,
            category: category.name,
            fields: event.fields as Record<string, any>,
            createdAt: event.createdAt.toISOString(),
          },
          timestamp: new Date().toISOString(),
          account: {
            id: user.id,
          },
        };

        // Send webhook
        const result = await WebhookClient.sendWebhook(
          webhook.url,
          webhookPayload,
          webhook.secret,
          webhook.headers as Record<string, string> || {}
        );

        // Record delivery
        await db.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            eventId: event.id,
            requestBody: JSON.stringify(webhookPayload),
            responseBody: result.responseBody,
            statusCode: result.statusCode,
            success: result.success,
            error: result.error,
          },
        });

        return result;
      } catch (error) {
        console.error(`Error sending webhook ${webhook.id}:`, error);
        
        // Record failed delivery
        await db.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            eventId: event.id,
            requestBody: JSON.stringify({
              event: {
                id: event.id,
                name: event.name,
                category: category.name,
                fields: event.fields,
              },
            }),
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
        
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    });

    try {
      await Promise.all([
        discord.sendEmbed(dmChannel.id, eventData),
        db.event.update({
          where: { id: event.id },
          data: { deliveryStatus: "DELIVERED" },
        }),
        db.quota.upsert({
          where: { userId: user.id, month: currentMonth, year: currentYear },
          update: { count: { increment: 1 } },
          create: {
            userId: user.id,
            month: currentMonth,
            year: currentYear,
            count: 1,
          },
        }),
        ...webhookPromises
      ])
    } catch (err) {
      console.error("Discord delivery error:", err)
      
      await db.event.update({
        where: { id: event.id },
        data: { 
          deliveryStatus: "FAILED",
          error: err instanceof Error ? err.message : "Unknown error"
        },
      })

      return NextResponse.json(
        {
          message: "Failed to deliver event to Discord",
          eventId: event.id,
          error: err instanceof Error ? err.message : "Unknown error"
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Event processed successfully",
      eventId: event.id,
    })
  } catch (err) {
    console.error(err)

    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.message }, { status: 422 })
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
