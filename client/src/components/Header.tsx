import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  toggleSidebar: () => void;
}

export default function Header({ title, subtitle, actions, toggleSidebar }: HeaderProps) {
  return (
    <div className="lg:flex lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 focus:outline-none focus:text-gray-600 lg:hidden mr-4"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            {title}
          </h2>
        </div>
        {subtitle && (
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div className="mt-5 flex lg:mt-0 lg:ml-4">{actions}</div>}
    </div>
  );
}
