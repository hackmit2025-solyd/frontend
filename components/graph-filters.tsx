"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  showAll?: boolean
  onShowAllChange?: (showAll: boolean) => void
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  showAll = false,
  onShowAllChange
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string) => {
    onChange(selected.filter(item => item !== value))
  }

  const handleClearAll = () => {
    onChange([])
    if (onShowAllChange) {
      onShowAllChange(false)
    }
  }

  const handleSelectAll = () => {
    onChange([...options])
    if (onShowAllChange) {
      onShowAllChange(true)
    }
  }

  const toggleShowAll = () => {
    if (onShowAllChange) {
      onShowAllChange(!showAll)
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
          >
            {showAll ? (
              <span>Show All</span>
            ) : selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selected.length === 1 ? (
              selected[0]
            ) : (
              `${selected.length} items selected`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                <CommandItem onSelect={toggleShowAll}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      showAll ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Show All
                </CommandItem>
                <CommandItem onSelect={handleSelectAll}>
                  Select All
                </CommandItem>
                <CommandItem onSelect={handleClearAll}>
                  Clear All
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    onSelect={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {!showAll && selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">
              {item}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => handleRemove(item)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

interface GraphFiltersProps {
  nodeTypes: string[]
  selectedNodeTypes: string[]
  onNodeTypesChange: (types: string[]) => void
  showAllNodes: boolean
  onShowAllNodesChange: (showAll: boolean) => void

  relationshipTypes: string[]
  selectedRelationshipTypes: string[]
  onRelationshipTypesChange: (types: string[]) => void
  showAllRelationships: boolean
  onShowAllRelationshipsChange: (showAll: boolean) => void
}

export function GraphFilters({
  nodeTypes,
  selectedNodeTypes,
  onNodeTypesChange,
  showAllNodes,
  onShowAllNodesChange,
  relationshipTypes,
  selectedRelationshipTypes,
  onRelationshipTypesChange,
  showAllRelationships,
  onShowAllRelationshipsChange
}: GraphFiltersProps) {
  return (
    <div className="space-y-4 p-4 bg-background border rounded-lg">
      <div className="space-y-2">
        <label className="text-sm font-medium">Filter by Node Type</label>
        <MultiSelect
          options={nodeTypes}
          selected={selectedNodeTypes}
          onChange={onNodeTypesChange}
          placeholder="Select node types"
          showAll={showAllNodes}
          onShowAllChange={onShowAllNodesChange}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Filter by Relationship Type</label>
        <MultiSelect
          options={relationshipTypes}
          selected={selectedRelationshipTypes}
          onChange={onRelationshipTypesChange}
          placeholder="Select relationship types"
          showAll={showAllRelationships}
          onShowAllChange={onShowAllRelationshipsChange}
        />
      </div>
    </div>
  )
}