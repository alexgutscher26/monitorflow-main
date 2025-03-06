import { z } from 'zod';

export const WEBHOOK_NAME_VALIDATOR = z
  .string()
  .min(1, 'Name must not be empty')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9-_\s]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores');

export const WEBHOOK_URL_VALIDATOR = z
  .string()
  .url('Must be a valid URL')
  .startsWith('https://', 'URL must use HTTPS for security');

export const CREATE_WEBHOOK_VALIDATOR = z.object({
  name: WEBHOOK_NAME_VALIDATOR,
  url: WEBHOOK_URL_VALIDATOR,
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  eventCategories: z.array(z.string()).min(1, 'At least one event category must be selected'),
  headers: z.record(z.string()).optional(),
});

export const UPDATE_WEBHOOK_VALIDATOR = z.object({
  id: z.string().min(1, 'Webhook ID is required'),
  name: WEBHOOK_NAME_VALIDATOR,
  url: WEBHOOK_URL_VALIDATOR,
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  eventCategories: z.array(z.string()).min(1, 'At least one event category must be selected'),
  headers: z.record(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const DELETE_WEBHOOK_VALIDATOR = z.object({
  id: z.string().min(1, 'Webhook ID is required'),
});

export type CreateWebhookInput = z.infer<typeof CREATE_WEBHOOK_VALIDATOR>;
export type UpdateWebhookInput = z.infer<typeof UPDATE_WEBHOOK_VALIDATOR>;
export type DeleteWebhookInput = z.infer<typeof DELETE_WEBHOOK_VALIDATOR>;
