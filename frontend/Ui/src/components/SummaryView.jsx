import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlignLeft, Copy, CheckCheck } from 'lucide-react'

export default function SummaryView({ summary }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(summary || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!summary) return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 40, textAlign: 'center', color: 'var(--tx3)' }}>
      <AlignLeft size={28} style={{ margin: '0 auto 10px' }} />
      <p>No summary available.</p>
    </div>
  )

  const lines = summary.split('\n').map(l => l.trim()).filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '24px 28px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <AlignLeft size={16} color="var(--accent)" />
          AI Summary
        </div>
        <button onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: copied ? 'var(--green)' : 'var(--tx2)', fontFamily: 'var(--display)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'var(--ease)' }}>
          {copied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
        </button>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lines.map((line, i) => {
          const isBullet = /^[•\-\*]/.test(line)
          const clean = isBullet ? line.replace(/^[•\-\*]\s*/, '') : line
          return isBullet ? (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 10, borderLeft: '3px solid var(--accent)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 7 }} />
              <p style={{ fontSize: 14, lineHeight: 1.65 }}>{clean}</p>
            </motion.div>
          ) : (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--tx2)' }}>{clean}</p>
          )
        })}
      </div>
    </motion.div>
  )
}