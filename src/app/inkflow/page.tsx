```
'use client'

import { useState, useEffect } from 'react'
import { Upload, Save, History, ArrowLeft, RefreshCw, Check, FileText, Share2, Copy } from 'lucide-react'
import Link from 'next/link'
import { transcribeImage, saveVersion, getHistory, shareNote, getLatestVersionMetadata } from './actions'

export default function InkFlowPage() {
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [attribution, setAttribution] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
    loadMetadata()
  }, [])

  async function loadHistory() {
    const data = await getHistory()
    setHistory(data)
  }

  async function loadMetadata() {
    const meta = await getLatestVersionMetadata()
    if (meta) {
      setMarkdown(meta.content_text) // Load latest content
      if (meta.parentOwner) {
        setAttribution(meta.parentOwner)
      }
    }
  }

  async function handleShare() {
    // First save current state
    const saveResult = await saveVersion(markdown, null)
    if (saveResult.error) {
      alert('Please save your note before sharing.')
      return
    }
    
    // Then share
    // We need to fetch the latest version ID since saveVersion returns version_number
    await loadHistory()
    const latest = await getHistory()
    if (latest && latest.length > 0) {
       const shareResult = await shareNote(latest[0].id)
       if (shareResult.success) {
         setShareUrl(`${window.location.origin}/share/${shareResult.token}`)
       }
    }
  }

  async function handleTranscribe() {
    if (!file) return
    setIsTranscribing(true)
    
    const formData = new FormData()
    formData.append('image', file)

    const result = await transcribeImage(formData)
    
    if (result.text) {
      setMarkdown(result.text)
    } else {
      alert(`Transcription failed: ${result.error}`)
    }
    
    setIsTranscribing(false)
  }

  async function handleSave() {
    if (!markdown) return
    setIsSaving(true)
    
    const result = await saveVersion(markdown, image)
    
    if (result.success) {
      await loadHistory()
      alert(`Version ${result.version} saved!`)
    } else {
      alert('Failed to save version')
    }
    
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col relative">
      {/* History Sidebar */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-white/10 transform transition-transform duration-300 z-40 ${showHistory ? 'translate-x-0' : 'translate-x-full'} pt-20 p-6 overflow-y-auto`}>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><History size={20} /> Version History</h2>
        <div className="space-y-4">
          {history.map((version) => (
            <div 
              key={version.id} 
              className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
              onClick={() => setMarkdown(version.content_text)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-accent-blue">v{version.version_number}.0</span>
                <span className="text-xs text-gray-500">{new Date(version.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">{version.content_text}</p>
            </div>
          ))}
          {history.length === 0 && <p className="text-gray-500 text-sm">No versions saved yet.</p>}
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 p-4 flex items-center justify-between bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
            <span className="text-2xl">✒️</span> INKFLOW <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded">BETA</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {shareUrl && (
            <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg text-sm">
              <span className="truncate max-w-[150px]">{shareUrl}</span>
              <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="hover:text-white">
                <Copy size={14} />
              </button>
            </div>
          )}
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-bold uppercase tracking-wide"
            title="Share Public Link"
          >
            <Share2 size={16} /> Share
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-bold uppercase tracking-wide ${showHistory ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <History size={16} /> History
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !markdown}
            className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-navy-blue hover:bg-white rounded-lg transition-colors text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Save Version
          </button>
        </div>
      </header>

      {attribution && (
        <div className="bg-accent-blue/10 border-b border-accent-blue/20 px-6 py-2 text-xs text-accent-blue flex items-center gap-2">
          <Copy size={12} />
          Remixed from @{attribution}'s version
        </div>
      )}

      {/* Main Content - Split Screen */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Image Upload/Preview */}
        <div className="w-1/2 border-r border-white/10 p-8 flex flex-col relative bg-white/5">
          <div className="absolute top-4 left-4 text-xs text-gray-500 uppercase tracking-widest font-bold">Source Material</div>
          
          <div className="flex-1 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center relative overflow-hidden group hover:border-accent-blue/50 transition-colors">
            {image ? (
              <img src={image} alt="Uploaded Note" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="text-gray-400 group-hover:text-white" size={32} />
                </div>
                <p className="text-gray-400 text-sm">Drag & drop or click to upload</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setFile(file)
                  const reader = new FileReader()
                  reader.onload = (e) => setImage(e.target?.result as string)
                  reader.readAsDataURL(file)
                }
              }}
            />
          </div>

          {image && (
            <button 
              onClick={handleTranscribe}
              className="mt-6 w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <>
                  <RefreshCw className="animate-spin" size={20} /> Transcribing...
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span> Transcribe with Gemini
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: Markdown Editor */}
        <div className="w-1/2 p-8 flex flex-col bg-black">
          <div className="mb-4 flex justify-between items-center">
             <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Markdown Editor</div>
             <div className="text-xs text-gray-600">v1.0</div>
          </div>
          <textarea 
            className="flex-1 bg-transparent text-gray-300 font-mono resize-none outline-none leading-relaxed custom-scrollbar"
            placeholder="# Your transcribed text will appear here..."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
          />
        </div>
      </main>
    </div>
  )
}
