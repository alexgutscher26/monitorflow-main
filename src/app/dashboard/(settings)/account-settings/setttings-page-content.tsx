"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { z } from "zod"
import { KeyboardShortcutsSettings } from "@/components/keyboard-shortcuts-settings"

const discordIdSchema = z.string().min(17).max(19).regex(/^\d+$/, "Must be a valid Discord ID")

export const AccountSettings = ({
  discordId: initialDiscordId,
}: {
  discordId: string
}) => {
  const [discordId, setDiscordId] = useState(initialDiscordId)
  const [showGuide, setShowGuide] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: async (discordId: string) => {
      const res = await client.project.setDiscordID.$post({ discordId })
      return await res.json()
    },
    onSuccess: () => {
      toast.success("Discord ID updated successfully")
      setError(null)
    },
    onError: () => {
      toast.error("Failed to update Discord ID")
    },
  })

  const handleSubmit = () => {
    try {
      discordIdSchema.parse(discordId)
      setError(null)
      mutate(discordId)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-xl w-full p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Account Settings</h2>
          <p className="text-sm text-gray-500">Manage your account preferences and integrations</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discord-id">Discord ID</Label>
          <Input
            id="discord-id"
            value={discordId}
            onChange={(e) => {
              setDiscordId(e.target.value)
              setError(null)
            }}
            placeholder="Enter your Discord ID"
            className={error ? "border-red-500 focus:ring-red-500" : ""}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <span>Don't know how to find your Discord ID?</span>
          <button
            onClick={() => setShowGuide(true)}
            className="text-brand-600 hover:text-brand-500 font-medium"
          >
            Learn how
          </button>
        </div>

        <div>
          <Button
            onClick={handleSubmit}
            disabled={isPending || discordId === initialDiscordId}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      <KeyboardShortcutsSettings />

      <Modal
        showModal={showGuide}
        setShowModal={setShowGuide}
        className="max-w-lg p-6"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">How to Find Your Discord ID</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. Open Discord and go to Settings → App Settings → Advanced</p>
            <p>2. Enable "Developer Mode"</p>
            <p>3. Right-click on your profile picture and select "Copy ID"</p>
          </div>
          <div className="pt-4 flex justify-end">
            <Button onClick={() => setShowGuide(false)}>Got it</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
