CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','growth','fleet')),
  requested_plan text NOT NULL DEFAULT 'free' CHECK (requested_plan IN ('free','starter','growth','fleet')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','suspended')),
  email text,
  business_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update subscriptions" ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE req text := coalesce(NEW.raw_user_meta_data->>'requested_plan', 'free');
BEGIN
  IF req NOT IN ('free','starter','growth','fleet') THEN req := 'free'; END IF;
  INSERT INTO public.subscriptions (user_id, plan, requested_plan, status, email, business_name)
  VALUES (NEW.id, 'free', req, CASE WHEN req = 'free' THEN 'active' ELSE 'pending' END,
          NEW.email, NEW.raw_user_meta_data->>'business_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created_subscription AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

CREATE OR REPLACE FUNCTION public.current_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN s.status = 'suspended' THEN 'free' ELSE s.plan END
  FROM public.subscriptions s WHERE s.user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p text := coalesce(public.current_plan(NEW.owner_id), 'free'); n int;
BEGIN
  IF TG_TABLE_NAME = 'vehicles' AND p = 'free' THEN
    SELECT count(*) INTO n FROM public.vehicles WHERE owner_id = NEW.owner_id;
    IF n >= 4 THEN RAISE EXCEPTION 'Free plan allows up to 4 trucks. Upgrade to add more.'; END IF;
  ELSIF TG_TABLE_NAME = 'customers' AND p IN ('free','starter') THEN
    SELECT count(*) INTO n FROM public.customers WHERE owner_id = NEW.owner_id;
    IF p = 'free' AND n >= 5 THEN RAISE EXCEPTION 'Free plan allows up to 5 customers. Upgrade to add more.'; END IF;
    IF p = 'starter' AND n >= 10 THEN RAISE EXCEPTION 'Starter plan allows up to 10 customers. Upgrade to Growth for unlimited.'; END IF;
  ELSIF TG_TABLE_NAME = 'orders' AND p = 'free' THEN
    SELECT count(*) INTO n FROM public.orders WHERE owner_id = NEW.owner_id
      AND created_at >= date_trunc('month', now());
    IF n >= 20 THEN RAISE EXCEPTION 'Free plan allows 20 orders per month. Upgrade for unlimited orders.'; END IF;
  ELSIF TG_TABLE_NAME = 'quotations' AND p NOT IN ('growth','fleet') THEN
    RAISE EXCEPTION 'Quotations are available on the Growth and Fleet plans.';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER enforce_vehicle_limit BEFORE INSERT ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
CREATE TRIGGER enforce_customer_limit BEFORE INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
CREATE TRIGGER enforce_order_limit BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_no text NOT NULL,
  customer_name text NOT NULL,
  site text,
  material text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'tonnes',
  rate numeric NOT NULL DEFAULT 0,
  haulage_freight numeric NOT NULL DEFAULT 0,
  gst_percent numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  valid_until date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','converted')),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own quotations" ON public.quotations FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER enforce_quotation_plan BEFORE INSERT ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

REVOKE EXECUTE ON FUNCTION public.enforce_plan_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_subscription() FROM PUBLIC, anon, authenticated;