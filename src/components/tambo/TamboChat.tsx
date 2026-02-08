import React from 'react';
import { useTamboThread, useTamboThreadInput, TamboThreadMessage } from '@tambo-ai/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Loader2, Sparkles, Bot, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Helper to extract text content from message
const getMessageText = (content: TamboThreadMessage['content']): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map(part => part.text)
      .join('');
  }
  return '';
};

const TamboChat: React.FC = () => {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;
    await submit();
  };

  const handleQuickPrompt = (prompt: string) => {
    setValue(prompt);
  };

  const quickPrompts = [
    "Show me a pie chart of current shipment statuses",
    "What's the breakdown of our vehicle fleet?",
    "Show delivery trends for this week",
    "Display key metrics as stat cards"
  ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Tambo AI Assistant
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Generative UI
          </Badge>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {thread?.messages && thread.messages.length > 0 ? (
            thread.messages.map((message: TamboThreadMessage, index: number) => (
              <div key={message.id || index} className="space-y-2">
                {/* User message */}
                {message.role === 'user' && (
                  <div className="flex items-start gap-2 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[80%]">
                      <p className="text-sm">{getMessageText(message.content)}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}
                
                {/* Assistant message */}
                {message.role === 'assistant' && (
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="space-y-2 max-w-[85%]">
                      {message.content && (
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <p className="text-sm">{getMessageText(message.content)}</p>
                        </div>
                      )}
                      {/* Render generative component if available */}
                      {message.renderedComponent && (
                        <div className="mt-2">
                          {message.renderedComponent}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Welcome to Tambo AI</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ask me anything about your fleet data. I can generate charts, stats, and insights.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {isPending && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask about your fleet data..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={isPending || !value.trim()} size="icon" className="h-[60px] w-[60px]">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default TamboChat;
