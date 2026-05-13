from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
import shutil
import os
from datetime import datetime, timezone
from app.services.pdf_service import extract_text_from_pdf
from app.services.transcription_service import transcribe_media
from app.services.ai_service import generate_summary
from app.database import save_document

router = APIRouter(prefix="/api/upload", tags=["Upload"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # 1. File save locally
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        full_text = ""
        file_type = ""
        timestamps = []

        # 2. Content extraction
        if file.filename.endswith(".pdf"):
            full_text = extract_text_from_pdf(file_path) or ""
            file_type = "pdf"

        elif file.filename.endswith((".mp3", ".wav", ".mp4", ".mkv")):
            transcription_data = await transcribe_media(file_path)
            full_text  = transcription_data.get("text", "")
            timestamps = transcription_data.get("segments", [])
            file_type  = "video" if file.filename.endswith((".mp4", ".mkv")) else "audio"

        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        # 3. AI Summary
        summary = await generate_summary(full_text)

        # 4. MongoDB document
        document_data = {
            "metadata": {
                "filename": file.filename,
                "file_type": file_type,
                "upload_date": datetime.now(timezone.utc),
                "file_path": file_path,
            },
            "full_text": full_text,
            "summary":   summary,
            "timestamps": timestamps,
        }

        # 5. Save to DB
        doc_id = await save_document(document_data)

        # 6. Return — full_text bhi bhejo taaki chat kaam kare
        return {
    "id": doc_id,
    "message": "File processed and saved successfully",
    "summary": summary,
    "type": file_type,
    "full_text": full_text,
    "timestamps": timestamps,
}

    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))