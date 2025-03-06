/**
 * Webhook Database Cleanup Script
 * 
 * This script fixes the webhook count issue by:
 * 1. Identifying all webhooks in the database
 * 2. Keeping only the most recent webhook for each user
 * 3. Deleting any orphaned or duplicate webhooks
 * 
 * Run with: pnpm tsx scripts/fix-webhook-count.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixWebhookCount() {
  console.log('Starting webhook database cleanup...');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    console.log(`Found ${users.length} users in the database`);
    
    // Process each user
    for (const user of users) {
      console.log(`\nProcessing user: ${user.email} (${user.id})`);
      
      // Get all webhooks for this user
      const webhooks = await prisma.webhook.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`Found ${webhooks.length} webhooks for this user`);
      
      if (webhooks.length <= 1) {
        console.log('User has 0 or 1 webhook, no cleanup needed');
        continue;
      }
      
      // Keep only the most recent webhook (first in the array due to desc ordering)
      const webhooksToDelete = webhooks.slice(1);
      
      console.log(`Keeping webhook: ${webhooks[0].name} (${webhooks[0].id})`);
      console.log(`Deleting ${webhooksToDelete.length} extra webhooks`);
      
      // Delete the extra webhooks
      for (const webhook of webhooksToDelete) {
        await prisma.webhook.delete({
          where: { id: webhook.id }
        });
        console.log(`Deleted webhook: ${webhook.name} (${webhook.id})`);
      }
    }
    
    console.log('\nWebhook cleanup completed successfully!');
  } catch (error) {
    console.error('Error during webhook cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup function
fixWebhookCount();
