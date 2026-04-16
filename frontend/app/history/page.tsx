'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { listDocuments, deleteDocument, exportJson, exportCsv } from '@/lib/api'
import ExtractionResults from '@/components/ExtractionResults'
import type { Document } from '@/lib/types'

const statusBadge: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  processing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  pending:    'bg-gray-100 text-gray-600 border-gray-200',
  failed:     'bg-red-100 text-red-700 border-red-200',
}

const statusFilters = ['all', 'pending', 'processing', 'completed', 'failed']

export default function HistoryPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['documents', page, statusFilter],
    queryFn: () => listDocuments(page, statusFilter),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted')
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => toast.error('Delete failed'),
  })

  const handleExportJson = async (id: string) => {
    try { await exportJson(id); toast.success('JSON exported') }
    catch { toast.error('Export failed') }
  }

  const handleExportCsv = async (id: string) => {
    try { await exportCsv(id); toast.success('CSV exported') }
    catch { toast.error('Export failed') }
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id))
  }

  const docs: Document[] = data?.items ?? []
  const totalPages = data?.pages ?? 1

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document History</h2>
          <p className="text-gray-500 mt-1">All uploaded documents and their extraction results.</p>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {statusFilters.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400 py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading documents…</span>
        </div>
      )}

      {isError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Failed to load documents.
        </div>
      )}

      {!isLoading && docs.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No documents found.</p>
        </div>
      )}

      {docs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left font-semibold text-gray-600 w-5"></th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Filename</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Template</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <>
                  <tr
                    key={doc.id}
                    className={`cursor-pointer transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } hover:bg-indigo-50/30`}
                    onClick={() => toggleExpand(doc.id)}
                  >
                    <td className="px-5 py-3 text-gray-400">
                      {expanded === doc.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 truncate max-w-xs">
                        {doc.original_filename || doc.filename}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 capitalize">{doc.template_type}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          statusBadge[doc.status] ?? statusBadge.pending
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                        {doc.status === 'completed' && (
                          <>
                            <button
                              onClick={() => handleExportJson(doc.id)}
                              className="p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-md transition-colors"
                              title="Export JSON"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleExportCsv(doc.id)}
                              className="px-1.5 py-1 text-xs font-medium text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Export CSV"
                            >
                              CSV
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(doc.id)}
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expanded === doc.id && (
                    <tr key={`${doc.id}-expanded`} className="bg-indigo-50/20">
                      <td colSpan={6} className="px-8 py-4 border-t border-indigo-100">
                        {doc.status === 'completed' && doc.extracted_data ? (
                          <ExtractionResults data={doc.extracted_data} />
                        ) : doc.status === 'failed' ? (
                          <p className="text-sm text-red-600">
                            {doc.error_message ?? 'Extraction failed.'}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            No extracted data yet.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · {data?.total ?? 0} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
