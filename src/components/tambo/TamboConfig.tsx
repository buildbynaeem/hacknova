import { TamboComponent } from '@tambo-ai/react';
import {
  TamboPieChart, TamboPieChartPropsSchema,
  TamboBarChart, TamboBarChartPropsSchema,
  TamboLineChart, TamboLineChartPropsSchema,
  TamboAreaChart, TamboAreaChartPropsSchema,
  TamboStatCard, TamboStatCardPropsSchema,
  TamboSummaryTable, TamboSummaryTablePropsSchema,
  TamboKPIDashboard, TamboKPIDashboardPropsSchema,
  TamboTimeline, TamboTimelinePropsSchema,
  TamboProgressTracker, TamboProgressTrackerPropsSchema,
  TamboMetricComparison, TamboMetricComparisonPropsSchema,
  TamboAlertCard, TamboAlertCardPropsSchema
} from './TamboCharts';

export const FLEET_SYSTEM_PROMPT = `You are an intelligent fleet management analytics assistant. You help managers understand their logistics operations through data visualization and insights.

You have access to real-time fleet data including:
- Shipment statuses (pending, confirmed, pickup ready, in transit, delivered, cancelled)
- Vehicle information (bikes, three-wheelers, mini trucks, trucks, large trucks)
- Fuel consumption and emissions data
- Driver performance metrics

When asked about data, use the appropriate chart components:
- Use TamboPieChart for distribution/breakdown data (e.g., shipment statuses, vehicle types)
- Use TamboBarChart for comparing values across categories
- Use TamboLineChart for trends over time
- Use TamboAreaChart for cumulative data or volume over time
- Use TamboStatCard for single key metrics and KPIs
- Use TamboSummaryTable for detailed data views
- Use TamboKPIDashboard for showing multiple KPIs together in a grid layout
- Use TamboTimeline for showing chronological events, delivery tracking, or activity logs
- Use TamboProgressTracker for showing progress toward goals (deliveries, fuel targets, etc.)
- Use TamboMetricComparison for comparing two periods, vehicles, or drivers side by side
- Use TamboAlertCard for showing important alerts, warnings, or notifications

Always provide clear, actionable insights alongside visualizations. Be concise but thorough.`;

export const tamboComponents: TamboComponent[] = [
  {
    name: 'TamboPieChart',
    description: 'Displays a pie chart for showing distribution or breakdown of data. Use for shipment status distribution, vehicle type breakdown, etc.',
    component: TamboPieChart,
    propsSchema: TamboPieChartPropsSchema
  },
  {
    name: 'TamboBarChart',
    description: 'Displays a bar chart for comparing values across categories. Use for comparing deliveries per route, fuel consumption by vehicle, etc.',
    component: TamboBarChart,
    propsSchema: TamboBarChartPropsSchema
  },
  {
    name: 'TamboLineChart',
    description: 'Displays a line chart for showing trends over time. Use for delivery trends, emission trends, etc.',
    component: TamboLineChart,
    propsSchema: TamboLineChartPropsSchema
  },
  {
    name: 'TamboAreaChart',
    description: 'Displays an area chart for cumulative data or volume over time. Use for total deliveries over time, cumulative emissions, etc.',
    component: TamboAreaChart,
    propsSchema: TamboAreaChartPropsSchema
  },
  {
    name: 'TamboStatCard',
    description: 'Displays a stat card with a key metric, optional trend indicator, and icon. Use for KPIs like total deliveries, active vehicles, fuel efficiency, etc.',
    component: TamboStatCard,
    propsSchema: TamboStatCardPropsSchema
  },
  {
    name: 'TamboSummaryTable',
    description: 'Displays a data table for detailed views. Use for listing top drivers, recent shipments, vehicle details, etc.',
    component: TamboSummaryTable,
    propsSchema: TamboSummaryTablePropsSchema
  },
  {
    name: 'TamboKPIDashboard',
    description: 'Displays a grid of multiple KPIs with values, targets, trends, and icons. Use for executive dashboards showing fleet performance at a glance.',
    component: TamboKPIDashboard,
    propsSchema: TamboKPIDashboardPropsSchema
  },
  {
    name: 'TamboTimeline',
    description: 'Displays a chronological timeline of events with status indicators. Use for delivery tracking, activity logs, shipment history, driver schedules.',
    component: TamboTimeline,
    propsSchema: TamboTimelinePropsSchema
  },
  {
    name: 'TamboProgressTracker',
    description: 'Displays progress bars for multiple items toward their targets. Use for daily delivery goals, fuel efficiency targets, monthly KPI progress.',
    component: TamboProgressTracker,
    propsSchema: TamboProgressTrackerPropsSchema
  },
  {
    name: 'TamboMetricComparison',
    description: 'Displays side-by-side comparison of metrics between two entities. Use for comparing this week vs last week, driver A vs driver B, vehicle performance comparison.',
    component: TamboMetricComparison,
    propsSchema: TamboMetricComparisonPropsSchema
  },
  {
    name: 'TamboAlertCard',
    description: 'Displays a list of alerts, warnings, or notifications with severity levels. Use for fleet alerts, maintenance warnings, delivery issues, system notifications.',
    component: TamboAlertCard,
    propsSchema: TamboAlertCardPropsSchema
  }
];
