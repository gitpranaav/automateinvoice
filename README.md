# AutomateInvoice

AutomateInvoice is a full-stack invoice management app for browsing, filtering, editing, exporting, and analyzing invoice data.

## Features
- Invoice dashboard with summary metrics and charts
- Invoice listing with search, filters, and pagination
- Invoice detail view with header edits and line items
- Excel export for filtered invoice data
- AI assistant endpoint for invoice Q&A (Gemini-backed)

## Tech Stack
- Frontend: React, TypeScript, Vite, Tailwind CSS, TanStack Query, Wouter
- Backend: Node.js, Express, TypeScript
- Data: MongoDB
- Shared validation/types: Zod

## System Architecture

### Component view
- **Client (`client/src`)**: SPA UI, route-based pages, data fetching via REST APIs.
- **Server (`server`)**: Express API for invoices, analytics, export, and AI assistant.
- **Shared (`shared/schema.ts`)**: shared TypeScript interfaces and Zod schemas.
- **Database (MongoDB)**: primary storage for invoice documents.

### Runtime flow
1. User interacts with the React UI.
2. UI calls `/api/*` endpoints on the Express server.
3. Server reads/writes invoice documents in MongoDB.
4. Server returns JSON (or `.xlsx` for export).
5. Optional: AI assistant endpoint builds context from invoice data and calls Gemini.

### Request paths
- `GET /api/invoices` - list invoices with filters and pagination
- `GET /api/invoices/:invoice_num` - fetch invoice details
- `PUT /api/invoices/:invoice_num` - update invoice header fields
- `GET /api/analytics/summary` - dashboard analytics
- `GET /api/vendors` - vendor list
- `GET /api/export/invoices` - export filtered data to Excel
- `POST /api/ai-assistant/query` - AI-powered invoice query

## Local Setup

### Prerequisites
- Node.js 18+
- npm
- MongoDB connection string

### Environment variables
Create a `.env` file using `.env.example`:
- `MONGO_URI`
- `GEMINI_API_KEY` (required only for AI assistant endpoint)

### Install and run
```bash
npm install
npm run dev
```

App and API run on port `3002`.

## Build and type-check
```bash
npm run check
npm run build
npm run start
```
