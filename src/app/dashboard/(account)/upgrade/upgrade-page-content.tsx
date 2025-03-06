"use client"

import { Card } from "@/components/ui/card"
import { client } from "@/lib/client"
import { Plan } from "@prisma/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { BarChart, Loader2, Webhook } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { FREE_QUOTA, PRO_QUOTA } from "@/config"

interface UsageData {
  eventsUsed: number
  eventsLimit: number
  categoriesUsed: number
  categoriesLimit: number
  webhooksUsed: number
  webhooksLimit: number
  resetDate: string
}

export const UpgradePageContent = ({ plan }: { plan: Plan }) => {
  const router = useRouter()

  const { mutate: createCheckoutSession, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.payment.createCheckoutSession.$post()
      return await res.json()
    },
    onSuccess: ({ url }) => {
      if (url) router.push(url)
    },
    onError: () => {
      toast.error("Failed to create checkout session. Please try again.")
    },
  })

  const { data: usageData, isLoading } = useQuery<UsageData>({
    queryKey: ["usage"],
    queryFn: async (): Promise<UsageData> => {
      const res = await client.project.getUsage.$get()
      const data = await res.json()
      
      // Get webhook count
      let webhooksUsed = 0;
      try {
        const webhooksRes = await client.webhooks.getWebhooks.$get();
        const webhooksData = await webhooksRes.json();
        
        // Only count actual webhooks from the API, not mock webhooks
        if (Array.isArray(webhooksData)) {
          // Count visible webhooks instead of relying on database count
          webhooksUsed = webhooksData.length;
          console.log('Webhook count from API (array):', webhooksUsed);
        } else if (webhooksData && typeof webhooksData === 'object' && webhooksData.webhooks && Array.isArray(webhooksData.webhooks)) {
          webhooksUsed = webhooksData.webhooks.length;
          console.log('Webhook count from API (object):', webhooksUsed);
        }
      } catch (error) {
        console.error('Error fetching webhooks count:', error);
        // Do not use mock webhooks for the count display
      }
      
      // IMPORTANT: Manual override for webhook count
      // This ensures the display shows the correct count regardless of database state
      const visibleWebhookCount = webhooksUsed;
      
      return {
        ...data,
        webhooksUsed: visibleWebhookCount,
        webhooksLimit: plan === "PRO" ? PRO_QUOTA.maxWebhooks : FREE_QUOTA.maxWebhooks,
        resetDate: data.resetDate.toString()
      }
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl flex flex-col gap-8"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="mt-2 text-xl/8 font-medium tracking-tight text-gray-900">
          {plan === "PRO" ? "Plan: Pro" : "Plan: Free"}
        </h1>
        <p className="text-sm/6 text-gray-600 max-w-prose">
          {plan === "PRO"
            ? "Thank you for supporting MonitorFlow. Find your increased usage limits below."
            : "Get access to more events, categories and premium support."}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-brand-700 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm/6 font-medium">Total Events</p>
              <BarChart className="size-4 text-muted-foreground" />
            </div>

            <div>
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {usageData?.eventsUsed || 0} of{" "}
                    {usageData?.eventsLimit.toLocaleString() || 100}
                  </p>
                  <p className="text-xs/5 text-muted-foreground">
                    Events this period
                  </p>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm/6 font-medium">Event Categories</p>
              <BarChart className="size-4 text-muted-foreground" />
            </div>

            <div>
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {usageData?.categoriesUsed || 0} of{" "}
                    {usageData?.categoriesLimit.toLocaleString() || 10}
                  </p>
                  <p className="text-xs/5 text-muted-foreground">Active categories</p>
                </>
              )}
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className={`h-full ${plan === "PRO" ? "border-2 border-brand-700" : ""}`}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm/6 font-medium">Webhooks</p>
              <Webhook className="size-4 text-muted-foreground" />
            </div>

            <div>
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {usageData?.webhooksUsed || 0} of{" "}
                    {usageData?.webhooksLimit === Infinity ? "∞" : usageData?.webhooksLimit || 1}
                  </p>
                  <p className="text-xs/5 text-muted-foreground">Active webhooks</p>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-gray-500"
      >
        Usage will reset{" "}
        {isLoading || !usageData?.resetDate ? (
          <span className="animate-pulse w-8 h-4 bg-gray-200 inline-block align-middle"></span>
        ) : (
          format(new Date(usageData.resetDate), "MMM d, yyyy")
        )}
        {plan !== "PRO" ? (
          <span
            onClick={() => !isPending && createCheckoutSession()}
            className={`inline cursor-pointer underline text-brand-600 ${isPending ? 'opacity-50' : 'hover:text-brand-500'}`}
          >
            {isPending ? (
              <>
                <Loader2 className="inline mr-1 h-3 w-3 animate-spin" />
                Processing...
              </>
            ) : (
              " or upgrade now to increase your limit →"
            )}
          </span>
        ) : null}
      </motion.p>
    </motion.div>
  )
}
