import { motion } from 'framer-motion'
import { Clock, Play } from 'lucide-react'

function toSeconds(val) {
  if (!val) return 0
  const s = String(val)
  // "1:23" or "00:01:23"
  if (s.includes(':')) {
    const parts = s.split(':').map(Number)
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return Number(val) || 0
}

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TimestampList({ timestamps, mediaRef }) {
  const play = (sec) => {
    if (mediaRef?.current) {
      mediaRef.current.currentTime = sec
      mediaRef.current.play()
    }
  }

  if (!timestamps?.length) return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 40, textAlign: 'center', color: 'var(--tx3)' }}>
      <Clock size={28} style={{ margin: '0 auto 10px' }} />
      <p>No timestamps extracted.</p>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '24px 28px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
        <Clock size={16} color="var(--accent)" />
        Timestamps
        <span style={{ padding: '2px 10px', borderRadius: 99, background: 'rgba(124,110,255,0.14)', color: 'var(--accent)', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 700, marginLeft: 4 }}>
          {timestamps.length} segments
        </span>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {timestamps.map((ts, i) => {
          const sec  = toSeconds(ts.start ?? ts.timestamp ?? ts.time)
          const text = ts.text ?? ts.topic ?? ts.content ?? `Segment ${i + 1}`

          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', transition: 'var(--ease)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Time badge */}
              <span style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 6, background: 'var(--bg3)', border: '1px solid var(--border2)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>
                {fmt(sec)}
              </span>

              {/* Text */}
              <p style={{ flex: 1, fontSize: 14, lineHeight: 1.5 }}>{text}</p>

              {/* ▶ Play button */}
              <button onClick={() => play(sec)}
                title={`Play from ${fmt(sec)}`}
                style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, transition: 'var(--ease)', boxShadow: '0 2px 12px rgba(124,110,255,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.background = 'var(--accent2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--accent)' }}
              >
                <Play size={14} />
              </button>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}