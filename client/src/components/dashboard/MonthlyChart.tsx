import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyData {
  month: string;
  amount: number;
}

interface MonthlyChartProps {
  data: MonthlyData[];
  isLoading: boolean;
}

export default function MonthlyChart({ data, isLoading }: MonthlyChartProps) {
  // Function to format month label (from YYYY-MM to Month name)
  const formatMonth = (month: string) => {
    if (!month) return "";
    try {
      const date = new Date(`${month}-01`);
      return date.toLocaleString('default', { month: 'short' });
    } catch (e) {
      return month;
    }
  };

  // Prepare chart data
  const chartData = data.map(item => ({
    ...item,
    month: formatMonth(item.month)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Invoice Amounts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => 
                    value === 0 ? '0' : 
                    value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : 
                    `$${value}`
                  } 
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), "Amount"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                  name="Amount"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
