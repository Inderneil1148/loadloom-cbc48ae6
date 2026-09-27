CREATE TABLE public.demo_users (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.demo_users TO service_role;
ALTER TABLE public.demo_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_demo_user(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.demo_users WHERE user_id = _user_id)
$$;
REVOKE EXECUTE ON FUNCTION public.is_demo_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_demo_user(uuid) TO authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['business_profiles','customers','deliveries','delivery_sites','drivers','invoices','materials','orders','payments','quotations','vehicles'] LOOP
    EXECUTE format('CREATE POLICY "Demo read only insert" ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_demo_user(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Demo read only update" ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.is_demo_user(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Demo read only delete" ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (NOT public.is_demo_user(auth.uid()))', t);
  END LOOP;
END $$;