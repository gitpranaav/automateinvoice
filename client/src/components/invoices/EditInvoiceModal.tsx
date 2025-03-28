import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Invoice, InvoiceHeader } from "@shared/schema";

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSave: () => void;
}

export default function EditInvoiceModal({ isOpen, onClose, invoice, onSave }: EditInvoiceModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<InvoiceHeader>>({
    vendor_name: invoice.invoice_header.vendor_name,
    invoice_date: invoice.invoice_header.invoice_date,
    invoice_amount: invoice.invoice_header.invoice_amount,
    currency_code: invoice.invoice_header.currency_code,
    payment_term: invoice.invoice_header.payment_term,
    invoice_type: invoice.invoice_header.invoice_type,
    pdf_link: invoice.invoice_header.pdf_link,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("PUT", `/api/invoices/${invoice.invoice_header.invoice_num}`, formData);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoice.invoice_header.invoice_num}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      
      toast({
        title: "Success",
        description: `Invoice ${invoice.invoice_header.invoice_num} has been updated.`,
      });
      
      onSave();
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Invoice</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                name="invoice_number"
                value={invoice.invoice_header.invoice_num}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input
                id="invoice_date"
                name="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="vendor_name">Vendor Name</Label>
            <Input
              id="vendor_name"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice_amount">Invoice Amount</Label>
              <Input
                id="invoice_amount"
                name="invoice_amount"
                type="number"
                step="0.01"
                value={formData.invoice_amount}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="currency_code">Currency</Label>
              <select
                id="currency_code"
                name="currency_code"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={formData.currency_code}
                onChange={handleChange}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_term">Payment Term</Label>
              <select
                id="payment_term"
                name="payment_term"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={formData.payment_term}
                onChange={handleChange}
              >
                <option value="NET30">NET30</option>
                <option value="NET15">NET15</option>
                <option value="NET45">NET45</option>
                <option value="NET60">NET60</option>
                <option value="IMMEDIATE">IMMEDIATE</option>
              </select>
            </div>
            <div>
              <Label htmlFor="invoice_type">Invoice Type</Label>
              <select
                id="invoice_type"
                name="invoice_type"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={formData.invoice_type}
                onChange={handleChange}
              >
                <option value="Standard">Standard</option>
                <option value="Credit">Credit</option>
                <option value="Prepayment">Prepayment</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="pdf_link">PDF Link</Label>
            <Input
              id="pdf_link"
              name="pdf_link"
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              value={formData.pdf_link}
              onChange={handleChange}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
