import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  return (
    <div>
      <Label className="block text-sm font-medium text-gray-700">Date Range</Label>
      <div className="mt-1 flex">
        <Input
          type="date"
          className="w-full"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
        />
        <span className="mx-2 flex items-center text-gray-500">to</span>
        <Input
          type="date"
          className="w-full"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>
    </div>
  );
}
