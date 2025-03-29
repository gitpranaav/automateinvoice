import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { updateInvoiceHeaderSchema } from "@shared/schema";
import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API Routes
  // All routes are prefixed with /api

  // Get paginated list of invoice headers with optional filters
  app.get("/api/invoices", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Process filter parameters
      const filters: any = {};
      
      if (req.query.vendor) filters.vendor = req.query.vendor as string;
      if (req.query.currency) filters.currency = req.query.currency as string;
      if (req.query.invoiceType) filters.invoiceType = req.query.invoiceType as string;
      if (req.query.search) filters.search = req.query.search as string;
      
      if (req.query.startDate && req.query.endDate) {
        filters.startDate = req.query.startDate as string;
        filters.endDate = req.query.endDate as string;
      }
      
      const result = await storage.getInvoices(page, limit, filters);
      
      res.json({
        invoices: result.invoices,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get a single invoice with all details
  app.get("/api/invoices/:invoice_num", async (req, res) => {
    try {
      const invoiceNum = req.params.invoice_num;
      const invoice = await storage.getInvoiceByNumber(invoiceNum);
      
      if (!invoice) {
        return res.status(404).json({ message: `Invoice ${invoiceNum} not found` });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error(`Error fetching invoice ${req.params.invoice_num}:`, error);
      res.status(500).json({ message: "Failed to fetch invoice details" });
    }
  });

  // Update invoice header info
  app.put("/api/invoices/:invoice_num", async (req, res) => {
    try {
      const invoiceNum = req.params.invoice_num;
      
      // Validate request body
      const validationResult = updateInvoiceHeaderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid invoice data", errors: validationResult.error.errors });
      }
      
      const updatedInvoice = await storage.updateInvoiceHeader(invoiceNum, req.body);
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: `Invoice ${invoiceNum} not found` });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error(`Error updating invoice ${req.params.invoice_num}:`, error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Get analytics summary
  app.get("/api/analytics/summary", async (req, res) => {
    try {
      // Process filter parameters
      const filters: any = {};
      
      if (req.query.vendor) filters.vendor = req.query.vendor as string;
      if (req.query.currency) filters.currency = req.query.currency as string;
      
      if (req.query.startDate && req.query.endDate) {
        filters.startDate = req.query.startDate as string;
        filters.endDate = req.query.endDate as string;
      }
      
      const summary = await storage.getAnalyticsSummary(filters);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  // Get unique vendor list
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getVendorList();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendor list:", error);
      res.status(500).json({ message: "Failed to fetch vendor list" });
    }
  });

  // Export invoices to Excel based on filters
  app.get("/api/export/invoices", async (req, res) => {
    try {
      // Process filter parameters (same as invoices endpoint)
      const filters: any = {};
      
      if (req.query.vendor) filters.vendor = req.query.vendor as string;
      if (req.query.currency) filters.currency = req.query.currency as string;
      if (req.query.invoiceType) filters.invoiceType = req.query.invoiceType as string;
      if (req.query.search) filters.search = req.query.search as string;
      
      if (req.query.startDate && req.query.endDate) {
        filters.startDate = req.query.startDate as string;
        filters.endDate = req.query.endDate as string;
      }

      // Get all invoices matching filters without pagination (limit = 0)
      const result = await storage.getInvoices(1, 0, filters);
      const invoices = result.invoices;

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Create worksheet for invoice headers
      const headerData = invoices.map(invoice => {
        const header = invoice.invoice_header;
        return {
          'Invoice Number': header.invoice_num,
          'Invoice Date': header.invoice_date,
          'Vendor': header.vendor_name,
          'Vendor Site': header.vendor_site_code,
          'Amount': header.invoice_amount,
          'Currency': header.currency_code,
          'Payment Terms': header.payment_term,
          'Type': header.invoice_type,
          'Organization Code': header.organization_code
        };
      });
      
      const headerSheet = XLSX.utils.json_to_sheet(headerData);
      XLSX.utils.book_append_sheet(workbook, headerSheet, 'Invoice Headers');

      // Create worksheet for invoice lines
      const lineData: any[] = [];
      invoices.forEach(invoice => {
        invoice.invoice_lines.forEach(line => {
          lineData.push({
            'Invoice Number': invoice.invoice_header.invoice_num,
            'Line Number': line.line_number,
            'Line Type': line.line_type,
            'Description': line.description,
            'Quantity': line.quantity,
            'Unit Price': line.unit_price,
            'Line Amount': line.line_amount
          });
        });
      });
      
      const linesSheet = XLSX.utils.json_to_sheet(lineData);
      XLSX.utils.book_append_sheet(workbook, linesSheet, 'Invoice Lines');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=invoices_export.xlsx');
      
      // Send the file
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting invoices:", error);
      res.status(500).json({ message: "Failed to export invoices" });
    }
  });

  // AI Assistant API endpoint
  app.post("/api/ai-assistant/query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Invalid query format" });
      }

      // Check for API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          message: "Gemini API key is not configured",
          needsApiKey: true 
        });
      }

      // Initialize the Google Generative AI with the API key
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Get invoice data to provide context for the AI
      // For now, we'll get the most recent 100 invoices to provide as context
      const invoiceResult = await storage.getInvoices(1, 100);
      const invoices = invoiceResult.invoices;

      // Get analytics summary
      const summary = await storage.getAnalyticsSummary();

      // Prepare context for the AI
      const invoiceData = invoices.map(invoice => {
        const header = invoice.invoice_header;
        return {
          invoice_num: header.invoice_num,
          invoice_date: header.invoice_date,
          vendor_name: header.vendor_name,
          invoice_amount: header.invoice_amount,
          currency_code: header.currency_code,
          invoice_type: header.invoice_type
        };
      });

      // Create prompt with context
      const contextPrompt = `
You are an AI assistant helping with invoice analysis. You MUST ONLY use the data provided below to answer queries. Do not make up or hallucinate any information that is not directly supported by this data.

INVOICE DATA SUMMARY:
- Total invoices: ${summary.total_invoices}
- Total amount: ${summary.total_amount}
- Invoice types: ${JSON.stringify(summary.invoice_types)}
- Monthly totals: ${JSON.stringify(summary.monthly_totals)}

RECENT INVOICES:
${JSON.stringify(invoiceData, null, 2)}

USER QUERY: ${query}

Based ONLY on the invoice data provided above, respond to the user query. If the query is asking for specific invoice data, return both:
1. A natural language response to the query
2. The specific data requested in a structured format

Format your response as valid JSON with the following structure:
{
  "message": "Your natural language response to the user query",
  "invoices": [array of matching invoice objects] (optional),
  "total": numeric total if applicable (optional),
  "analysis": "Additional analysis if relevant" (optional),
  "chart_data": structured data for visualization if relevant (optional),
  "confidence": "high" | "medium" | "low" - indicate your confidence in the answer based on available data
}

IMPORTANT GUIDELINES:
1. Return ONLY the JSON object. Do not include markdown code blocks (like \`\`\`json) or any other text outside the JSON structure.
2. If you cannot find the answer in the provided data, state clearly in your message that you don't have enough information to answer.
3. Do not hallucinate or make up information that is not in the data provided.
4. Be specific about which data you used to form your answer.
5. If there are no results matching a query, explicitly state that no matching invoices were found rather than making up an answer.

If you're uncertain or the query can't be answered with the available data, provide a helpful response explaining what information is needed.
`;

      // Generate content using the Gemini model
      const result = await model.generateContent(contextPrompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Process AI response
      try {
        // The AI might format the JSON with code blocks or other formatting
        // Let's try to extract just the JSON part if it exists
        let jsonStr = aiResponse;
        
        // Check if response is wrapped in markdown code blocks
        const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonStr = jsonMatch[1];
        }
        
        // Try to parse as JSON
        const jsonResponse = JSON.parse(jsonStr);
        
        // Define the expected structure of an invoice from the AI response
        interface AIResponseInvoice {
          invoice_num: string;
          invoice_date?: string;
          vendor_name?: string;
          invoice_amount?: number;
          currency_code?: string;
          invoice_type?: string;
          [key: string]: any; // Allow for any other properties the AI might include
        }
        
        // Verify that any returned invoices actually match data we sent
        if (jsonResponse.invoices && Array.isArray(jsonResponse.invoices) && jsonResponse.invoices.length > 0) {
          // Create a set of valid invoice numbers from our data
          const validInvoiceNumbers = new Set(invoiceData.map(inv => inv.invoice_num));
          
          // Filter out any hallucinated invoices
          const verifiedInvoices = jsonResponse.invoices.filter((inv: AIResponseInvoice) => {
            // Check if this invoice exists in our original data
            const isValid = validInvoiceNumbers.has(inv.invoice_num);
            if (!isValid) {
              console.warn(`Removing hallucinated invoice from AI response: ${inv.invoice_num}`);
            }
            return isValid;
          });
          
          // If AI hallucinated invoices, update the response
          if (verifiedInvoices.length !== jsonResponse.invoices.length) {
            const removedCount = jsonResponse.invoices.length - verifiedInvoices.length;
            jsonResponse.invoices = verifiedInvoices;
            
            // Update the message to be transparent about removal
            if (verifiedInvoices.length === 0) {
              jsonResponse.message = "I couldn't find any matching invoices in the available data. " + 
                                     "Please try a different query or check if the data contains the information you're looking for.";
            } else {
              jsonResponse.message += ` (Note: ${removedCount} invalid result${removedCount > 1 ? 's were' : ' was'} removed from the results to ensure accuracy.)`;
            }
          }
        }
        
        res.json(jsonResponse);
      } catch (parseError) {
        // If we can't parse as JSON, just return the text response
        console.error("Failed to parse AI response as JSON:", parseError);
        res.json({
          message: aiResponse.replace(/```(?:json)?\s*|\s*```/g, '') || "I processed your query, but couldn't format the result properly."
        });
      }
    } catch (error) {
      console.error("Error processing AI assistant query:", error);
      res.status(500).json({ message: "Failed to process your query" });
    }
  });

  return httpServer;
}
