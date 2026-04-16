'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { listDocuments } from '@/lib/api'
import type { Document } from '@/lib/types'

const statusBadge: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  pending:    'bg-gray-100 text-gray-600',
  failed:     'bg-red-100 text-red-700',
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['documents', 1, 'all'],
    queryFn: () => listDocuments(1, 'all'),
  })

  const allDocs: Document[] = data?.items ?? []
  const total      = data?.total ?? 0
  const completed  = allDocs.filter((d) => d.status === 'completed').length
  const processing = allDocs.filter((d) => d.status === 'processing').length
  const failed     = allDocs.filter((d) => d.status === 'failed').length
  const recent     = allDocs.slice(0, 5)

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of your document extraction activity.</p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading stats…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Documents"
            value={total}
            icon={<FileText className="w-6 h-6 text-indigo-600" />}
            color="bg-indigo-50"
          />
          <StatCard
            label="Completed"
            value={completed}
            icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            label="Processing"
            value={processing}
            icon={<Clock className="w-6 h-6 text-yellow-600" />}
            color="bg-yellow-50"
          />
          <StatCard
            label="Failed"
            value={failed}
            icon={<XCircle className="w-6 h-6 text-red-500" />}
            color="bg-red-50"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Upload size={16} />
          Upload Document
        </Link>
        <Link
          href="/history"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          View All Documents
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Recent documents */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Documents</h3>

        {isError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Failed to load documents. Make sure the backend is running.
          </div>
        )}

        {!isLoading && !isError && recent.length === 0 && (
          <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-2xl text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No documents yet. Upload your first document!</p>
          </div>
        )}

        {recent.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Filename</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Template</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((doc, i) => (
                  <tr
                    key={doc.id}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  >
                    <td className="px-5 py-3 font-medium text-gray-800 truncate max-w-xs">
                      {doc.original_filename || doc.filename}
                    </td>
                    <td className="px-5 py-3 text-gray-500 capitalize">{doc.template_type}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusBadge[doc.status] ?? statusBadge.pending
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-indigo-600 hover:underline text-xs font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
