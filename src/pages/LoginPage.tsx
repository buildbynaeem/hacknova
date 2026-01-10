import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Package, BarChart3, ArrowRight, ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, isAuthenticated } = useAuth();

  const roles = [
    {
      id: 'manager',
      title: 'Fleet Owner',
      description: 'Manage your fleet, view analytics, and track sustainability metrics.',
      icon: BarChart3,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      route: '/dashboard/manager',
    },
    {
      id: 'driver',
      title: 'Driver',
      description: 'Handle active deliveries with OTP verification and proof of custody.',
      icon: Truck,
      color: 'text-transit',
      bgColor: 'bg-transit/10',
      route: '/driver/active',
    },
    {
      id: 'sender',
      title: 'Sender',
      description: 'Track your shipments in real-time and manage bookings.',
      icon: Package,
      color: 'text-success',
      bgColor: 'bg-success/10',
      route: '/dashboard/sender',
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="h-16 px-4 border-b border-border flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button variant="accent" size="sm" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        )}
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-accent-foreground" />
              </div>
              <span className="font-bold text-2xl">Routezy</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {isAuthenticated ? `Welcome, ${user?.user_metadata?.full_name || 'User'}` : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground">
              {isAuthenticated ? 'Select your role to continue' : 'Sign in to access your dashboard or explore as guest'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="h-full cursor-pointer group hover:border-accent hover:shadow-lg transition-all duration-300"
                  onClick={() => navigate(role.route)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className={`w-14 h-14 ${role.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <role.icon className={`w-7 h-7 ${role.color}`} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{role.title}</h3>
                    <p className="text-sm text-muted-foreground flex-1">{role.description}</p>
                    <div className="flex items-center gap-2 mt-4 text-accent font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-8 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/auth?mode=signup" className="text-accent hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Demo OTPs: Pickup: 1234, Delivery: 5678
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
