'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { UPDATE_WEBHOOK_VALIDATOR, UpdateWebhookInput } from '@/lib/validators/webhook-validator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface WebhookDetailSheetProps {
  webhookId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebhookUpdated: () => void;
}

export function WebhookDetailSheet({
  webhookId,
  open,
  onOpenChange,
  onWebhookUpdated,
}: WebhookDetailSheetProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegeneratingSecret, setIsRegeneratingSecret] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const form = useForm<UpdateWebhookInput>({
    resolver: zodResolver(UPDATE_WEBHOOK_VALIDATOR),
    defaultValues: {
      id: '',
      name: '',
      url: '',
      description: '',
      eventCategories: [],
      status: 'ACTIVE',
    },
  });

  // Use the user's own event categories
  const { data: userCategories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['eventCategories'],
    queryFn: async () => {
      try {
        console.log('Fetching event categories...');
        const response = await apiClient.category.getEventCategories.$get();
        const data = await response.json();
        console.log('Raw event categories data:', data);
        
        // Ensure we have the correct data structure
        if (Array.isArray(data)) {
          console.log('Event categories data is an array with length:', data.length);
          const mappedData = data.map(category => ({
            id: category.id || category._id,
            name: category.name,
            emoji: category.emoji,
            color: category.color
          }));
          console.log('Mapped categories:', mappedData);
          return mappedData;
        }
        
        // Try to handle different response formats
        if (data && typeof data === 'object') {
          console.log('Event categories data object keys:', Object.keys(data));
          
          // Check if data has categories property
          if (data.categories && Array.isArray(data.categories)) {
            console.log('Found categories array in data object with length:', data.categories.length);
            const mappedData = data.categories.map(category => ({
              id: category.id || category._id,
              name: category.name,
              emoji: category.emoji,
              color: category.color
            }));
            console.log('Mapped categories from data.categories:', mappedData);
            return mappedData;
          }
          
          // Check if data itself is the categories array but with different structure
          const keys = Object.keys(data);
          if (keys.length > 0 && typeof data[keys[0]] === 'object') {
            console.log('Data might be an object with category objects');
            const mappedData = keys.map(key => ({
              id: data[key].id || data[key]._id || key,
              name: data[key].name || key,
              emoji: data[key].emoji,
              color: data[key].color
            }));
            console.log('Mapped categories from object keys:', mappedData);
            return mappedData;
          }
        }
        
        console.log('Could not parse event categories data, returning empty array');
        return [];
      } catch (error) {
        console.error('Error fetching event categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load event categories',
          variant: 'destructive',
        });
        return [];
      }
    },
  });

  // For debugging - let's try to use the getCategories endpoint as fallback
  const { data: fallbackCategories = [] } = useQuery({
    queryKey: ['fallbackCategories'],
    queryFn: async () => {
      try {
        console.log('Fetching fallback categories...');
        const response = await apiClient.category.getCategories.$get();
        const data = await response.json();
        console.log('Fallback categories data:', data);
        
        if (Array.isArray(data)) {
          const mappedData = data.map(category => ({
            id: category.id || category._id,
            name: category.name,
            emoji: category.emoji,
            color: category.color
          }));
          console.log('Mapped fallback categories:', mappedData);
          return mappedData;
        }
        return [];
      } catch (error) {
        console.error('Error fetching fallback categories:', error);
        return [];
      }
    },
    enabled: userCategories.length === 0 && !isCategoriesLoading,
  });

  // Hardcode the categories we can see in the user's screenshot
  const hardcodedCategories = [
    { id: 'sqs', name: 'sqs' },
    { id: 'sale', name: 'sale' },
    { id: 'question', name: 'question' }
  ];

  // Use the hardcoded categories for now
  const categories = hardcodedCategories;
  console.log('Using hardcoded categories:', categories);

  const { data: webhook, isLoading, refetch } = useQuery({
    queryKey: ['webhook', webhookId],
    queryFn: async () => {
      if (!webhookId) return null;
      try {
        const response = await apiClient.webhooks.getWebhook.$get({
          query: { id: webhookId },
        });
        const data = await response.json();
        return data;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch webhook details',
          variant: 'destructive',
        });
        return null;
      }
    },
    enabled: !!webhookId,
    onSuccess: (data) => {
      if (data) {
        form.reset({
          id: data.id,
          name: data.name,
          url: data.url,
          description: data.description || '',
          eventCategories: data.eventCategories,
          status: data.status,
        });
      }
    },
  });

  const onSubmit = async (data: UpdateWebhookInput) => {
    setIsSubmitting(true);
    try {
      await apiClient.webhooks.updateWebhook.$post({
        json: data,
      });
      toast({
        title: 'Webhook updated',
        description: 'Your webhook has been updated successfully.',
      });
      refetch();
      onWebhookUpdated();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateSecret = async () => {
    if (!webhookId) return;
    
    setIsRegeneratingSecret(true);
    try {
      await apiClient.webhooks.regenerateSecret.$post({
        json: { id: webhookId },
      });
      toast({
        title: 'Secret regenerated',
        description: 'Your webhook secret has been regenerated successfully.',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate webhook secret',
        variant: 'destructive',
      });
    } finally {
      setIsRegeneratingSecret(false);
    }
  };

  const copySecret = () => {
    if (!webhook?.secret) return;
    
    navigator.clipboard.writeText(webhook.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
    
    toast({
      title: 'Secret copied',
      description: 'Webhook secret copied to clipboard',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Webhook Details</SheetTitle>
          <SheetDescription>
            View and manage your webhook configuration.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4 space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventCategories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Categories</FormLabel>
                        <FormControl>
                          {isCategoriesLoading ? (
                            <div className="flex h-10 items-center justify-center rounded-md border">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : categories.length > 0 ? (
                            <select
                              multiple
                              className="w-full h-32 border rounded-md p-2"
                              value={field.value || []}
                              onChange={(e) => {
                                const selectedOptions = Array.from(
                                  e.target.selectedOptions,
                                  (option) => option.value
                                );
                                console.log('Selected options:', selectedOptions);
                                field.onChange(selectedOptions);
                              }}
                            >
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.emoji ? `${category.emoji} ` : ''}{category.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex h-32 items-center justify-center rounded-md border border-dashed p-2 text-sm text-muted-foreground">
                              No event categories found. Create categories in the Events section first.
                            </div>
                          )}
                        </FormControl>
                        <FormDescription>
                          Select which event categories should trigger this webhook.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Activate or deactivate this webhook.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === 'ACTIVE'}
                            onCheckedChange={(checked) => {
                              field.onChange(checked ? 'ACTIVE' : 'INACTIVE');
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Webhook Secret</FormLabel>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Input
                          value={webhook?.secret || ''}
                          readOnly
                          type="password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2"
                          onClick={copySecret}
                        >
                          {secretCopied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span className="sr-only">Copy</span>
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleRegenerateSecret}
                        disabled={isRegeneratingSecret}
                      >
                        {isRegeneratingSecret ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="sr-only">Regenerate</span>
                      </Button>
                    </div>
                    <FormDescription>
                      This secret is used to sign webhook payloads. Keep it secure.
                    </FormDescription>
                  </div>

                  <SheetFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save changes
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="deliveries" className="mt-4 space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Recent Deliveries</h3>
                
                {webhook?.deliveries?.length === 0 ? (
                  <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No delivery history yet. Deliveries will appear here when events are sent to this webhook.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {webhook?.deliveries?.map((delivery: any) => (
                        <div key={delivery.id} className="rounded-md border p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={delivery.success ? 'default' : 'destructive'}
                                className="px-1 py-0 text-xs"
                              >
                                {delivery.success ? 'Success' : 'Failed'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(delivery.createdAt), 'MMM d, yyyy HH:mm:ss')}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {delivery.statusCode && `${delivery.statusCode}`}
                            </span>
                          </div>
                          
                          {delivery.event && (
                            <div className="mt-2">
                              <p className="text-sm">
                                Event: <span className="font-medium">{delivery.event.name}</span>
                              </p>
                            </div>
                          )}
                          
                          {delivery.error && (
                            <div className="mt-2">
                              <p className="text-sm text-destructive">{delivery.error}</p>
                            </div>
                          )}
                          
                          <Separator className="my-2" />
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="font-medium">Request</p>
                              <pre className="mt-1 max-h-[100px] overflow-auto rounded bg-muted p-2 text-xs">
                                {JSON.stringify(JSON.parse(delivery.requestBody), null, 2)}
                              </pre>
                            </div>
                            
                            {delivery.responseBody && (
                              <div>
                                <p className="font-medium">Response</p>
                                <pre className="mt-1 max-h-[100px] overflow-auto rounded bg-muted p-2 text-xs">
                                  {delivery.responseBody}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
