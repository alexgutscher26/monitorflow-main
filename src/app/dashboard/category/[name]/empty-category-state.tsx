"use client"

import { Card } from "@/components/ui/card"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { CheckIcon, ClipboardIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

export const EmptyCategoryState = ({
  categoryName,
}: {
  categoryName: string
}) => {
  const router = useRouter()
  const [copySuccess, setCopySuccess] = useState(false)
  const { theme } = useTheme()

  const { data, isLoading, error } = useQuery({
    queryKey: ["category", categoryName, "hasEvents"],
    queryFn: async () => {
      const res = await client.category.pollCategory.$get({
        name: categoryName,
      })

      return await res.json()
    },
    refetchInterval(query) {
      return query.state.data?.hasEvents ? false : 1000
    },
  })

  const hasEvents = data?.hasEvents

  useEffect(() => {
    if (hasEvents) router.refresh()
  }, [hasEvents, router])

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippet)
      setCopySuccess(true)
      toast.success("Code copied to clipboard")
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      toast.error("Failed to copy code")
      console.error("Copy failed:", error)
    }
  }

  const codeSnippet = `await fetch('http://localhost:3000/api/events', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    category: '${categoryName}',
    fields: {
      field1: 'value1', // for example: user id
      field2: 'value2' // for example: user email
    }
  })
})`

  if (error) {
    return (
      <Card className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-destructive">
          Failed to check event status. Please try again.
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex items-center justify-center"
    >
      <Card
        className="w-full max-w-2xl p-6"
      >
        <div className="flex flex-col items-center">
          <h2 className="text-xl/8 font-medium text-center tracking-tight text-foreground">
            Create your first {categoryName} event
          </h2>
          <p className="text-sm/6 text-muted-foreground mb-8 max-w-md text-center text-pretty">
            Get started by sending a request to our tracking API:
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-3xl rounded-lg shadow-lg overflow-hidden border border-border"
          >
            <div className="bg-zinc-900 dark:bg-zinc-800 px-4 py-2 flex justify-between items-center">
              <div className="flex space-x-2">
                <div className="size-3 rounded-full bg-red-500" />
                <div className="size-3 rounded-full bg-yellow-500" />
                <div className="size-3 rounded-full bg-green-500" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-sm">your-first-event.js</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-zinc-400 hover:text-zinc-100"
                  onClick={copyCode}
                >
                  {copySuccess ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <SyntaxHighlighter
              language="javascript"
              style={atomDark}
              customStyle={{
                borderRadius: "0px",
                margin: 0,
                padding: "1rem",
                fontSize: "0.875rem",
                lineHeight: "1.5",
                backgroundColor: "#18181b", // zinc-900
                color: "#e4e4e7", // zinc-200
              }}
            >
              {codeSnippet}
            </SyntaxHighlighter>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-col items-center space-y-4"
          >
            <div className="flex gap-2 items-center">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-muted-foreground">
                    Listening to incoming events...
                  </span>
                </>
              )}
            </div>

            <p className="text-sm/6 text-muted-foreground mt-2">
              Need help? Check out our{" "}
              <a href="#" className="text-primary hover:underline">
                documentation
              </a>{" "}
              or{" "}
              <a href="#" className="text-primary hover:underline">
                contact support
              </a>
              .
            </p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}
