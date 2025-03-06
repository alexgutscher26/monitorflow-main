import { z } from 'zod';
import { router } from '../__internals/router';
import { privateProcedure } from '../procedures';
import { db } from '@/db';
import { 
  CREATE_WEBHOOK_VALIDATOR, 
  UPDATE_WEBHOOK_VALIDATOR, 
  DELETE_WEBHOOK_VALIDATOR 
} from '@/lib/validators/webhook-validator';
import * as CryptoJS from 'crypto-js';
import { FREE_QUOTA, PRO_QUOTA } from '@/config';

export const webhookRouter = router({
  // Get all webhooks for the current user
  getWebhooks: privateProcedure.query(async ({ c, ctx }) => {
    const { user } = ctx;

    const webhooks = await db.webhook.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return c.superjson(webhooks);
  }),

  // Get a single webhook by ID
  getWebhook: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ c, ctx, input }) => {
      const { user } = ctx;
      const { id } = input;

      const webhook = await db.webhook.findFirst({
        where: { id, userId: user.id },
        include: {
          deliveries: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      return c.superjson(webhook);
    }),

  // Create a new webhook
  createWebhook: privateProcedure
    .input(CREATE_WEBHOOK_VALIDATOR)
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx;
      const { name, url, description, eventCategories, headers } = input;

      // Check if webhook with same name already exists
      const existingWebhook = await db.webhook.findFirst({
        where: { name, userId: user.id },
      });

      if (existingWebhook) {
        throw new Error(`A webhook with the name "${name}" already exists`);
      }

      // Get user's plan limits
      const limits = user.plan === "PRO" ? PRO_QUOTA : FREE_QUOTA;

      // Count existing webhooks
      const webhookCount = await db.webhook.count({
        where: { userId: user.id },
      });

      // Check if user has reached their webhook limit
      if (webhookCount >= limits.maxWebhooks) {
        throw new Error(
          `You have reached your limit of ${limits.maxWebhooks} webhook${
            limits.maxWebhooks === 1 ? '' : 's'
          }. Please upgrade to the Pro plan for unlimited webhooks.`
        );
      }

      // Generate a random secret for the webhook
      const secret = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);

      const webhook = await db.webhook.create({
        data: {
          name,
          url,
          description,
          secret,
          eventCategories,
          headers: headers || {},
          userId: user.id,
        },
      });

      return c.superjson(webhook);
    }),

  // Update an existing webhook
  updateWebhook: privateProcedure
    .input(UPDATE_WEBHOOK_VALIDATOR)
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx;
      const { id, name, url, description, eventCategories, headers, status } = input;

      // Check if webhook exists and belongs to user
      const webhook = await db.webhook.findFirst({
        where: { id, userId: user.id },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      // Check if another webhook with the same name exists
      if (name !== webhook.name) {
        const existingWebhook = await db.webhook.findFirst({
          where: { 
            name, 
            userId: user.id,
            id: { not: id },
          },
        });

        if (existingWebhook) {
          throw new Error(`A webhook with the name "${name}" already exists`);
        }
      }

      const updatedWebhook = await db.webhook.update({
        where: { id },
        data: {
          name,
          url,
          description,
          eventCategories,
          headers: headers || {},
          status,
        },
      });

      return c.superjson(updatedWebhook);
    }),

  // Delete a webhook
  deleteWebhook: privateProcedure
    .input(DELETE_WEBHOOK_VALIDATOR)
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx;
      const { id } = input;

      // Check if webhook exists and belongs to user
      const webhook = await db.webhook.findFirst({
        where: { id, userId: user.id },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      await db.webhook.delete({
        where: { id },
      });

      return c.json({ success: true });
    }),

  // Regenerate webhook secret
  regenerateSecret: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx;
      const { id } = input;

      // Check if webhook exists and belongs to user
      const webhook = await db.webhook.findFirst({
        where: { id, userId: user.id },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      // Generate a new secret
      const secret = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);

      const updatedWebhook = await db.webhook.update({
        where: { id },
        data: { secret },
      });

      return c.superjson(updatedWebhook);
    }),

  // Get webhook deliveries
  getWebhookDeliveries: privateProcedure
    .input(z.object({ 
      webhookId: z.string(),
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ c, ctx, input }) => {
      const { user } = ctx;
      const { webhookId, limit, cursor } = input;

      // Check if webhook exists and belongs to user
      const webhook = await db.webhook.findFirst({
        where: { id: webhookId, userId: user.id },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const deliveries = await db.webhookDelivery.findMany({
        where: { webhookId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (deliveries.length > limit) {
        const nextItem = deliveries.pop();
        nextCursor = nextItem?.id;
      }

      return c.superjson({
        items: deliveries,
        nextCursor,
      });
    }),
});
