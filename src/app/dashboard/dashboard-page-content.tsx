"use client"

import { LoadingSpinner } from "@/components/loading-spinner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowRight, BarChart2, Clock, Database, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { DashboardEmptyState } from "./dashboard-empty-state"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export const DashboardPageContent = () => {
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: categories, isPending: isEventCategoriesLoading, error } = useQuery({
    queryKey: ["user-event-categories"],
    queryFn: async () => {
      try {
        const res = await client.category.getEventCategories.$get()
        const { categories } = await res.json()
        return categories
      } catch (error) {
        toast.error("Failed to load categories. Please try again.")
        throw error
      }
    },
  })

  const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation(
    {
      mutationFn: async (name: string) => {
        try {
          await client.category.deleteCategory.$post({ name })
          toast.success(`Category "${name}" deleted successfully`)
        } catch (error) {
          toast.error(`Failed to delete category "${name}"`)
          throw error
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["user-event-categories"] })
        setDeletingCategory(null)
      },
    }
  )

  if (isEventCategoriesLoading) {
    return (
      <div className="grid max-w-6xl grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="relative rounded-lg bg-card p-6 shadow-sm ring-1 ring-border"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="size-12 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="size-4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-1 h-full w-full">
        <div className="text-center space-y-4">
          <p className="text-red-600">Failed to load categories</p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["user-event-categories"] })}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!categories || categories.length === 0) {
    return <DashboardEmptyState />
  }

  return (
    <>
      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid max-w-6xl grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {categories.map((category) => (
            <motion.li
              key={category.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -2 }}
              className="relative group z-10"
            >
              <div className="absolute z-0 inset-px rounded-lg bg-card" />
              <div className="pointer-events-none z-0 absolute inset-px rounded-lg shadow-sm transition-all duration-300 group-hover:shadow-md ring-1 ring-border" />

              <div className="relative p-6 z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="size-12 rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: category.color
                        ? `#${category.color.toString(16).padStart(6, "0")}`
                        : "#f3f4f6",
                    }}
                  />

                  <div>
                    <h3 className="text-lg/7 font-medium tracking-tight text-foreground">
                      {category.emoji || "📂"} {category.name}
                    </h3>
                    <p className="text-sm/6 text-muted-foreground">
                      {format(category.createdAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm/5 text-muted-foreground">
                    <Clock className="size-4 mr-2 text-brand-500" />
                    <span className="font-medium">Last ping:</span>
                    <span className="ml-1">
                      {category.lastPing
                        ? formatDistanceToNow(category.lastPing) + " ago"
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center text-sm/5 text-muted-foreground">
                    <Database className="size-4 mr-2 text-brand-500" />
                    <span className="font-medium">Unique fields:</span>
                    <span className="ml-1">{category.uniqueFieldCount || 0}</span>
                  </div>
                  <div className="flex items-center text-sm/5 text-muted-foreground">
                    <BarChart2 className="size-4 mr-2 text-brand-500" />
                    <span className="font-medium">Events this month:</span>
                    <span className="ml-1">{category.eventsCount || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <Link
                    href={`/dashboard/category/${category.name}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "flex items-center gap-2 text-sm group-hover:bg-accent",
                    })}
                  >
                    View all <ArrowRight className="size-4" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Delete ${category.name} category`}
                    onClick={() => setDeletingCategory(category.name)}
                  >
                    <Trash2 className="size-5" />
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <Modal
        showModal={!!deletingCategory}
        setShowModal={() => setDeletingCategory(null)}
        className="max-w-md p-8"
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-lg/7 font-medium tracking-tight text-foreground">
              Delete Category
            </h2>
            <p className="text-sm/6 text-muted-foreground">
              Are you sure you want to delete the category "{deletingCategory}"?
              This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deletingCategory && deleteCategory(deletingCategory)
              }
              disabled={isDeletingCategory}
            >
              {isDeletingCategory ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
