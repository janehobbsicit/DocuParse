'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  User,
  ScrollText,
  Layers,
  Plus,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { listTemplates, createTemplate, deleteTemplate } from '@/lib/api'
import type { Template } from '@/lib/types'

const templateIcons: Record<string, React.ReactNode> = {
  invoice:  <FileText  className="w-6 h-6 text-blue-600"   />,
  resume:   <User       className="w-6 h-6 text-purple-600" />,
  contract: <ScrollText className="w-6 h-6 text-orange-600" />,
  generic:  <Layers     className="w-6 h-6 text-gray-500"   />,
}

const templateColors: Record<string, string> = {
  invoice:  'bg-blue-50 border-blue-200',
  resume:   'bg-purple-50 border-purple-200',
  contract: 'bg-orange-50 border-orange-200',
  generic:  'bg-gray-50 border-gray-200',
}

const BUILT_IN: Template[] = [
  {
    id: 'builtin-invoice',
    name: 'Invoice',
    type: 'invoice',
    fields: [
      { name: 'invoice_number', description: 'Unique invoice identifier', required: true },
      { name: 'vendor_name',    description: 'Name of the vendor',         required: true },
      { name: 'total_amount',   description: 'Total amount due',           required: true },
      { name: 'due_date',       description: 'Payment due date',           required: false },
      { name: 'line_items',     description: 'List of items/services',     required: false },
    ],
    created_at: '',
    updated_at: '',
  },
  {
    id: 'builtin-resume',
    name: 'Resume',
    type: 'resume',
    fields: [
      { name: 'full_name',   description: 'Candidate full name',   required: true },
      { name: 'email',       description: 'Contact email',         required: true },
      { name: 'skills',      description: 'List of skills',        required: false },
      { name: 'experience',  description: 'Work experience',       required: false },
      { name: 'education',   description: 'Educational background',required: false },
    ],
    created_at: '',
    updated_at: '',
  },
  {
    id: 'builtin-contract',
    name: 'Contract',
    type: 'contract',
    fields: [
      { name: 'parties',        description: 'Parties involved',        required: true },
      { name: 'effective_date', description: 'Contract effective date', required: true },
      { name: 'terms',          description: 'Key contract terms',      required: false },
      { name: 'signatures',     description: 'Signatory details',       required: false },
    ],
    created_at: '',
    updated_at: '',
  },
  {
    id: 'builtin-generic',
    name: 'Generic',
    type: 'generic',
    fields: [
      { name: 'title',       description: 'Document title',       required: false },
      { name: 'date',        description: 'Document date',        required: false },
      { name: 'key_points',  description: 'Main key points',      required: false },
      { name: 'entities',    description: 'Named entities found', required: false },
    ],
    created_at: '',
    updated_at: '',
  },
]

interface NewField {
  name: string
  description: string
  required: boolean
}

export default function TemplatesPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('generic')
  const [fields, setFields] = useState<NewField[]>([
    { name: '', description: '', required: false },
  ])

  const { data: apiTemplates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createTemplate({
        name: formName,
        type: formType,
        fields: fields.filter((f) => f.name.trim()),
      }),
    onSuccess: () => {
      toast.success('Template created!')
      qc.invalidateQueries({ queryKey: ['templates'] })
      setShowModal(false)
      setFormName('')
      setFormType('generic')
      setFields([{ name: '', description: '', required: false }])
    },
    onError: () => toast.error('Failed to create template'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      toast.success('Template deleted')
      qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: () => toast.error('Delete failed'),
  })

  const allTemplates = [...BUILT_IN, ...apiTemplates]

  const addField = () => setFields([...fields, { name: '', description: '', required: false }])

  const updateField = (i: number, key: keyof NewField, val: string | boolean) => {
    setFields(fields.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)))
  }

  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i))

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Templates</h2>
          <p className="text-gray-500 mt-1">Manage extraction templates for different document types.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading templates…</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {allTemplates.map((tmpl) => {
          const isBuiltin = tmpl.id.startsWith('builtin-')
          const colorClass = templateColors[tmpl.type] ?? templateColors.generic
          const icon = templateIcons[tmpl.type] ?? templateIcons.generic

          return (
            <div
              key={tmpl.id}
              className={`relative bg-white border rounded-2xl shadow-sm p-5 flex flex-col gap-4 ${colorClass}`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tmpl.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-600 mt-0.5 capitalize">
                      {tmpl.type}
                    </span>
                  </div>
                </div>
                {isBuiltin ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                    Built-in
                  </span>
                ) : (
                  <button
                    onClick={() => deleteMutation.mutate(tmpl.id)}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Fields list */}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Fields</p>
                <div className="flex flex-wrap gap-1.5">
                  {tmpl.fields.map((f) => (
                    <span
                      key={f.name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 text-gray-700 text-xs rounded-lg"
                    >
                      {f.required && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Create Template</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="My Template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="invoice">Invoice</option>
                  <option value="resume">Resume</option>
                  <option value="contract">Contract</option>
                  <option value="generic">Generic</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Fields</label>
                  <button
                    type="button"
                    onClick={addField}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    + Add field
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((f, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={f.name}
                        onChange={(e) => updateField(i, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="field_name"
                      />
                      <input
                        value={f.description}
                        onChange={(e) => updateField(i, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="Description"
                      />
                      <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={(e) => updateField(i, 'required', e.target.checked)}
                          className="rounded"
                        />
                        Req
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(i)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!formName.trim() || createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? 'Creating…' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
