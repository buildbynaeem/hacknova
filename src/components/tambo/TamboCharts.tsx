import React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, Package, Truck, Fuel, Leaf } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// Pie Chart Component
export const TamboPieChartPropsSchema = z.object({
  title: z.string().describe('Chart title'),
  data: z.array(z.object({
    name: z.string(),
    value: z.number()
  })).describe('Array of data points with name and value'),
  description: z.string().optional().describe('Optional description below the chart')
});

export type TamboPieChartProps = z.infer<typeof TamboPieChartPropsSchema>;

export const TamboPieChart: React.FC<TamboPieChartProps> = ({ title, data, description }) => (
  <Card className="w-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
    </CardContent>
  </Card>
);

// Bar Chart Component
export const TamboBarChartPropsSchema = z.object({
  title: z.string().describe('Chart title'),
  data: z.array(z.object({
    name: z.string(),
    value: z.number()
  })).describe('Array of data points'),
  xAxisKey: z.string().default('name').describe('Key for X axis'),
  yAxisKey: z.string().default('value').describe('Key for Y axis'),
  color: z.string().optional().describe('Bar color')
});

export type TamboBarChartProps = z.infer<typeof TamboBarChartPropsSchema>;

export const TamboBarChart: React.FC<TamboBarChartProps> = ({ title, data, xAxisKey = 'name', yAxisKey = 'value', color = '#22c55e' }) => (
  <Card className="w-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey={xAxisKey} className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip />
          <Bar dataKey={yAxisKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// Line Chart Component
export const TamboLineChartPropsSchema = z.object({
  title: z.string().describe('Chart title'),
  data: z.array(z.record(z.union([z.string(), z.number()]))).describe('Array of data points'),
  lines: z.array(z.object({
    dataKey: z.string(),
    color: z.string(),
    name: z.string().optional()
  })).describe('Lines to display'),
  xAxisKey: z.string().default('name').describe('Key for X axis')
});

export type TamboLineChartProps = z.infer<typeof TamboLineChartPropsSchema>;

export const TamboLineChart: React.FC<TamboLineChartProps> = ({ title, data, lines, xAxisKey = 'name' }) => (
  <Card className="w-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey={xAxisKey} className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip />
          <Legend />
          {lines.map((line, idx) => (
            <Line 
              key={idx}
              type="monotone" 
              dataKey={line.dataKey} 
              stroke={line.color} 
              name={line.name || line.dataKey}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// Area Chart Component
export const TamboAreaChartPropsSchema = z.object({
  title: z.string().describe('Chart title'),
  data: z.array(z.record(z.union([z.string(), z.number()]))).describe('Array of data points'),
  areas: z.array(z.object({
    dataKey: z.string(),
    color: z.string(),
    name: z.string().optional()
  })).describe('Areas to display'),
  xAxisKey: z.string().default('name').describe('Key for X axis')
});

export type TamboAreaChartProps = z.infer<typeof TamboAreaChartPropsSchema>;

export const TamboAreaChart: React.FC<TamboAreaChartProps> = ({ title, data, areas, xAxisKey = 'name' }) => (
  <Card className="w-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey={xAxisKey} className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip />
          <Legend />
          {areas.map((area, idx) => (
            <Area 
              key={idx}
              type="monotone" 
              dataKey={area.dataKey} 
              stroke={area.color} 
              fill={area.color}
              fillOpacity={0.3}
              name={area.name || area.dataKey}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// Stat Card Component
export const TamboStatCardPropsSchema = z.object({
  title: z.string().describe('Stat title'),
  value: z.union([z.string(), z.number()]).describe('Main value'),
  change: z.number().optional().describe('Percentage change'),
  icon: z.enum(['package', 'truck', 'fuel', 'leaf']).optional().describe('Icon to display'),
  description: z.string().optional().describe('Additional description')
});

export type TamboStatCardProps = z.infer<typeof TamboStatCardPropsSchema>;

const iconMap = {
  package: Package,
  truck: Truck,
  fuel: Fuel,
  leaf: Leaf
};

export const TamboStatCard: React.FC<TamboStatCardProps> = ({ title, value, change, icon, description }) => {
  const Icon = icon ? iconMap[icon] : null;
  const TrendIcon = change !== undefined ? (change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus) : null;
  const trendColor = change !== undefined ? (change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground') : '';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && TrendIcon && (
              <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(change)}%</span>
              </div>
            )}
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          {Icon && <Icon className="w-8 h-8 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
};

// Summary Table Component
export const TamboSummaryTablePropsSchema = z.object({
  title: z.string().describe('Table title'),
  headers: z.array(z.string()).describe('Column headers'),
  rows: z.array(z.array(z.union([z.string(), z.number()]))).describe('Table rows data'),
  description: z.string().optional().describe('Optional description')
});

export type TamboSummaryTableProps = z.infer<typeof TamboSummaryTablePropsSchema>;

export const TamboSummaryTable: React.FC<TamboSummaryTableProps> = ({ title, headers, rows, description }) => (
  <Card className="w-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, idx) => (
              <TableHead key={idx}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIdx) => (
            <TableRow key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <TableCell key={cellIdx}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
