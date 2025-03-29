import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, ChevronDown, Bot, FileText, X } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice } from '@shared/schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatBotProps {
  variant?: 'inline' | 'floating';
}

export default function ChatBot({ variant = 'inline' }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      type: 'bot', 
      text: 'Hello! I\'m your invoice assistant. Ask me questions about your invoices, such as "Show me recent invoices from BuildSmart" or "What were our total expenses last month?"', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [relatedInvoices, setRelatedInvoices] = useState<Invoice[]>([]);
  const [showInvoices, setShowInvoices] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Focus input when chat is opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Scroll to the bottom when messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showInvoices]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message to the chat
    const userMessageObj: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    setIsLoading(true);
    setRelatedInvoices([]);
    setShowInvoices(false);
    
    try {
      // Send the message to the AI
      const result = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
      });
      
      const response = await result.json();
      
      // Add bot response
      const botMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: response.answer || "Sorry, I couldn't process your request.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessageObj]);
      
      // Update related invoices
      if (response.invoices && response.invoices.length > 0) {
        setRelatedInvoices(response.invoices);
        setShowInvoices(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
      
      // Add error message
      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: "I'm sorry, I encountered an error processing your question. Please try again.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp for messages
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const InvoiceList = () => (
    <div className="border rounded-lg mt-2 bg-slate-50">
      <div className="flex justify-between items-center px-3 py-2 border-b">
        <div className="font-medium flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Related Invoices ({relatedInvoices.length})
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => setShowInvoices(!showInvoices)}
        >
          {showInvoices ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 transform rotate-180" />}
        </Button>
      </div>
      
      {showInvoices && (
        <div className="p-2 max-h-60 overflow-y-auto">
          {relatedInvoices.slice(0, 5).map((invoice, index) => (
            <div key={invoice.invoice_header.invoice_num} className="border rounded-md p-2 mb-2 bg-white">
              <div className="flex justify-between mb-1">
                <div className="font-medium">{invoice.invoice_header.invoice_num}</div>
                <div className="text-sm text-gray-500">{formatDate(invoice.invoice_header.invoice_date)}</div>
              </div>
              <div className="text-sm">{invoice.invoice_header.vendor_name}</div>
              <div className="flex justify-between mt-1">
                <div className="text-sm text-gray-500">{invoice.invoice_header.invoice_type}</div>
                <div className="font-medium">{formatCurrency(invoice.invoice_header.invoice_amount, invoice.invoice_header.currency_code)}</div>
              </div>
            </div>
          ))}
          
          {relatedInvoices.length > 5 && (
            <div className="text-sm text-center text-gray-500">
              {relatedInvoices.length - 5} more invoice(s) not shown
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Inline chat UI
  const InlineChat = () => (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white shadow">
      <div className="flex items-center justify-between bg-slate-100 px-4 py-2 border-b">
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2 text-slate-700" />
          <h3 className="font-medium">Invoice Assistant</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <ScrollArea className="h-[400px] pr-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.text}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-primary-foreground/70' : 'text-slate-500'
                  }`}
                >
                  {formatMessageTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-slate-100">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-4 w-60 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          )}
          
          {relatedInvoices.length > 0 && <InvoiceList />}
          
          <div ref={endOfMessagesRef} />
        </ScrollArea>
      </div>
      
      <div className="p-4 border-t">
        <div className="flex">
          <Input
            placeholder="Ask about your invoices..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            disabled={isLoading}
            className="mr-2"
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Floating chat button and dialog
  const FloatingChat = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] p-0">
          <InlineChat />
        </DialogContent>
      </Dialog>
    </div>
  );

  // Return the variant of chatbot UI
  return (
    <>
      {variant === 'inline' ? (
        <div className="h-full">
          <InlineChat />
        </div>
      ) : (
        <FloatingChat />
      )}
    </>
  );
}