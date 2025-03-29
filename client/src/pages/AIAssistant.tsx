import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Bot, Mic, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ResultInvoice {
  invoice_num: string;
  invoice_date: string;
  vendor_name: string;
  invoice_amount: number;
  currency_code: string;
  invoice_type: string;
}

interface AIResult {
  message: string;
  invoices?: ResultInvoice[];
  total?: number;
  analysis?: string;
  chart_data?: any;
  confidence?: "high" | "medium" | "low";
}

export default function AIAssistant() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI invoice assistant. Ask me anything about your invoices, such as:\n\n" +
        "- \"Show me invoices from Vendor X in March\"\n" +
        "- \"What is my highest invoice this month?\"\n" +
        "- \"How much did we spend on consulting services?\""
    }
  ]);
  const [results, setResults] = useState<AIResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = { role: "user", content: query };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear the input and set loading state
    setQuery("");
    setIsLoading(true);
    setResults(null);
    
    try {
      // Send query to the backend
      const response = await fetch('/api/ai-assistant/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },  
        body: JSON.stringify({ query: userMessage.content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI assistant');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: ChatMessage = { 
        role: "assistant", 
        content: data.message || "I processed your request. Here are the results." 
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Set results
      setResults(data);
    } catch (error) {
      console.error('Error querying AI assistant:', error);
      const response = error instanceof Response ? await error.json() : null;
      
      let errorContent = "I'm sorry, I encountered an error processing your request. Please try again.";
      
      if (response && response.needsApiKey) {
        errorContent = "The AI Assistant requires a valid Gemini API key. Please check the API key configuration.";
      } else if (response && response.message) {
        errorContent = `Error: ${response.message}`;
      }
      
      const errorMessage: ChatMessage = { 
        role: "assistant", 
        content: errorContent
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get a response from the AI assistant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderResults = () => {
    if (!results) return null;
    
    return (
      <div className="mt-6">
        {results.confidence && (
          <div className="mb-3">
            <span className="text-sm font-medium mr-2">Answer confidence:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${results.confidence === 'high' ? 'bg-green-100 text-green-800' : 
                results.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}>
              {results.confidence.charAt(0).toUpperCase() + results.confidence.slice(1)}
            </span>
          </div>
        )}
        
        {results.invoices && results.invoices.length > 0 && (
          <Card className="p-4 mb-4">
            <h3 className="text-lg font-medium mb-3">Invoice Results</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.invoices.map((invoice) => (
                    <tr key={invoice.invoice_num} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                        <a href={`/invoices/${invoice.invoice_num}`} className="hover:underline">
                          {invoice.invoice_num}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.invoice_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.vendor_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(invoice.invoice_amount, invoice.currency_code)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${invoice.invoice_type === 'Standard' ? 'bg-green-100 text-green-800' : 
                            invoice.invoice_type === 'Credit' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {invoice.invoice_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {results.total !== undefined && (
              <div className="mt-4 text-right">
                <span className="font-semibold">Total: {formatCurrency(results.total)}</span>
              </div>
            )}
          </Card>
        )}
        
        {results.analysis && (
          <Card className="p-4 mb-4">
            <h3 className="text-lg font-medium mb-2">Analysis</h3>
            <p className="text-gray-700 whitespace-pre-line">{results.analysis}</p>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Invoice Assistant</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-4">
            <div className="p-4 h-[calc(70vh-150px)] overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center mb-1">
                          <Bot size={16} className="mr-1" />
                          <span className="font-semibold text-sm">Assistant</span>
                        </div>
                      )}
                      <div className="whitespace-pre-line">{message.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 bg-gray-200 text-gray-800">
                      <div className="flex items-center">
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        <span>Processing your query...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your invoices..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !query.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-medium mb-3">Example Queries</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setQuery("Show me invoices from BuildSmart in March")}
                  className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  Show me invoices from BuildSmart in March
                </button>
                <button
                  onClick={() => setQuery("What is my highest invoice this month?")}
                  className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  What is my highest invoice this month?
                </button>
                <button
                  onClick={() => setQuery("How much did we spend on consulting services?")}
                  className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  How much did we spend on consulting services?
                </button>
                <button
                  onClick={() => setQuery("Compare invoices between Q1 and Q2")}
                  className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  Compare invoices between Q1 and Q2
                </button>
                <button
                  onClick={() => setQuery("Show me all credit invoices")}
                  className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  Show me all credit invoices
                </button>
              </div>
            </div>
            
            {renderResults()}
          </Card>
        </div>
      </div>
    </div>
  );
}