import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

export default function InvoiceDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/invoices/:invoiceNum");
  const invoiceNum = params?.invoiceNum;
  const [activeTab, setActiveTab] = useState<string>("details");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: invoice, isLoading, error, refetch } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceNum}`],
    enabled: !!invoiceNum,
  });

  useEffect(() => {
    if (error) {
      console.error("Error loading invoice:", error);
    }
  }, [error]);
  
  const handleEditInvoice = () => {
    setIsEditModalOpen(true);
  };

  const handleInvoiceUpdated = () => {
    refetch();
    setIsEditModalOpen(false);
    toast({
      title: "Success",
      description: "Invoice has been updated successfully.",
    });
  };

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

  // We've already handled the !invoice case above

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
          <Button onClick={handleEditInvoice}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Invoice
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Invoice Details</TabsTrigger>
          {(invoice_header.pdf_link || invoice_header.pdf_base64) && (
            <TabsTrigger value="pdf">PDF Document</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="details" className="mt-0">
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
                <p className="text-lg font-medium">{formatCurrency(invoice_header.invoice_amount, invoice_header.currency_code)}</p>
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
        </TabsContent>
        
        {/* Display PDF tab - handles both pdf_link and pdf_base64 */}
        {(invoice_header.pdf_link || invoice_header.pdf_base64) && (
          <TabsContent value="pdf" className="mt-0">
            <Card className="w-full overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full bg-gray-100 flex flex-col">
                  <div className="p-4 bg-white border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium">Invoice PDF Document</h3>
                    <div className="flex gap-2">
                      {/* Download Button */}
                      {invoice_header.pdf_base64 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const linkSource = `data:application/pdf;base64,${invoice_header.pdf_base64}`;
                            const downloadLink = document.createElement("a");
                            const fileName = `Invoice_${invoice_header.invoice_num}.pdf`;
                            
                            downloadLink.href = linkSource;
                            downloadLink.download = fileName;
                            downloadLink.click();
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      )}
                      
                      {/* Open in new tab buttons */}
                      {invoice_header.pdf_link && (
                        <Button variant="outline" size="sm" onClick={() => window.open(invoice_header.pdf_link, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in New Tab
                        </Button>
                      )}
                      {invoice_header.pdf_base64 && !invoice_header.pdf_link && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const pdfWindow = window.open('', '_blank');
                            if (pdfWindow) {
                              pdfWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Invoice ${invoice_header.invoice_num} PDF</title>
                                  </head>
                                  <body style="margin:0;padding:0;overflow:hidden">
                                    <iframe 
                                      src="data:application/pdf;base64,${invoice_header.pdf_base64}" 
                                      style="border:none;width:100%;height:100vh"
                                    ></iframe>
                                  </body>
                                </html>
                              `);
                            }
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in New Tab
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-[800px]">
                    {invoice_header.pdf_link ? (
                      // Display PDF from link
                      <iframe 
                        src={invoice_header.pdf_link} 
                        title={`Invoice ${invoice_header.invoice_num} PDF`}
                        className="w-full h-full border-0"
                        allow="fullscreen"
                      />
                    ) : invoice_header.pdf_base64 ? (
                      // Display PDF from base64 data
                      <iframe 
                        src={`data:application/pdf;base64,${invoice_header.pdf_base64}`}
                        title={`Invoice ${invoice_header.invoice_num} PDF`}
                        className="w-full h-full border-0"
                        allow="fullscreen"
                      />
                    ) : (
                      // Fallback if no PDF data is available
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900">PDF Not Available</h3>
                          <p className="text-sm text-gray-500">
                            The PDF document for this invoice is not available.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
