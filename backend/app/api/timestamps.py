from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.transcription_service import get_transcription_service

router = APIRouter(prefix="/timestamps", tags=["Timestamps"])

class TimestampRequest(BaseModel):
    file_path: str

@router.post("/")
async def get_timestamps(request: TimestampRequest):
    try:
        service = get_transcription_service()
        # transcribe call
        result = await service.transcribe(request.file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))