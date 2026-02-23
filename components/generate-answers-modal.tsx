"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SearchStrategy } from "@/components/search-strategy"
import { Sparkles } from "lucide-react"

export function GenerateAnswersModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-card p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Generate Answers
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Configure search strategy for AI-powered answer generation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="px-6 py-5">
          <SearchStrategy />
        </div>

        <Separator />

        <DialogFooter className="px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-sm">
            Cancel
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Generate Answers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
