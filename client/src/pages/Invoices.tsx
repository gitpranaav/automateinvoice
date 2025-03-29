import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FilterComponent from "@/components/filters/FilterComponent";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import { FileText, Download, Filter, Plus, Search } from "lucide-react";
import { Invoice } from "@shared/schema";

interface FilterState {
  startDate: string;
  endDate: string;
  vendor: string;
  invoiceType: string;
  search: string;
}

export default function Invoices() {
  const { toast } = useToast();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  // No edit modal state needed as editing is done on the details page
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
    vendor: "",
    invoiceType: "",
    search: ""
  });

  // Query for invoices with pagination and filters
  const { data, isLoading, error, refetch } = useQuery<{
    invoices: Invoice[];
    pagination: { total: number; totalPages: number }
  }>({
    queryKey: ["/api/invoices", { page: currentPage, limit: 10, ...filters }],
    staleTime: 60000,
    retry: 1
  });

  // Query for vendors dropdown
  const { data: vendors = [] } = useQuery<string[]>({
    queryKey: ["/api/vendors"],
    staleTime: Infinity
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    refetch();
    toast({
      title: "Filters Applied",
      description: "Invoice list has been updated based on your filters.",
    });
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      vendor: "",
      invoiceType: "",
      search: ""
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Editing is now done directly on the details page

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your invoice data is being prepared for download.",
    });

    // Create URL with current filters
    const queryParams = new URLSearchParams();
    
    if (filters.vendor) queryParams.append('vendor', filters.vendor);
    if (filters.invoiceType) queryParams.append('invoiceType', filters.invoiceType);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.search) queryParams.append('search', filters.search);
    
    // Create export URL with filters
    const exportUrl = `/api/export/invoices?${queryParams.toString()}`;
    
    // Open the export URL in a new window/tab which will trigger the download
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Invoices Header */}
      <div className="lg:flex lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">Invoices</h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>Total: {data?.pagination?.total || 0} invoices</span>
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
          <span className="ml-3 hidden sm:block">
            <Button>
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Invoice
            </Button>
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white shadow rounded-lg p-4 mt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Search & Filter</h3>
          <Button 
            variant="ghost" 
            onClick={() => setShowFilters(!showFilters)}
            className="text-primary hover:text-blue-600"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
            <span className={`ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </Button>
        </div>
        
        <div className="mt-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search invoices by number, vendor name or amount..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>
        
        {showFilters && (
          <>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <div className="mt-1 flex">
                  <Input
                    type="date"
                    className="w-full"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                  />
                  <span className="mx-2 flex items-center text-gray-500">to</span>
                  <Input
                    type="date"
                    className="w-full"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendor</label>
                <select 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={filters.vendor}
                  onChange={(e) => handleFilterChange({ vendor: e.target.value })}
                >
                  <option value="">All Vendors</option>
                  {vendors?.map((vendor: string) => (
                    <option key={vendor} value={vendor}>{vendor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Type</label>
                <select 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={filters.invoiceType}
                  onChange={(e) => handleFilterChange({ invoiceType: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="Standard">Standard</option>
                  <option value="Credit">Credit</option>
                  <option value="Prepayment">Prepayment</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={handleResetFilters} className="mr-2">
                Reset
              </Button>
              <Button onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Invoice Table */}
      <InvoiceTable
        invoices={data?.invoices || []}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={data?.pagination?.totalPages || 1}
        totalItems={data?.pagination?.total || 0}
        onPageChange={handlePageChange}
        onEditInvoice={() => {}}
      />
    </div>
  );
}
