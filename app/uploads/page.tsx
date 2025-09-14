"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Check, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TopNavBar } from "@/components/top-nav-bar"
import { StatusBar } from "@/components/status-bar"
import { DocumentTemplateEditor } from "@/components/document-template-editor"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  status: "processing" | "completed" | "error"
  extractedData?: any
}

interface ExtractedNode {
  id: string
  type: "Patient" | "Encounter" | "Symptom" | "Disease" | "Test" | "TestResult" | "Medication" | "SourceDocument" | "Assertion"
  properties: Record<string, any>
}

interface ExtractedRelationship {
  id: string
  type: string
  source: string
  target: string
  properties: Record<string, any>
}

interface ExtractedData {
  nodes: ExtractedNode[]
  relationships: ExtractedRelationship[]
}

export default function UploadsPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [editingFile, setEditingFile] = useState<UploadedFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const mockExtractData = (fileName: string): ExtractedData => {
    // Mock extracted data based on document type
    const mockData: ExtractedData = {
      nodes: [
        {
          id: "patient_001",
          type: "Patient",
          properties: {
            id: "P001",
            dob: "1978-03-15",
            sex: "Male"
          }
        },
        {
          id: "encounter_001",
          type: "Encounter",
          properties: {
            id: "E001",
            date: "2023-09-13",
            dept: "Cardiology"
          }
        },
        {
          id: "symptom_001",
          type: "Symptom",
          properties: {
            name: "Chest Pain",
            code: "R06.02",
            coding_system: "ICD-10"
          }
        },
        {
          id: "disease_001",
          type: "Disease",
          properties: {
            code: "I25.10",
            name: "Atherosclerotic heart disease",
            status: "Active"
          }
        },
        {
          id: "test_001",
          type: "Test",
          properties: {
            name: "Troponin I",
            loinc: "10839-9",
            category: "Cardiac"
          }
        },
        {
          id: "testresult_001",
          type: "TestResult",
          properties: {
            id: "TR001",
            value: "0.05",
            unit: "ng/mL",
            time: "2023-09-13T10:30:00Z"
          }
        },
        {
          id: "medication_001",
          type: "Medication",
          properties: {
            code: "314076",
            name: "Atorvastatin",
            form: "Tablet"
          }
        },
        {
          id: "source_001",
          type: "SourceDocument",
          properties: {
            source_id: "DOC001",
            source_type: "Clinical Note",
            title: "Cardiology Consultation"
          }
        },
        {
          id: "assertion_001",
          type: "Assertion",
          properties: {
            assertion_id: "A001",
            predicate: "has_diagnosis",
            confidence: 0.95
          }
        }
      ],
      relationships: [
        {
          id: "rel_001",
          type: "HAS_ENCOUNTER",
          source: "patient_001",
          target: "encounter_001",
          properties: {
            date: "2023-09-13"
          }
        },
        {
          id: "rel_002",
          type: "HAS_SYMPTOM",
          source: "encounter_001",
          target: "symptom_001",
          properties: {
            severity: "Moderate",
            onset: "Acute"
          }
        },
        {
          id: "rel_003",
          type: "DIAGNOSED_AS",
          source: "encounter_001",
          target: "disease_001",
          properties: {
            diagnosedBy: "Dr. Johnson",
            confidence: "High"
          }
        },
        {
          id: "rel_004",
          type: "ORDERED_TEST",
          source: "encounter_001",
          target: "test_001",
          properties: {
            orderedBy: "Dr. Johnson",
            orderTime: "2023-09-13T09:00:00Z"
          }
        },
        {
          id: "rel_005",
          type: "YIELDED",
          source: "test_001",
          target: "testresult_001",
          properties: {
            resultTime: "2023-09-13T10:30:00Z"
          }
        },
        {
          id: "rel_006",
          type: "PRESCRIBED",
          source: "encounter_001",
          target: "medication_001",
          properties: {
            prescribedBy: "Dr. Johnson",
            dosage: "20mg daily",
            startDate: "2023-09-13"
          }
        },
        {
          id: "rel_007",
          type: "EVIDENCED_BY",
          source: "assertion_001",
          target: "source_001",
          properties: {
            extractedFrom: "Clinical Note Section 3",
            extractionMethod: "NLP"
          }
        }
      ]
    }
    return mockData
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)

    for (const file of acceptedFiles) {
      const fileId = Math.random().toString(36).substr(2, 9)
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: "processing"
      }

      setUploadedFiles(prev => [...prev, newFile])

      try {
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', file)

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        )

        // Upload to PDF ingest API with timeout
        const uploadPromise = fetch('/api/ingest/pdf', {
          method: 'POST',
          body: formData
        })

        const response = await Promise.race([uploadPromise, timeoutPromise]) as Response

        if (response.ok) {
          const result = await response.json()
          console.log('PDF ingest successful:', result)

          // Extract upsert results from the API response
          const { upsert_results } = result
          const nodesCreated = upsert_results?.nodes_created || 0
          const relationshipsCreated = upsert_results?.relationships_created || 0

          // Create extracted data structure for display
          const extractedData = {
            nodes: Array.from({ length: nodesCreated }, (_, i) => ({
              id: `node_${i + 1}`,
              type: "Unknown" as const,
              properties: { generated: true }
            })),
            relationships: Array.from({ length: relationshipsCreated }, (_, i) => ({
              id: `rel_${i + 1}`,
              type: "CONNECTED_TO",
              source: `node_${i + 1}`,
              target: `node_${(i + 2) % nodesCreated || 1}`,
              properties: { generated: true }
            })),
            apiResult: result
          }

          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { ...f, status: "completed" as const, extractedData }
                : f
            )
          )
        } else {
          const error = await response.json()
          console.error('PDF ingest failed:', error)

          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { ...f, status: "error" as const }
                : f
            )
          )
        }
      } catch (error) {
        console.error('Upload error:', error)

        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: "error" as const }
              : f
          )
        )
      }
    }

    setIsUploading(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  })

  const handleEditTemplate = (file: UploadedFile) => {
    setEditingFile(file)
  }

  const handleSaveTemplate = (updatedData: ExtractedData) => {
    if (editingFile) {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === editingFile.id
            ? { ...f, extractedData: updatedData }
            : f
        )
      )
      setEditingFile(null)
    }
  }

  const handleSubmitToBackend = async (file: UploadedFile) => {
    // Mock API call to backend
    console.log('Submitting to backend:', file.extractedData)
    // Here you would make the actual API call
    alert(`Data for ${file.name} submitted to backend successfully!`)
  }

  if (editingFile) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <TopNavBar />
        <DocumentTemplateEditor
          data={editingFile.extractedData}
          onSave={handleSaveTemplate}
          onCancel={() => setEditingFile(null)}
          fileName={editingFile.name}
        />
        <StatusBar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <TopNavBar />

      <main className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Document Uploads</h1>
          <p className="text-muted-foreground">
            Upload medical documents to extract structured data for your healthcare knowledge graph.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Drag and drop files here or click to browse. Supported formats: PDF, DOC, DOCX, TXT, Images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size: 10MB per file
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                Review and edit extracted data before submitting to your knowledge graph.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div key={file.id}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB • {file.uploadedAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={
                        file.status === 'completed' ? 'default' :
                        file.status === 'processing' ? 'secondary' : 'destructive'
                      }>
                        {file.status === 'completed' && <Check className="h-3 w-3 mr-1" />}
                        {file.status === 'processing' && <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-1" />}
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </Badge>

                      {file.status === 'completed' && file.extractedData && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTemplate(file)}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Template
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitToBackend(file)}
                          >
                            Submit to Backend
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {file.status === 'completed' && file.extractedData && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Nodes Created:</strong> {file.extractedData.apiResult?.upsert_results?.nodes_created || 0}
                          {file.extractedData.apiResult?.upsert_results?.nodes_created > 0 && (
                            <div className="ml-2 text-muted-foreground">
                              • Successfully added to knowledge graph
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Relationships Created:</strong> {file.extractedData.apiResult?.upsert_results?.relationships_created || 0}
                          {file.extractedData.apiResult?.upsert_results?.relationships_created > 0 && (
                            <div className="ml-2 text-muted-foreground">
                              • Successfully added to knowledge graph
                            </div>
                          )}
                        </div>
                      </div>
                      {file.extractedData.apiResult && (
                        <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div><strong>Document ID:</strong> {file.extractedData.apiResult.document_id}</div>
                            <div><strong>Chunks Created:</strong> {file.extractedData.apiResult.chunks_created}</div>
                            <div><strong>Entities Extracted:</strong> {file.extractedData.apiResult.entities_extracted}</div>
                            <div><strong>Assertions Created:</strong> {file.extractedData.apiResult.assertions_created}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {index < uploadedFiles.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      <StatusBar />
    </div>
  )
}
