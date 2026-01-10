import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertTriangle, Check, Clock, Car, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface DamageReport {
  id: string;
  vehicle_id: string;
  driver_id: string;
  vehicle_number: string;
  damage_description: string;
  damage_severity: string;
  damage_date: string;
  location: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  repair_cost: number | null;
  manager_notes: string | null;
  created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  moderate: 'bg-orange-100 text-orange-800 border-orange-300',
  severe: 'bg-red-100 text-red-800 border-red-300',
};

const fetchDamageReports = async (): Promise<DamageReport[]> => {
  const { data, error } = await supabase
    .from('damage_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export function DamageReportsPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);
  const [repairCost, setRepairCost] = useState('');
  const [managerNotes, setManagerNotes] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['damage-reports'],
    queryFn: fetchDamageReports,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, cost, notes }: { id: string; cost: number | null; notes: string }) => {
      const { error } = await supabase
        .from('damage_reports')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          repair_cost: cost,
          manager_notes: notes || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] });
      toast.success('Damage report marked as resolved');
      setSelectedReport(null);
      setRepairCost('');
      setManagerNotes('');
    },
    onError: (error) => {
      toast.error('Failed to update report: ' + (error as Error).message);
    },
  });

  const handleResolve = () => {
    if (!selectedReport) return;
    resolveMutation.mutate({
      id: selectedReport.id,
      cost: repairCost ? parseFloat(repairCost) : null,
      notes: managerNotes,
    });
  };

  const unresolvedCount = reports?.filter(r => !r.is_resolved).length || 0;
  const totalCount = reports?.length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Damage Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Damage Reports
            </CardTitle>
            <CardDescription>
              {unresolvedCount > 0 ? (
                <span className="text-destructive font-medium">{unresolvedCount} unresolved</span>
              ) : (
                <span>All reports resolved</span>
              )}{' '}
              · {totalCount} total reports
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reports && reports.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className={!report.is_resolved ? 'bg-destructive/5' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{report.vehicle_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={SEVERITY_COLORS[report.damage_severity] || ''}>
                      {report.damage_severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate" title={report.damage_description}>
                      {report.damage_description}
                    </p>
                    {report.location && (
                      <p className="text-xs text-muted-foreground truncate">📍 {report.location}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(report.damage_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {report.is_resolved ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                        <Check className="h-3 w-3" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!report.is_resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setRepairCost(report.repair_cost?.toString() || '');
                          setManagerNotes(report.manager_notes || '');
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                    {report.is_resolved && report.repair_cost && (
                      <span className="text-sm text-muted-foreground">
                        ₹{report.repair_cost.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No damage reports yet</p>
          </div>
        )}

        {/* Resolve Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Damage Report</DialogTitle>
              <DialogDescription>
                Mark this damage report as resolved and add repair details
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4 py-4">
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Vehicle:</span>
                    <span className="font-mono font-medium">{selectedReport.vehicle_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Severity:</span>
                    <Badge className={SEVERITY_COLORS[selectedReport.damage_severity]}>
                      {selectedReport.damage_severity}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <p className="text-sm mt-1">{selectedReport.damage_description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repairCost">Repair Cost (₹)</Label>
                  <Input
                    id="repairCost"
                    type="number"
                    placeholder="Enter repair cost"
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerNotes">Notes</Label>
                  <Textarea
                    id="managerNotes"
                    placeholder="Add any notes about the repair..."
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Cancel
              </Button>
              <Button onClick={handleResolve} disabled={resolveMutation.isPending} className="gap-2">
                <Check className="h-4 w-4" />
                {resolveMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
