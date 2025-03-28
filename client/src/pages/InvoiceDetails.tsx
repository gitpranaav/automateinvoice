import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import InvoiceLineItems from "@/components/invoices/InvoiceLineItems";
import { ChevronLeft, FileText, ExternalLink, Edit } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoiceDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/invoices/:invoiceNum");
  const invoiceNum = params?.invoiceNum;

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: [`/api/invoices/${invoiceNum}`],
    enabled: !!invoiceNum,
  });

  useEffect(() => {
    if (error) {
      console.error("Error loading invoice:", error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => setLocation("/invoices")} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-64 w-full mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => setLocation("/invoices")} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Invoice Not Found</h3>
              <p className="mt-2 text-sm text-gray-500">
                The invoice you're looking for could not be found or may have been deleted.
              </p>
              <Button className="mt-4" onClick={() => setLocation("/invoices")}>
                Return to Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invoice_header, invoice_lines } = invoice;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <Button variant="ghost" onClick={() => setLocation("/invoices")} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Invoices
      </Button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Invoice #{invoice_header.invoice_num}
        </h2>
        <div className="flex space-x-3">
          {invoice_header.pdf_link && (
            <Button variant="outline" onClick={() => window.open(invoice_header.pdf_link, "_blank")}>
              <FileText className="mr-2 h-4 w-4" />
              View PDF
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
          <Button onClick={() => setLocation(`/invoices?edit=${invoice_header.invoice_num}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Vendor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{invoice_header.vendor_name}</p>
            <p className="text-sm text-gray-500">Vendor Site: {invoice_header.vendor_site_code}</p>
            <p className="text-sm text-gray-500">Organization Code: {invoice_header.organization_code}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{formatCurrency(invoice_header.invoice_amount)}</p>
            <p className="text-sm text-gray-500">Currency: {invoice_header.currency_code}</p>
            <p className="text-sm text-gray-500">
              Date: {formatDate(invoice_header.invoice_date)}
            </p>
            <p className="text-sm text-gray-500">
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  invoice_header.invoice_type === "Standard" 
                    ? "bg-green-100 text-green-800" 
                    : invoice_header.invoice_type === "Credit" 
                    ? "bg-red-100 text-red-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {invoice_header.invoice_type}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">Terms: {invoice_header.payment_term}</p>
            <p className="text-sm text-gray-500">Due Date: {
              (() => {
                const date = new Date(invoice_header.invoice_date);
                const daysToAdd = parseInt(invoice_header.payment_term.replace("NET", "")) || 30;
                date.setDate(date.getDate() + daysToAdd);
                return formatDate(date.toISOString());
              })()
            }</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceLineItems lines={invoice_lines} currency={invoice_header.currency_code} />
        </CardContent>
      </Card>
    </div>
  );
}
