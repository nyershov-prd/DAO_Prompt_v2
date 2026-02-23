"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GenerateAnswersModal } from "@/components/generate-answers-modal"
import { Sparkles } from "lucide-react"

export default function Page() {
  const [open, setOpen] = useState(true)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Answers
        </Button>
        <p className="text-sm text-muted-foreground">
          Click to open the Generate Answers modal
        </p>
      </div>
      <GenerateAnswersModal open={open} onOpenChange={setOpen} />
    </main>
  )
}
