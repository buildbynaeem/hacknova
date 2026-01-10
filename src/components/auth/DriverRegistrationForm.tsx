import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, ArrowLeft, User, Phone, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DriverRegistrationFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const DriverRegistrationForm: React.FC<DriverRegistrationFormProps> = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to register as a driver');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('driver_requests').insert({
        user_id: user.id,
        email: user.email || '',
        full_name: fullName.trim(),
        phone: phone.trim(),
        license_number: licenseNumber.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already submitted a driver registration request');
        } else {
          throw error;
        }
        return;
      }

      // Update profile with the info
      await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
      });

      setIsSubmitted(true);
      toast.success('Registration submitted! Awaiting admin approval.');
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error submitting driver registration:', error);
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-8 h-8 text-success" />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
          <p className="text-muted-foreground">
            Your driver registration is being reviewed. You'll be notified once approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-transit/10 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-transit" />
          </div>
        </div>
        <CardTitle>Driver Registration</CardTitle>
        <CardDescription>
          Submit your details to join our driver network. Your application will be reviewed by our team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license">License Number</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="license"
                type="text"
                placeholder="DL-XXXXXX"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="pl-10"
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
                Submitting...
              </>
            ) : (
              'Submit Registration'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DriverRegistrationForm;
