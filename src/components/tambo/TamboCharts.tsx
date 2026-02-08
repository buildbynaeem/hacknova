import React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart as PieIcon, TrendingUp, Activity } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['hsl(var(--accent))', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#22c55e'];

// Pie Chart Component
export interface TamboPieChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
}

export const tamboPieChartSchema = z.object({
  title: z.string().describe('The title of the pie chart'),
  data: z.array(z.object({
    name: z.string().describe('Label for this segment'),
    value: z.number().describe('Numeric value for this segment'),
  })).describe('Array of data points with name and value'),
});

export const TamboPieChart: React.FC<TamboPieChartProps> = ({ title, data }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Bar Chart Component
export interface TamboBarChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
  xLabel?: string;
  yLabel?: string;
}

export const tamboBarChartSchema = z.object({
  title: z.string().describe('The title of the bar chart'),
  data: z.array(z.object({
    name: z.string().describe('Label for the x-axis category'),
    value: z.number().describe('Numeric value for the y-axis'),
  })).describe('Array of data points'),
  xLabel: z.string().optional().describe('Optional label for x-axis'),
  yLabel: z.string().optional().describe('Optional label for y-axis'),
});

export const TamboBarChart: React.FC<TamboBarChartProps> = ({ title, data, xLabel, yLabel }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" label={xLabel ? { value: xLabel, position: 'bottom' } : undefined} />
              <YAxis className="text-xs" label={yLabel ? { value: yLabel, angle: -90, position: 'left' } : undefined} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Line Chart Component
export interface TamboLineChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
}

export const tamboLineChartSchema = z.object({
  title: z.string().describe('The title of the line chart'),
  data: z.array(z.object({
    name: z.string().describe('Label for the x-axis point'),
    value: z.number().describe('Numeric value for the y-axis'),
  })).describe('Array of data points for the line'),
});

export const TamboLineChart: React.FC<TamboLineChartProps> = ({ title, data }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--accent))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Area Chart Component
export interface TamboAreaChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
}

export const tamboAreaChartSchema = z.object({
  title: z.string().describe('The title of the area chart'),
  data: z.array(z.object({
    name: z.string().describe('Label for the x-axis point'),
    value: z.number().describe('Numeric value for the y-axis'),
  })).describe('Array of data points for the area'),
});

export const TamboAreaChart: React.FC<TamboAreaChartProps> = ({ title, data }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent) / 0.2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Stat Card Component
export interface TamboStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const tamboStatCardSchema = z.object({
  title: z.string().describe('The metric title'),
  value: z.union([z.string(), z.number()]).describe('The main value to display'),
  description: z.string().optional().describe('Optional description or context'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('Trend direction'),
});

export const TamboStatCard: React.FC<TamboStatCardProps> = ({ title, value, description, trend }) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${trend ? trendColors[trend] : ''}`}>
          {value}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Summary Table Component
export interface TamboSummaryTableProps {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export const tamboSummaryTableSchema = z.object({
  title: z.string().describe('Table title'),
  headers: z.array(z.string()).describe('Column headers'),
  rows: z.array(z.array(z.union([z.string(), z.number()]))).describe('Table rows'),
});

export const TamboSummaryTable: React.FC<TamboSummaryTableProps> = ({ title, headers, rows }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {headers.map((header, i) => (
                  <th key={i} className="text-left py-2 px-3 font-medium text-muted-foreground">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="py-2 px-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
