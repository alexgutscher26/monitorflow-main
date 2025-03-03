"use client"

import { buttonVariants } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/utils"
import { UserButton } from "@clerk/nextjs"
import { Gem, Home, Key, LucideIcon, Menu, Settings, X } from "lucide-react"
import Link from "next/link"
import { PropsWithChildren, useState, useCallback } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { KeyboardShortcutsProvider, ShortcutAction, useKeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface SidebarItem {
  href: string
  icon: LucideIcon
  text: string
}

interface SidebarCategory {
  category: string
  items: SidebarItem[]
}

const SIDEBAR_ITEMS: SidebarCategory[] = [
  {
    category: "Overview",
    items: [{ href: "/dashboard", icon: Home, text: "Dashboard" }],
  },
  {
    category: "Account",
    items: [{ href: "/dashboard/upgrade", icon: Gem, text: "Upgrade" }],
  },
  {
    category: "Settings",
    items: [
      { href: "/dashboard/api-key", icon: Key, text: "API Key" },
      {
        href: "/dashboard/account-settings",
        icon: Settings,
        text: "Account Settings",
      },
    ],
  },
]

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  return (
    <div className="space-y-4 md:space-y-6 relative z-20 flex flex-col h-full">
      {/* logo */}
      <p className="hidden sm:block text-lg/7 font-semibold">
        Ping<span className="text-brand-700">Panda</span>
      </p>

      {/* navigation items */}
      <div className="flex-grow">
        <ul>
          {SIDEBAR_ITEMS.map(({ category, items }) => (
            <li key={category} className="mb-4 md:mb-8">
              <p className="text-xs font-medium leading-6 text-muted-foreground">
                {category}
              </p>
              <div className="-mx-2 flex flex-1 flex-col">
                {items.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "w-full justify-start group flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium leading-6 transition"
                    )}
                    onClick={onClose}
                  >
                    <item.icon className="size-4 text-muted-foreground group-hover:text-foreground" />
                    {item.text}
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col">
        <hr className="my-4 md:my-6 w-full h-px border-border" />

        <div className="flex items-center justify-between">
          <UserButton
            showName
            appearance={{
              elements: {
                userButtonBox: "flex-row-reverse",
                userButtonOuterIdentifier: "text-foreground font-medium",
                userButtonTrigger: "focus:shadow-none",
              },
            }}
          />
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

const Layout = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { handleShortcut: baseHandleShortcut } = useKeyboardShortcuts()

  const handleShortcut = useCallback((action: ShortcutAction) => {
    // First let the base handler try to handle it
    baseHandleShortcut(action)

    // Then handle app-specific shortcuts
    switch (action) {
      case "newCategory":
        // We can't directly trigger the modal from here, but we can show a toast
        toast.info("Press the 'Add Category' button to create a new category", {
          description: "Shortcut: Alt+N",
          duration: 3000,
        })
        break
      case "refreshData":
        queryClient.invalidateQueries({ queryKey: ["user-event-categories"] })
        toast.success("Dashboard data refreshed")
        break
      case "toggleTheme":
        // Theme toggle is handled by the ThemeToggle component
        document.querySelector("[data-theme-toggle]")?.dispatchEvent(
          new MouseEvent("click", { bubbles: true })
        )
        break
      case "navigateDashboard":
        router.push("/dashboard")
        break
      case "navigateSettings":
        router.push("/dashboard/account-settings")
        break
      case "navigateAccount":
        router.push("/dashboard/upgrade")
        break
      // help case is handled by the base handler
    }
  }, [baseHandleShortcut, router, queryClient])

  return (
    <KeyboardShortcutsProvider onShortcut={handleShortcut}>
      <div className="relative h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
        {/* sidebar for desktop */}
        <div className="hidden md:block w-64 lg:w-80 border-r border-border p-6 h-full relative z-10">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* mobile header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
            <p className="text-lg/7 font-semibold">
              Ping<span className="text-brand-700">Panda</span>
            </p>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="size-6" />
            </button>
          </div>

          {/* main content area */}
          <div className="flex-1 overflow-y-auto bg-background shadow-md p-4 md:p-6 relative z-10">
            <div className="relative min-h-full flex flex-col">
              <div className="h-full flex flex-col flex-1 space-y-4">
                {children}
              </div>
            </div>
          </div>

          <Modal
            className="p-4"
            showModal={isDrawerOpen}
            setShowModal={setIsDrawerOpen}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="text-lg/7 font-semibold">
                Ping<span className="text-brand-700">Panda</span>
              </p>
              <button
                aria-label="Close modal"
                onClick={() => setIsDrawerOpen(false)}
              >
                <X className="size-6" />
              </button>
            </div>

            <Sidebar onClose={() => setIsDrawerOpen(false)} />
          </Modal>
        </div>
      </div>
    </KeyboardShortcutsProvider>
  )
}

export default Layout
