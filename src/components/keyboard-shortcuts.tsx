"use client"

import { useEffect, useCallback } from "react"

// Define shortcut types
export type ShortcutAction = 
  | "newCategory" 
  | "refreshData" 
  | "toggleTheme" 
  | "navigateDashboard" 
  | "navigateSettings" 
  | "navigateAccount" 
  | "help"

// Define shortcut key combinations
export const KEYBOARD_SHORTCUTS: Record<ShortcutAction, { key: string; description: string; modifiers: string[] }> = {
  newCategory: { 
    key: "n", 
    modifiers: ["Alt"], 
    description: "Create a new event category" 
  },
  refreshData: { 
    key: "r", 
    modifiers: ["Alt"], 
    description: "Refresh dashboard data" 
  },
  toggleTheme: { 
    key: "t", 
    modifiers: ["Alt"], 
    description: "Toggle between light and dark mode" 
  },
  navigateDashboard: { 
    key: "d", 
    modifiers: ["Alt"], 
    description: "Go to dashboard" 
  },
  navigateSettings: { 
    key: "s", 
    modifiers: ["Alt"], 
    description: "Go to settings" 
  },
  navigateAccount: { 
    key: "a", 
    modifiers: ["Alt"], 
    description: "Go to account" 
  },
  help: { 
    key: "h", 
    modifiers: ["Alt"], 
    description: "Show keyboard shortcuts help" 
  }
}

// Shortcut handler type
export type ShortcutHandler = (action: ShortcutAction) => void

interface KeyboardShortcutsProviderProps {
  onShortcut: ShortcutHandler
  children: React.ReactNode
}

export const KeyboardShortcutsProvider = ({ 
  onShortcut, 
  children 
}: KeyboardShortcutsProviderProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key is a shortcut
      const isAltPressed = event.altKey
      
      if (!isAltPressed) return
      
      // Find matching shortcut
      const action = Object.entries(KEYBOARD_SHORTCUTS).find(
        ([_, shortcut]) => {
          const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase()
          const modifiersMatch = shortcut.modifiers.every(modifier => {
            if (modifier === "Alt") return event.altKey
            if (modifier === "Ctrl") return event.ctrlKey
            if (modifier === "Shift") return event.shiftKey
            return false
          })
          
          return keyMatches && modifiersMatch
        }
      )?.[0] as ShortcutAction | undefined
      
      if (action) {
        event.preventDefault()
        onShortcut(action)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onShortcut])
  
  return <>{children}</>
}

// Hook to use keyboard shortcuts
export const useKeyboardShortcuts = () => {
  const handleShortcut = useCallback((action: ShortcutAction) => {
    // This is now just a placeholder for component-specific shortcut handling
  }, [])
  
  return {
    handleShortcut
  }
}
