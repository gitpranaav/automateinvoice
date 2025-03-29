import { Card } from "@/components/ui/card";
import { Link } from "wouter";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBgColor: string;
  linkText?: string;
  linkUrl?: string;
  footer?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  linkText,
  linkUrl,
  footer,
}: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {(linkText || footer) && (
        <div className="bg-gray-50 px-5 py-3">
          {linkText && linkUrl ? (
            <div className="text-sm">
              <Link href={linkUrl} className="font-medium text-blue-600 hover:text-blue-700">
                {linkText}
                <span className="sr-only"> {title.toLowerCase()}</span>
              </Link>
            </div>
          ) : (
            footer
          )}
        </div>
      )}
    </div>
  );
}
