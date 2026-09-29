DROP POLICY IF EXISTS "Signed-in users read payment settings" ON public.payment_settings;
CREATE POLICY "Paying users and admins read payment settings"
ON public.payment_settings FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = auth.uid() AND s.requested_plan <> 'free'
  )
);

DROP POLICY IF EXISTS "Signed-in users read payment QR" ON storage.objects;
CREATE POLICY "Paying users and admins read payment QR"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-qr'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = auth.uid() AND s.requested_plan <> 'free'
    )
  )
);