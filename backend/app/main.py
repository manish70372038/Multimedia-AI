from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.upload import router as upload_router
from app.api.chat import router as chat_router
from app.api.summary import router as summary_router
from app.api.timestamps import router as timestamps_router
from app.database import test_db_connection

# Lifespan context manager: Naya industry standard tarika startup/shutdown ke liye
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("🚀 Starting up application...")
    await test_db_connection()
    yield
    # Shutdown logic yahan aati hai (agar jarurat ho)
    print("🛑 Shutting down application...")

app = FastAPI(
    title="Multimedia AI Backend", 
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(summary_router)
app.include_router(timestamps_router)

@app.get("/")
async def root():
    # Message ko wahi rakha hai jo pytest expect kar raha hai
    return {"message": "Backend Working"}

@app.get("/health")
async def health():
    return {"status": "healthy", "database": "connected"}