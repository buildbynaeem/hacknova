import { TamboComponent } from '@tambo-ai/react';
import {
  TamboPieChart,
  tamboPieChartSchema,
  TamboBarChart,
  tamboBarChartSchema,
  TamboLineChart,
  tamboLineChartSchema,
  TamboAreaChart,
  tamboAreaChartSchema,
  TamboStatCard,
  tamboStatCardSchema,
  TamboSummaryTable,
  tamboSummaryTableSchema,
} from './TamboCharts';

// Register all Tambo components for generative UI
export const tamboComponents: TamboComponent[] = [
  {
    name: 'PieChart',
    description: 'Displays data as a pie/donut chart. Use for showing proportions, distributions, or breakdowns. Great for shipment status distribution, vehicle type breakdown, or any categorical data.',
    component: TamboPieChart,
    propsSchema: tamboPieChartSchema,
  },
  {
    name: 'BarChart',
    description: 'Displays data as a bar chart. Use for comparing values across categories. Great for comparing fleet performance, fuel usage by vehicle, or monthly statistics.',
    component: TamboBarChart,
    propsSchema: tamboBarChartSchema,
  },
  {
    name: 'LineChart',
    description: 'Displays data as a line chart. Use for showing trends over time. Great for tracking deliveries over time, fuel consumption trends, or emissions trends.',
    component: TamboLineChart,
    propsSchema: tamboLineChartSchema,
  },
  {
    name: 'AreaChart',
    description: 'Displays data as an area chart. Use for showing cumulative data or trends with volume. Great for visualizing total deliveries, cumulative emissions, or capacity utilization.',
    component: TamboAreaChart,
    propsSchema: tamboAreaChartSchema,
  },
  {
    name: 'StatCard',
    description: 'Displays a single key metric or KPI. Use for highlighting important numbers like total shipments, active vehicles, total CO2 emissions, or fuel consumption.',
    component: TamboStatCard,
    propsSchema: tamboStatCardSchema,
  },
  {
    name: 'SummaryTable',
    description: 'Displays tabular data in a clean format. Use for detailed breakdowns, lists, or comparisons. Great for driver leaderboards, vehicle summaries, or route details.',
    component: TamboSummaryTable,
    propsSchema: tamboSummaryTableSchema,
  },
];

// System prompt for the fleet management AI
export const FLEET_SYSTEM_PROMPT = `You are an AI assistant for a fleet and logistics management platform. You help managers analyze shipments, vehicles, fuel consumption, and emissions data.

You have access to the following fleet data context:
- Shipment statuses: PENDING, CONFIRMED, PICKUP_READY, IN_TRANSIT, DELIVERED, CANCELLED
- Vehicle types: BIKE, THREE_WHEELER, MINI_TRUCK, TRUCK, LARGE_TRUCK
- Fuel types: DIESEL, PETROL, CNG, ELECTRIC

When users ask questions:
1. Analyze the provided data context
2. Generate appropriate visualizations using the available components
3. Provide clear, actionable insights

Available visualization components:
- PieChart: For distributions and proportions (e.g., "Show shipment status breakdown")
- BarChart: For comparisons (e.g., "Compare fuel usage by vehicle type")
- LineChart: For trends (e.g., "Show delivery trends this week")
- AreaChart: For cumulative data (e.g., "Show emissions over time")
- StatCard: For key metrics (e.g., "What's our total fuel consumption?")
- SummaryTable: For detailed data (e.g., "List top performing drivers")

Always be helpful, concise, and data-driven in your responses.`;
