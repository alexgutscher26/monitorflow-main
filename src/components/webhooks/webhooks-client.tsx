'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WebhookList } from './webhook-list';
import { WebhookCreateButton } from './webhook-create-button';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { FREE_QUOTA, PRO_QUOTA } from '@/config';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function WebhooksClient() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch user's plan
  const { data: userPlan } = useQuery({
    queryKey: ['user-plan'],
    queryFn: async () => {
      try {
        const response = await apiClient.payment.getUserPlan.$get();
        const data = await response.json();
        return data.plan;
      } catch (error) {
        console.error('Error fetching user plan:', error);
        return 'FREE'; // Default to free plan if there's an error
      }
    },
  });

  const { data: webhooks, isLoading, refetch } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      try {
        console.log('Fetching webhooks...');
        const response = await apiClient.webhooks.getWebhooks.$get();
        console.log('Webhooks response:', response);
        
        const data = await response.json();
        console.log('Webhooks data:', data);
        
        // Get actual webhooks from API
        let apiWebhooks = [];
        if (Array.isArray(data)) {
          console.log('Webhooks data is an array with length:', data.length);
          apiWebhooks = data;
        } else if (data && typeof data === 'object') {
          console.log('Webhooks data object keys:', Object.keys(data));
          
          // Check if data has webhooks property
          if (data.webhooks && Array.isArray(data.webhooks)) {
            console.log('Found webhooks array in data object with length:', data.webhooks.length);
            apiWebhooks = data.webhooks;
          }
        }
        
        // Only use mock webhooks if no real webhooks and within limits
        if (apiWebhooks.length === 0) {
          try {
            const mockWebhooks = JSON.parse(localStorage.getItem('mockWebhooks') || '[]');
            console.log('Found mock webhooks:', mockWebhooks);
            
            // Only use mock webhooks if within plan limits
            const limits = userPlan === 'PRO' ? Infinity : 1;
            if (mockWebhooks.length <= limits) {
              console.log('Using mock webhooks within limits');
              return mockWebhooks;
            } else {
              console.log('Mock webhooks exceed plan limits, limiting to:', limits);
              return mockWebhooks.slice(0, limits);
            }
          } catch (localStorageError) {
            console.error('Error fetching mock webhooks:', localStorageError);
          }
        }
        
        return apiWebhooks;
      } catch (error) {
        console.error('Error fetching webhooks from API:', error);
        
        // Try to get mock webhooks from localStorage as fallback
        try {
          const mockWebhooks = JSON.parse(localStorage.getItem('mockWebhooks') || '[]');
          console.log('Using mock webhooks from localStorage:', mockWebhooks);
          
          // Only use mock webhooks if within plan limits
          const limits = userPlan === 'PRO' ? Infinity : 1;
          if (mockWebhooks.length <= limits) {
            return mockWebhooks;
          } else {
            return mockWebhooks.slice(0, limits);
          }
        } catch (localStorageError) {
          console.error('Error fetching mock webhooks:', localStorageError);
        }
        
        toast({
          title: 'Error',
          description: 'Failed to load webhooks',
          variant: 'destructive',
        });
        return [];
      }
    },
  });

  const onWebhookCreated = () => {
    console.log('Webhook created, refreshing list...');
    setIsCreating(false);
    refetch().then(result => {
      console.log('Refetch result:', result);
    }).catch(error => {
      console.error('Error refetching webhooks:', error);
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Webhooks</h2>
        <div className="flex items-center gap-2">
          {userPlan === 'FREE' && webhooks?.length >= FREE_QUOTA.maxWebhooks && (
            <div className="flex items-center">
              <Link href="/dashboard/upgrade">
                <Button variant="outline" className="mr-2">
                  Upgrade to Pro
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">
                {FREE_QUOTA.maxWebhooks} of {FREE_QUOTA.maxWebhooks} webhooks used
              </span>
            </div>
          )}
          <WebhookCreateButton
            isCreating={isCreating}
            onClick={() => setIsCreating(true)}
            onWebhookCreated={onWebhookCreated}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      </div>
      {webhooks?.length ? (
        <WebhookList webhooks={webhooks} onWebhookUpdated={() => refetch()} />
      ) : (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="webhook" />
          <EmptyPlaceholder.Title>No webhooks created</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            You don&apos;t have any webhooks yet. Create one to get started.
          </EmptyPlaceholder.Description>
        </EmptyPlaceholder>
      )}
    </div>
  );
}
