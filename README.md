# DocuParse AI

**AI-powered document extraction and parsing SaaS platform.**

Upload invoices, resumes, and contracts — get structured key-value data back instantly.

---

## Features

- 📄 **Upload** PDF or image files (JPG, PNG, TIFF, etc.)
- 🤖 **AI Extraction** – regex-based placeholder extraction (swap in real AI later)
- 📊 **Structured Data** – displays key-value pairs in a clean dashboard
- 📥 **Export** as JSON or CSV
- 🗂️ **Document History** – paginated list with status badges
- 🏷️ **Templates** – Invoice, Resume, Contract, Generic
- ⚡ **Batch Processing** – upload multiple files at once

---

## Stack

| Layer    | Technology                   |
|----------|------------------------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend  | Python FastAPI               |
| Database | PostgreSQL (via SQLAlchemy async) |
| ORM/Migrations | SQLAlchemy + Alembic  |

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### Run with Docker Compose

```bash
# Clone the repo
git clone https://github.com/janehobbsicit/DocuParse.git
cd DocuParse

# Start all services
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL URL
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/documents/upload` | Upload single document |
| POST | `/api/documents/batch-upload` | Upload multiple documents |
| GET | `/api/documents` | List documents (paginated) |
| GET | `/api/documents/{id}` | Get document by ID |
| DELETE | `/api/documents/{id}` | Delete document |
| GET | `/api/documents/{id}/export/json` | Export as JSON |
| GET | `/api/documents/{id}/export/csv` | Export as CSV |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| DELETE | `/api/templates/{id}` | Delete template |
| GET | `/health` | Health check |

---

## Templates

- **Invoice** – invoice number, date, vendor, amounts, line items
- **Resume** – name, email, skills, work experience, education
- **Contract** – parties, dates, governing law, key clauses
- **Generic** – extracts all key-value pairs, dates, emails, phone numbers

---

## Project Structure

```
DocuParse/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # DB engine & session
│   │   ├── routers/         # API routers
│   │   └── extractors/      # Extraction logic per template
│   ├── alembic/             # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # API client & types
│   └── Dockerfile
└── docker-compose.yml
```

