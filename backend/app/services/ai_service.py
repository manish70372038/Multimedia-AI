import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Original working models — mat badlo
model_names = [
    'models/gemini-3.1-flash-lite',
    'models/gemini-2.5-flash',
    'models/gemini-2.0-flash',
]


async def generate_ai_response(prompt: str) -> str:
    """Helper — tries each model in order until one works."""
    for name in model_names:
        try:
            print(f"Trying model: {name}")
            model = genai.GenerativeModel(model_name=name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Failed {name}: {str(e)}")
            continue
    return "Error: All Gemini models failed to respond."


async def ask_gemini(pdf_text: str, user_question: str) -> str:
    """Chat interface ke liye."""
    prompt = f"Document Text:\n{pdf_text}\n\nQuestion: {user_question}"
    return await generate_ai_response(prompt)


async def generate_summary(text: str) -> str:
    """Summarization ke liye."""
    if not text or not text.strip():
        return "No content to summarize."
    prompt = (
        "Summarize the following content clearly and concisely in bullet points. "
        "Focus on key topics and main ideas.\n\n"
        f"Content:\n{text}"
    )
    return await generate_ai_response(prompt)


# ── Aliases — saare ImportError solve karte hain ──────────────
ask_gemni      = ask_gemini       # typo alias
summarize_text = generate_summary  # summary.py ke liye