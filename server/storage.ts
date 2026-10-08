import { Invoice, InvoiceHeader, InvoiceSummary, User, InsertUser } from "@shared/schema";
import { MongoClient, ObjectId } from "mongodb";

export interface IStorage {
  // User methods (keeping for compatibility)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Invoice methods
  getInvoices(page: number, limit: number, filters?: any): Promise<{ invoices: Invoice[], total: number }>;
  getInvoiceByNumber(invoiceNum: string): Promise<Invoice | null>;
  updateInvoiceHeader(invoiceNum: string, data: Partial<InvoiceHeader>): Promise<Invoice | null>;
  getAnalyticsSummary(filters?: any): Promise<InvoiceSummary>;
  getVendorList(): Promise<string[]>;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private dbName: string = "invoice_automation";
  private users: Map<number, User>;
  private currentId: number;

  constructor() {
    const mongoUri = process.env.MONGO_URI || "";
    this.client = new MongoClient(mongoUri);
    this.users = new Map();
    this.currentId = 1;
    
    // Connect to MongoDB
    this.init();
  }

  private async init() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("Failed to connect to MongoDB", err);
    }
  }

  // User methods (from MemStorage for compatibility)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Invoice methods
  async getInvoices(page: number = 1, limit: number = 10, filters: any = {}): Promise<{ invoices: Invoice[], total: number }> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<Invoice>("invoices");
    
    const query: any = {};
    
    // Apply filters
    if (filters.vendor && filters.vendor !== "") {
      query["invoice_header.vendor_name"] = filters.vendor;
    }
    
    if (filters.currency && filters.currency !== "") {
      query["invoice_header.currency_code"] = filters.currency;
    }
    
    if (filters.invoiceType && filters.invoiceType !== "") {
      query["invoice_header.invoice_type"] = filters.invoiceType;
    }
    
    if (filters.startDate && filters.endDate) {
      query["invoice_header.invoice_date"] = {
        $gte: filters.startDate,
        $lte: filters.endDate
      };
    }
    
    if (filters.search && filters.search !== "") {
      // Search by invoice number or vendor name
      query["$or"] = [
        { "invoice_header.invoice_num": { $regex: filters.search, $options: "i" } },
        { "invoice_header.vendor_name": { $regex: filters.search, $options: "i" } }
      ];
    }

    // Get total count for pagination
    const total = await collection.countDocuments(query);
    
    // Create query
    const findQuery = collection
      .find(query)
      .sort({ "invoice_header.invoice_date": -1 });
    
    // Apply pagination unless limit is 0 (which means get all records for export)
    if (limit > 0) {
      const skip = (page - 1) * limit;
      findQuery.skip(skip).limit(limit);
    }
    
    // Execute query and get results
    const invoices = await findQuery.toArray();
      
    // Recalculate invoice amounts for each invoice
    for (const invoice of invoices) {
      // Calculate the total invoice amount based on line items
      const totalAmount = invoice.invoice_lines.reduce(
        (sum, line) => sum + line.line_amount,
        0
      );
      
      // If the stored amount doesn't match the calculated amount, update it
      if (invoice.invoice_header.invoice_amount !== totalAmount || !invoice.invoice_header.to_usd) {
        // Convert to USD if needed
        let toUsd = totalAmount;
        if (invoice.invoice_header.currency_code === "INR") {
          toUsd = totalAmount / 83; // Using approximate INR to USD conversion
        } else if (invoice.invoice_header.currency_code === "EUR") {
          toUsd = totalAmount * 1.08; // Using approximate EUR to USD conversion
        }
        
        await collection.updateOne(
          { "invoice_header.invoice_num": invoice.invoice_header.invoice_num },
          { $set: { 
              "invoice_header.invoice_amount": totalAmount,
              "invoice_header.to_usd": toUsd
            } 
          }
        );
        
        // Update the invoice object to return the correct amounts
        invoice.invoice_header.invoice_amount = totalAmount;
        invoice.invoice_header.to_usd = toUsd;
      }
    }
    
    return { invoices, total };
  }

  async getInvoiceByNumber(invoiceNum: string): Promise<Invoice | null> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<Invoice>("invoices");
    
    const invoice = await collection.findOne({ "invoice_header.invoice_num": invoiceNum });
    
    if (invoice) {
      // Calculate the total invoice amount based on line items
      const totalAmount = invoice.invoice_lines.reduce(
        (sum, line) => sum + line.line_amount, 
        0
      );
      
      // If the stored amount doesn't match the calculated amount, update it
      if (invoice.invoice_header.invoice_amount !== totalAmount || !invoice.invoice_header.to_usd) {
        // Convert to USD if needed
        let toUsd = totalAmount;
        if (invoice.invoice_header.currency_code === "INR") {
          toUsd = totalAmount / 83; // Using approximate INR to USD conversion
        } else if (invoice.invoice_header.currency_code === "EUR") {
          toUsd = totalAmount * 1.08; // Using approximate EUR to USD conversion
        }
        
        await collection.updateOne(
          { "invoice_header.invoice_num": invoiceNum },
          { $set: { 
              "invoice_header.invoice_amount": totalAmount,
              "invoice_header.to_usd": toUsd
            } 
          }
        );
        
        // Update the invoice object to return the correct amounts
        invoice.invoice_header.invoice_amount = totalAmount;
        invoice.invoice_header.to_usd = toUsd;
      }
    }
    
    return invoice;
  }

  async updateInvoiceHeader(invoiceNum: string, data: Partial<InvoiceHeader>): Promise<Invoice | null> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<Invoice>("invoices");
    
    // First, get the current invoice to access its line items
    const currentInvoice = await collection.findOne({ "invoice_header.invoice_num": invoiceNum });
    
    if (!currentInvoice) {
      return null;
    }
    
    // Calculate the total invoice amount based on line items
    const totalAmount = currentInvoice.invoice_lines.reduce(
      (sum, line) => sum + line.line_amount, 
      0
    );
    
    // Convert to USD if needed
    let toUsd = totalAmount;
    const currencyCode = data.currency_code || currentInvoice.invoice_header.currency_code;
    if (currencyCode === "INR") {
      toUsd = totalAmount / 83; // Using approximate INR to USD conversion
    } else if (currencyCode === "EUR") {
      toUsd = totalAmount * 1.08; // Using approximate EUR to USD conversion
    }
    
    // Update only the specified fields in invoice_header
    const updateData: { [key: string]: any } = {};
    Object.entries(data).forEach(([key, value]) => {
      updateData[`invoice_header.${key}`] = value;
    });
    
    // Always update the invoice_amount and to_usd to reflect the sum of line_amount values
    updateData["invoice_header.invoice_amount"] = totalAmount;
    updateData["invoice_header.to_usd"] = toUsd;
    
    const result = await collection.findOneAndUpdate(
      { "invoice_header.invoice_num": invoiceNum },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    return result;
  }

  async getAnalyticsSummary(filters: any = {}): Promise<InvoiceSummary> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<Invoice>("invoices");
    
    const query: any = {};
    
    // Apply filters
    if (filters.vendor && filters.vendor !== "") {
      query["invoice_header.vendor_name"] = filters.vendor;
    }
    
    if (filters.currency && filters.currency !== "") {
      query["invoice_header.currency_code"] = filters.currency;
    }
    
    if (filters.startDate && filters.endDate) {
      query["invoice_header.invoice_date"] = {
        $gte: filters.startDate,
        $lte: filters.endDate
      };
    }
    
    // First ensure all invoices have correct amounts
    const allInvoices = await collection.find(query).toArray();
    let updatesNeeded = false;
    
    for (const invoice of allInvoices) {
      // Calculate the total invoice amount based on line items
      const totalAmount = invoice.invoice_lines.reduce(
        (sum, line) => sum + line.line_amount,
        0
      );
      
      // If the stored amount doesn't match the calculated amount, update it
      if (invoice.invoice_header.invoice_amount !== totalAmount) {
        await collection.updateOne(
          { "invoice_header.invoice_num": invoice.invoice_header.invoice_num },
          { $set: { "invoice_header.invoice_amount": totalAmount } }
        );
        updatesNeeded = true;
      }
    }
    
    // Get total invoice count
    const total_invoices = await collection.countDocuments(query);
    
    // Calculate total amount using pipeline after updates
    const amountPipeline = [
      { $match: query },
      { $group: { _id: null, total: { $sum: "$invoice_header.to_usd" } } }
    ];
    
    const amountResult = await collection.aggregate(amountPipeline).toArray();
    const total_amount = amountResult.length > 0 ? amountResult[0].total : 0;
    
    // Get invoice types counts and amounts
    const typesPipeline = [
      { $match: query },
      { 
        $group: { 
          _id: "$invoice_header.invoice_type", 
          count: { $sum: 1 }, 
          amount: { $sum: "$invoice_header.to_usd" } 
        } 
      },
      { $sort: { count: -1 } }
    ];
    
    const typesResult = await collection.aggregate(typesPipeline).toArray();
    const invoice_types = typesResult.map(item => ({
      type: item._id,
      count: item.count,
      amount: item.amount
    }));
    
    // Calculate monthly totals
    const monthlyPipeline = [
      { $match: query },
      {
        $group: {
          _id: { $substr: ["$invoice_header.invoice_date", 0, 7] }, // Group by YYYY-MM
          amount: { $sum: "$invoice_header.to_usd" }
        }
      },
      { $sort: { _id: 1 } }
    ];
    
    const monthlyResult = await collection.aggregate(monthlyPipeline).toArray();
    const monthly_totals = monthlyResult.map(item => ({
      month: item._id,
      amount: item.amount
    }));
    
    return {
      total_invoices,
      total_amount,
      invoice_types,
      monthly_totals
    };
  }

  async getVendorList(): Promise<string[]> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<Invoice>("invoices");
    
    const pipeline = [
      { $group: { _id: "$invoice_header.vendor_name" } },
      { $sort: { _id: 1 } }
    ];
    
    const result = await collection.aggregate(pipeline).toArray();
    return result.map(item => item._id);
  }
}

type StoredInvoice = Invoice & { _id: string };

function calculateInvoiceTotals(invoice: Invoice) {
  const totalAmount = invoice.invoice_lines.reduce(
    (sum, line) => sum + line.line_amount,
    0,
  );

  let toUsd = totalAmount;
  if (invoice.invoice_header.currency_code === "INR") {
    toUsd = totalAmount / 83;
  } else if (invoice.invoice_header.currency_code === "EUR") {
    toUsd = totalAmount * 1.08;
  }

  return { totalAmount, toUsd };
}

function applyFilters(invoices: Invoice[], filters: any = {}) {
  return invoices.filter((invoice) => {
    const header = invoice.invoice_header;

    if (filters.vendor && filters.vendor !== "" && header.vendor_name !== filters.vendor) {
      return false;
    }

    if (filters.currency && filters.currency !== "" && header.currency_code !== filters.currency) {
      return false;
    }

    if (filters.invoiceType && filters.invoiceType !== "" && header.invoice_type !== filters.invoiceType) {
      return false;
    }

    if (filters.startDate && filters.endDate) {
      const invoiceDate = header.invoice_date.slice(0, 10);
      if (invoiceDate < filters.startDate || invoiceDate > filters.endDate) {
        return false;
      }
    }

    if (filters.search && filters.search !== "") {
      const search = filters.search.toLowerCase();
      const matchesInvoice = header.invoice_num.toLowerCase().includes(search);
      const matchesVendor = header.vendor_name.toLowerCase().includes(search);
      if (!matchesInvoice && !matchesVendor) {
        return false;
      }
    }

    return true;
  });
}

function createSeedInvoices(): StoredInvoice[] {
  const seedData: Invoice[] = [
    {
      invoice_header: {
        organization_code: 100001,
        invoice_num: "INV101",
        invoice_date: "2024-03-01",
        vendor_name: "TechCorp",
        vendor_site_code: "V001",
        invoice_amount: 1250,
        to_usd: 1250,
        currency_code: "USD",
        payment_term: "NET30",
        invoice_type: "Standard",
        invoice_status: "pending",
      },
      invoice_lines: [
        { line_number: 1, line_type: "Service", description: "Cloud Subscription", quantity: 1, unit_price: 1250, line_amount: 1250 },
      ],
    },
    {
      invoice_header: {
        organization_code: 100002,
        invoice_num: "INV102",
        invoice_date: "2024-03-05",
        vendor_name: "HealthPlus",
        vendor_site_code: "V002",
        invoice_amount: 8420,
        to_usd: 101.45,
        currency_code: "INR",
        payment_term: "NET45",
        invoice_type: "Credit Memo",
        invoice_status: "pending",
      },
      invoice_lines: [
        { line_number: 1, line_type: "Product", description: "Hardware Supply", quantity: 2, unit_price: 2100, line_amount: 4200 },
        { line_number: 2, line_type: "Service", description: "Maintenance Contract", quantity: 1, unit_price: 4220, line_amount: 4220 },
      ],
    },
    {
      invoice_header: {
        organization_code: 100003,
        invoice_num: "INV103",
        invoice_date: "2024-03-08",
        vendor_name: "OfficeWorld",
        vendor_site_code: "V003",
        invoice_amount: 3100,
        to_usd: 3348,
        currency_code: "EUR",
        payment_term: "NET60",
        invoice_type: "Standard",
        invoice_status: "approved",
      },
      invoice_lines: [
        { line_number: 1, line_type: "Service", description: "Project Management", quantity: 2, unit_price: 775, line_amount: 1550 },
        { line_number: 2, line_type: "Service", description: "Data Migration", quantity: 1, unit_price: 1550, line_amount: 1550 },
      ],
    },
    {
      invoice_header: {
        organization_code: 100004,
        invoice_num: "INV104",
        invoice_date: "2024-03-11",
        vendor_name: "GreenEnergy",
        vendor_site_code: "V004",
        invoice_amount: 2750,
        to_usd: 2750,
        currency_code: "USD",
        payment_term: "NET30",
        invoice_type: "Standard",
        invoice_status: "pending",
      },
      invoice_lines: [
        { line_number: 1, line_type: "Service", description: "Security Audit", quantity: 1, unit_price: 1750, line_amount: 1750 },
        { line_number: 2, line_type: "Service", description: "Training Workshop", quantity: 1, unit_price: 1000, line_amount: 1000 },
      ],
    },
    {
      invoice_header: {
        organization_code: 100005,
        invoice_num: "INV105",
        invoice_date: "2024-03-15",
        vendor_name: "BuildSmart",
        vendor_site_code: "V005",
        invoice_amount: 4850,
        to_usd: 5835,
        currency_code: "EUR",
        payment_term: "NET45",
        invoice_type: "Credit Memo",
        invoice_status: "approved",
      },
      invoice_lines: [
        { line_number: 1, line_type: "Product", description: "Network Installation", quantity: 3, unit_price: 950, line_amount: 2850 },
        { line_number: 2, line_type: "Service", description: "Custom Development", quantity: 2, unit_price: 1000, line_amount: 2000 },
      ],
    },
  ];

  return seedData.map((invoice, index) => {
    const { totalAmount, toUsd } = calculateInvoiceTotals(invoice);
    return {
      ...invoice,
      _id: String(index + 1),
      invoice_header: {
        ...invoice.invoice_header,
        invoice_amount: totalAmount,
        to_usd: toUsd,
      },
    };
  });
}

class MemoryStorage implements IStorage {
  private invoices: StoredInvoice[];
  private users: Map<number, User>;
  private currentId: number;

  constructor() {
    this.invoices = createSeedInvoices();
    this.users = new Map();
    this.currentId = 1;
    console.log("Using in-memory invoice storage because MONGO_URI is not set");
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getInvoices(page = 1, limit = 10, filters: any = {}): Promise<{ invoices: Invoice[]; total: number }> {
    const filteredInvoices = applyFilters(this.invoices, filters)
      .sort((a, b) => b.invoice_header.invoice_date.localeCompare(a.invoice_header.invoice_date));

    const total = filteredInvoices.length;
    if (limit <= 0) {
      return { invoices: filteredInvoices.map(({ _id, ...invoice }) => invoice), total };
    }

    const skip = (page - 1) * limit;
    return {
      invoices: filteredInvoices.slice(skip, skip + limit).map(({ _id, ...invoice }) => invoice),
      total,
    };
  }

  async getInvoiceByNumber(invoiceNum: string): Promise<Invoice | null> {
    const invoice = this.invoices.find((item) => item.invoice_header.invoice_num === invoiceNum);
    return invoice ? { invoice_header: { ...invoice.invoice_header }, invoice_lines: [...invoice.invoice_lines] } : null;
  }

  async updateInvoiceHeader(invoiceNum: string, data: Partial<InvoiceHeader>): Promise<Invoice | null> {
    const invoice = this.invoices.find((item) => item.invoice_header.invoice_num === invoiceNum);
    if (!invoice) {
      return null;
    }

    const updatedHeader = {
      ...invoice.invoice_header,
      ...data,
    };
    const { totalAmount, toUsd } = calculateInvoiceTotals({
      invoice_header: updatedHeader,
      invoice_lines: invoice.invoice_lines,
    });

    invoice.invoice_header = {
      ...updatedHeader,
      invoice_amount: totalAmount,
      to_usd: toUsd,
    };

    return {
      invoice_header: { ...invoice.invoice_header },
      invoice_lines: [...invoice.invoice_lines],
    };
  }

  async getAnalyticsSummary(filters: any = {}): Promise<InvoiceSummary> {
    const filteredInvoices = applyFilters(this.invoices, filters);

    const invoiceTypeMap = new Map<string, { count: number; amount: number }>();
    const monthlyMap = new Map<string, number>();

    for (const invoice of filteredInvoices) {
      const { toUsd } = calculateInvoiceTotals(invoice);
      const type = invoice.invoice_header.invoice_type;
      const month = invoice.invoice_header.invoice_date.slice(0, 7);

      const typeSummary = invoiceTypeMap.get(type) || { count: 0, amount: 0 };
      invoiceTypeMap.set(type, { count: typeSummary.count + 1, amount: typeSummary.amount + toUsd });
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + toUsd);
    }

    return {
      total_invoices: filteredInvoices.length,
      total_amount: filteredInvoices.reduce((sum, invoice) => sum + calculateInvoiceTotals(invoice).toUsd, 0),
      invoice_types: Array.from(invoiceTypeMap.entries()).map(([type, value]) => ({ type, count: value.count, amount: value.amount })),
      monthly_totals: Array.from(monthlyMap.entries()).map(([month, amount]) => ({ month, amount })),
    };
  }

  async getVendorList(): Promise<string[]> {
    return Array.from(new Set(this.invoices.map((invoice) => invoice.invoice_header.vendor_name))).sort();
  }
}

// Use MongoDB when configured, otherwise fall back to in-memory demo data for local development.
export const storage = process.env.MONGO_URI ? new MongoStorage() : new MemoryStorage();
