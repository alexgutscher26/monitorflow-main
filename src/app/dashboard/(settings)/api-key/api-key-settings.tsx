"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckIcon, ClipboardIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const ApiKeySettings = ({ apiKey }: { apiKey: string }) => {
  const [copySuccess, setCopySuccess] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopySuccess(true)
      toast.success("API key copied to clipboard")
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      toast.error("Failed to copy API key")
      console.error("Copy failed:", error)
    }
  }

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey)
  }

  return (
    <Card className="max-w-xl w-full p-6">
      <div>
        <Label>Your API Key</Label>
        <div className="mt-1 relative">
          <Input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            readOnly
            className="pr-20"
            aria-label="API Key"
          />
          <div className="absolute space-x-0.5 inset-y-0 right-0 flex items-center">
            <Button
              variant="ghost"
              onClick={toggleApiKeyVisibility}
              className="p-1 w-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={showApiKey ? "Hide API key" : "Show API key"}
            >
              {showApiKey ? (
                <EyeOffIcon className="size-4 text-brand-900" />
              ) : (
                <EyeIcon className="size-4 text-brand-900" />
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={copyApiKey}
              className="p-1 w-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Copy API key to clipboard"
            >
              {copySuccess ? (
                <CheckIcon className="size-4 text-brand-900" />
              ) : (
                <ClipboardIcon className="size-4 text-brand-900" />
              )}
            </Button>
          </div>
        </div>

        <p className="mt-2 text-sm/6 text-gray-600">
          Keep your key secret and do not share it with others.
        </p>
      </div>
    </Card>
  )
}
