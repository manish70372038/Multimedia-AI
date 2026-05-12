from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import summarize_text  # Ye function ai_service se aayega

router = APIRouter(prefix="/summary", tags=["Summary"])

class SummaryRequest(BaseModel):
    text: str

@router.post("/")
async def create_summary(request: SummaryRequest):
    """
    Summarize given text.
    Frontend sends text, we return bullet points.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        # await lagana zaroori hai kyunki service async hai
        summary = await summarize_text(request.text)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary failed: {str(e)}")