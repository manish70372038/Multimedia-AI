import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Upload, MessageSquare } from 'lucide-react'
import FileUpload from './components/FileUpload.jsx'
import ChatInterface from './components/ChatInterface.jsx'

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 60,
      background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)', zIndex: 100,
      display: 'flex', alignItems: 'center', padding: '0 28px',
      justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--accent)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>
          Media<span style={{ color: 'var(--accent)' }}>Mind</span>
        </span>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { to: '/', icon: Upload, label: 'Upload' },
          { to: '/chat', icon: MessageSquare, label: 'Chat' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10,
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--display)',
            color: isActive ? 'var(--accent)' : 'var(--tx2)',
            background: isActive ? 'rgba(124,110,255,0.12)' : 'transparent',
            transition: 'var(--ease)',
          })}>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ paddingTop: 60, minHeight: '100vh' }}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={
              <motion.div key="upload"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <FileUpload />
              </motion.div>
            } />
            <Route path="/chat" element={
              <motion.div key="chat"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <ChatInterface />
              </motion.div>
            } />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  )
}