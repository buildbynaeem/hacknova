import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BarChart3, PieChart as PieIcon, TrendingUp, Zap, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import AIChatAssistant from './AIChatAssistant';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const GenerativeDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'chat' | 'auto'>('chat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<string | null>(null);

  // Fetch data for auto-generated dashboard
  const { data: shipments } = useQuery({
    queryKey: ['dashboard-shipments'],
    queryFn: async () => {
      const { data } = await supabase.from('shipments').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    }
  });

  const { data: vehicles } = useQuery({
    queryKey: ['dashboard-vehicles'],
    queryFn: async () => {
      const { data } = await supabase.from('fleet_vehicles').select('*');
      return data || [];
    }
  });

  const { data: fuelEntries } = useQuery({
    queryKey: ['dashboard-fuel'],
    queryFn: async () => {
      const { data } = await supabase.from('fuel_entries').select('*').order('entry_date', { ascending: false }).limit(50);
      return data || [];
    }
  });

  // Calculate chart data
  const statusData = React.useMemo(() => {
    if (!shipments) return [];
    const counts: Record<string, number> = {};
    shipments.forEach(s => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], index) => ({
      name: name.replace('_', ' '),
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [shipments]);

  const vehicleTypeData = React.useMemo(() => {
    if (!vehicles) return [];
    const counts: Record<string, number> = {};
    vehicles.forEach(v => {
      counts[v.vehicle_type] = (counts[v.vehicle_type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));
  }, [vehicles]);

  const fuelTrendData = React.useMemo(() => {
    if (!fuelEntries) return [];
    const dailyFuel: Record<string, number> = {};
    fuelEntries.forEach(e => {
      const date = new Date(e.entry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      dailyFuel[date] = (dailyFuel[date] || 0) + (e.fuel_liters || 0);
    });
    return Object.entries(dailyFuel).slice(-7).map(([date, liters]) => ({
      date,
      liters: Math.round(liters * 10) / 10
    }));
  }, [fuelEntries]);

  const generateAutoInsights = async () => {
    setIsGenerating(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Give me a brief 3-point summary of the most important insights from the current fleet and shipment data. Focus on actionable recommendations.' }],
        }),
      });

      if (!resp.ok) throw new Error('Failed to generate insights');

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) content += delta;
            } catch {}
          }
        }
      }

      setGeneratedInsights(content);
    } catch (error) {
      toast.error('Failed to generate insights');
    } finally {
      setIsGenerating(false);
    }
  };

  const summaryCards = [
    { 
      title: 'Total Shipments', 
      value: shipments?.length || 0, 
      icon: BarChart3, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      title: 'Active Vehicles', 
      value: vehicles?.filter(v => v.is_active).length || 0, 
      icon: Zap, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      title: 'Total Fuel (L)', 
      value: Math.round(fuelEntries?.reduce((sum, e) => sum + (e.fuel_liters || 0), 0) || 0).toLocaleString(), 
      icon: TrendingUp, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    { 
      title: 'CO₂ Emitted (kg)', 
      value: Math.round(fuelEntries?.reduce((sum, e) => sum + (e.co2_emitted_kg || 0), 0) || 0).toLocaleString(), 
      icon: PieIcon, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            AI-Powered Analytics
          </h2>
          <p className="text-muted-foreground">Ask questions or view auto-generated insights</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="w-3 h-3" />
          Powered by Lovable AI
        </Badge>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'chat' | 'auto')}>
        <TabsList>
          <TabsTrigger value="chat" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Chat Assistant
          </TabsTrigger>
          <TabsTrigger value="auto" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Auto Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <AIChatAssistant />
            
            {/* Quick Stats Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summaryCards.map((card, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                          <card.icon className={`w-4 h-4 ${card.color}`} />
                        </div>
                        <span className="text-sm text-muted-foreground">{card.title}</span>
                      </div>
                      <span className="font-semibold">{card.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Shipment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="auto" className="mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {summaryCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Shipment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vehicle Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vehicleTypeData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Fuel Consumption Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fuelTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="liters" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--accent))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Generated Insights */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>Click to generate insights based on your current data</CardDescription>
              </div>
              <Button onClick={generateAutoInsights} disabled={isGenerating} variant="outline" className="gap-2">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </CardHeader>
            <CardContent>
              {generatedInsights ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{generatedInsights}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Click "Generate" to get AI-powered insights about your fleet data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GenerativeDashboard;
