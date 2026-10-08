import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceLineItems from "@/components/invoices/InvoiceLineItems";
import EditInvoiceModal from "@/components/invoices/EditInvoiceModal";
import { ChevronLeft, FileText, ExternalLink, Edit, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Invoice } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import PDFViewer from "@/components/invoices/PDFViewer";
import { apiRequest } from "@/lib/queryClient";

export default function InvoiceDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/invoices/:invoice_num");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading, error, refetch } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${params?.invoice_num}`],
    enabled: !!params?.invoice_num,
  });

  const handleInvoiceUpdated = () => {
    setIsEditModalOpen(false);
    refetch();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice?.invoice_header.invoice_num) return;
    
    try {
      await apiRequest("PUT", `/api/invoices/${invoice.invoice_header.invoice_num}`, {
        invoice_status: newStatus
      });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoice.invoice_header.invoice_num}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      
      toast({
        title: "Success",
        description: "Invoice status has been updated.",
      });
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-red-600">Failed to load invoice details</div>
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
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
          {invoice_header.pdf_base64 && !invoice_header.pdf_link && (
            <Button 
              variant="outline" 
              onClick={() => {
                // Create a link to download the base64 PDF data
                const link = document.createElement('a');
                link.href = `data:application/pdf;base64,${invoice_header.pdf_base64}`;
                link.download = `Invoice_${invoice_header.invoice_num}.pdf`;
                link.click();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
          <Button onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Invoice
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {(invoice_header.pdf_link || invoice_header.pdf_base64) && (
            <TabsTrigger value="pdf">PDF</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{formatCurrency(invoice_header.invoice_amount, invoice_header.currency_code)}</p>
                <p className="text-sm text-green-600">USD: {formatCurrency(invoice_header.to_usd || 0, "USD")}</p>
                <p className="text-sm text-gray-500">Currency: {invoice_header.currency_code}</p>
                <p className="text-sm text-gray-500">
                  Date: {formatDate(invoice_header.invoice_date)}
                </p>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={invoice_header.invoice_status || "pending"}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <p className="text-sm text-gray-500 mt-2">
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
        </TabsContent>
        
        {/* Display PDF tab - handles both pdf_link and pdf_base64 */}
        {(invoice_header.pdf_link || invoice_header.pdf_base64) && (
          <TabsContent value="pdf" className="mt-0">
            <PDFViewer 
              pdfData={{
                pdf_link: invoice_header.pdf_link,
                pdf_base64: invoice_header.pdf_base64
              }}
              invoiceNum={invoice_header.invoice_num}
            />
          </TabsContent>
        )}
      </Tabs>
      
      {/* Edit Invoice Modal */}
      {invoice && (
        <EditInvoiceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          invoice={invoice}
          onSave={handleInvoiceUpdated}
        />
      )}
    </div>
  );
}
