import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceLine } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

interface InvoiceLineItemsProps {
  lines: InvoiceLine[];
  currency: string;
}

export default function InvoiceLineItems({ lines, currency }: InvoiceLineItemsProps) {
  // Calculate total amount
  const totalAmount = lines.reduce((sum, line) => sum + line.line_amount, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Line #</TableHead>
          <TableHead className="w-32">Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-24 text-right">Quantity</TableHead>
          <TableHead className="w-32 text-right">Unit Price</TableHead>
          <TableHead className="w-32 text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.line_number}>
            <TableCell>{line.line_number}</TableCell>
            <TableCell>{line.line_type}</TableCell>
            <TableCell>{line.description}</TableCell>
            <TableCell className="text-right">{line.quantity}</TableCell>
            <TableCell className="text-right">{formatCurrency(line.unit_price, currency)}</TableCell>
            <TableCell className="text-right">{formatCurrency(line.line_amount, currency)}</TableCell>
          </TableRow>
        ))}
        {/* Total Row */}
        <TableRow className="border-t-2">
          <TableCell colSpan={5} className="text-right font-medium">
            Total:
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(totalAmount, currency)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
