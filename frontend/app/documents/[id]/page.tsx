'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  Calendar,
  HardDrive,
  Tag,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getDocument, exportJson, exportCsv } from '@/lib/api'
import ExtractionResults from '@/components/ExtractionResults'

const statusBadge: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  processing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  pending:    'bg-gray-100 text-gray-600 border-gray-200',
  failed:     'bg-red-100 text-red-700 border-red-200',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: doc, isLoading, isError } = useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id),
    enabled: !!id,
  })

  const handleExportJson = async () => {
    try { await exportJson(id); toast.success('JSON exported') }
    catch { toast.error('Export failed') }
  }

  const handleExportCsv = async () => {
    try { await exportCsv(id); toast.success('CSV exported') }
    catch { toast.error('Export failed') }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-16 justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading document…</span>
      </div>
    )
  }

  if (isError || !doc) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-gray-600">Document not found or failed to load.</p>
        <button onClick={() => router.back()} className="text-indigo-600 hover:underline text-sm">
          ← Go back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link
          href="/history"
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900 truncate">
            {doc.original_filename || doc.filename}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Document ID: {doc.id}</p>
        </div>
      </div>

      {/* Metadata card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">File Type</p>
              <p className="text-sm font-semibold text-gray-800 uppercase">{doc.file_type}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Tag size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Template</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">{doc.template_type}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <HardDrive size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">File Size</p>
              <p className="text-sm font-semibold text-gray-800">{formatBytes(doc.file_size)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Uploaded</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
              statusBadge[doc.status] ?? statusBadge.pending
            }`}
          >
            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
          </span>

          {doc.status === 'completed' && (
            <div className="flex gap-2">
              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Download size={14} />
                Export JSON
              </button>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {doc.status === 'failed' && doc.error_message && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Extraction failed</p>
            <p className="text-sm text-red-600 mt-0.5">{doc.error_message}</p>
          </div>
        </div>
      )}

      {/* Extracted data */}
      {doc.status === 'completed' && doc.extracted_data && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Extracted Data</h3>
          <ExtractionResults data={doc.extracted_data} />
        </div>
      )}

      {(doc.status === 'pending' || doc.status === 'processing') && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
          <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
          <p className="text-sm text-yellow-700 font-medium">Document is being processed…</p>
        </div>
      )}
    </div>
  )
}
