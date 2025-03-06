import { Metadata } from 'next';
import { WebhooksClient } from '@/components/webhooks/webhooks-client';

import { DashboardShell } from '@/components/dashboard-shell';
import { DashboardHeader } from '@/components/dashboard-header';

export const metadata: Metadata = {
  title: 'Webhooks',
  description: 'Manage your webhook integrations',
};

export default function WebhooksPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Webhooks"
        text="Manage your webhook integrations to connect MonitorFlow with your own services."
      />
      <div className="grid gap-8">
        <WebhooksClient />
      </div>
    </DashboardShell>
  );
}
