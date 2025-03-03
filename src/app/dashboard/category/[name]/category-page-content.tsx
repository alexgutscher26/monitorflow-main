"use client"

import { Event, EventCategory } from "@prisma/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { EmptyCategoryState } from "./empty-category-state"
import { useEffect, useMemo, useState } from "react"
import { client } from "@/lib/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { ArrowUpDown, BarChart, CheckCircle2, CircleSlash, Filter, CheckSquare, Square } from "lucide-react"
import { isAfter, isToday, startOfMonth, startOfWeek } from "date-fns"

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils"
import { Heading } from "@/components/heading"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

interface CategoryPageContentProps {
  hasEvents: boolean
  category: EventCategory
}

export const CategoryPageContent = ({
  hasEvents: initialHasEvents,
  category,
}: CategoryPageContentProps) => {
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<"today" | "week" | "month">(
    "today"
  )

  const [acknowledgmentFilter, setAcknowledgmentFilter] = useState<"all" | "acknowledged" | "unacknowledged">("all")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  // https://localhost:3000/dashboard/category/sale?page=5&limit=30
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "30", 10)

  const [pagination, setPagination] = useState({
    pageIndex: page - 1,
    pageSize: limit,
  })

  const { data: pollingData } = useQuery({
    queryKey: ["category", category.name, "hasEvents"],
    initialData: { hasEvents: initialHasEvents },
  })

  const queryClient = useQueryClient()

  const { data, isFetching, error } = useQuery({
    queryKey: [
      "events",
      category.name,
      pagination.pageIndex,
      pagination.pageSize,
      activeTab,
      acknowledgmentFilter,
    ],
    queryFn: async () => {
      try {
        const res = await client.category.getEventsByCategoryName.$get({
          name: category.name,
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          timeRange: activeTab,
          acknowledgmentFilter,
        })
        return await res.json()
      } catch (error) {
        toast.error("Failed to fetch events. Please try again.")
        throw error
      }
    },
    refetchOnWindowFocus: false,
    enabled: pollingData.hasEvents,
  })

  const { mutate: acknowledgeEvent, isPending: isAcknowledging } = useMutation({
    mutationFn: async ({ eventId, acknowledged }: { eventId: string; acknowledged: boolean }) => {
      try {
        await client.category.acknowledgeEvent.$post({ eventId, acknowledged })
        toast.success(`Event ${acknowledged ? 'acknowledged' : 'unacknowledged'} successfully`)
      } catch (error) {
        toast.error(`Failed to ${acknowledged ? 'acknowledge' : 'unacknowledge'} event`)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["events", category.name, pagination.pageIndex, pagination.pageSize, activeTab, acknowledgmentFilter] 
      })
    },
  })

  const { mutate: acknowledgeMultipleEvents, isPending: isAcknowledgingMultiple } = useMutation({
    mutationFn: async ({ eventIds, acknowledged }: { eventIds: string[]; acknowledged: boolean }) => {
      try {
        await client.category.acknowledgeMultipleEvents.$post({ eventIds, acknowledged })
        toast.success(`${eventIds.length} events ${acknowledged ? 'acknowledged' : 'unacknowledged'} successfully`)
      } catch (error) {
        toast.error(`Failed to ${acknowledged ? 'acknowledge' : 'unacknowledge'} events`)
        throw error
      }
    },
    onSuccess: () => {
      setSelectedEvents([])
      queryClient.invalidateQueries({ 
        queryKey: ["events", category.name, pagination.pageIndex, pagination.pageSize, activeTab, acknowledgmentFilter] 
      })
    },
  })

  const handleToggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId) 
        : [...prev, eventId]
    )
  }

  const handleSelectAllEvents = () => {
    if (!data?.events) return
    
    if (selectedEvents.length === data.events.length) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(data.events.map(event => event.id))
    }
  }

  const columns: ColumnDef<Event>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getRowModel().rows.length > 0 &&
              selectedEvents.length === table.getRowModel().rows.length
            }
            onCheckedChange={handleSelectAllEvents}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedEvents.includes(row.original.id)}
            onCheckedChange={() => handleToggleEventSelection(row.original.id)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "acknowledged",
        header: "Status",
        cell: ({ row }) => {
          const acknowledged = row.original.acknowledged
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => acknowledgeEvent({ 
                eventId: row.original.id, 
                acknowledged: !acknowledged 
              })}
              disabled={isAcknowledging}
              className={cn(
                "size-8 rounded-full",
                acknowledged ? "text-green-600 hover:text-green-700" : "text-yellow-600 hover:text-yellow-700"
              )}
            >
              {acknowledged ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <CircleSlash className="size-5" />
              )}
            </Button>
          )
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: () => <span>{category.name || "Uncategorized"}</span>,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Date
              <ArrowUpDown className="ml-2 size-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          return new Date(row.getValue("createdAt")).toLocaleString()
        },
      },
      ...(data?.events[0]
        ? Object.keys(data.events[0].fields as object).map((field) => ({
            accessorFn: (row: Event) =>
              (row.fields as Record<string, any>)[field],
            header: field,
            cell: ({ row }: { row: Row<Event> }) =>
              (row.original.fields as Record<string, any>)[field] || "-",
          }))
        : []),
      {
        accessorKey: "deliveryStatus",
        header: "Delivery Status",
        cell: ({ row }) => (
          <span
            className={cn("px-2 py-1 rounded-full text-xs font-semibold", {
              "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300":
                row.getValue("deliveryStatus") === "DELIVERED",
              "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300":
                row.getValue("deliveryStatus") === "FAILED",
              "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300":
                row.getValue("deliveryStatus") === "PENDING",
            })}
          >
            {row.getValue("deliveryStatus")}
          </span>
        ),
      },
    ],

    [category.name, data?.events]
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data: data?.events || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((data?.eventsCount || 0) / pagination.pageSize),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  /**
   * I FORGOT THIS IN THE VIDEO
   * Update URL when pagination changes
   */
  const router = useRouter()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("page", (pagination.pageIndex + 1).toString())
    searchParams.set("limit", pagination.pageSize.toString())
    router.push(`?${searchParams.toString()}`, { scroll: false })
  }, [pagination, router])
  
  /**
   * END OF WHAT I FORGOT IN THE VIDEO
   */

  const numericFieldSums = useMemo(() => {
    if (!data?.events || data.events.length === 0) return {}

    const sums: Record<
      string,
      {
        total: number
        thisWeek: number
        thisMonth: number
        today: number
      }
    > = {}

    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const monthStart = startOfMonth(now)

    data.events.forEach((event) => {
      const eventDate = event.createdAt

      Object.entries(event.fields as object).forEach(([field, value]) => {
        if (typeof value === "number") {
          if (!sums[field]) {
            sums[field] = { total: 0, thisWeek: 0, thisMonth: 0, today: 0 }
          }

          sums[field].total += value

          if (
            isAfter(eventDate, weekStart) ||
            eventDate.getTime() === weekStart.getTime()
          ) {
            sums[field].thisWeek += value
          }

          if (
            isAfter(eventDate, monthStart) ||
            eventDate.getTime() === monthStart.getTime()
          ) {
            sums[field].thisMonth += value
          }

          if (isToday(eventDate)) {
            sums[field].today += value
          }
        }
      })
    })

    return sums
  }, [data?.events])

  const NumericFieldSumCards = () => {
    if (Object.keys(numericFieldSums).length === 0) return null

    return Object.entries(numericFieldSums).map(([field, sums]) => {
      const relevantSum =
        activeTab === "today"
          ? sums.today
          : activeTab === "week"
          ? sums.thisWeek
          : sums.thisMonth

      return (
        <Card key={field}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm/6 font-medium">
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </p>
            <BarChart className="size-4 text-muted-foreground" />
          </div>

          <div>
            <p className="text-2xl font-bold">{relevantSum.toFixed(2)}</p>
            <p className="text-xs/5 text-muted-foreground">
              {activeTab === "today"
                ? "today"
                : activeTab === "week"
                ? "this week"
                : "this month"}
            </p>
          </div>
        </Card>
      )
    })
  }

  if (!pollingData.hasEvents) {
    return <EmptyCategoryState categoryName={category.name} />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as "today" | "week" | "month")
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <TabsList className="overflow-x-auto flex-nowrap">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {selectedEvents.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => acknowledgeMultipleEvents({ 
                    eventIds: selectedEvents, 
                    acknowledged: true 
                  })}
                  disabled={isAcknowledgingMultiple}
                  className="flex items-center gap-1"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Acknowledge {selectedEvents.length}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => acknowledgeMultipleEvents({ 
                    eventIds: selectedEvents, 
                    acknowledged: false 
                  })}
                  disabled={isAcknowledgingMultiple}
                  className="flex items-center gap-1"
                >
                  <CircleSlash className="size-4" />
                  <span>Unacknowledge {selectedEvents.length}</span>
                </Button>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="size-4" />
                  <span>Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acknowledgment Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setAcknowledgmentFilter("all")}
                  className={cn(acknowledgmentFilter === "all" && "bg-accent")}
                >
                  All Events
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAcknowledgmentFilter("acknowledged")}
                  className={cn(acknowledgmentFilter === "acknowledged" && "bg-accent")}
                >
                  Acknowledged Only
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setAcknowledgmentFilter("unacknowledged")}
                  className={cn(acknowledgmentFilter === "unacknowledged" && "bg-accent")}
                >
                  Unacknowledged Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value={activeTab}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-2 border-primary h-full">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <p className="text-sm/6 font-medium">Total Events</p>
                    <BarChart className="size-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-2xl font-bold">{data?.eventsCount || 0}</p>
                    <p className="text-xs/5 text-muted-foreground">
                      Events{" "}
                      {activeTab === "today"
                        ? "today"
                        : activeTab === "week"
                        ? "this week"
                        : "this month"}
                    </p>
                  </div>
                </Card>
              </motion.div>

              <NumericFieldSumCards />
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="w-full flex flex-col gap-4">
            <Heading className="text-3xl">Event overview</Heading>
          </div>
        </div>

        <Card contentClassName="px-6 py-4 overflow-x-auto">
          {error ? (
            <div className="text-center py-8 text-red-600">
              Failed to load events. Please try again.
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {isFetching ? (
                  [...Array(5)].map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <motion.div
                            animate={{
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                            }}
                            className="h-4 w-full bg-gray-200 rounded"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="[&>td]:p-4"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage() || isFetching}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage() || isFetching}
        >
          Next
        </Button>
      </div>
    </motion.div>
  )
}
