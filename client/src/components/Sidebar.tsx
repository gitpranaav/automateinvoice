import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 transform lg:relative lg:translate-x-0 transition duration-200 ease-in-out z-10 w-64 bg-slate-800 text-white pt-16 lg:pt-0 h-screen lg:h-auto overflow-y-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <nav className="mt-5 px-2">
        <div
          className={cn(
            "group flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 cursor-pointer",
            isActive("/") ? "bg-slate-700" : "hover:bg-slate-700"
          )}
          onClick={() => window.location.href = "/"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-3 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </div>
        <div
          className={cn(
            "group flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 cursor-pointer",
            isActive("/invoices") ? "bg-slate-700" : "hover:bg-slate-700"
          )}
          onClick={() => window.location.href = "/invoices"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-3 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Invoices
        </div>
        <div
          className={cn(
            "group flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 cursor-pointer",
            isActive("/vendors") ? "bg-slate-700" : "hover:bg-slate-700"
          )}
          onClick={() => window.location.href = "/vendors"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-3 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Vendors
        </div>
        <div
          className={cn(
            "group flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 cursor-pointer",
            isActive("/ai-assistant") ? "bg-slate-700" : "hover:bg-slate-700"
          )}
          onClick={() => window.location.href = "/ai-assistant"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-3 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          AI Assistant
        </div>
        <div
          className={cn(
            "group flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 cursor-pointer",
            isActive("/settings") ? "bg-slate-700" : "hover:bg-slate-700"
          )}
          onClick={() => window.location.href = "/settings"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-3 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Settings
        </div>
      </nav>
      <div className="px-4 mt-8">
        <div className="px-4 py-4 bg-slate-700 rounded-lg">
          <h3 className="text-sm font-medium text-white">Need Help?</h3>
          <p className="mt-1 text-xs text-slate-300">
            Contact support for assistance with invoice management.
          </p>
          <button className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
