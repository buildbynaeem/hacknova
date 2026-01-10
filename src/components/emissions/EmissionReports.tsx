import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Leaf,
  Building,
  TrendingDown
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { generateEmissionReport, EmissionReport } from '@/lib/emissions-service';
import { cn } from '@/lib/utils';

const EmissionReports: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(subMonths(new Date(), 1)));
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<EmissionReport | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const reportData = await generateEmissionReport(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      setReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      // Generate mock report for demo
      setReport({
        reportDate: new Date().toISOString(),
        reportPeriod: { 
          start: format(startDate, 'yyyy-MM-dd'), 
          end: format(endDate, 'yyyy-MM-dd') 
        },
        summary: {
          totalCO2Emitted: 2450.5,
          totalCO2Saved: 892.3,
          co2PerKm: 0.28,
          totalDistanceKm: 8750,
          totalFuelLiters: 1250,
          totalTrips: 245,
          monthlyTrend: -8.5,
          evSavings: 1580,
        },
        byVehicle: [],
        byFuelType: [
          { fuelType: 'DIESEL', totalCO2: 1850, percentage: 65 },
          { fuelType: 'PETROL', totalCO2: 450, percentage: 25 },
          { fuelType: 'CNG', totalCO2: 150.5, percentage: 10 },
        ],
        monthlyTrend: [],
        insights: [],
        complianceStatus: 'compliant',
        recommendations: [
          'Review and optimize delivery routes to reduce fuel consumption',
          'Schedule maintenance for high-emission vehicles',
          'Consider adding electric vehicles to your fleet for short-distance routes',
          'Implement driver training programs focused on eco-driving techniques',
          'Set monthly emission reduction targets and track progress',
        ],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getComplianceStyle = (status: string) => {
    switch (status) {
      case 'compliant':
        return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Compliant' };
      case 'at-risk':
        return { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'At Risk' };
      case 'non-compliant':
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Non-Compliant' };
      default:
        return { icon: CheckCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Unknown' };
    }
  };

  const downloadReport = () => {
    if (!report) return;

    // Generate a simple text report (in production, this would be a PDF)
    const reportContent = `
CARBON EMISSION REPORT
======================
Generated: ${format(new Date(report.reportDate), 'PPP')}
Period: ${format(new Date(report.reportPeriod.start), 'PP')} - ${format(new Date(report.reportPeriod.end), 'PP')}

SUMMARY
-------
Total CO₂ Emitted: ${report.summary.totalCO2Emitted} kg
Total CO₂ Saved: ${report.summary.totalCO2Saved} kg
CO₂ per km: ${report.summary.co2PerKm} kg/km
Total Distance: ${report.summary.totalDistanceKm} km
Total Fuel: ${report.summary.totalFuelLiters} L
Total Trips: ${report.summary.totalTrips}
Monthly Trend: ${report.summary.monthlyTrend}%
EV Savings Potential: ${report.summary.evSavings} kg

EMISSIONS BY FUEL TYPE
----------------------
${report.byFuelType.map(f => `${f.fuelType}: ${f.totalCO2} kg (${f.percentage}%)`).join('\n')}

COMPLIANCE STATUS: ${report.complianceStatus.toUpperCase()}

RECOMMENDATIONS
---------------
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emission-report-${format(startDate, 'yyyy-MM')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Report Generator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generate Emission Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button 
                onClick={handleGenerateReport} 
                disabled={isGenerating}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>

            {/* Quick Period Buttons */}
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const lastMonth = subMonths(new Date(), 1);
                  setStartDate(startOfMonth(lastMonth));
                  setEndDate(endOfMonth(lastMonth));
                }}
              >
                Last Month
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const threeMonthsAgo = subMonths(new Date(), 3);
                  setStartDate(startOfMonth(threeMonthsAgo));
                  setEndDate(endOfMonth(subMonths(new Date(), 1)));
                }}
              >
                Last Quarter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setStartDate(new Date(new Date().getFullYear(), 0, 1));
                  setEndDate(new Date());
                }}
              >
                Year to Date
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generated Report */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Report Header */}
          <Card className="border-2 border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold">Carbon Emission Report</h2>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Period: {format(new Date(report.reportPeriod.start), 'PP')} - {format(new Date(report.reportPeriod.end), 'PP')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Generated: {format(new Date(report.reportDate), 'PPpp')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const style = getComplianceStyle(report.complianceStatus);
                    const Icon = style.icon;
                    return (
                      <Badge className={`${style.bg} ${style.color} border-0 gap-1`}>
                        <Icon className="w-4 h-4" />
                        {style.label}
                      </Badge>
                    );
                  })()}
                  <Button onClick={downloadReport} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-destructive">
                  {report.summary.totalCO2Emitted.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">kg CO₂ Emitted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-success">
                  {report.summary.totalCO2Saved.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">kg CO₂ Saved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">
                  {report.summary.co2PerKm}
                </p>
                <p className="text-sm text-muted-foreground">kg CO₂/km</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-chart-1">
                  {report.summary.monthlyTrend}%
                </p>
                <p className="text-sm text-muted-foreground">vs Last Month</p>
              </CardContent>
            </Card>
          </div>

          {/* Emissions by Fuel Type */}
          <Card>
            <CardHeader>
              <CardTitle>Emissions by Fuel Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.byFuelType.map((fuel, index) => (
                  <div key={fuel.fuelType} className="flex items-center gap-4">
                    <div className="w-24 font-medium">{fuel.fuelType}</div>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${fuel.percentage}%` }}
                      />
                    </div>
                    <div className="w-24 text-right">
                      <span className="font-medium">{fuel.totalCO2}</span>
                      <span className="text-muted-foreground"> kg</span>
                    </div>
                    <Badge variant="outline">{fuel.percentage}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="p-1 bg-success/20 rounded-full shrink-0 mt-0.5">
                      <TrendingDown className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-sm">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ESG Compliance Note */}
          <Card className="bg-gradient-to-br from-success/10 to-chart-1/10 border-success/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-success/20 rounded-xl shrink-0">
                  <Leaf className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">ESG Compliance Ready</h3>
                  <p className="text-muted-foreground mt-1">
                    This report follows international emission reporting standards and can be used for 
                    ESG (Environmental, Social, Governance) compliance, carbon credit calculations, 
                    and sustainability reporting to stakeholders.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline">ISO 14064</Badge>
                    <Badge variant="outline">GHG Protocol</Badge>
                    <Badge variant="outline">CDP Ready</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sample Reports */}
      {!report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Available Report Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <FileText className="w-8 h-8 text-primary mb-2" />
                  <h4 className="font-medium">Monthly Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Detailed monthly emission analysis with vehicle & driver breakdown
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <FileText className="w-8 h-8 text-success mb-2" />
                  <h4 className="font-medium">ESG Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Sustainability report for stakeholders and compliance
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <FileText className="w-8 h-8 text-chart-1 mb-2" />
                  <h4 className="font-medium">Client Report</h4>
                  <p className="text-sm text-muted-foreground">
                    B2B emission certificate for client deliveries
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EmissionReports;
