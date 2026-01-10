import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import DriverRegistrationForm from '@/components/auth/DriverRegistrationForm';
import { toast } from 'sonner';

type FlowStep = 'auth' | 'register';

const DriverJoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, signIn, signUp } = useAuth();
  const { isPendingDriver, isApprovedDriver, isDriver, loading: roleLoading } = useUserRole();
  
  const [step, setStep] = useState<FlowStep>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect based on driver status
  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (isAuthenticated) {
      if (isApprovedDriver || isDriver) {
        navigate('/driver/active');
      } else if (isPendingDriver) {
        navigate('/driver/pending');
      } else {
        setStep('register');
      }
    }
  }, [isAuthenticated, isApprovedDriver, isDriver, isPendingDriver, authLoading, roleLoading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (authMode === 'signup') {
        const result = await signUp(email, password);
        if (result.error) {
          toast.error(result.error.message);
        } else {
          toast.success('Account created! Please complete your driver registration.');
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          toast.error(result.error.message);
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistrationSuccess = () => {
    navigate('/driver/pending');
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="h-16 px-4 border-b border-border flex items-center">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 bg-transit/20 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-transit" />
            </div>
            <span className="font-bold text-2xl">Join as Driver</span>
          </div>

          {step === 'auth' && !isAuthenticated ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">
                  {authMode === 'login' ? 'Welcome Back, Driver' : 'Create Driver Account'}
                </CardTitle>
                <CardDescription>
                  {authMode === 'login' 
                    ? 'Sign in to continue your registration' 
                    : 'First, create an account to get started'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="accent"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      authMode === 'login' ? 'Sign In' : 'Create Account'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="ml-1 text-accent hover:underline font-medium"
                    >
                      {authMode === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : step === 'register' && isAuthenticated ? (
            <DriverRegistrationForm 
              onBack={() => navigate('/')} 
              onSuccess={handleRegistrationSuccess}
            />
          ) : null}
        </motion.div>
      </div>
    </div>
  );
};

export default DriverJoinPage;
