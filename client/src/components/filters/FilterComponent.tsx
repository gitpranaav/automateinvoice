import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DateRangeFilter from "./DateRangeFilter";
import { useState } from "react";

interface FilterComponentProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: {
    startDate: string;
    endDate: string;
    vendor: string;
    currency?: string;
    invoiceType?: string;
  };
  onFilterChange: (filters: any) => void;
  onApply: () => void;
  onReset: () => void;
  vendors: string[];
}

export default function FilterComponent({
  isOpen,
  onToggle,
  filters,
  onFilterChange,
  onApply,
  onReset,
  vendors,
}: FilterComponentProps) {
  return (
    <Card className="bg-white shadow rounded-lg p-4 mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Filter Analytics</h3>
        <Button 
          variant="ghost" 
          onClick={onToggle}
          className="text-blue-600 hover:text-blue-700"
        >
          {isOpen ? "Hide Filters" : "Show Filters"}
          <span className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </Button>
      </div>
      
      {isOpen && (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateRangeFilter
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={(date) => onFilterChange({ startDate: date })}
              onEndDateChange={(date) => onFilterChange({ endDate: date })}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Vendor</label>
              <select
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={filters.vendor}
                onChange={(e) => onFilterChange({ vendor: e.target.value })}
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor: string) => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={filters.currency || ""}
                onChange={(e) => onFilterChange({ currency: e.target.value })}
              >
                <option value="">All Currencies</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
            
            {filters.invoiceType !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Type</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={filters.invoiceType}
                  onChange={(e) => onFilterChange({ invoiceType: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="Standard">Standard</option>
                  <option value="Credit">Credit</option>
                  <option value="Prepayment">Prepayment</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onReset} className="mr-2">
              Reset
            </Button>
            <Button onClick={onApply}>
              Apply Filters
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
