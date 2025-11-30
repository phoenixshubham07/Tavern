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
    <div className="min-h-screen bg-[#202225] text-white font-sans flex">
      {/* Sidebar (Simplified for now, matching App Dock style) */}
      <nav className="w-[72px] bg-[#202225] flex flex-col items-center py-4 gap-4 border-r border-black/20">
        <Link href="/" className="w-12 h-12 bg-[#36393f] rounded-full flex items-center justify-center hover:bg-accent-blue hover:text-white transition-all group" title="Dashboard">
            <ArrowLeft size={24} />
        </Link>
        <div className="w-8 h-[2px] bg-white/10 rounded-full my-2"></div>
        <Link href="/inkflow" className="w-12 h-12 bg-[#36393f] rounded-[24px] hover:rounded-[16px] flex items-center justify-center hover:bg-accent-blue transition-all group" title="InkFlow Editor">
          <span className="text-2xl">✒️</span>
        </Link>
        <div className="w-12 h-12 bg-accent-blue text-white rounded-[16px] flex items-center justify-center transition-all shadow-lg" title="CV Roaster">
          <span className="text-2xl">🔥</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-[#36393f] flex flex-col items-center justify-center p-8 relative overflow-y-auto">
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
