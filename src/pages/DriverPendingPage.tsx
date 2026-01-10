import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Clock, ArrowLeft, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const DriverPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { driverStatus, isApprovedDriver } = useUserRole();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast.info('Checking status...');
    
    setTimeout(() => {
      if (isApprovedDriver) {
        navigate('/driver/active');
      }
    }, 1000);
  };

  // If approved, redirect to driver dashboard
  React.useEffect(() => {
    if (isApprovedDriver) {
      navigate('/driver/active');
    }
  }, [isApprovedDriver, navigate]);

  if (driverStatus === 'REJECTED') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <nav className="h-16 px-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </nav>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="border-destructive/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Truck className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Application Rejected</h2>
                <p className="text-muted-foreground mb-6">
                  Unfortunately, your driver application was not approved. Please contact support for more information.
                </p>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Return Home
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="h-16 px-4 border-b border-border flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-4 bg-warning/10 rounded-full flex items-center justify-center"
              >
                <Clock className="w-8 h-8 text-warning" />
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">Pending Approval</h2>
              <p className="text-muted-foreground mb-6">
                Your driver registration is being reviewed by our team. You'll be notified once your account is approved.
              </p>
              <Button variant="outline" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Check Status
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DriverPendingPage;
