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
    const mongoUri = process.env.MONGO_URI || "***REMOVED***";
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

    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await collection.countDocuments(query);
    
    // Get paginated results
    const invoices = await collection
      .find(query)
      .sort({ "invoice_header.invoice_date": -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return { invoices, total };
  }

  async getInvoiceByNumber(invoiceNum: string): Promise<Invoice | null> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<Invoice>("invoices");
    
    return await collection.findOne({ "invoice_header.invoice_num": invoiceNum });
  }

  async updateInvoiceHeader(invoiceNum: string, data: Partial<InvoiceHeader>): Promise<Invoice | null> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<Invoice>("invoices");
    
    // Update only the specified fields in invoice_header
    const updateData: { [key: string]: any } = {};
    Object.entries(data).forEach(([key, value]) => {
      updateData[`invoice_header.${key}`] = value;
    });
    
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
    
    // Get total invoice count
    const total_invoices = await collection.countDocuments(query);
    
    // Calculate total amount
    const amountPipeline = [
      { $match: query },
      { $group: { _id: null, total: { $sum: "$invoice_header.invoice_amount" } } }
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
          amount: { $sum: "$invoice_header.invoice_amount" } 
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
          amount: { $sum: "$invoice_header.invoice_amount" }
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

// Use the MongoDB storage implementation
export const storage = new MongoStorage();
