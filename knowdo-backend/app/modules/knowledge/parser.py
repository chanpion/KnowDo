import io
from app.core.exceptions import ServiceException


def parse_document(filename: str, content: bytes) -> str:
    """根据文件扩展名选择解析器提取文本。"""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext in ("md", "txt"):
        return content.decode("utf-8", errors="replace")

    elif ext == "pdf":
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            return "\n".join(
                page.extract_text() or "" for page in reader.pages
            )
        except ImportError:
            raise ServiceException("PDF 解析依赖未安装: pip install PyPDF2")

    elif ext == "docx":
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs)
        except ImportError:
            raise ServiceException("DOCX 解析依赖未安装: pip install python-docx")

    elif ext in ("html", "htm"):
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(content, "html.parser")
            return soup.get_text(separator="\n")
        except ImportError:
            raise ServiceException("HTML 解析依赖未安装: pip install beautifulsoup4")

    elif ext == "csv":
        return content.decode("utf-8", errors="replace")

    else:
        raise ServiceException(f"不支持的文件格式: .{ext}")
