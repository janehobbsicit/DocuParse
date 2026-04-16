'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image } from 'lucide-react'

interface FileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  multiple?: boolean
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ type }: { type: string }) {
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />
  return <Image className="w-5 h-5 text-blue-500" />
}

export default function FileUpload({ files, onFilesChange, multiple = false }: FileUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (multiple) {
        onFilesChange([...files, ...accepted])
      } else {
        onFilesChange(accepted.slice(0, 1))
      }
    },
    [files, multiple, onFilesChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple,
  })

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDragActive ? 'bg-indigo-100' : 'bg-white border border-gray-200'
            }`}
          >
            <Upload
              className={`w-6 h-6 ${isDragActive ? 'text-indigo-600' : 'text-gray-400'}`}
            />
          </div>
          {isDragActive ? (
            <p className="text-indigo-600 font-medium">Drop files here…</p>
          ) : (
            <>
              <div>
                <p className="font-medium text-gray-700">
                  Drag & drop files here, or{' '}
                  <span className="text-indigo-600 underline">browse</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Supports PDF, JPG, PNG, TIFF, WEBP
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={i}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
            >
              <FileIcon type={file.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
