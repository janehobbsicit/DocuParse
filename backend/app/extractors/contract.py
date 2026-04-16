import re
from app.extractors.base import BaseExtractor


class ContractExtractor(BaseExtractor):
    def extract(self, text: str) -> dict:
        result: dict = {}

        # Parties
        parties = []
        party_matches = re.findall(
            r"(?:between|party|parties|hereinafter)[\s:\"]+([A-Z][^\n,\"]{2,60})", text, re.IGNORECASE
        )
        for p in party_matches[:4]:
            party = p.strip().rstrip(".,;")
            if party and party not in parties:
                parties.append(party)
        result["parties"] = parties

        # Dates
        date_pattern = r"\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})\b"

        effective_match = re.search(
            r"(?:effective|commencement|start)\s+date[\s:]+(" + date_pattern[2:-2] + ")",
            text, re.IGNORECASE
        )
        if effective_match:
            result["effective_date"] = effective_match.group(1).strip()

        expiry_match = re.search(
            r"(?:expir|terminat|end)\s*(?:ation|es)?\s*date[\s:]+(" + date_pattern[2:-2] + ")",
            text, re.IGNORECASE
        )
        if expiry_match:
            result["expiration_date"] = expiry_match.group(1).strip()

        # Governing law
        law_match = re.search(
            r"governed\s+by\s+(?:the\s+laws?\s+of\s+)?([^\n.]{3,60})", text, re.IGNORECASE
        )
        if law_match:
            result["governing_law"] = law_match.group(1).strip().rstrip(".,;")

        # Payment terms
        payment_match = re.search(
            r"(?:payment\s+terms?|payment\s+due|net\s+\d+)[^\n]*([^\n]{5,200})",
            text, re.IGNORECASE
        )
        if payment_match:
            result["payment_terms"] = payment_match.group(0).strip()

        # Termination clause
        term_match = re.search(
            r"(?:termination|cancellation)[^\n]*\n([^\n]+(?:\n[^\n]+){0,3})",
            text, re.IGNORECASE
        )
        if term_match:
            result["termination_clause"] = term_match.group(1).strip()

        # Key clauses - look for section headers
        clause_headers = re.findall(
            r"(?:^|\n)\s*(\d+\.?\s+[A-Z][^\n]{5,60})", text
        )
        result["key_clauses"] = [c.strip() for c in clause_headers[:10]]

        return result
