import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, BarChart3, TrendingUp, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChartData {
  type: 'pie' | 'bar' | 'line' | 'area';
  title: string;
  data: Array<{ name: string; value: number; color?: string }>;
  xKey?: string;
  yKey?: string;
}

const SUGGESTED_QUERIES = [
  { icon: BarChart3, text: "Show shipment status breakdown", query: "Show me a pie chart of current shipment statuses" },
  { icon: TrendingUp, text: "Fleet performance summary", query: "What's the current fleet performance and fuel efficiency?" },
  { icon: Sparkles, text: "Generate insights", query: "Analyze the data and give me key insights and recommendations" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-insights`;

const parseChartFromContent = (content: string): { text: string; charts: ChartData[] } => {
  const charts: ChartData[] = [];
  const chartRegex = /```chart\n([\s\S]*?)```/g;
  
  let match;
  let textContent = content;
  
  while ((match = chartRegex.exec(content)) !== null) {
    try {
      const chartData = JSON.parse(match[1]);
      charts.push(chartData);
      textContent = textContent.replace(match[0], '');
    } catch (e) {
      console.error('Failed to parse chart data:', e);
    }
  }
  
  return { text: textContent.trim(), charts };
};

const DynamicChart: React.FC<{ chart: ChartData }> = ({ chart }) => {
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  
  return (
    <Card className="mt-4 bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          {chart.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === 'pie' ? (
              <PieChart>
                <Pie
                  data={chart.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : chart.type === 'bar' ? (
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={chart.xKey || 'name'} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey={chart.yKey || 'value'} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chart.type === 'line' ? (
              <LineChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={chart.xKey || 'name'} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey={chart.yKey || 'value'} stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
              </LineChart>
            ) : (
              <AreaChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={chart.xKey || 'name'} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area type="monotone" dataKey={chart.yKey || 'value'} stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const { text, charts } = parseChartFromContent(message.content);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-accent text-accent-foreground' : 'bg-muted'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`rounded-2xl px-4 py-2.5 ${
          isUser 
            ? 'bg-accent text-accent-foreground rounded-tr-sm' 
            : 'bg-muted rounded-tl-sm'
        }`}>
          {isUser ? (
            <p className="text-sm">{text}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {charts.map((chart, index) => (
          <DynamicChart key={index} chart={chart} />
        ))}
      </div>
    </motion.div>
  );
};

const AIChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (resp.status === 429) {
      throw new Error("Rate limited - please try again in a moment");
    }
    if (resp.status === 402) {
      throw new Error("AI credits exhausted - please add funds");
    }
    if (!resp.ok || !resp.body) {
      throw new Error("Failed to get AI response");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (query?: string) => {
    const messageText = query || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat([...messages, userMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
          </div>
          AI Fleet Assistant
          <Badge variant="secondary" className="ml-auto">Beta</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Ask me anything about your fleet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                I can analyze shipments, fuel data, emissions, and generate visualizations
              </p>
              <div className="grid gap-2 w-full max-w-md">
                {SUGGESTED_QUERIES.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start gap-2 h-auto py-3 text-left"
                    onClick={() => handleSend(item.query)}
                  >
                    <item.icon className="w-4 h-4 shrink-0 text-accent" />
                    <span className="text-sm">{item.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))}
              </AnimatePresence>
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <p className="text-sm text-muted-foreground">Analyzing data...</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about shipments, fleet, emissions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} size="icon">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatAssistant;
