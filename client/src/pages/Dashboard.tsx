import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import StatCard from "@/components/dashboard/StatCard";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import InvoiceTypeChart from "@/components/dashboard/InvoiceTypeChart";
import RecentInvoices from "@/components/dashboard/RecentInvoices";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  RefreshCcw,
  Download,
  FileText,
  DollarSign,
  Clock
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { toast } = useToast();
  
  // Set default date range for the current month
  const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];

  // Query for analytics summary (without filters)
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/summary"],
    staleTime: 60000, // 1 minute
    retry: 1
  });

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your data is being prepared for download.",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Dashboard Header */}
      <div className="lg:flex lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">Dashboard</h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <RefreshCcw className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>Last updated {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex lg:mt-0 lg:ml-4">
          <span className="ml-3 hidden sm:block">
            <Button variant="outline" onClick={handleExport}>
              <Download className="-ml-1 mr-2 h-5 w-5" />
              Export
            </Button>
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total Invoices"
          value={isLoading ? "Loading..." : analytics?.total_invoices.toString() || "0"}
          icon={<FileText className="text-white" />}
          iconBgColor="bg-blue-500"
          linkText="View all"
          linkUrl="/invoices"
        />
        <StatCard 
          title="Total Amount"
          value={isLoading ? "Loading..." : formatCurrency(analytics?.total_amount || 0, "USD")}
          icon={<DollarSign className="text-white" />}
          iconBgColor="bg-green-500"
          footer={
            <div className="text-sm text-green-600">
              <span className="font-medium">↑ 12.5%</span> from last month
            </div>
          }
        />
        <StatCard 
          title="Pending Invoices"
          value={isLoading ? "Loading..." : "23"}
          icon={<Clock className="text-white" />}
          iconBgColor="bg-amber-500"
          linkText="View pending"
          linkUrl="/invoices?status=pending"
        />
      </div>

      {/* Charts Section */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MonthlyChart data={analytics?.monthly_totals || []} isLoading={isLoading} />
        <InvoiceTypeChart data={analytics?.invoice_types || []} isLoading={isLoading} />
      </div>

      {/* Recent Invoices */}
      <RecentInvoices />
    </div>
  );
}
