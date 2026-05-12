# 🎯 MediaMind — AI-Powered Document & Multimedia Q&A App

> Upload PDFs, audio, and video files — get instant AI summaries, timestamps, and a chatbot that knows your content.

---

## 📌 Features

- 📄 **PDF Upload** — Extract text and ask questions
- 🎵 **Audio/Video Upload** — Auto-transcription using Gemini AI
- 🤖 **AI Chatbot** — Ask anything about uploaded content
- 📝 **Summaries** — Auto-generated bullet-point summaries
- ⏱️ **Timestamps** — Extract topic-wise timestamps from audio/video
- ▶️ **Play Button** — Jump to exact timestamp in audio/video
- 🐳 **Docker** — Fully containerized with Docker Compose
- ✅ **95%+ Test Coverage** — Automated testing with pytest

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI |
| AI/LLM | Google Gemini API |
| Transcription | Gemini File API |
| Frontend | React + Vite |
| Styling | CSS Variables + Framer Motion |
| Testing | pytest + pytest-cov |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## 📁 Project Structure

```
Multimedia-ai-powered/
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── run.py
│   ├── .env
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── api/
│   │   │   ├── upload.py
│   │   │   ├── chat.py
│   │   │   ├── summary.py
│   │   │   └── timestamps.py
│   │   └── services/
│   │       ├── ai_service.py
│   │       ├── pdf_service.py
│   │       └── transcription_service.py
│   └── tests/
│       └── test_apis.py
└── frontend/
    └── Ui/
        ├── Dockerfile
        ├── nginx.conf
        ├── src/
        │   ├── App.jsx
        │   ├── api/index.js
        │   └── components/
        │       ├── FileUpload.jsx
        │       ├── ChatInterface.jsx
        │       ├── SummaryView.jsx
        │       ├── TimestampList.jsx
        │       └── VideoTrans.jsx
        └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 20+
- Google Gemini API Key — [Get here](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/multimedia-ai-powered.git
cd multimedia-ai-powered
```

### 2. Backend Setup

```bash
cd backend

# Virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# .env mein apni GEMINI_API_KEY daalo
```

### 3. `.env` File

```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGO_URL=your_mongodb_url_here
```

### 4. Run Backend

```bash
cd backend
python run.py
# Server: http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

### 5. Frontend Setup

```bash
cd frontend/Ui
npm install
npm run dev
# App: http://localhost:3000
```

---

## 🐳 Docker Setup

```bash
# Root folder se
docker-compose up --build

# Frontend: http://localhost
# Backend:  http://localhost:8000
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### `POST /api/upload/`
Upload PDF, audio, or video file.

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| file | File | PDF, MP3, WAV, MP4, MKV |

**Response:**
```json
{
  "filename": "document.pdf",
  "type": "pdf",
  "full_text": "extracted text...",
  "summary": "• Key point 1\n• Key point 2",
  "segments": [],
  "language": "auto",
  "duration": 0
}
```

---

#### `POST /api/chat/`
Ask questions about uploaded content.

**Request:**
```json
{
  "pdf_text": "document content here",
  "question": "What is this document about?"
}
```

**Response:**
```json
{
  "answer": "This document is about..."
}
```

---

#### `POST /summary/`
Generate summary of text.

**Request:**
```json
{
  "text": "long text content here"
}
```

**Response:**
```json
{
  "summary": "• Point 1\n• Point 2"
}
```

---

#### `POST /timestamps/`
Search for topic timestamps in segments.

**Request:**
```json
{
  "topic": "machine learning",
  "segments": [
    {"id": 0, "start": 0.0, "end": 5.0, "text": "Hello everyone"}
  ]
}
```

**Response:**
```json
{
  "topic": "machine learning",
  "found": true,
  "count": 1,
  "timestamps": [
    {
      "start": 5.0,
      "end": 10.0,
      "text": "Today we discuss machine learning",
      "start_formatted": "0:05",
      "end_formatted": "0:10"
    }
  ]
}
```

---

#### `GET /health`
Health check.

**Response:**
```json
{
  "status": "healthy"
}
```

---

## 🧪 Testing

```bash
cd backend

# Run all tests
python -m pytest tests/test_apis.py -v

# With coverage report
python -m pytest tests/test_apis.py -v --cov=app --cov-report=term-missing

# Coverage must be 95%+
python -m pytest tests/test_apis.py --cov=app --cov-fail-under=95
```

### Coverage Report
```
app/api/chat.py          100%
app/api/summary.py       100%
app/api/timestamps.py    100%
app/api/upload.py        100%
app/services/ai_service.py     97%
app/services/pdf_service.py   100%
TOTAL                     95%+
```

---

## 🔄 CI/CD Pipeline

GitHub Actions automatically:
1. Runs all tests on every push to `main`
2. Checks 95%+ coverage
3. Builds Docker image
4. Tests container health

### GitHub Secrets Required
```
GEMINI_API_KEY = your_gemini_api_key
MONGO_URL      = your_mongodb_url
```

## 👨‍💻 Author

**Manish**
- Assignment: SDE-1 Programming Assignment
- Stack: FastAPI + React + Google Gemini AI