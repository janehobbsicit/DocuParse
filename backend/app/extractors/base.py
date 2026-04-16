from abc import ABC, abstractmethod


class BaseExtractor(ABC):
    @abstractmethod
    def extract(self, text: str) -> dict:
        """Extract structured data from raw text. Returns a dict of key-value pairs."""
        pass

    def safe_extract(self, text: str) -> dict:
        try:
            return self.extract(text)
        except Exception as e:
            return {"extraction_error": str(e)}
