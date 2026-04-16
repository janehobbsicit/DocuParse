'use client'

import { FileText, User, ScrollText, Layers } from 'lucide-react'

const templates = [
  { value: 'invoice',  label: 'Invoice',  Icon: FileText,  color: 'text-blue-600 bg-blue-50' },
  { value: 'resume',   label: 'Resume',   Icon: User,       color: 'text-purple-600 bg-purple-50' },
  { value: 'contract', label: 'Contract', Icon: ScrollText, color: 'text-orange-600 bg-orange-50' },
  { value: 'generic',  label: 'Generic',  Icon: Layers,     color: 'text-gray-600 bg-gray-100' },
]

interface TemplateSelectorProps {
  value: string
  onChange: (value: string) => void
}

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {templates.map(({ value: v, label, Icon, color }) => {
        const active = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
              active
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/40'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            {label}
          </button>
        )
      })}
    </div>
  )
}
