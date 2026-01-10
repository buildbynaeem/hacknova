-- Make the proof-of-delivery bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'proof-of-delivery';

-- Drop any existing public access policies
DROP POLICY IF EXISTS "Anyone can view proof of delivery images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create RLS policies for authorized access only
-- Drivers can upload to their own folder
CREATE POLICY "Drivers can upload POD images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proof-of-delivery' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Authorized users can view POD images (managers, admins, or the uploader)
CREATE POLICY "Authorized users can view POD"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'proof-of-delivery' AND 
  (public.has_role(auth.uid(), 'manager') OR 
   public.has_role(auth.uid(), 'admin') OR
   auth.uid()::text = (storage.foldername(name))[1])
);

-- Uploaders can update their own files
CREATE POLICY "Users can update own POD"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'proof-of-delivery' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Uploaders can delete their own files
CREATE POLICY "Users can delete own POD"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'proof-of-delivery' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);