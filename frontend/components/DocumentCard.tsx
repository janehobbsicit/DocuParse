'use client'

import Link from 'next/link'
import { FileText, Download, Trash2 } from 'lucide-react'
import type { Document } from '@/lib/types'
import { exportJson, exportCsv } from '@/lib/api'
import toast from 'react-hot-toast'

const statusStyles: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  processing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  pending:    'bg-gray-100 text-gray-600 border-gray-200',
  failed:     'bg-red-100 text-red-700 border-red-200',
}

interface DocumentCardProps {
  doc: Document
  onDelete: (id: string) => void
}

export default function DocumentCard({ doc, onDelete }: DocumentCardProps) {
  const handleExportJson = async () => {
    try {
      await exportJson(doc.id)
      toast.success('JSON exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleExportCsv = async () => {
    try {
      await exportCsv(doc.id)
      toast.success('CSV exported')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-indigo-600" />
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/documents/${doc.id}`} className="block">
          <p className="font-medium text-gray-900 truncate hover:text-indigo-600 transition-colors">
            {doc.original_filename || doc.filename}
          </p>
        </Link>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              statusStyles[doc.status] ?? statusStyles.pending
            }`}
          >
            {doc.status}
          </span>
          <span className="text-xs text-gray-400">{doc.template_type}</span>
          <span className="text-xs text-gray-400">
            {new Date(doc.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {doc.status === 'completed' && (
          <>
            <button
              onClick={handleExportJson}
              title="Export JSON"
              className="p-1.5 rounded-md hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <Download size={15} />
            </button>
            <button
              onClick={handleExportCsv}
              title="Export CSV"
              className="p-1.5 rounded-md hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors text-xs font-medium"
            >
              CSV
            </button>
          </>
        )}
        <button
          onClick={() => onDelete(doc.id)}
          title="Delete"
          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
