"use client"

import { Card } from "./ui/card"
import { KEYBOARD_SHORTCUTS } from "./keyboard-shortcuts"

export const KeyboardShortcutsSettings = () => {
  return (
    <Card className="max-w-xl w-full p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Keyboard Shortcuts</h2>
        <p className="text-sm text-gray-500">View keyboard shortcuts for common actions</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(KEYBOARD_SHORTCUTS).map(([action, shortcut]) => (
            <div key={action} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.modifiers.map(modifier => (
                  <kbd key={modifier} className="px-2 py-1 text-xs font-semibold bg-background rounded border border-border">
                    {modifier}
                  </kbd>
                ))}
                <span className="mx-1">+</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-background rounded border border-border">
                  {shortcut.key.toUpperCase()}
                </kbd>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
