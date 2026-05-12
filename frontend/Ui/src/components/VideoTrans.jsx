import { motion } from 'framer-motion'
import { Video, Music } from 'lucide-react'

export default function VideoTrans({ file, mediaRef }) {
  if (!file) return null

  const isVideo = file.type.startsWith('video/')
  const url     = URL.createObjectURL(file)
  const Icon    = isVideo ? Video : Music

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '20px 24px' }}
    >
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--tx2)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
        <Icon size={14} color="var(--accent)" />
        {isVideo ? 'Video Player' : 'Audio Player'}
      </div>

      {isVideo ? (
        <video
          ref={mediaRef}
          controls
          src={url}
          style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 320 }}
        />
      ) : (
        <audio
          ref={mediaRef}
          controls
          src={url}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      )}

      <p style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 10, fontFamily: 'var(--mono)' }}>
        Click ▶ on any timestamp below to jump to that moment.
      </p>
    </motion.div>
  )
}