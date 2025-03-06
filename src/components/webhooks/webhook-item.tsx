'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Trash, Edit, Power, PowerOff, ExternalLink } from 'lucide-react';

interface WebhookItemProps {
  webhook: any;
  onClick: () => void;
  onWebhookUpdated: () => void;
}

export function WebhookItem({ webhook, onClick, onWebhookUpdated }: WebhookItemProps) {
  const { toast } = useToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await apiClient.webhooks.deleteWebhook.$post({
        json: { id: webhook.id },
      });
      toast({
        title: 'Webhook deleted',
        description: 'Your webhook has been deleted successfully.',
      });
      onWebhookUpdated();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const toggleStatus = async () => {
    setIsLoading(true);
    try {
      await apiClient.webhooks.updateWebhook.$post({
        json: {
          id: webhook.id,
          name: webhook.name,
          url: webhook.url,
          description: webhook.description,
          eventCategories: webhook.eventCategories,
          headers: webhook.headers,
          status: webhook.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
        },
      });
      toast({
        title: `Webhook ${webhook.status === 'ACTIVE' ? 'deactivated' : 'activated'}`,
        description: `Your webhook has been ${webhook.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully.`,
      });
      onWebhookUpdated();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update webhook status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4">
        <div className="grid gap-1" onClick={onClick}>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{webhook.name}</span>
            <Badge variant={webhook.status === 'ACTIVE' ? 'default' : 'outline'}>
              {webhook.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate max-w-[300px]">{webhook.url}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                window.open(webhook.url, '_blank');
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">Open URL</span>
            </Button>
          </div>
          {webhook.description && (
            <p className="text-sm text-muted-foreground">{webhook.description}</p>
          )}
          <div className="mt-1 flex flex-wrap gap-1">
            {webhook.eventCategories.map((category: string) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleStatus}>
              {webhook.status === 'ACTIVE' ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  <span>Activate</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the webhook "{webhook.name}" and all its delivery history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
