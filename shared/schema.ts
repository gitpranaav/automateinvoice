import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// MongoDB schema definitions for the invoice management system
// Since we're using MongoDB, we'll define types rather than Drizzle tables

export interface InvoiceLine {
  line_number: number;
  line_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_amount: number;
}

export interface InvoiceHeader {
  organization_code: number;
  invoice_num: string;
  invoice_date: string;
  vendor_name: string;
  vendor_site_code: string;
  invoice_amount: number;
  currency_code: string;
  payment_term: string;
  invoice_type: string;
  pdf_link?: string;
  pdf_base64?: string;
}

export interface Invoice {
  _id?: string;
  invoice_header: InvoiceHeader;
  invoice_lines: InvoiceLine[];
}

// Zod schemas for validation
export const invoiceLineSchema = z.object({
  line_number: z.number(),
  line_type: z.string(),
  description: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  line_amount: z.number()
});

export const invoiceHeaderSchema = z.object({
  organization_code: z.number(),
  invoice_num: z.string(),
  invoice_date: z.string(),
  vendor_name: z.string(),
  vendor_site_code: z.string(),
  invoice_amount: z.number(),
  currency_code: z.string(),
  payment_term: z.string(),
  invoice_type: z.string(),
  pdf_link: z.string().optional(),
  pdf_base64: z.string().optional()
});

export const invoiceSchema = z.object({
  invoice_header: invoiceHeaderSchema,
  invoice_lines: z.array(invoiceLineSchema)
});

export const updateInvoiceHeaderSchema = invoiceHeaderSchema.partial();

// Types for analytics data
export interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  invoice_types: {
    type: string;
    count: number;
    amount: number;
  }[];
  monthly_totals: {
    month: string;
    amount: number;
  }[];
}

// Keep users table for compatibility with existing code
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
