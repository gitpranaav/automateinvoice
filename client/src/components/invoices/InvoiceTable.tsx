import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Invoice } from "@shared/schema";
import InvoiceLineItems from "./InvoiceLineItems";
import { ChevronLeft, ChevronRight, FileText, ArrowRight } from "lucide-react";

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEditInvoice: (invoice: Invoice) => void;
}

export default function InvoiceTable({
  invoices,
  isLoading,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: InvoiceTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getInvoiceTypeBadge = (type: string) => {
    switch (type) {
      case "Standard":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">{type}</Badge>;
      case "Credit":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">{type}</Badge>;
      case "Prepayment":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const toggleExpandRow = (invoiceNum: string) => {
    setExpandedRow(expandedRow === invoiceNum ? null : invoiceNum);
  };

  const renderPagination = () => {
    // Don't render pagination if there are no pages
    if (totalPages <= 0) {
      return null;
    }
    
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {startPage > 1 && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pageNumbers.map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderTableRows = () => {
    if (isLoading) {
      return Array(10).fill(0).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-8" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        </TableRow>
      ));
    }

    if (invoices.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            <div className="flex flex-col items-center justify-center">
              <FileText className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-gray-500">No invoices found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    const rows: React.ReactNode[] = [];

    invoices.forEach((invoice) => {
      // Main row
      rows.push(
        <TableRow 
          key={`row-${invoice.invoice_header.invoice_num}`}
          className="hover:bg-gray-50 cursor-pointer"
          onClick={() => toggleExpandRow(invoice.invoice_header.invoice_num)}
        >
          <TableCell className="font-medium text-blue-600">
            {invoice.invoice_header.invoice_num}
          </TableCell>
          <TableCell>
            {formatDate(invoice.invoice_header.invoice_date)}
          </TableCell>
          <TableCell>
            {invoice.invoice_header.vendor_name}
          </TableCell>
          <TableCell>
            {formatCurrency(invoice.invoice_header.to_usd || 0, "USD")}
          </TableCell>
          <TableCell>
            {getInvoiceTypeBadge(invoice.invoice_header.invoice_type)}
          </TableCell>
          <TableCell>
            {(invoice.invoice_header.pdf_link || invoice.invoice_header.pdf_base64) && (
              <Link 
                to={`/invoices/${invoice.invoice_header.invoice_num}`}
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800 inline-flex"
              >
                <FileText className="h-5 w-5" />
              </Link>
            )}
          </TableCell>
          <TableCell>
            <Link
              to={`/invoices/${invoice.invoice_header.invoice_num}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                variant="ghost" 
                size="sm"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </TableCell>
        </TableRow>
      );

      // Expanded row for line items
      if (expandedRow === invoice.invoice_header.invoice_num) {
        rows.push(
          <TableRow key={`expanded-${invoice.invoice_header.invoice_num}`}>
            <TableCell colSpan={7} className="bg-gray-50 px-6 py-4">
              <div className="pb-2 text-sm font-medium text-gray-900">Invoice Line Items</div>
              <InvoiceLineItems 
                lines={invoice.invoice_lines} 
                currency={invoice.invoice_header.currency_code}
              />
            </TableCell>
          </TableRow>
        );
      }
    });

    return rows;
  };

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="uppercase">Invoice #</TableHead>
              <TableHead className="uppercase">Date</TableHead>
              <TableHead className="uppercase">Vendor</TableHead>
              <TableHead className="uppercase">Amount</TableHead>
              <TableHead className="uppercase">Type</TableHead>
              <TableHead className="uppercase">PDF</TableHead>
              <TableHead className="uppercase">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableRows()}
          </TableBody>
        </Table>
      </div>
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{invoices.length ? (currentPage - 1) * 10 + 1 : 0}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * 10, totalItems)}
                </span>{" "}
                of <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              {totalPages > 1 && renderPagination()}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
