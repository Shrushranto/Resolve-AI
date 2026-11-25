import re
from pathlib import Path

POLICY_FILE = Path(__file__).parent.parent.parent.parent / "data" / "policy.txt"

class PolicyRAG:
    """Keyword-based retrieval over local policy document."""

    def __init__(self):
        self._text = ""
        self._sections: list[tuple[str, str]] = []
        self._load()

    def _load(self):
        if POLICY_FILE.exists():
            self._text = POLICY_FILE.read_text(encoding="utf-8")
            self._sections = self._parse_sections(self._text)

    def _parse_sections(self, text: str) -> list[tuple[str, str]]:
        sections = []
        current_header = "General"
        current_body: list[str] = []
        for line in text.splitlines():
            if line.startswith("#"):
                if current_body:
                    sections.append((current_header, "\n".join(current_body).strip()))
                current_header = line.lstrip("#").strip()
                current_body = []
            else:
                current_body.append(line)
        if current_body:
            sections.append((current_header, "\n".join(current_body).strip()))
        return sections

    def search(self, category: str, query: str = "") -> str:
        if not self._sections:
            return "Policy document not found. Please refer to the return policy page on our website."

        keywords = set(re.findall(r"\w+", (category + " " + query).lower()))
        scored = []
        for header, body in self._sections:
            combined = (header + " " + body).lower()
            score = sum(1 for kw in keywords if kw in combined)
            scored.append((score, header, body))

        scored.sort(reverse=True, key=lambda x: x[0])
        if scored and scored[0][0] > 0:
            top = scored[:2]
            return "\n\n".join(f"**{h}**\n{b}" for _, h, b in top)
        return self._text[:1500]
