-- Create storage bucket for proof of delivery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-of-delivery', 'proof-of-delivery', true);

-- Storage policies for proof of delivery
CREATE POLICY "Anyone can view proof of delivery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'proof-of-delivery');

CREATE POLICY "Authenticated users can upload proof of delivery"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'proof-of-delivery' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'proof-of-delivery' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'proof-of-delivery' AND auth.uid()::text = (storage.foldername(name))[1]);