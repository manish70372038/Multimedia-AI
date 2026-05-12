from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import ask_gemini

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

# Request model
class ChatRequest(BaseModel):
    pdf_text: str
    question: str

@router.post("/")
async def chat_with_pdf(request: ChatRequest):
    # Basic Validation
    if not request.pdf_text.strip():
        raise HTTPException(status_code=400, detail="PDF content is empty. Please upload a valid PDF first.")
    
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Please ask a question.")

    try:
        # 'await' is necessary because ask_gemini is now async
        answer = await ask_gemini(request.pdf_text, request.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")