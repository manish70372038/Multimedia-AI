import os
import re
import time
import logging
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

MODEL_NAMES = [
    'models/gemini-3.1-flash-lite',
    'models/gemini-2.5-flash',
    'models/gemini-2.0-flash',
]

EXTENSION_TO_MIME = {
    ".mp3":  "audio/mpeg",
    ".wav":  "audio/wav",
    ".m4a":  "audio/mp4",
    ".ogg":  "audio/ogg",
    ".webm": "video/webm",
    ".mp4":  "video/mp4",
    ".mkv":  "video/x-matroska",
    ".mov":  "video/quicktime",
    ".avi":  "video/x-msvideo",
}

ALL_SUPPORTED_EXTENSIONS = set(EXTENSION_TO_MIME.keys())

PROMPT = """Transcribe this audio/video file completely word by word.

Return ONLY in this exact format — nothing else:
[0:00] text of what was said
[0:08] next segment text
[0:15] more text here

Rules:
- Every line MUST start with [M:SS] timestamp
- Each segment 5-15 seconds
- Transcribe every word spoken exactly
- Do NOT add headers, explanations, or extra text
- If no speech found: [0:00] No speech detected"""


class TranscriptionService:

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
        else:
            logger.warning("GEMINI_API_KEY missing in .env")

    def transcribe(self, file_path: str) -> dict:
        """Sync transcription using Gemini File API."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        if path.suffix.lower() not in ALL_SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {path.suffix}")

        logger.info(f"Uploading to Gemini File API: {path.name}")

        # Step 1 — Upload
        media_file = genai.upload_file(path=str(path))

        # Step 2 — Wait
        while media_file.state.name == "PROCESSING":
            logger.info("Gemini processing file...")
            time.sleep(2)
            media_file = genai.get_file(media_file.name)

        if media_file.state.name == "FAILED":
            raise RuntimeError("Gemini File API processing failed.")

        # Step 3 — Generate
        response_text = None
        for model_name in MODEL_NAMES:
            try:
                logger.info(f"Trying model: {model_name}")
                model = genai.GenerativeModel(model_name=model_name)
                response = model.generate_content([PROMPT, media_file])
                response_text = response.text
                logger.info(f"Success: {model_name}")
                break
            except Exception as e:
                logger.warning(f"Failed {model_name}: {e}")
                continue

        # Step 4 — Cleanup
        try:
            genai.delete_file(media_file.name)
        except Exception:
            pass

        if not response_text:
            raise RuntimeError("Koi bhi model transcribe nahi kar paya.")

        return self._parse_response(response_text)

    def get_timestamps_for_topic(self, topic: str, segments: list) -> list:
        topic_lower = topic.lower().strip()
        return [
            {
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
                "start_formatted": self._format_ts(seg["start"]),
                "end_formatted": self._format_ts(seg["end"]),
            }
            for seg in segments
            if topic_lower in seg.get("text", "").lower()
        ]

    def _parse_response(self, text: str) -> dict:
        lines = text.strip().split("\n")
        segments, texts = [], []
        pattern = re.compile(r"^\[(\d+:\d{2}(?::\d{2})?)\]\s*(.*)")

        for i, line in enumerate(lines):
            m = pattern.match(line.strip())
            if not m:
                continue
            start = self._ts_to_sec(m.group(1))
            content = m.group(2).strip()
            end = start + 5.0
            if i + 1 < len(lines):
                nm = pattern.match(lines[i + 1].strip())
                if nm:
                    end = self._ts_to_sec(nm.group(1))
            segments.append({"id": len(segments), "start": round(start, 2),
                              "end": round(end, 2), "text": content})
            texts.append(content)

        return {
            "text": " ".join(texts),
            "segments": segments,
            "language": "auto",
            "duration": round(segments[-1]["end"], 2) if segments else 0.0,
        }

    @staticmethod
    def _ts_to_sec(ts: str) -> float:
        parts = ts.split(":")
        if len(parts) == 2:
            return int(parts[0]) * 60 + float(parts[1])
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])

    @staticmethod
    def _format_ts(sec: float) -> str:
        s = int(sec)
        h, m, s = s // 3600, (s % 3600) // 60, s % 60
        return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


# ── Singleton ──────────────────────────────────────────────────
_service_instance = None

def get_transcription_service() -> TranscriptionService:
    global _service_instance
    if _service_instance is None:
        _service_instance = TranscriptionService()
    return _service_instance


async def transcribe_media(file_path: str) -> dict:
    """Async alias — upload.py compatibility."""
    svc = get_transcription_service()
    return svc.transcribe(file_path)