'use client'

import { useState } from 'react'
import Link from 'next/link'
import { roastCV } from './actions'
import { ArrowLeft, Upload, Download, Flame } from 'lucide-react'

export default function RoasterPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultSvg, setResultSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (selected.type === 'application/pdf') {
        setFile(selected)
        setError(null)
      } else {
        setError('Please upload a PDF file.')
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0]
      if (selected.type === 'application/pdf') {
        setFile(selected)
        setError(null)
      } else {
        setError('Please upload a PDF file.')
      }
    }
  }

  const handleRoast = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResultSvg(null)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const result = await roastCV(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setResultSvg(result.svg)
      }
    } catch (err) {
      setError('Something went wrong. The AI might be too stunned by your resume.')
    } finally {
      setLoading(false)
    }
  }

  const downloadSvg = () => {
    if (!resultSvg) return
    const blob = new Blob([resultSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inkflow-roast.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold flex items-center justify-center gap-4">
              <Flame className="text-red-500" size={48} /> CV Roaster <Flame className="text-red-500" size={48} />
            </h1>
            <p className="text-gray-400 text-xl">Upload your resume. Get humbled by AI.</p>
          </div>

          {!resultSvg && (
            <div 
              className={`border-4 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[300px] ${file ? 'border-accent-blue bg-accent-blue/10' : 'border-gray-600 hover:border-[#5865f2] hover:bg-black/20'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload size={64} className={file ? 'text-accent-blue' : 'text-gray-500'} />
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">{file ? file.name : 'Drag & Drop PDF here'}</h3>
                <p className="text-gray-400">{file ? 'Click to change' : 'or click to browse'}</p>
              </div>
              <input 
                type="file" 
                id="file-input" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 border-4 border-white/10 border-t-red-500 rounded-full animate-spin"></div>
              <p className="text-xl font-bold animate-pulse">Analyzing your life choices...</p>
            </div>
          )}

          {!loading && !resultSvg && (
            <button 
              onClick={handleRoast}
              disabled={!file}
              className={`px-12 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105 ${file ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            >
              ROAST ME
            </button>
          )}

          {resultSvg && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div 
                className="rounded-xl overflow-hidden shadow-2xl border border-white/10 w-full max-w-[95%] mx-auto bg-[#1a1b1e]"
                dangerouslySetInnerHTML={{ __html: resultSvg }}
              />
              <div className="flex justify-center gap-4">
                <button 
                  onClick={downloadSvg}
                  className="flex items-center gap-2 px-8 py-3 bg-[#5865f2] hover:bg-[#4752c4] rounded-lg font-bold transition-colors"
                >
                  <Download size={20} /> Download Roast
                </button>
                <button 
                  onClick={() => {
                    setFile(null)
                    setResultSvg(null)
                  }}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-colors"
                >
                  Roast Another
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
