from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_URL)
db = client.multimedia_ai_db 

# Collections
files_collection = db.get_collection("files")

async def test_db_connection():
    try:
        await client.admin.command('ping')
        print("✅ MongoDB connected successfully!")
    except Exception as e:
        print(f"❌ DB Connection Error: {e}")

async def save_document(document_data: dict):
    """File data ko MongoDB mein save karne ke liye"""
    result = await files_collection.insert_one(document_data)
    return str(result.inserted_id)

async def get_document_by_name(filename: str):
    """Duplicate check karne ya file fetch karne ke liye"""
    return await files_collection.find_one({"metadata.filename": filename})