'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Upload, Loader2, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import FileUpload from '@/components/FileUpload'
import TemplateSelector from '@/components/TemplateSelector'
import ExtractionResults from '@/components/ExtractionResults'
import { uploadDocument, batchUpload } from '@/lib/api'
import type { Document } from '@/lib/types'

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [template, setTemplate] = useState('generic')
  const [batch, setBatch] = useState(false)
  const [results, setResults] = useState<Document[]>([])

  const singleMutation = useMutation({
    mutationFn: () => uploadDocument(files[0], template),
    onSuccess: (doc) => {
      setResults([doc])
      setFiles([])
      toast.success('Document uploaded & processed!')
    },
    onError: () => toast.error('Upload failed. Check the backend.'),
  })

  const batchMutation = useMutation({
    mutationFn: () => batchUpload(files, template),
    onSuccess: (docs) => {
      setResults(docs)
      setFiles([])
      toast.success(`${docs.length} document(s) uploaded!`)
    },
    onError: () => toast.error('Batch upload failed.'),
  })

  const isLoading = singleMutation.isPending || batchMutation.isPending

  const handleSubmit = () => {
    if (files.length === 0) {
      toast.error('Please select at least one file.')
      return
    }
    if (batch) {
      batchMutation.mutate()
    } else {
      singleMutation.mutate()
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
        <p className="text-gray-500 mt-1">Upload a file and extract structured data using AI.</p>
      </div>

      {/* Upload card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
        {/* Batch toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Batch Upload</p>
            <p className="text-xs text-gray-400">Upload multiple files at once</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBatch((b) => !b)
              setFiles([])
            }}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600"
          >
            {batch ? (
              <ToggleRight className="w-7 h-7 text-indigo-600" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-gray-300" />
            )}
            {batch ? 'On' : 'Off'}
          </button>
        </div>

        {/* File drop */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {batch ? 'Select Files' : 'Select File'}
          </label>
          <FileUpload files={files} onFilesChange={setFiles} multiple={batch} />
        </div>

        {/* Template selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Document Template
          </label>
          <TemplateSelector value={template} onChange={setTemplate} />
        </div>

        {/* Upload button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || files.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Upload size={18} />
              {batch ? `Upload ${files.length > 0 ? files.length : ''} Files` : 'Upload & Extract'}
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Extraction Results</h3>
          {results.map((doc) => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{doc.original_filename || doc.filename}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{doc.template_type} · {doc.status}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                  >
                    View Full <ArrowRight size={12} />
                  </Link>
                  <Link
                    href="/history"
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:underline"
                  >
                    History
                  </Link>
                </div>
              </div>

              {doc.status === 'completed' && doc.extracted_data ? (
                <ExtractionResults data={doc.extracted_data} />
              ) : doc.status === 'failed' ? (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {doc.error_message ?? 'Extraction failed.'}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
