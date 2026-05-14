import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Music, Video,
  CheckCircle, AlertCircle, ChevronRight, Loader
} from 'lucide-react'
import { uploadFile } from '../api/index.js'
import SummaryView from './SummaryView.jsx'
import TimestampList from './TimestampList.jsx'
import VideoTrans from './VideoTrans.jsx'

const TYPES = {
  'application/pdf':      { label: 'PDF',  icon: FileText, color: '#7c6eff' },
  'audio/mpeg':           { label: 'MP3',  icon: Music,    color: '#3ecf8e' },
  'audio/wav':            { label: 'WAV',  icon: Music,    color: '#3ecf8e' },
  'video/mp4':            { label: 'MP4',  icon: Video,    color: '#f59e0b' },
  'video/x-matroska':     { label: 'MKV',  icon: Video,    color: '#f59e0b' },
}

const s = {
  page:    { maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' },
  hero:    { textAlign: 'center', marginBottom: 40 },
  tag:     { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(124,110,255,0.14)', color: 'var(--accent)', marginBottom: 14 },
  title:   { fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 14 },
  sub:     { color: 'var(--tx2)', fontSize: 15, maxWidth: 460, margin: '0 auto' },
  card:    { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 32, transition: 'var(--ease)' },
  zone:    { textAlign: 'center', cursor: 'pointer', border: '2px dashed var(--border)', marginBottom: 16 },
  btn:     { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, transition: 'var(--ease)' },
  primary: { background: 'var(--accent)', color: '#fff' },
  ghost:   { background: 'transparent', color: 'var(--tx2)', border: '1px solid var(--border)' },
  err:     { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 'var(--r-md)', color: 'var(--red)', fontSize: 13, marginBottom: 16 },
  tabs:    { display: 'flex', gap: 4, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 4, width: 'fit-content', marginBottom: 16 },
  tab:     { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: 'none', borderRadius: 8, fontFamily: 'var(--display)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'var(--ease)' },
}

// File type helper
function getFileType(contentType) {
  if (contentType === 'application/pdf') return 'pdf'
  if (contentType.startsWith('audio/')) return 'audio'
  if (contentType.startsWith('video/')) return 'video'
  return 'unknown'
}

export default function FileUpload() {
  const [drag, setDrag]         = useState(false)
  const [file, setFile]         = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus]     = useState('idle')
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [tab, setTab]           = useState('summary')
  const inputRef = useRef()
  const mediaRef = useRef()

  const pick = useCallback((f) => {
    if (!TYPES[f.type]) { setError('Unsupported file. Use PDF, MP3, WAV, MP4, or MKV.'); return }
    setFile(f); setError(''); setResult(null); setStatus('idle')
  }, [])

  const onDrop = (e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) pick(f) }

  const handleUpload = async () => {
    if (!file) return
    setStatus('uploading'); setProgress(0); setError('')
    try {
      const data = await uploadFile(file, setProgress)
      
      const fileType = getFileType(file.type)

      // ✅ FIX: backend extracted_content use karo, full_text nahi
      const textForChat = data.extracted_content || ''

      // sessionStorage mein save karo chat ke liye
      sessionStorage.setItem('pdf_text', textForChat)
      sessionStorage.setItem('file_name', file.name)
      sessionStorage.setItem('file_type', fileType)

      // Result object normalize karo
      const normalizedResult = {
        ...data,
        type: fileType,
        summary: data.summary || 'No summary available.',
        // Timestamps: segments ko format karo
        timestamps: (data.segments || []).map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
          start_formatted: seg.start_formatted || formatTime(seg.start),
          end_formatted: seg.end_formatted || formatTime(seg.end),
        })),
      }

      setResult(normalizedResult)
      setStatus('done')

    } catch (e) {
      setStatus('error')
      setError(e?.response?.data?.detail || 'Upload failed. Try again.')
    }
  }

  // Helper: seconds to M:SS
  function formatTime(sec) {
    const s = Math.floor(sec)
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${m}:${ss.toString().padStart(2, '0')}`
  }

  const info = file ? TYPES[file.type] : null

  return (
    <div style={s.page}>
      {/* Hero */}
      <motion.div style={s.hero} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={s.tag}>AI-Powered</div>
        <h1 style={s.title}>
          Upload & Understand<br />
          <span style={{ color: 'var(--accent)' }}>Any Media.</span>
        </h1>
        <p style={s.sub}>PDF, audio, or video — instant AI summaries, timestamps, and a chatbot that knows your content.</p>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        style={{
          ...s.card, ...s.zone,
          borderColor: drag ? 'var(--accent)' : status === 'done' ? 'var(--green)' : 'var(--border)',
          borderStyle: status === 'done' ? 'solid' : 'dashed',
          background: drag ? 'rgba(124,110,255,0.05)' : 'var(--bg3)',
        }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf,.mp3,.wav,.mp4,.mkv"
          onChange={e => { if (e.target.files[0]) pick(e.target.files[0]) }}
          style={{ display: 'none' }} />

        <AnimatePresence mode="wait">
          {status === 'done' ? (
            <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 0' }}>
              <CheckCircle size={44} color="var(--green)" />
              <p style={{ fontWeight: 700, fontSize: 17 }}>Processed Successfully!</p>
              <p style={{ color: 'var(--tx2)', fontSize: 13 }}>{file.name}</p>
            </motion.div>
          ) : file ? (
            <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', padding: '8px 0', cursor: 'default' }}>
              {info && <info.icon size={38} color={info.color} style={{ flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{file.name}</p>
                <p style={{ color: 'var(--tx2)', fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · {info?.label}</p>
              </div>
              <button style={{ ...s.btn, ...s.ghost, padding: '7px 14px', fontSize: 13 }}
                onClick={e => { e.stopPropagation(); setFile(null); setResult(null); setStatus('idle') }}>
                Change
              </button>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '16px 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent)' }}>
                <Upload size={26} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Drag & drop your file here</p>
              <p style={{ color: 'var(--tx2)', fontSize: 13, marginBottom: 16 }}>PDF, MP3, WAV, MP4, MKV supported</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['PDF', 'MP3', 'WAV', 'MP4', 'MKV'].map(l => (
                  <span key={l} style={{ ...s.tag, marginBottom: 0 }}>{l}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error */}
      {error && <div style={s.err}><AlertCircle size={15} />{error}</div>}

      {/* Progress */}
      {status === 'uploading' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--tx2)', marginBottom: 8 }}>
            <span>Uploading & Processing...</span><span>{progress}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--bg2)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${progress}%` }}
              style={{ height: '100%', background: 'linear-gradient(90deg,var(--accent),var(--accent2))', borderRadius: 99 }} />
          </div>
        </motion.div>
      )}

      {/* Upload Button */}
      {file && status !== 'done' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <button style={{ ...s.btn, ...s.primary, padding: '13px 36px', fontSize: 15, opacity: status === 'uploading' ? 0.6 : 1 }}
            onClick={handleUpload} disabled={status === 'uploading'}>
            {status === 'uploading'
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
              : <>Process File <ChevronRight size={16} /></>}
          </button>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Media player */}
          {(result.type === 'audio' || result.type === 'video') && (
            <VideoTrans file={file} mediaRef={mediaRef} />
          )}

          {/* Tabs */}
          <div style={s.tabs}>
            {[
              { key: 'summary', label: 'Summary' },
              ...(result.type !== 'pdf' ? [{ key: 'timestamps', label: 'Timestamps' }] : []),
            ].map(({ key, label }) => (
              <button key={key}
                style={{ ...s.tab, background: tab === key ? 'var(--accent)' : 'transparent', color: tab === key ? '#fff' : 'var(--tx2)' }}
                onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'summary' && <SummaryView summary={result.summary} />}
          {tab === 'timestamps' && <TimestampList timestamps={result.timestamps} mediaRef={mediaRef} />}

          {/* Go to Chat */}
          <div style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderColor: 'rgba(124,110,255,0.4)', background: 'linear-gradient(135deg,var(--bg3),var(--bg2))' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Ask AI about this file</p>
              <p style={{ color: 'var(--tx2)', fontSize: 13 }}>Go to Chat to ask questions based on the uploaded content.</p>
            </div>
            <a href="/chat" style={{ ...s.btn, ...s.primary, textDecoration: 'none' }}>
              Open Chat <ChevronRight size={16} />
            </a>
          </div>
        </motion.div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}