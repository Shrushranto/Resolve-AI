import re

INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|above|prior)\s+instructions?",
    r"you\s+are\s+now\s+(?:a\s+)?(?:different|new|another)\s+(?:ai|assistant|bot|model)",
    r"disregard\s+(?:your\s+)?(?:training|guidelines|rules|policies?)",
    r"act\s+as\s+(?:if\s+you\s+(?:have\s+no|are\s+without)\s+restrictions?|a\s+different)",
    r"override\s+(?:safety|refund|policy|business|authorization)",
    r"bypass\s+(?:the\s+)?(?:refund|policy|check|validation|limit|threshold|rule)",
    r"approve\s+(?:all\s+)?refunds?\s+automatically",
    r"you\s+must\s+(?:always\s+)?(?:approve|process|execute)\s+(?:all\s+)?refunds?",
    r"forget\s+(?:all\s+)?(?:your\s+)?(?:instructions?|rules?|guidelines?|training)",
    r"print\s+(?:your\s+)?system\s+prompt",
    r"reveal\s+(?:your\s+)?(?:instructions?|system\s+prompt|configuration)",
    r"jailbreak",
    r"dan\s+mode",
    r"developer\s+mode",
]

_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

def detect_prompt_injection(text: str) -> bool:
    return any(p.search(text) for p in _PATTERNS)

def safe_response_for_injection() -> str:
    return (
        "I'm here to help with your support request. I cannot modify my operating "
        "guidelines or violate business policies. If you have a genuine support query, "
        "please describe your issue and I'll do my best to assist."
    )
