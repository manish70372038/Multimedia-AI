import axios from 'axios'

// baseURL khali rakha hai taaki Nginx (Port 80) ise handle kare
const api = axios.create({ baseURL: '' }) 

// ── Upload file ───────────────────────────────────────────────────────────────
export const uploadFile = async (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  // Backend route matching: /api/upload/
  const { data } = await api.post('/api/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
  return data
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chatWithPDF = async (pdfText, question) => {
  // Backend route matching: /api/chat/
  const { data } = await api.post('/api/chat/', { pdf_text: pdfText, question })
  return data
}

// ── Summary ──────────────────────────────────────────────────────────────────
export const getSummary = async (text) => {
  const { data } = await api.post('/api/summary/', { text })
  return data
}

// ── Timestamps ───────────────────────────────────────────────────────────────
export const getTimestamps = async (filePath) => {
  const { data } = await api.post('/api/timestamps/', { file_path: filePath })
  return data
}