# MonitorFlow Webhooks Documentation

## Overview

MonitorFlow webhooks allow you to receive real-time notifications when specific events occur in your application. Instead of polling our API for changes, webhooks push data to your server as events happen, enabling you to build responsive integrations.

## Plan Limits

MonitorFlow offers different webhook limits based on your subscription plan:

| Plan | Webhook Limit | Description |
|------|--------------|-------------|
| Free | 1 webhook    | Limited to a single webhook for basic integrations |
| Pro  | Unlimited    | Create as many webhooks as needed for comprehensive integrations |

Upgrade to the Pro plan to remove webhook limitations and access additional features.

## Getting Started

### 1. Create a Webhook

Create a webhook in the MonitorFlow dashboard by navigating to the Webhooks section and clicking "Create Webhook". You'll need to provide:

- **Name**: A descriptive name for your webhook
- **URL**: An HTTPS endpoint on your server that will receive webhook payloads
- **Event Categories**: The types of events you want to receive notifications for
- **Description** (optional): Additional context about the webhook's purpose

### 2. Set Up Your Endpoint

Your endpoint should:
- Accept POST requests
- Parse JSON request bodies
- Return a 2xx status code promptly (within 10 seconds)
- Be publicly accessible and served over HTTPS

## Webhook Payloads

### Payload Structure

All webhook payloads follow this structure:

```json
{
  "id": "evt_123456789",
  "event": "category.event_name",
  "createdAt": "2025-03-06T06:11:45Z",
  "data": {
    // Event-specific data
  },
  "webhookId": "whk_abcdefghij"
}
```

### Event Categories

MonitorFlow supports these event categories:

| Category | Description | Example Events |
|----------|-------------|----------------|
| `sqs` | SQS-related events | `sqs.message_received`, `sqs.queue_created` |
| `sale` | Sales-related events | `sale.created`, `sale.completed`, `sale.refunded` |
| `question` | User question events | `question.asked`, `question.answered` |

## Security

### Verifying Webhooks

Every webhook request includes a signature in the `X-MonitorFlow-Signature` header. Verify this signature to ensure the request came from MonitorFlow:

```typescript
import * as crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}
```

### Best Practices

1. **Store your webhook secret securely** - Never expose it in client-side code
2. **Implement signature verification** - Validate all incoming webhooks
3. **Use HTTPS endpoints** - All webhook URLs must use HTTPS
4. **Respond quickly** - Return a 2xx status code promptly
5. **Implement idempotency** - Handle duplicate webhook deliveries gracefully

## Handling Webhooks

### Example: Express.js Implementation

```typescript
import express from 'express';
import * as crypto from 'crypto';

const app = express();
const webhookSecret = process.env.MONITORFLOW_WEBHOOK_SECRET;

// Parse JSON bodies
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.post('/webhook', (req: any, res) => {
  const signature = req.headers['x-monitorflow-signature'];
  
  // Verify signature
  if (!verifyWebhookSignature(req.rawBody, signature, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body;
  
  // Handle different event types
  switch (event.event) {
    case 'sqs.message_received':
      // Handle SQS message
      console.log('SQS message received:', event.data);
      break;
    case 'sale.created':
      // Handle new sale
      console.log('New sale created:', event.data);
      break;
    default:
      console.log('Unhandled event type:', event.event);
  }
  
  // Acknowledge receipt
  res.status(200).send('Webhook received');
});

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return signature === digest;
}

app.listen(3000, () => {
  console.log('Webhook receiver running on port 3000');
});
```

### Example: Next.js API Route

```typescript
// pages/api/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import * as crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-monitorflow-signature'] as string;
    const webhookSecret = process.env.MONITORFLOW_WEBHOOK_SECRET;

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody);
    
    // Process the event based on its type
    // ...

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Webhook error' });
  }
}

// Helper functions
async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return signature === digest;
}
```

## Troubleshooting

### Common Issues

1. **Webhook not being delivered**
   - Ensure your endpoint is publicly accessible
   - Check that your server is running and can accept connections
   - Verify your firewall isn't blocking incoming requests

2. **Signature verification failing**
   - Confirm you're using the correct webhook secret
   - Ensure you're verifying against the raw request body
   - Check that your signature calculation matches our algorithm

3. **Webhook payload processing errors**
   - Implement proper error handling in your webhook processor
   - Log the full payload for debugging purposes
   - Ensure your server can handle the payload size

### Webhook Delivery Logs

MonitorFlow keeps logs of webhook delivery attempts for 7 days. You can view these logs in the webhook details page to troubleshoot delivery issues.

## Rate Limits and Quotas

- **Concurrent Webhooks**: Up to 10 concurrent webhook deliveries per account
- **Retry Attempts**: Failed deliveries are retried up to 5 times with exponential backoff
- **Payload Size**: Maximum payload size is 256KB

## API Reference

### Webhook Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the webhook |
| `name` | string | Name of the webhook |
| `url` | string | HTTPS URL where payloads are sent |
| `description` | string | Optional description of the webhook |
| `eventCategories` | string[] | Array of event categories this webhook subscribes to |
| `secret` | string | Secret used to sign webhook payloads (only shown once) |
| `status` | string | Current status: "ACTIVE" or "INACTIVE" |
| `createdAt` | string | ISO timestamp when the webhook was created |
| `updatedAt` | string | ISO timestamp when the webhook was last updated |

## Support

If you encounter any issues with webhooks, please contact our support team at support@monitorflow.com or open an issue on our GitHub repository.
