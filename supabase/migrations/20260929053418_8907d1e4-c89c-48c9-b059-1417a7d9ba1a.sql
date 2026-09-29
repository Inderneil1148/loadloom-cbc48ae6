CREATE TABLE public.plan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL CHECK (plan IN ('starter','growth','fleet')),
  amount numeric NOT NULL DEFAULT 0,
  reference text,
  screenshot_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.plan_payments TO authenticated;
GRANT ALL ON public.plan_payments TO service_role;
ALTER TABLE public.plan_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.plan_payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users submit own payments" ON public.plan_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending' AND NOT public.is_demo_user(auth.uid()));
CREATE POLICY "Admins update payments" ON public.plan_payments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_plan_payments_updated_at BEFORE UPDATE ON public.plan_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payment_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  upi_id text,
  payee_name text,
  qr_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO authenticated;
GRANT UPDATE, INSERT ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read payment settings" ON public.payment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert payment settings" ON public.payment_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update payment settings" ON public.payment_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.payment_settings (id) VALUES (true);

-- Allow users to change their own requested plan (not their active plan)
CREATE OR REPLACE FUNCTION public.request_plan(_plan text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_demo_user(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _plan NOT IN ('free','starter','growth','fleet') THEN RAISE EXCEPTION 'Invalid plan'; END IF;
  UPDATE public.subscriptions
    SET requested_plan = _plan,
        status = CASE WHEN status = 'suspended' THEN status WHEN _plan = 'free' OR _plan = plan THEN 'active' ELSE 'pending' END
    WHERE user_id = auth.uid();
END; $$;
REVOKE EXECUTE ON FUNCTION public.request_plan(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.request_plan(text) TO authenticated;

-- Storage policies
CREATE POLICY "Users upload own payment proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users and admins read payment proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Signed-in users read payment QR" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-qr');
CREATE POLICY "Admins upload payment QR" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-qr' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update payment QR" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-qr' AND public.has_role(auth.uid(),'admin'));