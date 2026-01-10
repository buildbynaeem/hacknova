import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type DriverStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

interface UserRoleState {
  roles: AppRole[];
  driverStatus: DriverStatus;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isDriver: boolean;
  isSender: boolean;
  isApprovedDriver: boolean;
  isPendingDriver: boolean;
}

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<UserRoleState>({
    roles: [],
    driverStatus: null,
    loading: true,
    isAdmin: false,
    isManager: false,
    isDriver: false,
    isSender: false,
    isApprovedDriver: false,
    isPendingDriver: false,
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setState({
        roles: [],
        driverStatus: null,
        loading: false,
        isAdmin: false,
        isManager: false,
        isDriver: false,
        isSender: false,
        isApprovedDriver: false,
        isPendingDriver: false,
      });
      return;
    }

    const fetchRoles = async () => {
      try {
        // Fetch user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;

        const roles = (rolesData?.map(r => r.role) || []) as AppRole[];

        // Check driver request status if applicable
        let driverStatus: DriverStatus = null;
        const { data: driverRequest } = await supabase
          .from('driver_requests')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (driverRequest) {
          driverStatus = driverRequest.status as DriverStatus;
        }

        const isAdmin = roles.includes('admin');
        const isManager = roles.includes('manager');
        const isDriver = roles.includes('driver');
        const isSender = roles.includes('sender');

        setState({
          roles,
          driverStatus,
          loading: false,
          isAdmin,
          isManager,
          isDriver,
          isSender,
          isApprovedDriver: isDriver && driverStatus === 'APPROVED',
          isPendingDriver: driverStatus === 'PENDING',
        });
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchRoles();
  }, [user, authLoading]);

  return state;
}
