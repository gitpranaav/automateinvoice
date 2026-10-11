# AutomateInvoice

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)

**AutomateInvoice** is a full-stack, AI-powered invoice management web application built to streamline how you browse, filter, edit, export, and analyze invoice data.

With seamless email integration, MongoDB document storage, and an intelligent Gemini-backed AI assistant, AutomateInvoice is your central hub for managing financials effortlessly.

---

## Features

- **Interactive Dashboard:** View summary metrics, trends, and charts for a bird's-eye view of your finances.
- **Advanced Filtering & Pagination:** Quickly find what you need with powerful search and multi-criteria filters.
- **Invoice Management:** View detailed invoice header information alongside line items, and edit details directly via an intuitive modal.
- **AI-Powered Assistant:** A built-in chat interface powered by Google's Gemini AI to answer questions about your invoice data instantly and accurately.
- **Automated PDF Processing:** Processes PDF attachments directly from emails via Gmail API and multimodal OCR.
- **Excel Export:** Export your filtered data views directly into `.xlsx` formats for external reporting.

---

## Tech Stack

### Frontend
- **Framework**: React with TypeScript and Vite
- **Styling**: Tailwind CSS & shadcn/ui components
- **State & Data Fetching**: TanStack Query (React Query)
- **Routing**: Wouter
- **Data Visualization**: Recharts

### Backend & Services
- **Server**: Node.js & Express (TypeScript)
- **Database**: MongoDB (via official Node Driver) with MemoryStorage fallback
- **AI Integration**: Google Generative AI (Gemini 1.5 Pro) API
- **Validation**: Zod (Shared contracts between client and server)
- **Export Engine**: SheetJS (`xlsx`) for multi-sheet spreadsheet generation

### Ingestion Pipeline
- **Runtime**: Python 3
- **Email Ingestion**: Google Gmail API (`googleapiclient`, OAuth 2.0)
- **Document OCR / AI**: Google Generative AI (Gemini Multimodal)
- **Database Driver**: PyMongo
- **Forex Conversion**: `forex-python` & static currency converters

---

## System Architecture

### High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend Client (React 18 + Vite)"]
        direction TB
        UI["UI Layer<br/>(Tailwind CSS + shadcn/ui)"]
        Router["Client Routing<br/>(Wouter)"]
        State["Data Fetching & Cache<br/>(TanStack Query)"]
        Charts["Analytics Visualizations<br/>(Recharts)"]
        PDFView["PDF Viewer<br/>(Base64 Stream / External)"]
        
        Router --> UI
        UI --> State
        UI --> Charts
        UI --> PDFView
    end

    subgraph Server["⚙️ Backend Server (Node.js + Express)"]
        direction TB
        API["REST API Router<br/>(/api/*)"]
        Validator["Request Validation<br/>(Zod Schemas)"]
        StorageIface["Storage Abstraction<br/>(IStorage)"]
        ExcelSvc["Excel Export Engine<br/>(xlsx multi-sheet)"]
        AIEngine["AI Query Orchestrator<br/>(Context Injection & Guardrails)"]

        API --> Validator
        Validator --> StorageIface
        API --> ExcelSvc
        API --> AIEngine
        AIEngine --> StorageIface
        ExcelSvc --> StorageIface
    end

    subgraph DataLayer["💾 Persistence Layer"]
        direction TB
        MongoDB[("MongoDB Cluster<br/>(invoice_automation db)")]
        MemoryDB[("In-Memory Store<br/>(Local fallback when no URI)")]
        
        StorageIface -->|MONGO_URI configured| MongoDB
        StorageIface -->|MONGO_URI missing| MemoryDB
    end

    subgraph Ingestion["📥 Ingestion Pipeline (Python Worker)"]
        direction TB
        GmailPoll["Gmail Poller<br/>(gmail.readonly)"]
        PDFExtract["Attachment Extractor<br/>& Base64 Re-encoder"]
        GeminiOCR["Gemini Vision / OCR<br/>Invoice Structuring"]
        ForexConv["Currency Normalizer<br/>(USD / EUR / INR)"]

        GmailPoll --> PDFExtract
        PDFExtract --> GeminiOCR
        GeminiOCR --> ForexConv
        ForexConv --> MongoDB
    end

    subgraph Cloud["🌐 External Cloud Services"]
        GeminiCloud["Google Gemini 1.5 Pro API"]
        GoogleGmail["Google Gmail API (OAuth2)"]
    end

    %% Cross-layer links
    Client <-->|"HTTP / REST API (JSON & Binary Stream)"| API
    AIEngine <-->|"Context Prompt & Structured JSON"| GeminiCloud
    GeminiOCR <-->|"Multimodal PDF Analysis"| GeminiCloud
    GmailPoll <-->|"Fetch Invoices & Attachments"| GoogleGmail
```

---

### Component Breakdown

| Layer | Component | Technologies | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend** | Single Page Application | React 18, Vite, TypeScript | Interactive UI for managing, browsing, and inspecting invoices. |
| **Frontend** | State & Data Fetching | TanStack Query (React Query) | Server-state caching, automatic refetching, mutation invalidation. |
| **Frontend** | UI Components | shadcn/ui, Tailwind CSS, Lucide | Modern design system, accessible dialogs, toasts, responsive sidebar. |
| **Frontend** | Document Preview | Custom Base64 / IFrame Viewer | Renders invoice PDFs directly in-browser with download/new-tab capabilities. |
| **Backend** | API Gateway & Middleware | Express 4, Node.js, TypeScript | Request routing, logging, JSON middleware, error handling. |
| **Backend** | Contract Validation | Zod, `@shared/schema` | Type-safe schema validation across client and server boundaries. |
| **Backend** | Storage Abstraction | `IStorage` interface | Flexible layer toggling between `MongoStorage` and `MemoryStorage`. |
| **Backend** | Analytics & Aggregations | MongoDB Aggregation Pipelines | Computes total spend, monthly trends, and invoice type distributions. |
| **Backend** | Excel Generation | SheetJS (`xlsx`) | Converts multi-level invoice headers and lines into structured `.xlsx` workbooks. |
| **Backend** | AI Orchestrator | `@google/generative-ai` | Enforces prompt grounding, context hydration, and anti-hallucination guardrails. |
| **Ingestion** | PDF Processing Worker | Python 3, PyMongo, Gmail API | Reads email attachments, extracts metadata with Gemini, and seeds MongoDB. |

---

### Key Workflows & Data Flows

#### 1. AI Assistant Query & Anti-Hallucination Pipeline
The AI Assistant injects grounded context from MongoDB into Google Gemini and applies a deterministic validation filter to verify returned invoice references against database records before returning results to the client.

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant UI as AIAssistant (React)
    participant API as Express API (/api/ai-assistant/query)
    participant Storage as Storage Layer (MongoDB / Memory)
    participant Gemini as Google Gemini 1.5 Pro
    participant Guard as Anti-Hallucination Filter

    User->>UI: Enters natural language query
    UI->>API: POST /api/ai-assistant/query { query }
    API->>Storage: Fetch recent invoices (100) + financial summary
    Storage-->>API: Return invoice records & metrics
    API->>API: Build grounded context prompt & strict JSON schema rules
    API->>Gemini: model.generateContent(contextPrompt)
    Gemini-->>API: Returns structured JSON response
    API->>Guard: Verify invoice IDs in response against dataset
    alt Hallucinated Invoice ID Detected
        Guard->>API: Strip invalid invoice items & append advisory note
    else All Invoice IDs Verified
        Guard->>API: Retain verified invoice items
    end
    API-->>UI: Return JSON { message, invoices, confidence, analysis }
    UI-->>User: Render natural language answer, confidence badge, & invoice cards
```

#### 2. Automated Email & PDF Ingestion Flow
Invoices received via email are processed asynchronously by the Python ingestion worker using Gemini's multimodal capabilities.

```mermaid
flowchart LR
    A["📧 Gmail Mailbox<br/>(Invoice Email)"] -->|OAuth 2.0| B["Python Worker<br/>(pdf_processor.py)"]
    B -->|Extract PDF| C["Base64 Re-encoder<br/>& Validator"]
    C -->|PDF Stream| D["Gemini 1.5 Multimodal<br/>Vision / Extraction"]
    D -->|Extracted JSON| E["Currency Normalization<br/>(USD / INR / EUR)"]
    E -->|Check duplicates| F{"Exists in DB?"}
    F -->|No| G[("MongoDB<br/>'invoices' collection")]
    F -->|Yes| H["Skip / Log"]
```

#### 3. Excel Export Workflow
When exporting filtered views, the server queries all matching invoices without pagination limits and constructs a two-sheet workbook:

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant UI as Invoices Page
    participant API as Express API (/api/export/invoices)
    participant Storage as Storage Layer
    participant XLSX as SheetJS Engine

    User->>UI: Clicks "Export" (applies current filters)
    UI->>API: GET /api/export/invoices?vendor=...&startDate=...
    API->>Storage: getInvoices(page=1, limit=0, filters)
    Storage-->>API: Return all matching invoices
    API->>XLSX: Generate "Invoice Headers" worksheet
    API->>XLSX: Generate "Invoice Lines" worksheet
    API->>XLSX: Package workbook into binary buffer
    API-->>UI: Stream .xlsx buffer with Content-Disposition header
    UI-->>User: Browser downloads invoices_export.xlsx
```

---

### Data Model & Entity Relationship

Each invoice is stored as a cohesive document featuring an invoice header and an embedded array of line items. Total amounts and USD conversions are kept consistent with the sum of line items.

```mermaid
classDiagram
    class Invoice {
        +_id: string (ObjectId)
        +invoice_header: InvoiceHeader
        +invoice_lines: InvoiceLine[]
    }
    class InvoiceHeader {
        +organization_code: number
        +invoice_num: string
        +invoice_date: string (YYYY-MM-DD)
        +vendor_name: string
        +vendor_site_code: string
        +invoice_amount: number
        +to_usd: number
        +currency_code: string (USD | INR | EUR)
        +payment_term: string (NET30 | NET45 | NET60)
        +invoice_type: string (Standard | Credit Memo)
        +invoice_status: string (pending | approved)
        +pdf_link?: string
        +pdf_base64?: string
    }
    class InvoiceLine {
        +line_number: number
        +line_type: string (Product | Service)
        +description: string
        +quantity: number
        +unit_price: number
        +line_amount: number
    }

    Invoice *-- InvoiceHeader : contains
    Invoice *-- "1..*" InvoiceLine : embeds
```

---

### Codebase Directory Structure

```
automateinvoice/
├── client/                     # Frontend React application
│   ├── index.html              # HTML entry point
│   └── src/
│       ├── App.tsx             # Root router, navigation, layout shell
│       ├── main.tsx            # React DOM bootstrap
│       ├── components/
│       │   ├── dashboard/      # Stat cards, monthly spending & invoice type charts
│       │   ├── filters/        # Date range & multi-criteria filter controls
│       │   ├── invoices/       # Invoice table, line items, edit modal, PDF viewer
│       │   ├── layout/         # App layout wrappers
│       │   └── ui/             # Reusable shadcn/ui component library
│       ├── hooks/              # Custom React hooks (e.g. use-toast)
│       ├── lib/                # Query client setup, formatters, utilities
│       └── pages/              # Primary views (Dashboard, Invoices, Details, AI Assistant)
├── server/                     # Backend Express server & Python worker
│   ├── index.ts                # Server startup, logging middleware, port binding (3002)
│   ├── routes.ts               # REST API endpoints, Excel export & Gemini AI integration
│   ├── storage.ts              # Storage abstraction (MongoStorage & MemoryStorage fallback)
│   ├── pdf_processor.py        # Python ingestion worker (Gmail & Gemini PDF parser)
│   └── vite.ts                 # Vite development middleware and static asset serving
├── shared/
│   └── schema.ts               # Shared TypeScript interfaces & Zod validation schemas
├── attached_assets/            # Demo PDF fixtures and mock data generation scripts
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler configuration
├── tailwind.config.ts          # Tailwind CSS theme configuration
└── vite.config.ts              # Vite bundling configuration
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (or yarn/pnpm)
- A MongoDB cluster/instance
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gitpranaav/automateinvoice.git
   cd automateinvoice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory using the provided template:
   ```bash
   cp .env.example .env
   ```
   *Fill in your `MONGO_URI` and `GEMINI_API_KEY` inside `.env`.*

4. **Run the Application**
   ```bash
   npm run dev
   ```
   *The client and server will start concurrently. The app will be available at `http://localhost:3002`.*

---

## Build & Production

To build the app for production and type-check:

```bash
npm run check
npm run build
npm run start
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/invoices` | List invoices with filters and pagination |
| `GET` | `/api/invoices/:invoice_num` | Fetch a specific invoice's details |
| `PUT` | `/api/invoices/:invoice_num` | Update invoice header fields |
| `GET` | `/api/analytics/summary` | Fetch dashboard analytics and metrics |
| `GET` | `/api/vendors` | Fetch a list of all distinct vendors |
| `GET` | `/api/export/invoices` | Export filtered invoice data to Excel |
| `POST` | `/api/ai-assistant/query` | Query the AI assistant against invoice data |

---

> Built by Snacks(LeviathanExecutionUnit) in COEP INSPIRON 4.0 Hackathon March-2025.
