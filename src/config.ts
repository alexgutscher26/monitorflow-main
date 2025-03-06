// 👇 constant value in all uppercase
export const FREE_QUOTA = {
  maxEventsPerMonth: 100,
  maxEventCategories: 3,
  maxWebhooks: 1,
} as const

export const PRO_QUOTA = {
  maxEventsPerMonth: 1000,
  maxEventCategories: 10,
  maxWebhooks: Infinity, // Unlimited webhooks for paid plans
} as const
