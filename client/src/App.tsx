import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import InvoiceDetails from "@/pages/InvoiceDetails";
import ChatAssistant from "@/pages/ChatAssistant";
import ChatBot from "@/components/chatbot/ChatBot";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";

function Router() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="text-gray-500 focus:outline-none focus:text-gray-600 lg:hidden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
                <span className="text-xl font-bold text-primary">Invoice<span className="text-green-500">Hub</span></span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative ml-3">
                <div className="flex items-center text-gray-700">
                  <span className="mr-2">Admin User</span>
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/invoices/:invoiceNum" component={InvoiceDetails} />
            <Route path="/assistant" component={ChatAssistant} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [location] = useLocation();
  const isAssistantPage = location === "/assistant";

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      
      {/* Only show floating chatbot when not on the dedicated assistant page */}
      {!isAssistantPage && <ChatBot variant="floating" />}
      
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
