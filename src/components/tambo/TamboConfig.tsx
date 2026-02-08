import { TamboComponent } from '@tambo-ai/react';
import {
  TamboPieChart, TamboPieChartPropsSchema,
  TamboBarChart, TamboBarChartPropsSchema,
  TamboLineChart, TamboLineChartPropsSchema,
  TamboAreaChart, TamboAreaChartPropsSchema,
  TamboStatCard, TamboStatCardPropsSchema,
  TamboSummaryTable, TamboSummaryTablePropsSchema
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
- Use TamboStatCard for key metrics and KPIs
- Use TamboSummaryTable for detailed data views

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
  }
];
