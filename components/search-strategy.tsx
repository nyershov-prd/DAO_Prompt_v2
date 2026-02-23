"use client"

import { useState, useCallback } from "react"
import {
  RotateCcw,
  Plus,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { type FilterCondition, FIELDS, VALUES, MultiValueSelect } from "@/components/strategy-row"

// ── Types ──────────────────────────────────────────────────────────────────────

type SimpleLayer = {
  id: string
  label: string
  conditions: FilterCondition[]
}

type Priority = "answer-bank" | "supporting" | "balanced"

// ── Constants ─────────────────────────────────────────────────────────────────

const PREDEFINED_LAYERS: Omit<SimpleLayer, "id">[] = [
  {
    label: "Fund + Vehicle",
    conditions: [
      { field: "Fund", operator: "equals", values: ["Fund I"], exclude: false },
      { field: "Vehicle", operator: "equals", values: ["LP", "SMA"], exclude: false },
    ],
  },
  {
    label: "Fund",
    conditions: [{ field: "Fund", operator: "equals", values: ["Fund I"], exclude: false }],
  },
  {
    label: "Strategy",
    conditions: [{ field: "Strategy", operator: "equals", values: ["Long/Short"], exclude: false }],
  },
  {
    label: "Business Unit",
    conditions: [{ field: "Business Unit", operator: "equals", values: [], exclude: false }],
  },
  {
    label: "Vehicle",
    conditions: [{ field: "Vehicle", operator: "equals", values: [], exclude: false }],
  },
  {
    label: "ESG",
    conditions: [{ field: "ESG", operator: "equals", values: [], exclude: false }],
  },
  {
    label: "Region",
    conditions: [{ field: "Region", operator: "equals", values: [], exclude: false }],
  },
  {
    label: "Sector",
    conditions: [{ field: "Sector", operator: "equals", values: [], exclude: false }],
  },
]

const DEFAULT_LAYERS: SimpleLayer[] = [
  { id: "1", ...PREDEFINED_LAYERS[0] },
  { id: "2", ...PREDEFINED_LAYERS[1] },
  { id: "3", ...PREDEFINED_LAYERS[2] },
]

const OPERATORS = ["equals", "not equals"]

// ── Inline condition editor ────────────────────────────────────────────────────

function InlineConditionRow({
  condition,
  index,
  onUpdate,
  onRemove,
  showRemove,
}: {
  condition: FilterCondition
  index: number
  onUpdate: (i: number, c: FilterCondition) => void
  onRemove: (i: number) => void
  showRemove: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Select
        value={condition.field}
        onValueChange={(val) => onUpdate(index, { ...condition, field: val, values: [] })}
      >
        <SelectTrigger className="h-7 w-[110px] text-xs bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELDS.map((f) => (
            <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.exclude ? "not equals" : "equals"}
        onValueChange={(val) => onUpdate(index, { ...condition, exclude: val === "not equals" })}
      >
        <SelectTrigger className="h-7 w-[100px] text-xs bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op} value={op} className="text-xs">{op}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <MultiValueSelect
        field={condition.field}
        values={condition.values}
        onChange={(vals) => onUpdate(index, { ...condition, values: vals })}
      />

      {showRemove && (
        <button
          onClick={() => onRemove(index)}
          className="rounded p-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Remove condition"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SearchStrategy() {
  const [layers, setLayers] = useState<SimpleLayer[]>(DEFAULT_LAYERS)
  const [useAnswerBank, setUseAnswerBank] = useState(true)
  const [useSupportingMaterials, setUseSupportingMaterials] = useState(true)
  const [priority, setPriority] = useState<Priority>("answer-bank")
  const [verbatim, setVerbatim] = useState(true)
  const [showRefine, setShowRefine] = useState(false)
  const [isCustomized, setIsCustomized] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [addLayerOpen, setAddLayerOpen] = useState(false)

  const markCustomized = () => setIsCustomized(true)

  const reset = () => {
    setLayers(DEFAULT_LAYERS)
    setUseAnswerBank(true)
    setUseSupportingMaterials(true)
    setPriority("answer-bank")
    setVerbatim(true)
    setShowRefine(false)
    setIsCustomized(false)
  }

  // ── Chip drag ──
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) return
    setLayers((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })
    setDragIndex(null)
    markCustomized()
  }

  const removeLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
    markCustomized()
  }

  const addLayer = (predefined: Omit<SimpleLayer, "id">) => {
    setLayers((prev) => [
      ...prev,
      { id: String(Date.now()), ...predefined },
    ])
    setAddLayerOpen(false)
    markCustomized()
  }

  const availableToAdd = PREDEFINED_LAYERS.filter(
    (p) => !layers.some((l) => l.label === p.label)
  )

  // ── Condition editing (Refine Filters) ──
  const updateCondition = useCallback(
    (layerId: string, condIndex: number, condition: FilterCondition) => {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l
          const newConds = [...l.conditions]
          newConds[condIndex] = condition
          return { ...l, conditions: newConds }
        })
      )
      markCustomized()
    },
    []
  )

  const removeCondition = useCallback((layerId: string, condIndex: number) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l
        return { ...l, conditions: l.conditions.filter((_, i) => i !== condIndex) }
      })
    )
    markCustomized()
  }, [])

  const addCondition = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l
        return {
          ...l,
          conditions: [
            ...l.conditions,
            { field: "Fund", operator: "equals", values: [], exclude: false },
          ],
        }
      })
    )
    markCustomized()
  }

  const showPriority = useAnswerBank && useSupportingMaterials

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Search Strategy</h3>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            Auto-generated from your selections. Adjust if needed.
          </p>
        </div>
        {isCustomized && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* ── Fallback Order ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Fallback Order
        </p>

        {/* Chip row */}
        <div className="flex items-center gap-1 flex-wrap">
          {layers.map((layer, index) => (
            <span key={layer.id} className="flex items-center gap-1">
              {/* Chip */}
              <span
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow transition-all select-none"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground/40" />
                <span>{layer.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => { removeLayer(layer.id) }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") removeLayer(layer.id) }}
                  className="ml-0.5 rounded-sm p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label={`Remove ${layer.label}`}
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              </span>

              {/* Arrow */}
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            </span>
          ))}

          {/* Firmwide locked chip */}
          <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-secondary/30 px-2 py-1 text-xs font-medium text-muted-foreground select-none">
            <Lock className="h-2.5 w-2.5" />
            Firmwide
          </span>
        </div>

        {/* Helper text */}
        <p className="text-[11px] text-muted-foreground/60">
          We start with the most specific scope and expand only if no matches are found.
        </p>

        {/* + Add Layer */}
        <Popover open={addLayerOpen} onOpenChange={setAddLayerOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
              <Plus className="h-3 w-3" />
              Add Layer
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="start">
            {availableToAdd.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">All layers added</p>
            ) : (
              availableToAdd.map((p) => (
                <button
                  key={p.label}
                  onClick={() => addLayer(p)}
                  className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent transition-colors"
                >
                  {p.label}
                </button>
              ))
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Sources & Behavior ── */}
      <div className="rounded-md border border-border bg-secondary/40 px-4 py-3 space-y-3">

        {/* Sources */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Sources</p>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="src-ab"
                checked={useAnswerBank}
                onCheckedChange={(v) => { setUseAnswerBank(!!v); markCustomized() }}
              />
              <Label htmlFor="src-ab" className="text-xs cursor-pointer">Answer Bank</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="src-sm"
                checked={useSupportingMaterials}
                onCheckedChange={(v) => { setUseSupportingMaterials(!!v); markCustomized() }}
              />
              <Label htmlFor="src-sm" className="text-xs cursor-pointer">Supporting Materials</Label>
            </div>
          </div>
        </div>

        {/* Priority — only when both sources active */}
        {showPriority && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Priority</p>
            <div className="flex items-center gap-4 flex-wrap">
              {(["answer-bank", "supporting", "balanced"] as Priority[]).map((val) => {
                const label = val === "answer-bank" ? "Answer Bank first" : val === "supporting" ? "Supporting first" : "Balanced"
                return (
                  <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={val}
                      checked={priority === val}
                      onChange={() => { setPriority(val); markCustomized() }}
                      className="accent-primary"
                    />
                    <span className="text-xs text-foreground">{label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Verbatim */}
        <div className="flex items-start gap-2 pt-0.5">
          <Checkbox
            id="verbatim"
            checked={verbatim}
            onCheckedChange={(v) => { setVerbatim(!!v); markCustomized() }}
            className="mt-0.5"
          />
          <div>
            <Label htmlFor="verbatim" className="text-xs cursor-pointer">Verbatim Only</Label>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Return exact matches only — no AI-generated responses
            </p>
          </div>
        </div>
      </div>

      {/* ── Helper text ── */}
      <p className="text-[11px] text-muted-foreground/60">
        Results are filtered in order of specificity. If no matches are found, the next layer is used.
      </p>

      {/* ── Refine Filters (Advanced) ── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowRefine((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
        >
          Advanced (Optional)
          {showRefine ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showRefine && (
          <div className="space-y-3 rounded-md border border-border bg-card p-3">
            {layers.map((layer) => (
              <div key={layer.id} className="space-y-1.5">
                <p className="text-[11px] font-semibold text-foreground">{layer.label}</p>
                <div className="space-y-1.5 pl-2 border-l-2 border-border">
                  {layer.conditions.map((cond, ci) => (
                    <InlineConditionRow
                      key={ci}
                      condition={cond}
                      index={ci}
                      onUpdate={(i, c) => updateCondition(layer.id, i, c)}
                      onRemove={(i) => removeCondition(layer.id, i)}
                      showRemove={layer.conditions.length > 1}
                    />
                  ))}
                  <button
                    onClick={() => addCondition(layer.id)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Condition
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
