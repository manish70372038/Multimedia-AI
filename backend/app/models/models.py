from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# 1. Multimedia Metadata Model
class FileMetadata(BaseModel):
    filename: str [cite: 5]
    file_type: str  # pdf, audio, or video [cite: 5]
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    file_path: str

# 2. Transcription & Timestamps Model
class TimestampSegment(BaseModel):
    start_time: float [cite: 8, 25]
    end_time: float [cite: 8, 25]
    topic: str [cite: 8, 25]
    text: str

# 3. Main Document Model (MongoDB mein yahi save hoga)
class DocumentStore(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    metadata: FileMetadata [cite: 15]
    full_text: str [cite: 15]
    summary: Optional[str] = None [cite: 7, 24]
    timestamps: Optional[List[TimestampSegment]] = None [cite: 8, 25]