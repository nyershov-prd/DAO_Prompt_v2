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
  ArrowDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  type FilterCondition,
  type StrategyLayer,
  type GroupLogic,
  FIELDS,
  VALUES,
  MultiValueSelect,
  StrategyRow,
} from "@/components/strategy-row"

// ── Types ──────────────────────────────────────────────────────────────────────

type SimpleLayer = {
  id: string
  label: string
  conditions: FilterCondition[]
}

type Priority = "answer-bank" | "supporting" | "balanced"

type Exclusion = {
  id: string
  field: string
  values: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LAYER_OPTIONS = [
  "Fund + Vehicle",
  "Fund",
  "Strategy",
  "Business Unit",
  "Vehicle",
  "ESG",
  "Region",
  "Sector",
]

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

// Build full StrategyLayer from SimpleLayer for the advanced editor
function toStrategyLayer(l: SimpleLayer, useAnswerBank: boolean, useSupportingMaterials: boolean, verbatim: boolean): StrategyLayer {
  return {
    id: l.id,
    conditions: l.conditions,
    groupLogic: "AND",
    useAnswerBank,
    useSupportingMaterials,
    useVerbatim: verbatim,
  }
}

// ── Sentence-style chip selector ──────────────────────────────────────────────

function LayerChip({
  label,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  index,
}: {
  label: string
  onRemove: () => void
  onDragStart: (e: React.DragEvent, i: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, i: number) => void
  index: number
}) {
  return (
    <span
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-foreground cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all select-none"
    >
      <GripVertical className="h-2.5 w-2.5 text-muted-foreground/40" />
      {label}
      <span
        role="button"
        tabIndex={0}
        onClick={onRemove}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onRemove() }}
        className="ml-0.5 rounded-sm p-0.5 text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        aria-label={`Remove ${label}`}
      >
        <X className="h-2 w-2" />
      </span>
    </span>
  )
}

// ── Interpreted preview ───────────────────────────────────────────────────────

function InterpretedPreview({
  layers,
  useAnswerBank,
  useSupportingMaterials,
  priority,
  verbatim,
}: {
  layers: SimpleLayer[]
  useAnswerBank: boolean
  useSupportingMaterials: boolean
  priority: Priority
  verbatim: boolean
}) {
  const priorityLabel =
    priority === "answer-bank" ? "Answer Bank first" :
    priority === "supporting" ? "Supporting Materials first" :
    "Balanced"

  const sourceParts = [
    useAnswerBank && "Answer Bank",
    useSupportingMaterials && "Supporting Materials",
  ].filter(Boolean).join(" + ") || "None"

  return (
    <div className="rounded-md border border-border bg-secondary/30 px-3 py-2.5 space-y-1.5">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {/* Fallback order */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 shrink-0">Order</span>
          <div className="flex items-center gap-1 flex-wrap">
            {layers.map((l, i) => (
              <span key={l.id} className="flex items-center gap-1">
                <span className="text-[11px] font-medium text-foreground">{l.label}</span>
                {i < layers.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40" />}
              </span>
            ))}
            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40" />
            <span className="text-[11px] font-medium text-muted-foreground">Firmwide</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/50 pt-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Sources</span>
          <span className="text-[11px] text-foreground">{sourceParts}</span>
        </div>
        {useAnswerBank && useSupportingMaterials && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Priority</span>
            <span className="text-[11px] text-foreground">{priorityLabel}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Verbatim</span>
          <span className="text-[11px] text-foreground">{verbatim ? "On" : "Off"}</span>
        </div>
      </div>
    </div>
  )
}

// ── Advanced condition editor (lightweight, for structured rules view) ─────────

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
          {["equals", "not equals"].map((op) => (
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
  // ── State ──
  const [layers, setLayers] = useState<SimpleLayer[]>(DEFAULT_LAYERS)
  const [useAnswerBank, setUseAnswerBank] = useState(true)
  const [useSupportingMaterials, setUseSupportingMaterials] = useState(true)
  const [priority, setPriority] = useState<Priority>("answer-bank")
  const [verbatim, setVerbatim] = useState(false)
  const [exclusions, setExclusions] = useState<Exclusion[]>([])
  const [showStructured, setShowStructured] = useState(false)
  const [isCustomized, setIsCustomized] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [addLayerOpen, setAddLayerOpen] = useState(false)

  const mark = () => setIsCustomized(true)

  const reset = () => {
    setLayers(DEFAULT_LAYERS)
    setUseAnswerBank(true)
    setUseSupportingMaterials(true)
    setPriority("answer-bank")
    setVerbatim(false)
    setExclusions([])
    setShowStructured(false)
    setIsCustomized(false)
  }

  // ── Drag ──
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
    mark()
  }

  // ── Layers ──
  const removeLayer = (id: string) => { setLayers((p) => p.filter((l) => l.id !== id)); mark() }

  const addLayer = (label: string) => {
    const pre = PREDEFINED_LAYERS.find((p) => p.label === label)
    if (!pre) return
    setLayers((p) => [...p, { id: String(Date.now()), ...pre }])
    setAddLayerOpen(false)
    mark()
  }

  const availableToAdd = LAYER_OPTIONS.filter((opt) => !layers.some((l) => l.label === opt))

  // ── Conditions (for structured view) ──
  const updateCondition = useCallback((layerId: string, ci: number, cond: FilterCondition) => {
    setLayers((prev) => prev.map((l) => {
      if (l.id !== layerId) return l
      const c = [...l.conditions]; c[ci] = cond
      return { ...l, conditions: c }
    }))
    mark()
  }, [])

  const removeCondition = useCallback((layerId: string, ci: number) => {
    setLayers((prev) => prev.map((l) => {
      if (l.id !== layerId) return l
      return { ...l, conditions: l.conditions.filter((_, i) => i !== ci) }
    }))
    mark()
  }, [])

  const addCondition = (layerId: string) => {
    setLayers((prev) => prev.map((l) => {
      if (l.id !== layerId) return l
      return { ...l, conditions: [...l.conditions, { field: "Fund", operator: "equals", values: [], exclude: false }] }
    }))
    mark()
  }

  // ── Exclusions ──
  const addExclusion = () => {
    setExclusions((p) => [...p, { id: String(Date.now()), field: "Fund", values: [] }])
    mark()
  }
  const removeExclusion = (id: string) => { setExclusions((p) => p.filter((e) => e.id !== id)); mark() }
  const updateExclusion = (id: string, patch: Partial<Exclusion>) => {
    setExclusions((p) => p.map((e) => e.id === id ? { ...e, ...patch } : e))
    mark()
  }

  const showPriority = useAnswerBank && useSupportingMaterials

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Search Strategy</h3>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            How should we prioritize answers for this submission?
          </p>
        </div>
        {isCustomized && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs text-muted-foreground hover:text-foreground shrink-0">
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* ── Sentence editor ── */}
      <div className="rounded-md border border-border bg-card px-4 py-3 space-y-3">

        {/* Start with */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0 w-[80px]">Start with</span>
          <div className="flex items-center gap-1 flex-wrap">
            {layers.slice(0, 1).map((layer, index) => (
              <LayerChip
                key={layer.id}
                label={layer.label}
                index={index}
                onRemove={() => removeLayer(layer.id)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>

        {/* If none found, expand to */}
        {layers.length > 1 && (
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground shrink-0 w-[80px] pt-0.5">If none found,<br />expand to</span>
            <div className="flex items-center gap-1 flex-wrap">
              {layers.slice(1).map((layer, i) => (
                <span key={layer.id} className="flex items-center gap-1">
                  <LayerChip
                    label={layer.label}
                    index={i + 1}
                    onRemove={() => removeLayer(layer.id)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                  {i < layers.length - 2 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                  )}
                </span>
              ))}
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
              <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-secondary/30 px-2 py-0.5 text-xs font-medium text-muted-foreground select-none">
                <Lock className="h-2.5 w-2.5" />
                Firmwide
              </span>
            </div>
          </div>
        )}

        {/* Add layer / Firmwide if only 1 layer */}
        {layers.length === 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0 w-[80px]">Then</span>
            <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-secondary/30 px-2 py-0.5 text-xs font-medium text-muted-foreground select-none">
              <Lock className="h-2.5 w-2.5" />
              Firmwide
            </span>
          </div>
        )}

        {/* Add layer button */}
        <div className="flex items-center gap-2">
          <span className="w-[80px]" />
          <Popover open={addLayerOpen} onOpenChange={setAddLayerOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" />
                Add layer
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="start">
              {availableToAdd.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">All layers added</p>
              ) : (
                availableToAdd.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => addLayer(opt)}
                    className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    {opt}
                  </button>
                ))
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="border-t border-border/60" />

        {/* Prefer */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0 w-[80px]">Prefer</span>
          <div className="flex items-center gap-3 flex-wrap">
            {(["answer-bank", "supporting", "balanced"] as Priority[]).map((val) => {
              const label = val === "answer-bank" ? "Answer Bank" : val === "supporting" ? "Supporting Materials" : "Balanced"
              return (
                <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={val}
                    checked={priority === val}
                    onChange={() => { setPriority(val); mark() }}
                    className="accent-primary"
                  />
                  <span className="text-xs text-foreground">{label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Verbatim */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0 w-[80px]">Verbatim</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id="verbatim"
              checked={verbatim}
              onCheckedChange={(v) => { setVerbatim(!!v); mark() }}
            />
            <span className="text-xs text-foreground">Use exact matches only</span>
          </label>
        </div>

        {/* Exclude */}
        <div className="flex items-start gap-2">
          <span className="text-xs text-muted-foreground shrink-0 w-[80px] pt-0.5">Exclude</span>
          <div className="space-y-1.5 flex-1">
            {exclusions.map((exc) => (
              <div key={exc.id} className="flex items-center gap-1.5 flex-wrap">
                <Select
                  value={exc.field}
                  onValueChange={(val) => updateExclusion(exc.id, { field: val, values: [] })}
                >
                  <SelectTrigger className="h-7 w-[110px] text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELDS.map((f) => (
                      <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <MultiValueSelect
                  field={exc.field}
                  values={exc.values}
                  onChange={(vals) => updateExclusion(exc.id, { values: vals })}
                />
                <button
                  onClick={() => removeExclusion(exc.id)}
                  className="rounded p-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove exclusion"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={addExclusion}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add exclusion
            </button>
          </div>
        </div>

      </div>

      {/* ── Interpreted preview ── */}
      <div className="space-y-1.5">
        <InterpretedPreview
          layers={layers}
          useAnswerBank={useAnswerBank}
          useSupportingMaterials={useSupportingMaterials}
          priority={priority}
          verbatim={verbatim}
        />
        <p className="text-[11px] text-muted-foreground/60 px-0.5">
          We convert your selections into structured search filters.
        </p>
      </div>

      {/* ── View Structured Rules ── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowStructured((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
        >
          View Structured Rules
          {showStructured ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showStructured && (
          <div className="space-y-3 rounded-md border border-border bg-card p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Layers are evaluated in order. If no matches are found, the next layer is used.
            </p>

            <div className="space-y-0">
              {layers.map((layer, index) => (
                <div key={layer.id}>
                  {/* Lightweight layer block */}
                  <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-foreground">{layer.label}</span>
                      </div>
                      <button
                        onClick={() => removeLayer(layer.id)}
                        className="rounded p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                        aria-label={`Remove ${layer.label}`}
                        style={{ opacity: layers.length > 1 ? undefined : 0, pointerEvents: layers.length > 1 ? undefined : "none" }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-1.5 pl-7">
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
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                      >
                        <Plus className="h-3 w-3" />
                        Add condition
                      </button>
                    </div>
                  </div>

                  {index < layers.length - 1 && (
                    <div className="flex items-center justify-center py-1">
                      <div className="flex items-center gap-1 text-muted-foreground/30">
                        <ArrowDown className="h-3 w-3" />
                        <span className="text-[9px] font-medium uppercase tracking-wider">fallback</span>
                        <ArrowDown className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-1 text-muted-foreground/30">
                  <ArrowDown className="h-3 w-3" />
                  <span className="text-[9px] font-medium uppercase tracking-wider">fallback</span>
                  <ArrowDown className="h-3 w-3" />
                </div>
              </div>
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 py-2">
                <span className="text-xs font-medium text-muted-foreground">Firmwide (locked fallback)</span>
              </div>
            </div>

            {/* Add layer inside structured view */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-full border-dashed text-xs text-muted-foreground hover:text-foreground hover:border-primary/30">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Layer
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1" align="start">
                {availableToAdd.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">All layers added</p>
                ) : (
                  availableToAdd.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => addLayer(opt)}
                      className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent transition-colors"
                    >
                      {opt}
                    </button>
                  ))
                )}
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

    </div>
  )
}
