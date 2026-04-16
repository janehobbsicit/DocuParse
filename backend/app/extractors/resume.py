import re
from app.extractors.base import BaseExtractor


class ResumeExtractor(BaseExtractor):
    def extract(self, text: str) -> dict:
        result: dict = {}
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        # Name - usually first non-empty line or after "Name:"
        name_match = re.search(r"(?:name)[\s:]+([^\n]+)", text, re.IGNORECASE)
        if name_match:
            result["name"] = name_match.group(1).strip()
        elif lines:
            result["name"] = lines[0]

        # Email
        email_match = re.search(r"[\w.\-+]+@[\w.\-]+\.[a-zA-Z]{2,}", text)
        if email_match:
            result["email"] = email_match.group(0)

        # Phone
        phone_match = re.search(r"(\+?1?\s*[\(\-]?\d{3}[\)\-\s]\s*\d{3}[\-\s]\d{4})", text)
        if phone_match:
            result["phone"] = phone_match.group(1).strip()

        # Location / Address
        loc_match = re.search(r"(?:location|address|city|residing)[\s:]+([^\n]+)", text, re.IGNORECASE)
        if loc_match:
            result["location"] = loc_match.group(1).strip()
        else:
            # Try to find city, state pattern
            city_match = re.search(r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})\b", text)
            if city_match:
                result["location"] = city_match.group(0)

        # Summary / Objective
        summary_match = re.search(
            r"(?:summary|objective|profile|about)[\s:]+([^\n]+(?:\n(?![A-Z\s]{3,})[^\n]+){0,4})",
            text, re.IGNORECASE
        )
        if summary_match:
            result["summary"] = summary_match.group(1).strip()

        # Skills - look for skills section
        skills_match = re.search(
            r"(?:skills?|technologies|competencies)[\s:]+([^\n]+(?:\n(?![A-Z]{3,})[^\n]+){0,5})",
            text, re.IGNORECASE
        )
        if skills_match:
            skills_text = skills_match.group(1)
            skills = re.split(r"[,|•·;\n]+", skills_text)
            result["skills"] = [s.strip() for s in skills if s.strip()]
        else:
            result["skills"] = []

        # Work Experience
        work_experience = []
        exp_section = re.search(
            r"(?:experience|employment|work\s+history)(.*?)(?:education|skills|projects|$)",
            text, re.IGNORECASE | re.DOTALL
        )
        if exp_section:
            exp_text = exp_section.group(1)
            job_blocks = re.split(r"\n(?=[A-Z])", exp_text)
            for block in job_blocks[:5]:
                if not block.strip():
                    continue
                job: dict = {}
                company_match = re.search(r"(?:at|@|company)[\s:]+([^\n]+)", block, re.IGNORECASE)
                if company_match:
                    job["company"] = company_match.group(1).strip()
                elif block.strip():
                    job["company"] = block.split("\n")[0].strip()

                title_match = re.search(
                    r"(?:title|position|role)[\s:]+([^\n]+)", block, re.IGNORECASE
                )
                if title_match:
                    job["title"] = title_match.group(1).strip()

                duration_match = re.search(
                    r"(\d{4}\s*[-–]\s*(?:\d{4}|present|current))", block, re.IGNORECASE
                )
                if duration_match:
                    job["duration"] = duration_match.group(1).strip()

                desc_lines = [l.strip() for l in block.split("\n")[1:] if l.strip()]
                job["description"] = " ".join(desc_lines[:3])

                if job.get("company"):
                    work_experience.append(job)
        result["work_experience"] = work_experience

        # Education
        education = []
        edu_section = re.search(
            r"(?:education|academic)(.*?)(?:experience|skills|projects|$)",
            text, re.IGNORECASE | re.DOTALL
        )
        if edu_section:
            edu_text = edu_section.group(1)
            edu_blocks = re.split(r"\n(?=[A-Z])", edu_text)
            for block in edu_blocks[:3]:
                if not block.strip():
                    continue
                edu: dict = {}
                edu["institution"] = block.split("\n")[0].strip()

                degree_match = re.search(
                    r"(?:b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?b\.?a\.?|ph\.?d\.?|bachelor|master|doctor)[^\n]*",
                    block, re.IGNORECASE
                )
                if degree_match:
                    edu["degree"] = degree_match.group(0).strip()

                year_match = re.search(r"\b(19|20)\d{2}\b", block)
                if year_match:
                    edu["year"] = year_match.group(0)

                if edu.get("institution"):
                    education.append(edu)
        result["education"] = education

        return result
