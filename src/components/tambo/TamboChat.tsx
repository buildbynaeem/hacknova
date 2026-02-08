import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTambo, useTamboThreadInput, type TamboThreadMessage } from '@tambo-ai/react';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_QUERIES = [
  { icon: BarChart3, text: "Show shipment status breakdown", query: "Show me a pie chart of current shipment statuses" },
  { icon: TrendingUp, text: "Fleet performance metrics", query: "Show me stat cards for total shipments, active vehicles, and fuel consumption" },
  { icon: Sparkles, text: "Emissions analysis", query: "Create a bar chart showing CO2 emissions by vehicle type" },
];

// Helper to extract text content from message
const getMessageText = (message: TamboThreadMessage): string => {
  if (typeof message.content === 'string') {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    return message.content
      .filter((part): part is { type: 'text'; text: string } => 
        typeof part === 'object' && part !== null && 'type' in part && part.type === 'text'
      )
      .map(part => part.text)
      .join('');
  }
  return '';
};

const TamboChat: React.FC = () => {
  const { thread, isIdle, startNewThread } = useTambo();
  const { value, setValue, submit } = useTamboThreadInput();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isGenerating = !isIdle;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages]);

  const handleSend = async (query?: string) => {
    const messageText = query || value.trim();
    if (!messageText || isGenerating) return;

    if (query) {
      setValue(query);
    }
    
    // Small delay to ensure value is set
    setTimeout(() => {
      submit();
      setValue('');
    }, 50);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
      setValue('');
    }
  };

  const messages = thread?.messages || [];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/70 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
          </div>
          <span>Fleet AI Assistant</span>
          <Badge variant="secondary" className="ml-2">Tambo</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={() => startNewThread()}
            title="New conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
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
                I can analyze shipments, fuel data, emissions, and generate visualizations automatically
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
                {messages.map((message, index) => {
                  const isUser = message.role === 'user';
                  const textContent = getMessageText(message);
                  
                  return (
                    <motion.div
                      key={index}
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
                        {/* Text content */}
                        {textContent && (
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            isUser 
                              ? 'bg-accent text-accent-foreground rounded-tr-sm' 
                              : 'bg-muted rounded-tl-sm'
                          }`}>
                            {isUser ? (
                              <p className="text-sm">{textContent}</p>
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-sm">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 text-sm">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                  }}
                                >
                                  {textContent}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Rendered Tambo component */}
                        {message.renderedComponent && (
                          <div className="mt-3">
                            {message.renderedComponent}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <p className="text-sm text-muted-foreground">Generating visualization...</p>
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
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isGenerating}
              className="flex-1"
            />
            <Button 
              onClick={() => { submit(); setValue(''); }} 
              disabled={!value.trim() || isGenerating} 
              size="icon"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TamboChat;
