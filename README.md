# AutomateInvoice

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
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
- **Automated PDF Processing:** Processes PDF attachments directly from emails.
- **Excel Export:** Export your filtered data views directly into `.xlsx` formats for external reporting.

---

## Tech Stack

### Frontend
- **Framework**: React with TypeScript and Vite
- **Styling**: Tailwind CSS & shadcn/ui components
- **State & Data Fetching**: TanStack Query (React Query)
- **Routing**: Wouter

### Backend
- **Server**: Node.js & Express (TypeScript)
- **Database**: MongoDB (via `mongodb` Node Driver)
- **AI Integration**: Google Generative AI (Gemini) API
- **Validation**: Zod (Shared schemas between client and server)

---

## System Architecture

### Component View
- **Client (`client/src`)**: Single Page Application UI with route-based pages fetching data via REST APIs.
- **Server (`server`)**: Express API handling invoices, analytics, export generation, and AI prompt orchestration.
- **Shared (`shared/schema.ts`)**: The source of truth for TypeScript interfaces and Zod schemas used across the stack.
- **Database**: MongoDB handles flexible, scalable document storage for all invoices.

### Runtime Flow
1. User interacts with the React UI.
2. The UI sends requests to `/api/*` endpoints on the Express backend.
3. The server validates the request using Zod, then reads/writes to MongoDB.
4. The server returns JSON data (or a buffered `.xlsx` file for exports).
5. For AI queries, the backend builds a context window from MongoDB data and streams the response via the Gemini API to the UI.

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
