"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Plus, Trash2, Save, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const nodeSchema = z.object({
  id: z.string().min(1, "ID is required"),
  type: z.enum(["Patient", "Encounter", "Symptom", "Disease", "Test", "TestResult", "Medication", "SourceDocument", "Assertion"]),
  properties: z.record(z.string(), z.any())
})

const relationshipSchema = z.object({
  id: z.string().min(1, "ID is required"),
  type: z.string().min(1, "Type is required"),
  source: z.string().min(1, "Source is required"),
  target: z.string().min(1, "Target is required"),
  properties: z.record(z.string(), z.any())
})

const templateSchema = z.object({
  nodes: z.array(nodeSchema),
  relationships: z.array(relationshipSchema)
})

type TemplateData = z.infer<typeof templateSchema>

interface DocumentTemplateEditorProps {
  data: any
  onSave: (data: TemplateData) => void
  onCancel: () => void
  fileName: string
}

const NODE_TYPES = [
  "Patient",
  "Encounter",
  "Symptom",
  "Disease",
  "Test",
  "TestResult",
  "Medication",
  "SourceDocument",
  "Assertion"
] as const

// Define valid relationship mappings based on schema
const RELATIONSHIP_MAPPINGS = {
  "HAS_ENCOUNTER": {
    validSources: ["Patient"],
    validTargets: ["Encounter"]
  },
  "HAS_SYMPTOM": {
    validSources: ["Encounter"],
    validTargets: ["Symptom"]
  },
  "DIAGNOSED_AS": {
    validSources: ["Encounter"],
    validTargets: ["Disease"]
  },
  "ORDERED_TEST": {
    validSources: ["Encounter"],
    validTargets: ["Test"]
  },
  "YIELDED": {
    validSources: ["Test"],
    validTargets: ["TestResult"]
  },
  "PRESCRIBED": {
    validSources: ["Encounter"],
    validTargets: ["Medication"]
  },
  "EVIDENCED_BY": {
    validSources: ["Assertion"],
    validTargets: ["SourceDocument"]
  }
} as const

const COMMON_RELATIONSHIP_TYPES = Object.keys(RELATIONSHIP_MAPPINGS)

export function DocumentTemplateEditor({ data, onSave, onCancel, fileName }: DocumentTemplateEditorProps) {
  const [activeTab, setActiveTab] = useState<"nodes" | "relationships">("nodes")

  const form = useForm<TemplateData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nodes: data?.nodes || [],
      relationships: data?.relationships || []
    }
  })

  const {
    fields: nodeFields,
    append: appendNode,
    remove: removeNode
  } = useFieldArray({
    control: form.control,
    name: "nodes"
  })

  const {
    fields: relationshipFields,
    append: appendRelationship,
    remove: removeRelationship
  } = useFieldArray({
    control: form.control,
    name: "relationships"
  })

  const handleAddNode = () => {
    appendNode({
      id: `node_${Date.now()}`,
      type: "Patient",
      properties: {}
    })
  }

  const handleAddRelationship = () => {
    appendRelationship({
      id: `rel_${Date.now()}`,
      type: "RELATED_TO",
      source: "",
      target: "",
      properties: {}
    })
  }

  const handleAddProperty = (index: number, type: "node" | "relationship", key: string, value: string) => {
    if (type === "node") {
      const currentProperties = form.getValues(`nodes.${index}.properties`) || {}
      form.setValue(`nodes.${index}.properties`, {
        ...currentProperties,
        [key]: value
      })
    } else {
      const currentProperties = form.getValues(`relationships.${index}.properties`) || {}
      form.setValue(`relationships.${index}.properties`, {
        ...currentProperties,
        [key]: value
      })
    }
  }

  const handleRemoveProperty = (index: number, type: "node" | "relationship", key: string) => {
    if (type === "node") {
      const currentProperties = form.getValues(`nodes.${index}.properties`) || {}
      const { [key]: removed, ...rest } = currentProperties
      form.setValue(`nodes.${index}.properties`, rest)
    } else {
      const currentProperties = form.getValues(`relationships.${index}.properties`) || {}
      const { [key]: removed, ...rest } = currentProperties
      form.setValue(`relationships.${index}.properties`, rest)
    }
  }

  const onSubmit = (data: TemplateData) => {
    onSave(data)
  }

  const availableNodeIds = form.watch("nodes").map(node => node.id)
  const nodesById = form.watch("nodes").reduce((acc, node) => {
    acc[node.id] = node
    return acc
  }, {} as Record<string, any>)

  // Helper functions for relationship validation
  const getValidRelationshipTypes = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || !nodesById[sourceId] || !nodesById[targetId]) return []

    const sourceType = nodesById[sourceId].type
    const targetType = nodesById[targetId].type

    return COMMON_RELATIONSHIP_TYPES.filter(relType => {
      const mapping = RELATIONSHIP_MAPPINGS[relType as keyof typeof RELATIONSHIP_MAPPINGS]
      return mapping.validSources.includes(sourceType) && mapping.validTargets.includes(targetType)
    })
  }

  const getValidSourceNodes = (relationshipType: string, targetId?: string) => {
    const mapping = RELATIONSHIP_MAPPINGS[relationshipType as keyof typeof RELATIONSHIP_MAPPINGS]
    if (!mapping) return availableNodeIds

    return availableNodeIds.filter(nodeId => {
      const node = nodesById[nodeId]
      return mapping.validSources.includes(node?.type)
    })
  }

  const getValidTargetNodes = (relationshipType: string, sourceId?: string) => {
    const mapping = RELATIONSHIP_MAPPINGS[relationshipType as keyof typeof RELATIONSHIP_MAPPINGS]
    if (!mapping) return availableNodeIds

    return availableNodeIds.filter(nodeId => {
      const node = nodesById[nodeId]
      return mapping.validTargets.includes(node?.type)
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Uploads
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Edit Template</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          Editing extracted data from: <span className="font-medium">{fileName}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <Button
              type="button"
              variant={activeTab === "nodes" ? "default" : "ghost"}
              onClick={() => setActiveTab("nodes")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Nodes ({nodeFields.length})
            </Button>
            <Button
              type="button"
              variant={activeTab === "relationships" ? "default" : "ghost"}
              onClick={() => setActiveTab("relationships")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Relationships ({relationshipFields.length})
            </Button>
          </div>

          {/* Nodes Tab */}
          {activeTab === "nodes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Nodes</h2>
                <Button type="button" onClick={handleAddNode}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Node
                </Button>
              </div>

              {nodeFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Node {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNode(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`nodes.${index}.id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="node_001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`nodes.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select node type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {NODE_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Properties</Label>
                      <div className="mt-2 space-y-2">
                        {Object.entries(form.watch(`nodes.${index}.properties`) || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <Input
                              value={key}
                              onChange={(e) => {
                                const newKey = e.target.value
                                const properties = form.getValues(`nodes.${index}.properties`) || {}
                                const { [key]: oldValue, ...rest } = properties
                                form.setValue(`nodes.${index}.properties`, {
                                  ...rest,
                                  [newKey]: value
                                })
                              }}
                              placeholder="Property name"
                              className="w-1/3"
                            />
                            <Input
                              value={String(value)}
                              onChange={(e) => handleAddProperty(index, "node", key, e.target.value)}
                              placeholder="Property value"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProperty(index, "node", key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <PropertyAdder
                          onAdd={(key, value) => handleAddProperty(index, "node", key, value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Relationships Tab */}
          {activeTab === "relationships" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Relationships</h2>
                <Button type="button" onClick={handleAddRelationship}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Relationship
                </Button>
              </div>

              {relationshipFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Relationship {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRelationship(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`relationships.${index}.id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="rel_001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`relationships.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMMON_RELATIONSHIP_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`relationships.${index}.source`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Node</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select source node" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableNodeIds.map((nodeId) => (
                                  <SelectItem key={nodeId} value={nodeId}>
                                    {nodeId}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`relationships.${index}.target`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Node</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select target node" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableNodeIds.map((nodeId) => (
                                  <SelectItem key={nodeId} value={nodeId}>
                                    {nodeId}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Properties</Label>
                      <div className="mt-2 space-y-2">
                        {Object.entries(form.watch(`relationships.${index}.properties`) || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <Input
                              value={key}
                              onChange={(e) => {
                                const newKey = e.target.value
                                const properties = form.getValues(`relationships.${index}.properties`) || {}
                                const { [key]: oldValue, ...rest } = properties
                                form.setValue(`relationships.${index}.properties`, {
                                  ...rest,
                                  [newKey]: value
                                })
                              }}
                              placeholder="Property name"
                              className="w-1/3"
                            />
                            <Input
                              value={String(value)}
                              onChange={(e) => handleAddProperty(index, "relationship", key, e.target.value)}
                              placeholder="Property value"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProperty(index, "relationship", key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <PropertyAdder
                          onAdd={(key, value) => handleAddProperty(index, "relationship", key, value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <Button type="submit" size="lg">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

function PropertyAdder({ onAdd }: { onAdd: (key: string, value: string) => void }) {
  const [key, setKey] = useState("")
  const [value, setValue] = useState("")

  const handleAdd = () => {
    if (key.trim() && value.trim()) {
      onAdd(key.trim(), value.trim())
      setKey("")
      setValue("")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Property name"
        className="w-1/3"
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Property value"
        className="flex-1"
      />
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}