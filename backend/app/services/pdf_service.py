import PyPDF2

def extract_text_from_pdf(file_path: str):
    text = ""
    try:
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            # Saare pages se text nikalna
            for page in reader.pages:
                content = page.extract_text()
                if content:
                    text += content + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None