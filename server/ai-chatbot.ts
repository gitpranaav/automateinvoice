import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { storage } from './storage';
import { Invoice } from '@shared/schema';

// Initialize the Google AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Generate context for the AI
const generateSystemContext = async () => {
  try {
    // Get summary information
    const summary = await storage.getAnalyticsSummary();
    
    // Get vendor list
    const vendors = await storage.getVendorList();
    
    // Create a system context with information about the available data
    return `
      You are an AI assistant specializing in invoice data analysis. 
      You have access to the following invoice data:
      
      Total invoices in the system: ${summary.total_invoices}
      Total invoice amount across all invoices: ${summary.total_amount}
      Available vendors: ${vendors.join(', ')}
      
      The invoice data structure includes:
      - Invoice header: Contains invoice number, date, vendor name, invoice amount, currency, payment terms, and invoice type.
      - Invoice lines: Contains line items with details like description, quantity, unit price, and line amount.
      
      You can help users find invoices, analyze invoice data, and answer questions about specific invoices.
      
      When a user asks for invoice data, try to determine what they're looking for and provide concise, accurate information.
      If you're not sure about something, acknowledge what you don't know and suggest an alternative.
    `;
  } catch (error) {
    console.error('Error generating system context:', error);
    return `
      You are an AI assistant specializing in invoice data analysis.
      You can help users find invoices, analyze invoice data, and answer questions about specific invoices.
      When a user asks for invoice data, try to determine what they're looking for and provide concise, accurate information.
    `;
  }
};

// Function to query invoice data based on AI interpretation
const queryInvoices = async (userQuery: string): Promise<Invoice[]> => {
  let filters: any = {};
  
  // Extract vendor name (if present)
  const vendorMatch = userQuery.match(/vendor\s+(\w+)/i) || 
                     userQuery.match(/from\s+(\w+)/i) ||
                     userQuery.match(/by\s+(\w+)/i);
                     
  if (vendorMatch && vendorMatch[1]) {
    filters.vendor = vendorMatch[1];
  }
  
  // Extract date range (if present)
  const monthMatch = userQuery.match(/in\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i);
  
  if (monthMatch && monthMatch[1]) {
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const monthIndex = monthNames.findIndex(
      month => month.toLowerCase() === monthMatch[1].toLowerCase()
    );
    
    if (monthIndex !== -1) {
      const year = new Date().getFullYear();
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0); // Last day of month
      
      filters.startDate = startDate.toISOString().split('T')[0];
      filters.endDate = endDate.toISOString().split('T')[0];
    }
  }
  
  // Extract invoice type (if present)
  const typeMatch = userQuery.match(/type\s+(\w+)/i) || 
                   userQuery.match(/(standard|credit|prepayment)\s+invoices/i);
                   
  if (typeMatch && typeMatch[1]) {
    filters.invoiceType = typeMatch[1].charAt(0).toUpperCase() + typeMatch[1].slice(1).toLowerCase();
  }
  
  // Extract specific invoice number (if present)
  const invoiceNumMatch = userQuery.match(/invoice\s+#?(\w+-?\d+)/i) || 
                         userQuery.match(/number\s+#?(\w+-?\d+)/i);
                         
  if (invoiceNumMatch && invoiceNumMatch[1]) {
    const invoiceNum = invoiceNumMatch[1];
    const invoice = await storage.getInvoiceByNumber(invoiceNum);
    return invoice ? [invoice] : [];
  }
  
  // Query the database with the filters
  try {
    // Get all matching invoices (limit=0 means no pagination)
    const result = await storage.getInvoices(1, 0, filters);
    return result.invoices;
  } catch (error) {
    console.error('Error querying invoices:', error);
    return [];
  }
};

// Process a user message and generate a response
export async function processUserMessage(userMessage: string): Promise<{
  answer: string;
  invoices?: Invoice[];
}> {
  try {
    // Query relevant invoices based on the user's question
    const relevantInvoices = await queryInvoices(userMessage);
    
    // Generate system context
    const systemContext = await generateSystemContext();
    
    // Format invoice data for the AI
    let invoiceContext = '';
    if (relevantInvoices.length > 0) {
      invoiceContext = `Based on the user's query, I found ${relevantInvoices.length} relevant invoices:\n\n`;
      
      // Limit to 5 invoices for context to avoid token limits
      const limitedInvoices = relevantInvoices.slice(0, 5);
      
      limitedInvoices.forEach((invoice, index) => {
        const header = invoice.invoice_header;
        invoiceContext += `Invoice ${index + 1}:\n`;
        invoiceContext += `- Invoice Number: ${header.invoice_num}\n`;
        invoiceContext += `- Date: ${header.invoice_date}\n`;
        invoiceContext += `- Vendor: ${header.vendor_name}\n`;
        invoiceContext += `- Amount: ${header.invoice_amount} ${header.currency_code}\n`;
        invoiceContext += `- Type: ${header.invoice_type}\n`;
        
        if (invoice.invoice_lines && invoice.invoice_lines.length > 0) {
          invoiceContext += `- Line Items: ${invoice.invoice_lines.length}\n`;
        }
        
        invoiceContext += '\n';
      });
      
      if (relevantInvoices.length > 5) {
        invoiceContext += `Note: There are ${relevantInvoices.length - 5} more matching invoices not shown here.\n\n`;
      }
    } else {
      invoiceContext = 'I could not find any invoices matching the user query.\n\n';
    }
    
    // Set up Gemini AI model with safety settings
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.0-pro',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Create chat session
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are an AI assistant for invoice data. Be concise and helpful.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand that I am an AI assistant specializing in invoice data. I will be concise and helpful in my responses.' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.2,
      },
    });
    
    // Generate the final prompt that combines context and user query
    const prompt = `
      ${systemContext}
      
      ${invoiceContext}
      
      User query: "${userMessage}"
      
      Answer the user's query based on the invoice data provided. Be concise and accurate. 
      If you don't have enough information, acknowledge that and suggest what additional information might help.
    `;
    
    // Get response from the AI model
    const result = await chat.sendMessage(prompt);
    const response = result.response.text();
    
    return {
      answer: response,
      invoices: relevantInvoices,
    };
  } catch (error) {
    console.error('Error processing chat message:', error);
    return {
      answer: 'Sorry, I encountered an error processing your question. Please try again or rephrase your question.',
    };
  }
}