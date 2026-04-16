'use client'

interface ExtractionResultsProps {
  data: Record<string, unknown>
}

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">—</span>
  }

  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </span>
    )
  }

  if (typeof value === 'number') {
    return <span className="text-indigo-700 font-mono">{value.toLocaleString()}</span>
  }

  if (typeof value === 'string') {
    return <span className="text-gray-800 break-words">{value}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400 italic">Empty list</span>

    // Array of objects → mini table
    if (typeof value[0] === 'object' && value[0] !== null) {
      const keys = Object.keys(value[0] as Record<string, unknown>)
      return (
        <div className="mt-1 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {keys.map((k) => (
                  <th key={k} className="px-3 py-2 text-left font-semibold text-gray-600 capitalize">
                    {k.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                  {keys.map((k) => (
                    <td key={k} className="px-3 py-2 text-gray-700">
                      {renderValue((row as Record<string, unknown>)[k], depth + 1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // Array of primitives → pill list
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {value.map((item, i) => (
          <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs border border-indigo-100">
            {String(item)}
          </span>
        ))}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (depth >= 2) {
      return (
        <span className="text-gray-500 text-xs font-mono">{JSON.stringify(value)}</span>
      )
    }
    return (
      <div className="mt-1 pl-3 border-l-2 border-indigo-100 space-y-2">
        {entries.map(([k, v]) => (
          <div key={k}>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {k.replace(/_/g, ' ')}
            </span>
            <div className="mt-0.5">{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-gray-700">{String(value)}</span>
}

export default function ExtractionResults({ data }: ExtractionResultsProps) {
  const entries = Object.entries(data)

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No extracted data available.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {entries.map(([key, value]) => {
        const isComplex =
          typeof value === 'object' && value !== null

        return (
          <div
            key={key}
            className={`bg-white rounded-xl border border-gray-200 shadow-sm ${
              isComplex ? 'p-4' : 'px-5 py-3 flex items-start justify-between gap-6'
            }`}
          >
            <div className={isComplex ? 'mb-2' : ''}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {key.replace(/_/g, ' ')}
              </p>
            </div>
            <div className={isComplex ? '' : 'text-right max-w-xs'}>
              {renderValue(value)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
