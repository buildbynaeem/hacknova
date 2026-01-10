-- Create enum for shipment status
CREATE TYPE public.shipment_status AS ENUM ('PENDING', 'CONFIRMED', 'PICKUP_READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- Create enum for package type
CREATE TYPE public.package_type AS ENUM ('DOCUMENTS', 'PARCEL', 'FRAGILE', 'HEAVY', 'PERISHABLE');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'driver', 'sender');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id TEXT NOT NULL UNIQUE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Pickup details
  pickup_address TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_pincode TEXT NOT NULL,
  pickup_contact_name TEXT NOT NULL,
  pickup_contact_phone TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time_slot TEXT,
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  
  -- Delivery details
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_pincode TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  delivery_lat FLOAT,
  delivery_lng FLOAT,
  
  -- Package details
  package_type package_type NOT NULL DEFAULT 'PARCEL',
  weight FLOAT,
  dimensions TEXT,
  description TEXT,
  is_fragile BOOLEAN DEFAULT false,
  
  -- OTP verification
  pickup_otp TEXT NOT NULL,
  delivery_otp TEXT NOT NULL,
  
  -- Status and tracking
  status shipment_status NOT NULL DEFAULT 'PENDING',
  driver_lat FLOAT,
  driver_lng FLOAT,
  
  -- Sustainability
  carbon_score FLOAT,
  distance_km FLOAT,
  
  -- Pricing
  estimated_cost FLOAT,
  final_cost FLOAT,
  
  -- Proof of delivery
  proof_of_delivery_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Invoice details
  amount FLOAT NOT NULL,
  tax_amount FLOAT DEFAULT 0,
  total_amount FLOAT NOT NULL,
  
  -- Status
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- URLs
  invoice_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Shipments policies
CREATE POLICY "Senders can view their own shipments"
ON public.shipments FOR SELECT
USING (auth.uid() = sender_id);

CREATE POLICY "Drivers can view assigned shipments"
ON public.shipments FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Managers can view all shipments"
ON public.shipments FOR SELECT
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Senders can create shipments"
ON public.shipments FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Drivers can update assigned shipments"
ON public.shipments FOR UPDATE
USING (auth.uid() = driver_id);

CREATE POLICY "Managers can update all shipments"
ON public.shipments FOR UPDATE
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

-- Invoices policies
CREATE POLICY "Senders can view their own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = sender_id);

CREATE POLICY "Managers can view all invoices"
ON public.invoices FOR SELECT
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Generate tracking ID function
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
BEGIN
  new_id := 'RTZ-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Generate invoice number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_num TEXT;
BEGIN
  new_num := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_num;
END;
$$ LANGUAGE plpgsql SET search_path = public;