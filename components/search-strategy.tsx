"use client"

import { useState, useCallback, useImperativeHandle, forwardRef } from "react"
import {
  RotateCcw,
  Plus,
  Lock,
  GripVertical,
  X,
  Trash2,
  Info,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  type FilterCondition,
  FIELDS,
  MultiValueSelect,
} from "@/components/strategy-row"

// ── Types ──────────────────────────────────────────────────────────────────────

type LayerCondition = FilterCondition & { connector?: "AND" | "OR" }

type SimpleLayer = {
  id: string
  label: string
  conditions: LayerCondition[]
}

type Priority = "answer-bank" | "supporting"

type Exclusion = {
  id: string
  field: string
  values: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PREDEFINED_LAYERS: Omit<SimpleLayer, "id">[] = [
  {
    label: "Fund + Vehicle",
    conditions: [
      { field: "Fund", operator: "includes", values: ["Fund I"], exclude: false },
      { field: "Vehicle", operator: "includes", values: ["LP", "SMA"], exclude: false, connector: "AND" },
    ],
  },
  {
    label: "Fund",
    conditions: [{ field: "Fund", operator: "includes", values: ["Fund I"], exclude: false }],
  },
  {
    label: "Strategy",
    conditions: [{ field: "Strategy", operator: "includes", values: ["Long/Short"], exclude: false }],
  },
  {
    label: "Business Unit",
    conditions: [{ field: "Business Unit", operator: "includes", values: [], exclude: false }],
  },
  {
    label: "Vehicle",
    conditions: [{ field: "Vehicle", operator: "includes", values: [], exclude: false }],
  },
  {
    label: "ESG",
    conditions: [{ field: "ESG", operator: "includes", values: [], exclude: false }],
  },
  {
    label: "Region",
    conditions: [{ field: "Region", operator: "includes", values: [], exclude: false }],
  },
  {
    label: "Sector",
    conditions: [{ field: "Sector", operator: "includes", values: [], exclude: false }],
  },
]

const DEFAULT_LAYERS: SimpleLayer[] = [
  { id: "1", ...PREDEFINED_LAYERS[0] },
  { id: "2", ...PREDEFINED_LAYERS[1] },
  { id: "3", ...PREDEFINED_LAYERS[2] },
]

// ── Inline condition editor ────────────────────────────────────────────────────

function InlineConditionRow({
  condition,
  index,
  onUpdate,
  onRemove,
  showRemove,
}: {
  condition: LayerCondition
  index: number
  onUpdate: (i: number, c: LayerCondition) => void
  onRemove: (i: number) => void
  showRemove: boolean
}) {
  return (
    <div className="space-y-1">
      {/* Connector badge */}
      {condition.connector && (
        <div className="flex items-center gap-1 pl-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            {condition.connector}
          </span>
        </div>
      )}
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
          value={condition.exclude ? "excludes" : "includes"}
          onValueChange={(val) => onUpdate(index, { ...condition, exclude: val === "excludes" })}
        >
          <SelectTrigger className="h-7 w-[90px] text-xs bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["includes", "excludes"].map((op) => (
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
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export type SearchStrategyHandle = { isCustomized: boolean; reset: () => void }

export const SearchStrategy = forwardRef<SearchStrategyHandle>(function SearchStrategy(_, ref) {
  const [layers, setLayers] = useState<SimpleLayer[]>(DEFAULT_LAYERS)
  const [useAnswerBank, setUseAnswerBank] = useState(true)
  const [useSupportingMaterials, setUseSupportingMaterials] = useState(true)
  const [smTab, setSmTab] = useState<"supporting-materials" | "registry">("supporting-materials")
  const [useAllSM, setUseAllSM] = useState(false)
  const [smFileQuery, setSmFileQuery] = useState("")
  const [priority, setPriority] = useState<Priority>("answer-bank")
  const [verbatim, setVerbatim] = useState(true)
  const [exclusions, setExclusions] = useState<Exclusion[]>([])
  const [isCustomized, setIsCustomized] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [addLayerOpen, setAddLayerOpen] = useState(false)
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null)

  const mark = () => setIsCustomized(true)

  const reset = () => {
    setLayers(DEFAULT_LAYERS)
    setUseAnswerBank(true)
    setUseSupportingMaterials(true)
    setPriority("answer-bank")
    setVerbatim(true)
    setExclusions([])
    setExpandedLayerId(null)
    setIsCustomized(false)
  }

  useImperativeHandle(ref, () => ({ isCustomized, reset }), [isCustomized])

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
  const removeLayer = (id: string) => {
    setLayers((p) => p.filter((l) => l.id !== id))
    if (expandedLayerId === id) setExpandedLayerId(null)
    mark()
  }

  const addLayer = (predefined: Omit<SimpleLayer, "id">) => {
    setLayers((p) => [...p, { id: String(Date.now()), ...predefined }])
    setAddLayerOpen(false)
    mark()
  }

  const availableToAdd = PREDEFINED_LAYERS.filter((p) => !layers.some((l) => l.label === p.label))

  // ── Conditions ──
  const updateCondition = useCallback((layerId: string, ci: number, cond: LayerCondition) => {
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

  const addCondition = (layerId: string, connector: "AND" | "OR") => {
    setLayers((prev) => prev.map((l) => {
      if (l.id !== layerId) return l
      return { ...l, conditions: [...l.conditions, { field: "Fund", operator: "includes", values: [], exclude: false, connector }] }
    }))
    mark()
  }

  // ── Exclusions ──
  const addExclusion = () => { setExclusions((p) => [...p, { id: String(Date.now()), field: "Fund", values: [] }]); mark() }
  const removeExclusion = (id: string) => { setExclusions((p) => p.filter((e) => e.id !== id)); mark() }
  const updateExclusion = (id: string, patch: Partial<Exclusion>) => {
    setExclusions((p) => p.map((e) => e.id === id ? { ...e, ...patch } : e))
    mark()
  }

  const showPriority = useAnswerBank && useSupportingMaterials

  return (
    <div className="space-y-3">

      {/* ── Sources & Behavior ── */}
      <div className="rounded-md border border-border bg-secondary/40 px-4 py-3 space-y-3">

        {/* Sources */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Sources</p>

          {/* Answer Bank */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="src-ab"
              checked={useAnswerBank}
              onCheckedChange={(v) => { setUseAnswerBank(!!v); mark() }}
            />
            <Label htmlFor="src-ab" className="text-xs cursor-pointer">Answer Bank</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                Sourced from pre-approved Q&A pairs in your Answer Bank.
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Supporting Materials checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="src-sm"
              checked={useSupportingMaterials}
              onCheckedChange={(v) => { setUseSupportingMaterials(!!v); mark() }}
            />
            <Label htmlFor="src-sm" className="text-xs cursor-pointer">Supporting Materials</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                Sourced from previously-completed questionnaires or other supporting documents.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Supporting Materials sub-module */}
        {useSupportingMaterials && (
          <div className="rounded-md border border-border bg-background p-3 space-y-3">
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 w-fit">
              {(["supporting-materials", "registry"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSmTab(tab)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    smTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "supporting-materials" ? "Supporting Materials" : "Registry"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-all-sm"
                checked={useAllSM}
                onCheckedChange={(v) => { setUseAllSM(!!v); mark() }}
              />
              <Label htmlFor="use-all-sm" className="text-xs cursor-pointer">Use all supporting materials (1)</Label>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Supporting files (Upload, attach, or paste a URL)<span className="text-destructive ml-0.5">*</span>
              </label>
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2.5">
                <input
                  type="text"
                  value={smFileQuery}
                  onChange={(e) => setSmFileQuery(e.target.value)}
                  placeholder="Type file name to search or paste a URL"
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                />
                <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* Priority */}
        {showPriority && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Priority</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  When both sources are enabled, choose which source the AI Agent should prioritize.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {(["answer-bank", "supporting"] as Priority[]).map((val) => {
                const label = val === "answer-bank" ? "Answer Bank first" : "Supporting first"
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
        )}

        {/* Verbatim */}
        <div className="flex items-start gap-2 pt-0.5">
          <Checkbox
            id="verbatim"
            checked={verbatim}
            onCheckedChange={(v) => { setVerbatim(!!v); mark() }}
            className="mt-0.5"
          />
          <div className="flex items-center gap-1.5">
            <Label htmlFor="verbatim" className="text-xs cursor-pointer">Do not create AI Agent Generated answers</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px]">
                Only verbatim matches from your selected sources will be used. Questions with no exact match will remain unanswered.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

      </div>

      {/* ── Search Order ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Search Order</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] space-y-1.5">
              <p>We search in this order. If no matches are found at a level, we expand to the next.</p>
              <p>Defaults are auto-generated from your submission intake — ordered from most specific (e.g. Fund + Vehicle) to least specific (Firmwide), so answers are always as contextually relevant as possible.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-1">
          {layers.map((layer, index) => {
            const isExpanded = expandedLayerId === layer.id
            return (
              <div key={layer.id}>
                {/* Chip row */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-center gap-2 group"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0 select-none">
                    {index + 1}
                  </span>
                  <button
                    onClick={() => setExpandedLayerId(isExpanded ? null : layer.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm hover:border-primary/30 hover:shadow transition-all select-none"
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
                    {layer.label}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); removeLayer(layer.id) }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); removeLayer(layer.id) } }}
                      className="ml-0.5 rounded-sm p-0.5 text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      aria-label={`Remove ${layer.label}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </span>
                    {isExpanded
                      ? <ChevronUp className="h-2.5 w-2.5 text-muted-foreground/40 ml-0.5" />
                      : <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/40 ml-0.5" />
                    }
                  </button>
                </div>

                {/* Inline expanded conditions */}
                {isExpanded && (
                  <div className="ml-7 mt-1.5 mb-1 rounded-md border border-border bg-card p-3 space-y-2">
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
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        onClick={() => addCondition(layer.id, "AND")}
                        className="flex items-center gap-0.5 text-[11px] font-medium text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 rounded px-2 py-0.5 transition-colors"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        AND
                      </button>
                      <button
                        onClick={() => addCondition(layer.id, "OR")}
                        className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded px-2 py-0.5 transition-colors"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        OR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Firmwide locked */}
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground shrink-0 select-none">
              {layers.length + 1}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-secondary/30 px-2 py-1 text-xs font-medium text-muted-foreground select-none">
              <Lock className="h-2.5 w-2.5" />
              Firmwide
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/40 cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] space-y-1.5">
                <p className="font-medium">Final fallback level — always last.</p>
                <p>Firmwide answers are canonical across all funds and structures. If no matches are found at any prior level, the engine falls back here. Firmwide content is never overridden by more specific levels.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Add Level */}
        <Popover open={addLayerOpen} onOpenChange={setAddLayerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-dashed text-xs text-muted-foreground hover:text-foreground hover:border-primary/30"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Level
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="start">
            {availableToAdd.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">All levels added</p>
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

      {/* ── Exclude ── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Exclude from all Search Levels</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px]">
              Exclude specific tags or scopes from all search levels. Excluded content will never be returned, regardless of how specific the match is.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="space-y-1.5">
          {exclusions.map((exc) => (
            <div key={exc.id} className="flex items-center gap-1.5 flex-wrap">
              <Select
                value={exc.field}
                onValueChange={(val) => updateExclusion(exc.id, { field: val, values: [] })}
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
            Exclude specific tags or scopes
          </button>
        </div>
      </div>

    </div>
  )
})
