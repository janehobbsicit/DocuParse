from app.extractors.invoice import InvoiceExtractor
from app.extractors.resume import ResumeExtractor
from app.extractors.contract import ContractExtractor
from app.extractors.generic import GenericExtractor

EXTRACTORS = {
    "invoice": InvoiceExtractor,
    "resume": ResumeExtractor,
    "contract": ContractExtractor,
    "generic": GenericExtractor,
}


def get_extractor(template_type: str):
    extractor_cls = EXTRACTORS.get(template_type, GenericExtractor)
    return extractor_cls()
