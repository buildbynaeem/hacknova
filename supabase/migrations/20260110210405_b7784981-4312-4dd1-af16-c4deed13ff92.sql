-- Create enum for driver verification status
CREATE TYPE public.driver_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create driver_requests table for driver registration workflow
CREATE TABLE public.driver_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT,
  status driver_status NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_requests ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own request
CREATE POLICY "Drivers can view their own request"
ON public.driver_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Drivers can insert their own request
CREATE POLICY "Users can submit driver request"
ON public.driver_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins/Managers can view all requests
CREATE POLICY "Managers can view all driver requests"
ON public.driver_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Admins/Managers can update requests (approve/reject)
CREATE POLICY "Managers can update driver requests"
ON public.driver_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_driver_requests_updated_at
BEFORE UPDATE ON public.driver_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles to allow managers to read all profiles for driver management
CREATE POLICY "Managers can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));