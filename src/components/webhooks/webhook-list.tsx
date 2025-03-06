'use client';

import { useState } from 'react';
import { WebhookItem } from './webhook-item';
import { WebhookDetailSheet } from './webhook-detail-sheet';

interface WebhookListProps {
  webhooks: any[];
  onWebhookUpdated: () => void;
}

export function WebhookList({ webhooks, onWebhookUpdated }: WebhookListProps) {
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border rounded-md border">
      {webhooks.map((webhook) => (
        <WebhookItem
          key={webhook.id}
          webhook={webhook}
          onClick={() => setSelectedWebhook(webhook.id)}
          onWebhookUpdated={onWebhookUpdated}
        />
      ))}
      
      <WebhookDetailSheet
        webhookId={selectedWebhook}
        open={!!selectedWebhook}
        onOpenChange={(open) => {
          if (!open) setSelectedWebhook(null);
        }}
        onWebhookUpdated={onWebhookUpdated}
      />
    </div>
  );
}
