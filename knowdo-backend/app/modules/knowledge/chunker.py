from typing import Optional


def chunk_text(
    text: str,
    chunk_size: int = 1024,
    chunk_overlap: int = 256,
    separators: Optional[list[str]] = None,
) -> list[dict]:
    """将文本按字符数和分隔符切分为分段列表。

    返回: [{"index": 0, "content": "...", "length": 1024}, ...]
    """
    if separators is None:
        separators = ["\n\n", "\n", "。", ".", " "]

    chunks = []
    current_pos = 0
    idx = 0

    while current_pos < len(text):
        end_pos = min(current_pos + chunk_size, len(text))

        if end_pos < len(text):
            # 尝试在分隔符处断开
            best_end = end_pos
            for sep in separators:
                search_start = max(current_pos + chunk_size // 2, current_pos)
                pos = text.rfind(sep, search_start, end_pos)
                if pos > search_start:
                    best_end = pos + len(sep)
                    break
            end_pos = best_end

        chunk_content = text[current_pos:end_pos]
        chunks.append({
            "index": idx,
            "content": chunk_content.strip(),
            "length": len(chunk_content),
        })

        idx += 1
        next_pos = end_pos - chunk_overlap
        if next_pos <= current_pos:
            next_pos = end_pos
        current_pos = next_pos

    return chunks
