import React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Package, Truck, Fuel, Leaf, Clock, CheckCircle, AlertCircle, XCircle, ArrowRight, Activity, Target, Zap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// ==================== NEW COMPONENTS ====================

// KPI Dashboard Component - Shows multiple KPIs in a grid
export const TamboKPIDashboardPropsSchema = z.object({
  title: z.string().describe('Dashboard title'),
  kpis: z.array(z.object({
    label: z.string().describe('KPI label'),
    value: z.union([z.string(), z.number()]).describe('KPI value'),
    target: z.union([z.string(), z.number()]).optional().describe('Target value'),
    unit: z.string().optional().describe('Unit suffix like %, kg, km'),
    trend: z.enum(['up', 'down', 'neutral']).optional().describe('Trend direction'),
    trendValue: z.number().optional().describe('Trend percentage'),
    icon: z.enum(['activity', 'target', 'zap', 'users', 'truck', 'package', 'fuel', 'leaf']).optional()
  })).describe('Array of KPIs to display'),
  columns: z.number().default(2).describe('Number of columns in the grid')
});

export type TamboKPIDashboardProps = z.infer<typeof TamboKPIDashboardPropsSchema>;

const kpiIconMap = {
  activity: Activity,
  target: Target,
  zap: Zap,
  users: Users,
  truck: Truck,
  package: Package,
  fuel: Fuel,
  leaf: Leaf
};

export const TamboKPIDashboard: React.FC<TamboKPIDashboardProps> = ({ title, kpis, columns = 2 }) => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className={cn("grid gap-4", columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4")}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon ? kpiIconMap[kpi.icon] : null;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
          const trendColor = kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
          
          return (
            <div key={idx} className="p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{kpi.value}</span>
                {kpi.unit && <span className="text-sm text-muted-foreground">{kpi.unit}</span>}
              </div>
              {kpi.target && (
                <p className="text-xs text-muted-foreground mt-1">Target: {kpi.target}{kpi.unit}</p>
              )}
              {kpi.trend && kpi.trendValue !== undefined && (
                <div className={cn("flex items-center gap-1 text-xs mt-1", trendColor)}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{kpi.trendValue}% vs last period</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

// Timeline Component - Shows events/activities in chronological order
export const TamboTimelinePropsSchema = z.object({
  title: z.string().describe('Timeline title'),
  events: z.array(z.object({
    time: z.string().describe('Time or date of the event'),
    title: z.string().describe('Event title'),
    description: z.string().optional().describe('Event description'),
    status: z.enum(['completed', 'in-progress', 'pending', 'error']).optional().describe('Event status'),
    icon: z.enum(['check', 'clock', 'alert', 'x']).optional().describe('Icon for the event')
  })).describe('Array of timeline events'),
  description: z.string().optional().describe('Optional timeline description')
});

export type TamboTimelineProps = z.infer<typeof TamboTimelinePropsSchema>;

const timelineIconMap = {
  check: CheckCircle,
  clock: Clock,
  alert: AlertCircle,
  x: XCircle
};

const statusColors = {
  completed: 'text-green-500 bg-green-500/10',
  'in-progress': 'text-blue-500 bg-blue-500/10',
  pending: 'text-yellow-500 bg-yellow-500/10',
  error: 'text-red-500 bg-red-500/10'
};

export const TamboTimeline: React.FC<TamboTimelineProps> = ({ title, events, description }) => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>
      <div className="relative">
        {events.map((event, idx) => {
          const Icon = event.icon ? timelineIconMap[event.icon] : 
                       event.status === 'completed' ? CheckCircle :
                       event.status === 'in-progress' ? Clock :
                       event.status === 'error' ? XCircle : AlertCircle;
          const colorClass = event.status ? statusColors[event.status] : 'text-muted-foreground bg-muted';
          
          return (
            <div key={idx} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={cn("p-1.5 rounded-full", colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                {idx < events.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{event.title}</p>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                )}
                {event.status && (
                  <Badge variant="outline" className={cn("mt-1 text-xs", colorClass)}>
                    {event.status.replace('-', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

// Progress Tracker Component - Shows progress of multiple items
export const TamboProgressTrackerPropsSchema = z.object({
  title: z.string().describe('Tracker title'),
  items: z.array(z.object({
    label: z.string().describe('Item label'),
    current: z.number().describe('Current value'),
    target: z.number().describe('Target value'),
    unit: z.string().optional().describe('Unit for the values'),
    color: z.enum(['green', 'blue', 'yellow', 'red', 'purple']).optional().describe('Progress bar color')
  })).describe('Array of progress items'),
  description: z.string().optional().describe('Optional description')
});

export type TamboProgressTrackerProps = z.infer<typeof TamboProgressTrackerPropsSchema>;

const progressColors = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500'
};

export const TamboProgressTracker: React.FC<TamboProgressTrackerProps> = ({ title, items, description }) => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-4">
      {items.map((item, idx) => {
        const percentage = Math.min(100, Math.round((item.current / item.target) * 100));
        const colorClass = item.color ? progressColors[item.color] : 'bg-primary';
        
        return (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">
                {item.current}{item.unit} / {item.target}{item.unit}
              </span>
            </div>
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn("absolute left-0 top-0 h-full rounded-full transition-all", colorClass)}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{percentage}% complete</p>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

// Metric Comparison Component - Compare two sets of metrics
export const TamboMetricComparisonPropsSchema = z.object({
  title: z.string().describe('Comparison title'),
  leftLabel: z.string().describe('Label for left column'),
  rightLabel: z.string().describe('Label for right column'),
  metrics: z.array(z.object({
    name: z.string().describe('Metric name'),
    leftValue: z.union([z.string(), z.number()]).describe('Left value'),
    rightValue: z.union([z.string(), z.number()]).describe('Right value'),
    unit: z.string().optional().describe('Unit suffix'),
    highlight: z.enum(['left', 'right', 'none']).optional().describe('Which value to highlight as better')
  })).describe('Array of metrics to compare'),
  description: z.string().optional().describe('Optional description')
});

export type TamboMetricComparisonProps = z.infer<typeof TamboMetricComparisonPropsSchema>;

export const TamboMetricComparison: React.FC<TamboMetricComparisonProps> = ({ 
  title, leftLabel, rightLabel, metrics, description 
}) => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-2 text-center mb-4 pb-2 border-b">
        <div className="text-sm font-medium text-muted-foreground">{leftLabel}</div>
        <div className="text-sm font-medium">Metric</div>
        <div className="text-sm font-medium text-muted-foreground">{rightLabel}</div>
      </div>
      <div className="space-y-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2 items-center text-center">
            <div className={cn(
              "text-lg font-semibold",
              metric.highlight === 'left' ? 'text-green-500' : ''
            )}>
              {metric.leftValue}{metric.unit}
            </div>
            <div className="flex items-center justify-center gap-2">
              <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
              <span className="text-sm font-medium">{metric.name}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className={cn(
              "text-lg font-semibold",
              metric.highlight === 'right' ? 'text-green-500' : ''
            )}>
              {metric.rightValue}{metric.unit}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Alert Card Component - Shows important alerts or notifications
export const TamboAlertCardPropsSchema = z.object({
  title: z.string().describe('Alert title'),
  alerts: z.array(z.object({
    message: z.string().describe('Alert message'),
    type: z.enum(['info', 'warning', 'error', 'success']).describe('Alert type'),
    timestamp: z.string().optional().describe('When the alert occurred'),
    action: z.string().optional().describe('Suggested action')
  })).describe('Array of alerts'),
  description: z.string().optional().describe('Optional description')
});

export type TamboAlertCardProps = z.infer<typeof TamboAlertCardPropsSchema>;

const alertStyles = {
  info: { icon: AlertCircle, bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  warning: { icon: AlertCircle, bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' },
  error: { icon: XCircle, bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
  success: { icon: CheckCircle, bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' }
};

export const TamboAlertCard: React.FC<TamboAlertCardProps> = ({ title, alerts, description }) => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-primary" />
        {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-3">
      {alerts.map((alert, idx) => {
        const style = alertStyles[alert.type];
        const Icon = style.icon;
        
        return (
          <div key={idx} className={cn("p-3 rounded-lg border", style.bg, style.border)}>
            <div className="flex items-start gap-3">
              <Icon className={cn("w-5 h-5 mt-0.5", style.text)} />
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.message}</p>
                {alert.action && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Action:</span> {alert.action}
                  </p>
                )}
                {alert.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);
