"use client"

import { useRef, useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SearchStrategy, type SearchStrategyHandle } from "@/components/search-strategy"
import { RotateCcw } from "lucide-react"

export function GenerateAnswersModal({
  open,
  onOpenChange,
  count = 2,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  count?: number
}) {
  const strategyRef = useRef<SearchStrategyHandle>(null)
  const [isCustomized, setIsCustomized] = useState(false)

  // Poll the ref to sync isCustomized into local state for rendering
  useEffect(() => {
    const id = setInterval(() => {
      if (strategyRef.current) {
        setIsCustomized(strategyRef.current.isCustomized)
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-card p-0 gap-0">
        <div className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold text-foreground">
            Generate {count} {count === 1 ? "Answer" : "Answers"}
          </DialogTitle>
        </div>
        <Separator />
        <div className="px-6 py-4">
          <SearchStrategy ref={strategyRef} />
        </div>

        <Separator />

        <DialogFooter className="px-6 py-4">
          {isCustomized && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => strategyRef.current?.reset()}
              className="text-sm text-muted-foreground hover:text-foreground mr-auto"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-sm">
            Cancel
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="text-sm bg-foreground text-background hover:bg-foreground/90"
          >
            Generate {count} {count === 1 ? "Answer" : "Answers"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
