import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentInvoices() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/invoices", { page: 1, limit: 5 }],
  });

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

  return (
    <Card className="mt-6">
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle>Recent Invoices</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="uppercase">Invoice #</TableHead>
              <TableHead className="uppercase">Date</TableHead>
              <TableHead className="uppercase">Vendor</TableHead>
              <TableHead className="uppercase">Amount</TableHead>
              <TableHead className="uppercase">Type</TableHead>
              <TableHead className="uppercase">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : (
              data?.invoices?.map((invoice: any) => (
                <TableRow key={invoice.invoice_header.invoice_num}>
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
                    <Link href={`/invoices/${invoice.invoice_header.invoice_num}`}>
                      <Button variant="link" className="text-blue-600 hover:text-blue-800">View</Button>
                    </Link>
                    <Link href={`/invoices?edit=${invoice.invoice_header.invoice_num}`}>
                      <Button variant="link" className="text-gray-600 hover:text-gray-800">Edit</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="bg-gray-50 px-5 py-3 flex justify-between items-center">
        <span className="text-sm text-gray-700">
          Showing {data?.invoices?.length || 0} of {data?.pagination?.total || 0} results
        </span>
        <Link href="/invoices">
          <Button variant="link" className="text-blue-600 hover:text-blue-800">
            View all invoices
          </Button>
        </Link>
      </div>
    </Card>
  );
}
