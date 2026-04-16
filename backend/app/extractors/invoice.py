import re
from app.extractors.base import BaseExtractor


class InvoiceExtractor(BaseExtractor):
    def extract(self, text: str) -> dict:
        result: dict = {}

        # Invoice number
        inv_match = re.search(r"invoice\s*(?:#|no\.?|number)?[\s:]*([A-Z0-9\-]+)", text, re.IGNORECASE)
        if inv_match:
            result["invoice_number"] = inv_match.group(1).strip()

        # Date patterns
        date_pattern = r"\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})\b"
        dates = re.findall(date_pattern, text)
        if dates:
            result["date"] = dates[0]
        if len(dates) > 1:
            result["due_date"] = dates[1]

        # Due date explicit
        due_match = re.search(r"due\s+(?:date)?[\s:]*(" + date_pattern[2:-2] + ")", text, re.IGNORECASE)
        if due_match:
            result["due_date"] = due_match.group(1).strip()

        # Vendor name - look for "from:" or "vendor:" or company after "bill from"
        vendor_match = re.search(r"(?:from|vendor|seller|billed\s+from)[\s:]+([^\n]+)", text, re.IGNORECASE)
        if vendor_match:
            result["vendor_name"] = vendor_match.group(1).strip()

        # Vendor address
        addr_match = re.search(
            r"(?:address|vendor\s+address)[\s:]+([^\n]+(?:\n[^\n]+){0,2})", text, re.IGNORECASE
        )
        if addr_match:
            result["vendor_address"] = addr_match.group(1).strip()

        # Bill to
        bill_match = re.search(r"bill\s+to[\s:]+([^\n]+(?:\n[^\n]+){0,2})", text, re.IGNORECASE)
        if bill_match:
            result["bill_to"] = bill_match.group(1).strip()

        # Amounts
        amount_pattern = r"\$\s*([\d,]+\.?\d*)"
        amounts = re.findall(amount_pattern, text)
        cleaned_amounts = [a.replace(",", "") for a in amounts]

        total_match = re.search(
            r"(?:total|amount\s+due|grand\s+total)[\s:$]*([0-9,]+\.?\d*)", text, re.IGNORECASE
        )
        if total_match:
            result["total_amount"] = total_match.group(1).replace(",", "")
        elif cleaned_amounts:
            result["total_amount"] = max(cleaned_amounts, key=lambda x: float(x) if x else 0)

        subtotal_match = re.search(r"subtotal[\s:$]*([0-9,]+\.?\d*)", text, re.IGNORECASE)
        if subtotal_match:
            result["subtotal"] = subtotal_match.group(1).replace(",", "")

        tax_match = re.search(r"(?:tax|vat|gst)[\s:$]*([0-9,]+\.?\d*)", text, re.IGNORECASE)
        if tax_match:
            result["tax"] = tax_match.group(1).replace(",", "")

        # Line items - look for table-like patterns
        line_items = []
        line_pattern = re.findall(
            r"([A-Za-z][^\n$]{2,40})\s+(\d+)\s+\$?\s*([\d,]+\.?\d*)", text
        )
        for item in line_pattern[:10]:
            line_items.append(
                {"description": item[0].strip(), "quantity": item[1], "amount": item[2].replace(",", "")}
            )
        result["line_items"] = line_items

        return result
