import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, ExternalLink, FileText, AlertCircle } from "lucide-react";

interface PDFViewerProps {
  pdfData: {
    pdf_link?: string;
    pdf_base64?: string;
  };
  invoiceNum: string;
}

export default function PDFViewer({ pdfData, invoiceNum }: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isValidBase64, setIsValidBase64] = useState(false);

  useEffect(() => {
    if (pdfData.pdf_base64) {
      try {
        // Clean the base64 string by removing any whitespace and URL-safe characters
        const cleanBase64 = pdfData.pdf_base64
          .replace(/\s/g, '') // Remove whitespace
          .replace(/-/g, '+') // Replace URL-safe characters
          .replace(/_/g, '/');

        // Add padding if needed
        const padding = cleanBase64.length % 4;
        const paddedBase64 = padding ? 
          cleanBase64 + '='.repeat(4 - padding) : 
          cleanBase64;

        // Try to decode the base64 string
        const binaryString = atob(paddedBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Check if it starts with PDF magic number (%PDF)
        const header = Array.from(bytes.slice(0, 4))
          .map(byte => String.fromCharCode(byte))
          .join('');
        
        if (header !== '%PDF') {
          setError("Invalid PDF file format - The file may be corrupted or not a valid PDF");
          setIsValidBase64(false);
          return;
        }

        setIsValidBase64(true);
        setError(null);
      } catch (err) {
        console.error('PDF processing error:', err);
        setError("Error processing PDF data - The file may be corrupted or in an unsupported format");
        setIsValidBase64(false);
      }
    }
  }, [pdfData.pdf_base64]);

  const handleDownload = () => {
    if (pdfData.pdf_link) {
      window.open(pdfData.pdf_link, '_blank');
      return;
    }

    if (pdfData.pdf_base64 && isValidBase64) {
      try {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfData.pdf_base64}`;
        link.download = `Invoice_${invoiceNum}.pdf`;
        link.click();
      } catch (err) {
        setError("Error downloading PDF");
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfData.pdf_link) {
      window.open(pdfData.pdf_link, '_blank');
      return;
    }

    if (pdfData.pdf_base64 && isValidBase64) {
      const pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoiceNum} PDF</title>
            </head>
            <body style="margin:0;padding:0;overflow:hidden">
              <iframe 
                src="data:application/pdf;base64,${pdfData.pdf_base64}" 
                style="border:none;width:100%;height:100vh"
              ></iframe>
            </body>
          </html>
        `);
      }
    }
  };

  if (error) {
    return (
      <Card className="w-full overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading PDF</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.open(pdfData.pdf_link || '#', '_blank')}>
                Open Original PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full bg-gray-100 flex flex-col">
          <div className="p-4 bg-white border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Invoice PDF Document</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                disabled={!pdfData.pdf_link && (!pdfData.pdf_base64 || !isValidBase64)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenInNewTab}
                disabled={!pdfData.pdf_link && (!pdfData.pdf_base64 || !isValidBase64)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
          <div className="w-full h-[800px]">
            {pdfData.pdf_link ? (
              <iframe 
                src={pdfData.pdf_link} 
                title={`Invoice ${invoiceNum} PDF`}
                className="w-full h-full border-0"
                allow="fullscreen"
              />
            ) : pdfData.pdf_base64 && isValidBase64 ? (
              <iframe 
                src={`data:application/pdf;base64,${pdfData.pdf_base64}`}
                title={`Invoice ${invoiceNum} PDF`}
                className="w-full h-full border-0"
                allow="fullscreen"
              />
            ) : (
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
  );
} 