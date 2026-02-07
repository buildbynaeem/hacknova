import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { 
  Home, Truck, Package, Users, BarChart3, Leaf, Fuel, Brain, FileText, 
  LogIn, UserPlus, Sparkles, Search, Map, Settings, ArrowRight, Loader2,
  Calculator, TrendingUp, Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  group: 'navigation' | 'actions' | 'ai';
}

const CommandBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Toggle command bar with ⌘K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('');
      setAiSuggestion(null);
    }
  }, [open]);

  const runAction = useCallback((action: () => void) => {
    setOpen(false);
    action();
  }, []);

  const navigationActions: CommandAction[] = [
    {
      id: 'home',
      label: 'Go to Home',
      description: 'Landing page',
      icon: Home,
      action: () => navigate('/'),
      keywords: ['home', 'landing', 'main'],
      group: 'navigation'
    },
    {
      id: 'login',
      label: 'Go to Login',
      description: 'Sign in to your account',
      icon: LogIn,
      action: () => navigate('/login'),
      keywords: ['login', 'signin', 'auth'],
      group: 'navigation'
    },
    {
      id: 'driver-join',
      label: 'Driver Registration',
      description: 'Join as a driver',
      icon: UserPlus,
      action: () => navigate('/driver/join'),
      keywords: ['driver', 'join', 'register', 'signup'],
      group: 'navigation'
    },
    {
      id: 'manager-dashboard',
      label: 'Manager Dashboard',
      description: 'Fleet analytics & management',
      icon: BarChart3,
      action: () => navigate('/dashboard/manager'),
      keywords: ['manager', 'dashboard', 'analytics', 'fleet'],
      group: 'navigation'
    },
    {
      id: 'sender-dashboard',
      label: 'Sender Dashboard',
      description: 'Book and track shipments',
      icon: Package,
      action: () => navigate('/dashboard/sender'),
      keywords: ['sender', 'shipment', 'booking', 'track'],
      group: 'navigation'
    },
    {
      id: 'driver-active',
      label: 'Driver Dashboard',
      description: 'Active deliveries',
      icon: Truck,
      action: () => navigate('/driver/active'),
      keywords: ['driver', 'active', 'delivery'],
      group: 'navigation'
    },
  ];

  const managerTabActions: CommandAction[] = [
    {
      id: 'tab-overview',
      label: 'Overview Tab',
      description: 'Fleet overview & map',
      icon: Map,
      action: () => {
        navigate('/dashboard/manager');
        toast.info('Switched to Overview tab');
      },
      keywords: ['overview', 'map', 'fleet'],
      group: 'actions'
    },
    {
      id: 'tab-ai',
      label: 'AI Analytics Tab',
      description: 'AI-powered insights',
      icon: Sparkles,
      action: () => {
        navigate('/dashboard/manager');
        toast.info('Switched to AI Analytics tab');
      },
      keywords: ['ai', 'analytics', 'insights', 'chat'],
      group: 'actions'
    },
    {
      id: 'tab-deliveries',
      label: 'Deliveries Tab',
      description: 'Active shipments',
      icon: Package,
      action: () => {
        navigate('/dashboard/manager');
        toast.info('Switched to Deliveries tab');
      },
      keywords: ['deliveries', 'shipments', 'active'],
      group: 'actions'
    },
    {
      id: 'tab-invoices',
      label: 'Invoices Tab',
      description: 'Billing & invoices',
      icon: FileText,
      action: () => {
        navigate('/dashboard/manager');
        toast.info('Switched to Invoices tab');
      },
      keywords: ['invoices', 'billing', 'payment'],
      group: 'actions'
    },
    {
      id: 'tab-fuel',
      label: 'Fuel Metrics Tab',
      description: 'Fuel consumption data',
      icon: Fuel,
      action: () => {
        navigate('/dashboard/manager');
        toast.info('Switched to Fuel Metrics tab');
      },
      keywords: ['fuel', 'consumption', 'metrics'],
      group: 'actions'
    },
    {
      id: 'tab-emissions',
      label: 'Emissions Tab',
      description: 'Carbon footprint tracking',
      icon: Leaf,
      action: () => {
        navigate('/dashboard/manager');
        toast.info('Switched to Emissions tab');
      },
      keywords: ['emissions', 'carbon', 'co2', 'environment'],
      group: 'actions'
    },
    {
      id: 'tab-forecast',
      label: 'Demand Forecast Tab',
      description: 'AI predictions',
      icon: Brain,
      action: () => {
        navigate('/dashboard/manager');
        toast.info('Switched to Forecast tab');
      },
      keywords: ['forecast', 'prediction', 'demand', 'ai'],
      group: 'actions'
    },
  ];

  const aiActions: CommandAction[] = [
    {
      id: 'ai-analyze',
      label: 'Analyze Fleet Performance',
      description: 'Get AI insights on fleet data',
      icon: TrendingUp,
      action: () => {
        navigate('/dashboard/manager');
        toast.success('Opening AI Analytics for fleet analysis');
      },
      keywords: ['analyze', 'performance', 'insights', 'ai'],
      group: 'ai'
    },
    {
      id: 'ai-forecast',
      label: 'Generate Demand Forecast',
      description: 'AI-powered demand prediction',
      icon: Brain,
      action: () => {
        navigate('/dashboard/manager');
        toast.success('Opening Demand Forecast');
      },
      keywords: ['forecast', 'demand', 'prediction', 'future'],
      group: 'ai'
    },
    {
      id: 'ai-emissions',
      label: 'Emissions Report',
      description: 'Analyze carbon footprint',
      icon: Leaf,
      action: () => {
        navigate('/dashboard/manager');
        toast.success('Opening Emissions Dashboard');
      },
      keywords: ['emissions', 'carbon', 'report', 'sustainability'],
      group: 'ai'
    },
  ];

  const allActions = [...navigationActions, ...managerTabActions, ...aiActions];

  // AI-powered natural language processing
  const processNaturalLanguage = async (query: string) => {
    if (!query.trim() || query.length < 3) return;

    // Simple keyword matching for natural language
    const lowerQuery = query.toLowerCase();
    
    // Check for common patterns
    if (lowerQuery.includes('show') || lowerQuery.includes('go to') || lowerQuery.includes('open')) {
      if (lowerQuery.includes('shipment') || lowerQuery.includes('deliver')) {
        setAiSuggestion('I can take you to the Deliveries tab to view shipments');
        return;
      }
      if (lowerQuery.includes('invoice') || lowerQuery.includes('bill')) {
        setAiSuggestion('Opening Invoices tab for billing information');
        return;
      }
      if (lowerQuery.includes('emission') || lowerQuery.includes('carbon') || lowerQuery.includes('co2')) {
        setAiSuggestion('I can show you the Emissions dashboard for carbon tracking');
        return;
      }
      if (lowerQuery.includes('fuel')) {
        setAiSuggestion('Opening Fuel Metrics to view consumption data');
        return;
      }
    }

    if (lowerQuery.includes('analyz') || lowerQuery.includes('insight')) {
      setAiSuggestion('Try the AI Analytics tab for intelligent insights');
      return;
    }

    if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
      setAiSuggestion('The Demand Forecast tab uses AI to predict future trends');
      return;
    }

    setAiSuggestion(null);
  };

  // Debounced search for AI processing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 3) {
        processNaturalLanguage(search);
      } else {
        setAiSuggestion(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredActions = allActions.filter(action => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      action.label.toLowerCase().includes(searchLower) ||
      action.description?.toLowerCase().includes(searchLower) ||
      action.keywords?.some(kw => kw.includes(searchLower))
    );
  });

  const groupedActions = {
    navigation: filteredActions.filter(a => a.group === 'navigation'),
    actions: filteredActions.filter(a => a.group === 'actions'),
    ai: filteredActions.filter(a => a.group === 'ai'),
  };

  return (
    <>
      {/* Floating trigger button for mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 lg:hidden w-12 h-12 bg-accent text-accent-foreground rounded-full shadow-lg flex items-center justify-center"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Desktop keyboard hint */}
      <div className="fixed bottom-4 right-4 z-40 hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-card border rounded-lg px-3 py-2 shadow-sm">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd>
        <span>Command bar</span>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Type a command or search..." 
              value={search}
              onValueChange={setSearch}
              className="flex-1"
            />
            <Badge variant="secondary" className="ml-2 gap-1 text-[10px]">
              <Sparkles className="w-3 h-3" />
              AI
            </Badge>
          </div>

          <CommandList>
            {/* AI Suggestion */}
            {aiSuggestion && (
              <div className="px-4 py-3 bg-accent/10 border-b">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-muted-foreground">{aiSuggestion}</span>
                </div>
              </div>
            )}

            <CommandEmpty>
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No results found.</p>
                <p className="text-xs text-muted-foreground mt-1">Try typing a natural language command</p>
              </div>
            </CommandEmpty>

            {groupedActions.navigation.length > 0 && (
              <CommandGroup heading="Navigation">
                {groupedActions.navigation.map((action) => (
                  <CommandItem
                    key={action.id}
                    onSelect={() => runAction(action.action)}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <action.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.label}</p>
                      {action.description && (
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {groupedActions.actions.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Manager Dashboard">
                  {groupedActions.actions.map((action) => (
                    <CommandItem
                      key={action.id}
                      onSelect={() => runAction(action.action)}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <action.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.label}</p>
                        {action.description && (
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-50" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {groupedActions.ai.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="AI Actions">
                  {groupedActions.ai.map((action) => (
                    <CommandItem
                      key={action.id}
                      onSelect={() => runAction(action.action)}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                        <action.icon className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.label}</p>
                        {action.description && (
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px]">AI</Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>

          <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">esc</kbd>
                Close
              </span>
            </div>
            <span className="text-accent">Powered by Lovable AI</span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
};

export default CommandBar;
