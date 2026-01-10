import React, { useState } from 'react';
import { AlertTriangle, Car, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DamageReportDialogProps {
  vehicleId: string | null;
  vehicleNumber: string;
}

const DamageReportDialog: React.FC<DamageReportDialogProps> = ({ vehicleId, vehicleNumber }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageSeverity, setDamageSeverity] = useState<string>('minor');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !vehicleId) {
      toast.error('No vehicle assigned to report damage');
      return;
    }

    if (!damageDescription.trim()) {
      toast.error('Please describe the damage');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('damage_reports').insert({
        vehicle_id: vehicleId,
        driver_id: user.id,
        vehicle_number: vehicleNumber,
        damage_description: damageDescription.trim(),
        damage_severity: damageSeverity,
        location: location.trim() || null,
      });

      if (error) throw error;

      toast.success('Damage report submitted successfully');
      setOpen(false);
      setDamageDescription('');
      setDamageSeverity('minor');
      setLocation('');
    } catch (error: any) {
      console.error('Error submitting damage report:', error);
      toast.error('Failed to submit damage report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasVehicle = vehicleId && vehicleNumber !== 'No vehicle assigned';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <AlertTriangle className="w-4 h-4" />
          Report Damage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Report Vehicle Damage
          </DialogTitle>
        </DialogHeader>

        {!hasVehicle ? (
          <div className="text-center py-6">
            <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No vehicle assigned to you.</p>
            <p className="text-sm text-muted-foreground">Contact your manager to get a vehicle assigned.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vehicle Info - Auto populated */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Car className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Vehicle:</span>
                <span className="font-semibold">{vehicleNumber}</span>
              </div>
            </div>

            {/* Damage Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity">Damage Severity</Label>
              <Select value={damageSeverity} onValueChange={setDamageSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor - Small scratches/dents</SelectItem>
                  <SelectItem value="moderate">Moderate - Noticeable damage</SelectItem>
                  <SelectItem value="severe">Severe - Major damage/Not drivable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="Where did this happen?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Damage Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Describe the Damage *</Label>
              <Textarea
                id="description"
                placeholder="Please describe what happened and the damage to the vehicle..."
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting || !damageDescription.trim()}
                className="flex-1 gap-2"
              >
                <FileText className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DamageReportDialog;
