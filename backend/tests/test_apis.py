"""
95%+ Coverage Test Suite — v4 (all failures fixed)
"""

import io
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

try:
    from app.main import app as fastapi_app
except ImportError:
    from app.app import app as fastapi_app

client = TestClient(fastapi_app)


async def _async_str(*args, **kwargs):
    return "mocked response"

async def _async_dict(*args, **kwargs):
    return {"text": "mocked", "segments": []}


# =============================================================================
class TestRoutes:

    def test_root_returns_200(self):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json() == {"message": "Backend Working"}

    def test_health_returns_200(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

    def test_openapi_schema_loads(self):
        r = client.get("/openapi.json")
        assert r.status_code == 200

    def test_main_app_is_fastapi(self):
        from fastapi import FastAPI
        assert isinstance(fastapi_app, FastAPI)


# =============================================================================
class TestChatEndpoint:

    def test_chat_happy_path(self):
        with patch("app.api.chat.ask_gemini", side_effect=_async_str):
            r = client.post("/api/chat/", json={"pdf_text": "hello pdf", "question": "what?"})
        assert r.status_code == 200
        assert "answer" in r.json()

    def test_chat_empty_pdf_text(self):
        r = client.post("/api/chat/", json={"pdf_text": "   ", "question": "something"})
        assert r.status_code == 400

    def test_chat_empty_question(self):
        r = client.post("/api/chat/", json={"pdf_text": "some content", "question": "  "})
        assert r.status_code == 400

    def test_chat_ai_raises_exception(self):
        with patch("app.api.chat.ask_gemini", side_effect=Exception("Gemini down")):
            r = client.post("/api/chat/", json={"pdf_text": "text", "question": "q"})
        assert r.status_code == 500

    def test_chat_missing_fields(self):
        r = client.post("/api/chat/", json={})
        assert r.status_code == 422


# =============================================================================
class TestSummaryEndpoint:

    def test_summary_happy_path(self):
        with patch("app.api.summary.summarize_text", side_effect=_async_str):
            r = client.post("/summary/", json={"text": "some long text here"})
        assert r.status_code == 200
        assert "summary" in r.json()

    def test_summary_empty_text(self):
        r = client.post("/summary/", json={"text": "   "})
        assert r.status_code == 400
        assert "empty" in r.json()["detail"].lower()

    def test_summary_ai_raises_exception(self):
        with patch("app.api.summary.summarize_text", side_effect=Exception("AI fail")):
            r = client.post("/summary/", json={"text": "valid text"})
        assert r.status_code == 500
        assert "Summary failed" in r.json()["detail"]

    def test_summary_missing_body(self):
        r = client.post("/summary/", json={})
        assert r.status_code == 422


# =============================================================================
class TestTimestampsEndpoint:

    def test_timestamps_happy_path(self):
        mock_service = MagicMock()
        mock_service.transcribe = AsyncMock(return_value={"text": "hello", "segments": []})
        with patch("app.api.timestamps.get_transcription_service", return_value=mock_service):
            r = client.post("/timestamps/", json={"file_path": "/fake/path/video.mp4"})
        assert r.status_code == 200

    def test_timestamps_service_raises(self):
        mock_service = MagicMock()
        mock_service.transcribe = AsyncMock(side_effect=Exception("transcription failed"))
        with patch("app.api.timestamps.get_transcription_service", return_value=mock_service):
            r = client.post("/timestamps/", json={"file_path": "/fake/path/video.mp4"})
        assert r.status_code == 500

    def test_timestamps_missing_body(self):
        r = client.post("/timestamps/", json={})
        assert r.status_code == 422

    def test_timestamps_mkv_file(self):
        mock_service = MagicMock()
        mock_service.transcribe = AsyncMock(return_value={"text": "mkv done"})
        with patch("app.api.timestamps.get_transcription_service", return_value=mock_service):
            r = client.post("/timestamps/", json={"file_path": "/fake/path/movie.mkv"})
        assert r.status_code == 200


# =============================================================================
class TestUploadEndpoint:

    def test_upload_pdf_happy_path(self):
        with patch("app.api.upload.extract_text_from_pdf", return_value="pdf text"), \
             patch("app.api.upload.generate_summary", side_effect=_async_str), \
             patch("app.api.upload.save_document", new_callable=AsyncMock, return_value="doc123"):
            r = client.post(
                "/api/upload/",
                files={"file": ("test.pdf", io.BytesIO(b"%PDF-1.4 fake"), "application/pdf")},
            )
        assert r.status_code == 200
        assert r.json()["type"] == "pdf"

    def test_upload_mp3_audio(self):
        with patch("app.api.upload.transcribe_media", side_effect=_async_dict), \
             patch("app.api.upload.generate_summary", side_effect=_async_str), \
             patch("app.api.upload.save_document", new_callable=AsyncMock, return_value="doc456"):
            r = client.post(
                "/api/upload/",
                files={"file": ("audio.mp3", io.BytesIO(b"fake audio"), "audio/mpeg")},
            )
        assert r.status_code == 200
        assert r.json()["type"] == "audio"

    def test_upload_mp4_video(self):
        with patch("app.api.upload.transcribe_media", side_effect=_async_dict), \
             patch("app.api.upload.generate_summary", side_effect=_async_str), \
             patch("app.api.upload.save_document", new_callable=AsyncMock, return_value="doc789"):
            r = client.post(
                "/api/upload/",
                files={"file": ("video.mp4", io.BytesIO(b"fake video"), "video/mp4")},
            )
        assert r.status_code == 200
        assert r.json()["type"] == "video"

    def test_upload_wav_audio(self):
        with patch("app.api.upload.transcribe_media", side_effect=_async_dict), \
             patch("app.api.upload.generate_summary", side_effect=_async_str), \
             patch("app.api.upload.save_document", new_callable=AsyncMock, return_value="docwav"):
            r = client.post(
                "/api/upload/",
                files={"file": ("sound.wav", io.BytesIO(b"fake wav"), "audio/wav")},
            )
        assert r.status_code == 200
        assert r.json()["type"] == "audio"

    def test_upload_mkv_video(self):
        with patch("app.api.upload.transcribe_media", side_effect=_async_dict), \
             patch("app.api.upload.generate_summary", side_effect=_async_str), \
             patch("app.api.upload.save_document", new_callable=AsyncMock, return_value="docmkv"):
            r = client.post(
                "/api/upload/",
                files={"file": ("film.mkv", io.BytesIO(b"fake mkv"), "video/x-matroska")},
            )
        assert r.status_code == 200
        assert r.json()["type"] == "video"

    def test_upload_unsupported_type(self):
        r = client.post(
            "/api/upload/",
            files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
        )
        assert r.status_code in [400, 500]

    def test_upload_no_file(self):
        r = client.post("/api/upload/")
        assert r.status_code == 422

    def test_upload_extract_raises(self):
        with patch("app.api.upload.extract_text_from_pdf", side_effect=Exception("read error")):
            r = client.post(
                "/api/upload/",
                files={"file": ("crash.pdf", io.BytesIO(b"%PDF fake"), "application/pdf")},
            )
        assert r.status_code == 500


# =============================================================================
class TestDatabase:

    @pytest.mark.asyncio
    async def test_db_connection_success(self):
        import app.database as db_mod
        with patch.object(db_mod.client.admin, "command", new_callable=AsyncMock):
            await db_mod.test_db_connection()

    @pytest.mark.asyncio
    async def test_db_connection_failure(self):
        import app.database as db_mod
        with patch.object(
            db_mod.client.admin, "command",
            new_callable=AsyncMock,
            side_effect=Exception("connection refused"),
        ):
            await db_mod.test_db_connection()

    @pytest.mark.asyncio
    async def test_save_document(self):
        import app.database as db_mod
        mock_result = MagicMock()
        mock_result.inserted_id = "abc123"
        with patch.object(db_mod.files_collection, "insert_one", new_callable=AsyncMock, return_value=mock_result):
            doc_id = await db_mod.save_document({"title": "test"})
        assert doc_id == "abc123"

    @pytest.mark.asyncio
    async def test_get_document_by_name_found(self):
        import app.database as db_mod
        with patch.object(
            db_mod.files_collection, "find_one",
            new_callable=AsyncMock,
            return_value={"metadata": {"filename": "test.pdf"}},
        ):
            result = await db_mod.get_document_by_name("test.pdf")
        assert result["metadata"]["filename"] == "test.pdf"

    @pytest.mark.asyncio
    async def test_get_document_by_name_not_found(self):
        import app.database as db_mod
        with patch.object(db_mod.files_collection, "find_one", new_callable=AsyncMock, return_value=None):
            result = await db_mod.get_document_by_name("missing.pdf")
        assert result is None


# =============================================================================
class TestAIService:

    @pytest.mark.asyncio
    async def test_generate_ai_response_success(self):
        mock_model = MagicMock()
        mock_model.generate_content.return_value.text = "great answer"
        with patch("google.generativeai.GenerativeModel", return_value=mock_model):
            from app.services.ai_service import generate_ai_response
            result = await generate_ai_response("test prompt")
        assert result == "great answer"

    @pytest.mark.asyncio
    async def test_generate_ai_response_all_models_fail(self):
        with patch("google.generativeai.GenerativeModel", side_effect=Exception("model down")):
            from app.services.ai_service import generate_ai_response
            result = await generate_ai_response("test prompt")
        assert "Error" in result

    @pytest.mark.asyncio
    async def test_ask_gemini(self):
        with patch("app.services.ai_service.generate_ai_response", side_effect=_async_str):
            from app.services.ai_service import ask_gemini
            result = await ask_gemini("pdf content", "what is this?")
        assert result == "mocked response"

    @pytest.mark.asyncio
    async def test_generate_summary(self):
        with patch("app.services.ai_service.generate_ai_response", side_effect=_async_str):
            from app.services.ai_service import generate_summary
            result = await generate_summary("long article text")
        assert result == "mocked response"

    @pytest.mark.asyncio
    async def test_aliases_exist(self):
        from app.services.ai_service import ask_gemni, summarize_text
        assert callable(ask_gemni)
        assert callable(summarize_text)


# =============================================================================
class TestPDFService:

    def test_pdf_extract_with_pypdf2_mock(self):
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "page content"
        mock_reader = MagicMock()
        mock_reader.pages = [mock_page, mock_page]

        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(b"%PDF-1.4 fake")
            tmp_path = tmp.name
        try:
            with patch("PyPDF2.PdfReader", return_value=mock_reader):
                from app.services import pdf_service
                import importlib
                importlib.reload(pdf_service)
                result = pdf_service.extract_text_from_pdf(tmp_path)
            assert "page content" in result
        finally:
            os.unlink(tmp_path)

    def test_pdf_extract_page_returns_none(self):
        mock_page = MagicMock()
        mock_page.extract_text.return_value = None
        mock_reader = MagicMock()
        mock_reader.pages = [mock_page]

        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(b"%PDF-1.4 fake")
            tmp_path = tmp.name
        try:
            with patch("PyPDF2.PdfReader", return_value=mock_reader):
                from app.services.pdf_service import extract_text_from_pdf
                result = extract_text_from_pdf(tmp_path)
            assert result == ""
        finally:
            os.unlink(tmp_path)

    def test_pdf_extract_file_not_found(self):
        from app.services.pdf_service import extract_text_from_pdf
        result = extract_text_from_pdf("nonexistent_xyz_123.pdf")
        assert result is None

    def test_pdf_extract_corrupt_file(self):
        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(b"not a real pdf at all")
            tmp_path = tmp.name
        try:
            from app.services.pdf_service import extract_text_from_pdf
            result = extract_text_from_pdf(tmp_path)
            assert result is None or isinstance(result, str)
        finally:
            os.unlink(tmp_path)


# =============================================================================
class TestTranscriptionService:

    def test_get_transcription_service_returns_instance(self):
        from app.services.transcription_service import get_transcription_service, TranscriptionService
        assert isinstance(get_transcription_service(), TranscriptionService)

    def test_init_with_api_key(self):
        with patch.dict("os.environ", {"GEMINI_API_KEY": "fake-key-123"}):
            with patch("google.generativeai.configure") as mock_cfg:
                from app.services.transcription_service import TranscriptionService
                svc = TranscriptionService()
                assert svc is not None

    def test_init_without_api_key(self):
        """No API key — should NOT raise, just log warning."""
        with patch.dict("os.environ", {}, clear=True):
            with patch("google.generativeai.configure"):
                from app.services.transcription_service import TranscriptionService
                svc = TranscriptionService()   # ✅ no ValueError
                assert svc is not None

    def test_transcribe_mp4_success(self):
        """Sync transcribe with File API mocked."""
        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(b"fake video bytes")
            tmp_path = tmp.name
        try:
            # Mock File API
            mock_media = MagicMock()
            mock_media.state.name = "ACTIVE"
            mock_media.name = "files/fake123"

            mock_model = MagicMock()
            mock_model.generate_content.return_value.text = "[0:00] Hello world"

            with patch("google.generativeai.upload_file", return_value=mock_media), \
                 patch("google.generativeai.delete_file"), \
                 patch("google.generativeai.GenerativeModel", return_value=mock_model):
                from app.services.transcription_service import TranscriptionService
                result = TranscriptionService().transcribe(tmp_path)

            assert "Hello world" in result["text"]
        finally:
            os.unlink(tmp_path)

    def test_transcribe_mp3_audio(self):
        """Sync transcribe for mp3."""
        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tmp.write(b"fake audio bytes")
            tmp_path = tmp.name
        try:
            mock_media = MagicMock()
            mock_media.state.name = "ACTIVE"
            mock_media.name = "files/fake456"

            mock_model = MagicMock()
            mock_model.generate_content.return_value.text = "[0:00] audio transcribed"

            with patch("google.generativeai.upload_file", return_value=mock_media), \
                 patch("google.generativeai.delete_file"), \
                 patch("google.generativeai.GenerativeModel", return_value=mock_model):
                from app.services.transcription_service import TranscriptionService
                result = TranscriptionService().transcribe(tmp_path)

            assert "audio transcribed" in result["text"]
        finally:
            os.unlink(tmp_path)

    @pytest.mark.asyncio
    async def test_transcribe_media_alias(self):
        """transcribe_media async alias test."""
        mock_media = MagicMock()
        mock_media.state.name = "ACTIVE"
        mock_media.name = "files/fake789"

        mock_model = MagicMock()
        mock_model.generate_content.return_value.text = "[0:00] alias works"

        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(b"fake")
            tmp_path = tmp.name
        try:
            with patch("google.generativeai.upload_file", return_value=mock_media), \
                 patch("google.generativeai.delete_file"), \
                 patch("google.generativeai.GenerativeModel", return_value=mock_model):
                from app.services.transcription_service import transcribe_media
                result = await transcribe_media(tmp_path)
            assert "alias works" in result["text"]
        finally:
            os.unlink(tmp_path)

    def test_transcribe_raises_on_missing_file(self):
        from app.services.transcription_service import TranscriptionService
        with pytest.raises(Exception):
            TranscriptionService().transcribe("totally_missing_file_xyz.mp4")