import axios from 'axios'

const api = axios.create({ baseURL: '' }) // vite proxy handle karega

// ── Upload file ───────────────────────────────────────────────────────────────
export const uploadFile = async (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/api/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
  return data
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chatWithPDF = async (pdfText, question) => {
  const { data } = await api.post('/api/chat/', { pdf_text: pdfText, question })
  return data
}

// ── Summary ──────────────────────────────────────────────────────────────────
export const getSummary = async (text) => {
  const { data } = await api.post('/summary/', { text })
  return data
}

// ── Timestamps ───────────────────────────────────────────────────────────────
export const getTimestamps = async (filePath) => {
  const { data } = await api.post('/timestamps/', { file_path: filePath })
  return data
}