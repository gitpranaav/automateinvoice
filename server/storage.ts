import { Invoice, InvoiceHeader, InvoiceSummary, User, InsertUser, GoogleUser } from "@shared/schema";
import { MongoClient, ObjectId } from "mongodb";

export interface IStorage {
  // User methods (keeping for compatibility)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Google User methods
  getGoogleUserById(id: string): Promise<GoogleUser | null>;
  getGoogleUserByEmail(email: string): Promise<GoogleUser | null>;
  createGoogleUser(user: GoogleUser): Promise<GoogleUser>;
  updateGoogleUser(id: string, userData: Partial<GoogleUser>): Promise<GoogleUser | null>;
  
  // Invoice methods
  getInvoices(page: number, limit: number, filters?: any): Promise<{ invoices: Invoice[], total: number }>;
  getInvoiceByNumber(invoiceNum: string): Promise<Invoice | null>;
  updateInvoiceHeader(invoiceNum: string, data: Partial<InvoiceHeader>): Promise<Invoice | null>;
  getAnalyticsSummary(filters?: any): Promise<InvoiceSummary>;
  getVendorList(): Promise<string[]>;
  
  // User-specific invoice methods
  getUserInvoices(userId: string, page: number, limit: number, filters?: any): Promise<{ invoices: Invoice[], total: number }>;
  createInvoice(invoice: Invoice): Promise<Invoice>;
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

  // Google User methods
  async getGoogleUserById(id: string): Promise<GoogleUser | null> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<GoogleUser>("google_users");
    return collection.findOne({ id: id });
  }

  async getGoogleUserByEmail(email: string): Promise<GoogleUser | null> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<GoogleUser>("google_users");
    return collection.findOne({ email: email });
  }

  async createGoogleUser(user: GoogleUser): Promise<GoogleUser> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<GoogleUser>("google_users");
    
    // Check if user already exists
    const existingUser = await this.getGoogleUserById(user.id);
    
    if (existingUser) {
      // Update the existing user instead
      await collection.updateOne(
        { id: user.id },
        { $set: {
          ...user,
          updatedAt: new Date()
        }}
      );
      
      return { ...user, updatedAt: new Date() };
    }
    
    // Set timestamps if not provided
    if (!user.createdAt) {
      user.createdAt = new Date();
    }
    if (!user.updatedAt) {
      user.updatedAt = new Date();
    }
    
    await collection.insertOne(user);
    return user;
  }

  async updateGoogleUser(id: string, userData: Partial<GoogleUser>): Promise<GoogleUser | null> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<GoogleUser>("google_users");
    
    // Always update the updatedAt timestamp
    const updatedUser = {
      ...userData,
      updatedAt: new Date()
    };
    
    const result = await collection.findOneAndUpdate(
      { id: id },
      { $set: updatedUser },
      { returnDocument: "after" }
    );
    
    return result;
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
      
    // Recalculate invoice amounts for each invoice
    for (const invoice of invoices) {
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
        
        // Update the invoice object to return the correct amount
        invoice.invoice_header.invoice_amount = totalAmount;
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
      if (invoice.invoice_header.invoice_amount !== totalAmount) {
        await collection.updateOne(
          { "invoice_header.invoice_num": invoiceNum },
          { $set: { "invoice_header.invoice_amount": totalAmount } }
        );
        
        // Update the invoice object to return the correct amount
        invoice.invoice_header.invoice_amount = totalAmount;
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
    
    // Update only the specified fields in invoice_header
    const updateData: { [key: string]: any } = {};
    Object.entries(data).forEach(([key, value]) => {
      updateData[`invoice_header.${key}`] = value;
    });
    
    // Always update the invoice_amount to reflect the sum of line_amount values
    updateData["invoice_header.invoice_amount"] = totalAmount;
    
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
  
  // User-specific invoice methods
  async getUserInvoices(userId: string, page: number = 1, limit: number = 10, filters: any = {}): Promise<{ invoices: Invoice[], total: number }> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<Invoice>("invoices");
    
    // Start with user filter
    const query: any = { userId: userId };
    
    // Apply other filters
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
      
    // Recalculate invoice amounts for each invoice
    for (const invoice of invoices) {
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
        
        // Update the invoice object to return the correct amount
        invoice.invoice_header.invoice_amount = totalAmount;
      }
    }
    
    return { invoices, total };
  }
  
  async createInvoice(invoice: Invoice): Promise<Invoice> {
    const db = this.client.db(this.dbName);
    const collection = db.collection<Invoice>("invoices");
    
    // Set timestamps if not provided
    if (!invoice.createdAt) {
      invoice.createdAt = new Date();
    }
    if (!invoice.updatedAt) {
      invoice.updatedAt = new Date();
    }
    
    // Calculate and ensure the invoice amount matches line items total
    const totalAmount = invoice.invoice_lines.reduce(
      (sum, line) => sum + line.line_amount,
      0
    );
    
    // Update invoice amount to match the calculated total
    invoice.invoice_header.invoice_amount = totalAmount;
    
    await collection.insertOne(invoice);
    return invoice;
  }
}

// Use the MongoDB storage implementation
export const storage = new MongoStorage();
