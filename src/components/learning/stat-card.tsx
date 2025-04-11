import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode; // Optional icon
  description?: string; // Optional description/comparison
  variant?: 'default' | 'compact';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, variant = 'default' }) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-card rounded-md border text-sm">
        {icon}
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}; 