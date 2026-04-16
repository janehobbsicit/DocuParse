import re
from app.extractors.base import BaseExtractor


class GenericExtractor(BaseExtractor):
    def extract(self, text: str) -> dict:
        result: dict = {}

        # Key: value patterns
        kv_colon = re.findall(r"^([A-Za-z][A-Za-z\s]{1,30})\s*:\s*(.+)$", text, re.MULTILINE)
        for key, value in kv_colon:
            clean_key = key.strip().lower().replace(" ", "_")
            if len(clean_key) <= 40 and value.strip():
                result[clean_key] = value.strip()

        # Key = value patterns
        kv_equals = re.findall(r"^([A-Za-z][A-Za-z\s]{1,30})\s*=\s*(.+)$", text, re.MULTILINE)
        for key, value in kv_equals:
            clean_key = key.strip().lower().replace(" ", "_")
            if clean_key not in result and len(clean_key) <= 40 and value.strip():
                result[clean_key] = value.strip()

        # Emails
        emails = re.findall(r"[\w.\-+]+@[\w.\-]+\.[a-zA-Z]{2,}", text)
        if emails:
            result["emails"] = list(set(emails))

        # Phone numbers
        phones = re.findall(r"\+?1?\s*[\(\-]?\d{3}[\)\-\s]\s*\d{3}[\-\s]\d{4}", text)
        if phones:
            result["phone_numbers"] = list(set(p.strip() for p in phones))

        # Dates
        dates = re.findall(
            r"\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{1,2},?\s+\d{4})\b",
            text
        )
        if dates:
            result["dates"] = list(set(dates))

        # Currency amounts
        amounts = re.findall(r"\$\s*([\d,]+\.?\d*)", text)
        if amounts:
            result["amounts"] = [a.replace(",", "") for a in amounts]

        # URLs
        urls = re.findall(r"https?://[^\s]+", text)
        if urls:
            result["urls"] = urls

        return result
