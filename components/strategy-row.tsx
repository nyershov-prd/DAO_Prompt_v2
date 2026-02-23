"use client"

import { useState, useRef, useEffect } from "react"
import { GripVertical, Trash2, Plus, X, Check, ChevronsUpDown, Ban } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

export type FilterCondition = {
  field: string
  operator: string
  values: string[]
  exclude: boolean
}

export type GroupLogic = "AND" | "OR"

export type StrategyLayer = {
  id: string
  conditions: FilterCondition[]
  groupLogic: GroupLogic
  useAnswerBank: boolean
  useSupportingMaterials: boolean
  useVerbatim: boolean
}

export const FIELDS = ["Fund", "Strategy", "Business Unit", "Vehicle", "ESG", "Region", "Sector"]
const OPERATORS = ["equals", "contains", "starts with"]
export const VALUES: Record<string, string[]> = {
  Fund: ["Fund I", "Fund II", "Fund III", "Growth Fund", "Income Fund"],
  Strategy: ["Long/Short", "Market Neutral", "Global Macro", "Event Driven"],
  "Business Unit": ["Americas", "EMEA", "Asia Pacific", "Global"],
  Vehicle: ["LP", "GP", "Co-Invest", "SMA", "Fund of Funds"],
  ESG: ["Article 8", "Article 9", "Non-classified", "SFDR Compliant"],
  Region: ["North America", "Europe", "Asia", "Emerging Markets"],
  Sector: ["Technology", "Healthcare", "Energy", "Financials"],
}

/* ── Multi-select value picker ── */
export function MultiValueSelect({
  field,
  values,
  onChange,
}: {
  field: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const options = VALUES[field] || []

  const toggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val))
    } else {
      onChange([...values, val])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex h-8 min-w-[150px] max-w-[220px] items-center justify-between gap-1 rounded-md border border-input bg-card px-2 text-xs transition-colors hover:bg-accent",
            values.length === 0 && "text-muted-foreground"
          )}
        >
          <span className="flex flex-1 items-center gap-1 overflow-hidden">
            {values.length === 0 && "Select values..."}
            {values.length > 0 && values.length <= 2 && (
              <span className="flex items-center gap-1 overflow-hidden">
                {values.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="h-5 max-w-[80px] truncate px-1.5 text-[10px] font-medium"
                  >
                    {v}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(values.filter((x) => x !== v))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation()
                          onChange(values.filter((x) => x !== v))
                        }
                      }}
                      aria-label={`Remove ${v}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </span>
                  </Badge>
                ))}
              </span>
            )}
            {values.length > 2 && (
              <span className="flex items-center gap-1">
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
                  {values[0]}
                </Badge>
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium text-muted-foreground">
                  +{values.length - 1}
                </Badge>
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${field}...`} className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="py-3 text-xs">No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => toggle(opt)}
                  className="text-xs"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-input",
                      values.includes(opt) ? "bg-primary border-primary text-primary-foreground" : "opacity-50"
                    )}
                  >
                    {values.includes(opt) && <Check className="h-2.5 w-2.5" />}
                  </div>
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* ── Single condition row ── */
function ConditionRow({
  condition,
  index,
  onUpdate,
  onRemove,
  showRemove,
}: {
  condition: FilterCondition
  index: number
  onUpdate: (index: number, condition: FilterCondition) => void
  onRemove: (index: number) => void
  showRemove: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Exclude toggle */}
      <button
        onClick={() => onUpdate(index, { ...condition, exclude: !condition.exclude })}
        className={cn(
          "flex h-8 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold uppercase tracking-wider transition-colors shrink-0",
          condition.exclude
            ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
            : "border-border bg-secondary text-muted-foreground hover:bg-accent"
        )}
        title={condition.exclude ? "Excluding matches" : "Click to exclude"}
      >
        {condition.exclude && <Ban className="h-3 w-3" />}
        {condition.exclude ? "NOT" : "IS"}
      </button>

      {/* Field */}
      <Select
        value={condition.field}
        onValueChange={(val) => onUpdate(index, { ...condition, field: val, values: [] })}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs bg-card">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {FIELDS.map((f) => (
            <SelectItem key={f} value={f} className="text-xs">
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator */}
      <Select
        value={condition.operator}
        onValueChange={(val) => onUpdate(index, { ...condition, operator: val })}
      >
        <SelectTrigger className="h-8 w-[110px] text-xs bg-card">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op} value={op} className="text-xs">
              {op}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Multi-value selector */}
      <MultiValueSelect
        field={condition.field}
        values={condition.values}
        onChange={(vals) => onUpdate(index, { ...condition, values: vals })}
      />

      {showRemove && (
        <button
          onClick={() => onRemove(index)}
          className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Remove condition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

/* ── Full strategy row (draggable layer) ── */
export function StrategyRow({
  layer,
  index,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  totalRows,
}: {
  layer: StrategyLayer
  index: number
  onUpdate: (id: string, layer: StrategyLayer) => void
  onRemove: (id: string) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, index: number) => void
  totalRows: number
}) {
  const updateCondition = (condIndex: number, condition: FilterCondition) => {
    const newConditions = [...layer.conditions]
    newConditions[condIndex] = condition
    onUpdate(layer.id, { ...layer, conditions: newConditions })
  }

  const removeCondition = (condIndex: number) => {
    const newConditions = layer.conditions.filter((_, i) => i !== condIndex)
    onUpdate(layer.id, { ...layer, conditions: newConditions })
  }

  const addCondition = () => {
    onUpdate(layer.id, {
      ...layer,
      conditions: [...layer.conditions, { field: "Fund", operator: "equals", values: [], exclude: false }],
    })
  }

  const cycleGroupLogic = () => {
    const next: GroupLogic = layer.groupLogic === "AND" ? "OR" : "AND"
    onUpdate(layer.id, { ...layer, groupLogic: next })
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div className="flex flex-col items-center gap-1 pt-0.5 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </div>

        {/* Row number + label */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Layer
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Conditions */}
          <div className="space-y-2">
            {layer.conditions.map((condition, condIndex) => (
              <div key={condIndex}>
                {condIndex > 0 && (
                  <button
                    onClick={cycleGroupLogic}
                    className="mb-2 inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent transition-colors"
                  >
                    {layer.groupLogic}
                  </button>
                )}
                <ConditionRow
                  condition={condition}
                  index={condIndex}
                  onUpdate={updateCondition}
                  onRemove={removeCondition}
                  showRemove={layer.conditions.length > 1}
                />
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={addCondition} className="h-7 text-xs text-muted-foreground hover:text-foreground">
            <Plus className="mr-1 h-3 w-3" />
            Add Condition
          </Button>

          {/* Source toggles */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <Switch
                id={`ab-${layer.id}`}
                checked={layer.useAnswerBank}
                onCheckedChange={(val) => onUpdate(layer.id, { ...layer, useAnswerBank: val as boolean })}
                className="scale-75"
              />
              <Label htmlFor={`ab-${layer.id}`} className="text-xs text-muted-foreground cursor-pointer">
                Answer Bank
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`sm-${layer.id}`}
                checked={layer.useSupportingMaterials}
                onCheckedChange={(val) => onUpdate(layer.id, { ...layer, useSupportingMaterials: val as boolean })}
                className="scale-75"
              />
              <Label htmlFor={`sm-${layer.id}`} className="text-xs text-muted-foreground cursor-pointer">
                Supporting Materials
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`vb-${layer.id}`}
                checked={layer.useVerbatim}
                onCheckedChange={(val) => onUpdate(layer.id, { ...layer, useVerbatim: val as boolean })}
                className="scale-75"
              />
              <Label htmlFor={`vb-${layer.id}`} className="text-xs text-muted-foreground cursor-pointer">
                Verbatim Only
              </Label>
            </div>
          </div>
        </div>

        {/* Remove row */}
        {totalRows > 1 && (
          <button
            onClick={() => onRemove(layer.id)}
            className="rounded-md p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove strategy layer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
