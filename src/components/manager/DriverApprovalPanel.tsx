import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { UserCheck, UserX, Clock, Phone, Mail, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface DriverRequest {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  license_number: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason: string | null;
  created_at: string;
}

export function DriverApprovalPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<DriverRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: pendingRequests, isLoading } = useQuery({
    queryKey: ['driver-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_requests')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DriverRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (request: DriverRequest) => {
      // Update driver request status
      const { error: updateError } = await supabase
        .from('driver_requests')
        .update({
          status: 'APPROVED',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Add driver role to user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: request.user_id,
          role: 'driver',
        });

      if (roleError && roleError.code !== '23505') throw roleError;

      return request;
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['driver-requests'] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-vehicles'] });
      toast.success(`${request.full_name} has been approved as a driver`);
    },
    onError: (error) => {
      toast.error('Failed to approve driver: ' + (error as Error).message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ request, reason }: { request: DriverRequest; reason: string }) => {
      const { error } = await supabase
        .from('driver_requests')
        .update({
          status: 'REJECTED',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', request.id);

      if (error) throw error;
      return request;
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['driver-requests'] });
      toast.success(`Driver request from ${request.full_name} has been rejected`);
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error('Failed to reject driver: ' + (error as Error).message);
    },
  });

  const handleReject = () => {
    if (selectedRequest) {
      rejectMutation.mutate({ request: selectedRequest, reason: rejectionReason });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Driver Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Pending Driver Requests
          </CardTitle>
          <CardDescription>
            {pendingRequests?.length || 0} requests awaiting approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests && pendingRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.full_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {request.email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {request.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.license_number ? (
                        <div className="flex items-center gap-1 text-sm">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          {request.license_number}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(request)}
                          disabled={approveMutation.isPending}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectDialog(true);
                          }}
                          disabled={rejectMutation.isPending}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending driver requests</p>
              <p className="text-sm">New applications will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Driver Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the application from {selectedRequest?.full_name}?
              Please provide a reason for the rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
