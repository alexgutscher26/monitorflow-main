import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { startOfDay, startOfMonth, startOfWeek } from "date-fns"
import { z } from "zod"
import { CATEGORY_NAME_VALIDATOR } from "@/lib/validators/category-validator"
import { parseColor } from "@/utils"
import { HTTPException } from "hono/http-exception"

export const categoryRouter = router({
  // Get all event categories for webhooks
  getCategories: privateProcedure.query(async ({ c, ctx }) => {
    const { user } = ctx;

    const categories = await db.eventCategory.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return c.superjson(categories);
  }),

  getEventCategories: privateProcedure.query(async ({ c, ctx }) => {
    const now = new Date()
    const firstDayOfMonth = startOfMonth(now)

    const categories = await db.eventCategory.findMany({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        name: true,
        emoji: true,
        color: true,
        updatedAt: true,
        createdAt: true,
        events: {
          where: { createdAt: { gte: firstDayOfMonth } },
          select: {
            fields: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            events: {
              where: { createdAt: { gte: firstDayOfMonth } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const categoriesWithCounts = categories.map((category) => {
      const uniqueFieldNames = new Set<string>()
      let lastPing: Date | null = null

      category.events.forEach((event) => {
        Object.keys(event.fields as object).forEach((fieldName) => {
          uniqueFieldNames.add(fieldName)
        })
        if (!lastPing || event.createdAt > lastPing) {
          lastPing = event.createdAt
        }
      })

      return {
        id: category.id,
        name: category.name,
        emoji: category.emoji,
        color: category.color,
        updatedAt: category.updatedAt,
        createdAt: category.createdAt,
        uniqueFieldCount: uniqueFieldNames.size,
        eventsCount: category._count.events,
        lastPing,
      }
    })

    return c.superjson({ categories: categoriesWithCounts })
  }),

  deleteCategory: privateProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ c, input, ctx }) => {
      const { name } = input

      await db.eventCategory.delete({
        where: { name_userId: { name, userId: ctx.user.id } },
      })

      return c.json({ success: true })
    }),

  createEventCategory: privateProcedure
    .input(
      z.object({
        name: CATEGORY_NAME_VALIDATOR,
        color: z
          .string()
          .min(1, "Color is required")
          .regex(/^#[0-9A-F]{6}$/i, "Invalid color format."),
        emoji: z.string().emoji("Invalid emoji").optional(),
      })
    )
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx
      const { color, name, emoji } = input

      // TODO: ADD PAID PLAN LOGIC

      const eventCategory = await db.eventCategory.create({
        data: {
          name: name.toLowerCase(),
          color: parseColor(color),
          emoji,
          userId: user.id,
        },
      })

      return c.json({ eventCategory })
    }),

  insertQuickstartCategories: privateProcedure.mutation(async ({ ctx, c }) => {
    const categories = await db.eventCategory.createMany({
      data: [
        { name: "bug", emoji: "🐛", color: 0xff6b6b },
        { name: "sale", emoji: "💰", color: 0xffeb3b },
        { name: "question", emoji: "🤔", color: 0x6c5ce7 },
      ].map((category) => ({
        ...category,
        userId: ctx.user.id,
      })),
    })

    return c.json({ success: true, count: categories.count })
  }),

  pollCategory: privateProcedure
    .input(z.object({ name: CATEGORY_NAME_VALIDATOR }))
    .query(async ({ c, ctx, input }) => {
      const { name } = input

      const category = await db.eventCategory.findUnique({
        where: { name_userId: { name, userId: ctx.user.id } },
        include: {
          _count: {
            select: {
              events: true,
            },
          },
        },
      })

      if (!category) {
        throw new HTTPException(404, {
          message: `Category "${name}" not found`,
        })
      }

      const hasEvents = category._count.events > 0

      return c.json({ hasEvents })
    }),

  getEventsByCategoryName: privateProcedure
    .input(
      z.object({
        name: CATEGORY_NAME_VALIDATOR,
        page: z.number(),
        limit: z.number().max(50),
        timeRange: z.enum(["today", "week", "month"]),
        acknowledgmentFilter: z.enum(["all", "acknowledged", "unacknowledged"]).optional().default("all"),
      })
    )
    .query(async ({ c, ctx, input }) => {
      const { name, page, limit, timeRange, acknowledgmentFilter } = input

      const now = new Date()
      let startDate: Date

      switch (timeRange) {
        case "today":
          startDate = startOfDay(now)
          break
        case "week":
          startDate = startOfWeek(now, { weekStartsOn: 0 })
          break
        case "month":
          startDate = startOfMonth(now)
          break
      }

      // Add filter for acknowledgment status
      const acknowledgmentCondition = acknowledgmentFilter === "all" 
        ? {} 
        : { acknowledged: acknowledgmentFilter === "acknowledged" };

      const [events, eventsCount, uniqueFieldCount] = await Promise.all([
        db.event.findMany({
          where: {
            EventCategory: { name, userId: ctx.user.id },
            createdAt: { gte: startDate },
            ...acknowledgmentCondition,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        db.event.count({
          where: {
            EventCategory: { name, userId: ctx.user.id },
            createdAt: { gte: startDate },
            ...acknowledgmentCondition,
          },
        }),
        db.event
          .findMany({
            where: {
              EventCategory: { name, userId: ctx.user.id },
              createdAt: { gte: startDate },
            },
            select: {
              fields: true,
            },
            distinct: ["fields"],
          })
          .then((events) => {
            const fieldNames = new Set<string>()
            events.forEach((event) => {
              Object.keys(event.fields as object).forEach((fieldName) => {
                fieldNames.add(fieldName)
              })
            })
            return fieldNames.size
          }),
      ])

      return c.superjson({
        events,
        eventsCount,
        uniqueFieldCount,
      })
    }),

  acknowledgeEvent: privateProcedure
    .input(
      z.object({
        eventId: z.string(),
        acknowledged: z.boolean(),
      })
    )
    .mutation(async ({ c, ctx, input }) => {
      const { eventId, acknowledged } = input;
      
      const event = await db.event.findUnique({
        where: { id: eventId },
        select: { userId: true },
      });
      
      if (!event) {
        throw new HTTPException(404, { message: "Event not found" });
      }
      
      if (event.userId !== ctx.user.id) {
        throw new HTTPException(403, { message: "Unauthorized" });
      }
      
      await db.event.update({
        where: { id: eventId },
        data: { 
          acknowledged,
          acknowledgedAt: acknowledged ? new Date() : null,
        },
      });
      
      return c.json({ success: true });
    }),
    
  acknowledgeMultipleEvents: privateProcedure
    .input(
      z.object({
        eventIds: z.array(z.string()),
        acknowledged: z.boolean(),
      })
    )
    .mutation(async ({ c, ctx, input }) => {
      const { eventIds, acknowledged } = input;
      
      // Verify all events belong to the user
      const events = await db.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, userId: true },
      });
      
      const unauthorizedEvents = events.filter(event => event.userId !== ctx.user.id);
      
      if (unauthorizedEvents.length > 0) {
        throw new HTTPException(403, { message: "Unauthorized access to one or more events" });
      }
      
      // Update all events
      await db.event.updateMany({
        where: { id: { in: eventIds } },
        data: { 
          acknowledged,
          acknowledgedAt: acknowledged ? new Date() : null,
        },
      });
      
      return c.json({ 
        success: true,
        count: events.length,
      });
    }),
})
