import ChatBot from '@/components/chatbot/ChatBot';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function ChatAssistant() {
  const { toast } = useToast();

  // We'll just show a basic reminder at the top of the page about the API key
  // rather than attempting to make a test request when the page loads

  return (
    <div className="container py-10">
      <div className="space-y-4 mb-6">
        <h1 className="text-3xl font-bold">Invoice AI Assistant</h1>
        <p className="text-gray-500">
          Ask questions about your invoice data in natural language. Get immediate answers and insights.
        </p>
        <div className="p-4 border rounded-md bg-amber-50 border-amber-200 text-amber-800">
          <p className="text-sm font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            This feature requires a Gemini API key to work properly.
          </p>
          <p className="text-xs mt-1 ml-7">Make sure the GEMINI_API_KEY environment variable is set.</p>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Try asking:</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200 hover:border-primary transition-colors">
            "What were our total expenses last month?"
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200 hover:border-primary transition-colors">
            "Show me BuildSmart invoices from January"
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200 hover:border-primary transition-colors">
            "How many Standard invoices do we have?"
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200 hover:border-primary transition-colors">
            "Find invoice INV-2023-004"
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200 hover:border-primary transition-colors">
            "Which vendor has the highest total invoice amount?"
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200 hover:border-primary transition-colors">
            "Compare Standard vs Credit invoices"
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
        <ChatBot variant="inline" />
      </div>
    </div>
  );
}