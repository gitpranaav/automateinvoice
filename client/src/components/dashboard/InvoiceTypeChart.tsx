import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface InvoiceType {
  type: string;
  count: number;
  amount: number;
}

interface InvoiceTypeChartProps {
  data: InvoiceType[];
  isLoading: boolean;
}

export default function InvoiceTypeChart({ data, isLoading }: InvoiceTypeChartProps) {
  // Colors for different invoice types
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  // Prepare chart data - convert to percentages
  const chartData = data.map((item, index) => ({
    name: item.type,
    value: item.count,
    color: COLORS[index % COLORS.length],
    amount: item.amount
  }));

  // Calculate total invoices for percentage
  const totalInvoices = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Types</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="h-64 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const item = props.payload;
                      return [
                        `Count: ${value} (${((value as number / totalInvoices) * 100).toFixed(1)}%)
                         Amount: ${formatCurrency(item.amount)}`,
                        item.name
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm text-center">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="mt-1">{item.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
