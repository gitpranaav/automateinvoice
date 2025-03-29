import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { updateInvoiceHeaderSchema } from "@shared/schema";
import * as XLSX from 'xlsx';

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

  return httpServer;
}
