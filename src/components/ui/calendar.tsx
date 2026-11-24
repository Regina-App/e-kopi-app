"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { id as idLocale } from "date-fns/locale/id"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = idLocale,
  ...props
}: CalendarProps) {
  return (
    <div
      className={cn(
        "p-4 bg-card text-card-foreground rounded-2xl border border-border shadow-xs",
        className
      )}
    >
      <DayPicker
        showOutsideDays={showOutsideDays}
        locale={locale}
        className="w-full"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4 w-full",
          month_caption: "flex justify-center pt-1 relative items-center mb-3",
          caption_label: "text-sm font-semibold capitalize",
          nav: "space-x-1 flex items-center justify-between w-full absolute top-1 px-1",
          button_previous: cn(
            "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent rounded-lg flex items-center justify-center transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
          ),
          button_next: cn(
            "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent rounded-lg flex items-center justify-center transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
          ),
          month_grid: "w-full border-collapse space-y-1",
          weekdays: "flex w-full justify-between mb-1",
          weekday:
            "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] text-center",
          week: "flex w-full mt-1 justify-between",
          day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
          day_button: cn(
            "h-9 w-9 p-0 font-normal rounded-lg transition-colors flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus:outline-hidden cursor-pointer"
          ),
          selected:
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-lg font-semibold shadow-xs",
          today: "bg-muted font-bold text-primary rounded-lg",
          outside: "text-muted-foreground opacity-40 hover:bg-transparent",
          disabled:
            "text-muted-foreground opacity-30 cursor-not-allowed hover:bg-transparent",
          hidden: "invisible",
          ...classNames,
        }}
        components={{
          Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
            if (orientation === "left") {
              return (
                <ChevronLeft
                  className={cn("h-4 w-4 text-foreground", chevronClass)}
                  {...chevronProps}
                />
              )
            }
            return (
              <ChevronRight
                className={cn("h-4 w-4 text-foreground", chevronClass)}
                {...chevronProps}
              />
            )
          },
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
