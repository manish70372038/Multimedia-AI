import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, User, Send, FileText, AlertCircle } from 'lucide-react'
import { chatWithPDF } from '../api/index.js'
import ReactMarkdown from 'react-markdown'

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatInterface() {
  const [msgs, setMsgs]     = useState([])
  const [input, setInput]   = useState('')
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState('')
  const bottomRef = useRef()
  const taRef     = useRef()

  const pdfText  = sessionStorage.getItem('pdf_text')  || ''
  const fileName = sessionStorage.getItem('file_name') || ''

  // Welcome message
  useEffect(() => {
    if (pdfText) {
      setMsgs([{ role: 'ai', text: `Hi! I've analysed **${fileName}**. Ask me anything about it!`, time: now() }])
    } else {
      setMsgs([{ role: 'ai', text: `Hello! No file uploaded yet, but I'm here to help. Upload a file for specific Q&A!`, time: now() }])
    }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto'
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    
    setError('')
    setInput('')
    setMsgs(p => [...p, { role: 'user', text: q, time: now() }])
    setLoad(true)

    try {
      // Agar pdfText nahi hai toh empty string bhejega (General Chat mode)
      const data = await chatWithPDF(pdfText, q)
      setMsgs(p => [...p, { role: 'ai', text: data.answer, time: now() }])
    } catch {
      setMsgs(p => [...p, { role: 'ai', text: 'Sorry, something went wrong. Please try again.', isErr: true, time: now() }])
    } finally {
      setLoad(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const page   = { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }
  const header = { borderBottom: '1px solid var(--border)', background: 'var(--bg2)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }
  const avatar = (ai) => ({ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: ai ? 'rgba(124,110,255,0.14)' : 'var(--bg3)', border: `1px solid ${ai ? 'var(--accent)' : 'var(--border)'}`, color: ai ? 'var(--accent)' : 'var(--tx2)' })
  const bubble = (ai, isErr) => ({ maxWidth: '72%', padding: '12px 16px', borderRadius: ai ? '4px 18px 18px 18px' : '18px 4px 18px 18px', background: isErr ? 'rgba(239,68,68,0.1)' : ai ? 'var(--bg3)' : 'var(--accent)', border: ai ? `1px solid ${isErr ? 'var(--red)' : 'var(--border)'}` : 'none' })

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={avatar(true)}><Bot size={17} /></div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>AI Assistant</p>
            <p style={{ color: 'var(--tx2)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', marginTop: 2 }}>
              {fileName ? <><FileText size={11} />{fileName}</> : 'General Mode'}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', padding: '4px 12px', borderRadius: 99, background: pdfText ? 'rgba(62,207,142,0.12)' : 'rgba(255, 152, 0, 0.12)', color: pdfText ? 'var(--green)' : 'var(--amber)' }}>
          {pdfText ? 'Context Ready' : 'General AI'}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860, width: '100%', margin: '0 auto', alignSelf: 'center', boxSizing: 'border-box' }}>

        <AnimatePresence>
          {msgs.map((m, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={avatar(m.role === 'ai')}>
                {m.role === 'ai' ? <Bot size={15} /> : <User size={15} />}
              </div>
              <div style={bubble(m.role === 'ai', m.isErr)}>
                <div style={{ 
                  fontSize: 14, 
                  lineHeight: 1.65, 
                  wordBreak: 'break-word', 
                  color: m.role === 'user' ? '#fff' : 'var(--tx1)' 
                }}>
                  {/* Markdown Implementation */}
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
                <span style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', color: m.role === 'user' ? 'rgba(255,255,255,0.5)' : 'var(--tx3)', marginTop: 6, textAlign: 'right' }}>{m.time}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={avatar(true)}><Bot size={15} /></div>
            <div style={{ ...bubble(true, false), padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((d, i) => (
                <motion.span key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }}
                  style={{ display: 'block', width: 7, height: 7, borderRadius: '50%', background: 'var(--tx3)' }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)', padding: '16px 28px', flexShrink: 0 }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 10, color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>
              <AlertCircle size={14} />{error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={taRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={pdfText ? 'Ask anything about your file...' : 'Type a general question...'}
              disabled={loading}
              rows={1}
              style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px', color: 'var(--tx1)', fontFamily: 'var(--display)', fontSize: 14, resize: 'none', outline: 'none', transition: 'var(--ease)', maxHeight: 120, opacity: loading ? 0.5 : 1 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{ width: 46, height: 46, borderRadius: 'var(--r-md)', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, opacity: (!input.trim() || loading) ? 0.4 : 1, transition: 'var(--ease)' }}>
              <Send size={17} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: 'var(--mono)', marginTop: 8 }}>Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}