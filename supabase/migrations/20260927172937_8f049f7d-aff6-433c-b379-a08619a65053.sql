CREATE TABLE public.plan_settings (
  plan text PRIMARY KEY CHECK (plan IN ('free', 'starter', 'growth', 'fleet')),
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  orders_limit integer CHECK (orders_limit IS NULL OR orders_limit >= 0),
  vehicles_limit integer CHECK (vehicles_limit IS NULL OR vehicles_limit >= 0),
  customers_limit integer CHECK (customers_limit IS NULL OR customers_limit >= 0),
  materials_limit integer CHECK (materials_limit IS NULL OR materials_limit >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plan_settings TO anon, authenticated;
GRANT UPDATE ON public.plan_settings TO authenticated;
GRANT ALL ON public.plan_settings TO service_role;

ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan settings"
ON public.plan_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins update plan settings"
ON public.plan_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_plan_settings_updated_at
BEFORE UPDATE ON public.plan_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plan_settings (plan, price, orders_limit, vehicles_limit, customers_limit, materials_limit)
VALUES
  ('free', 0, 20, 4, 5, 10),
  ('starter', 999, NULL, 10, 10, 100),
  ('growth', 2499, NULL, 25, NULL, 500),
  ('fleet', 4999, NULL, 100, NULL, NULL);

CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p text := coalesce(public.current_plan(NEW.owner_id), 'free');
  settings public.plan_settings%ROWTYPE;
  n integer;
BEGIN
  SELECT * INTO settings FROM public.plan_settings WHERE plan = p;

  IF TG_TABLE_NAME = 'vehicles' AND settings.vehicles_limit IS NOT NULL THEN
    SELECT count(*) INTO n FROM public.vehicles WHERE owner_id = NEW.owner_id;
    IF n >= settings.vehicles_limit THEN
      RAISE EXCEPTION '% plan allows up to % vehicles. Upgrade to add more.', initcap(p), settings.vehicles_limit;
    END IF;
  ELSIF TG_TABLE_NAME = 'customers' AND settings.customers_limit IS NOT NULL THEN
    SELECT count(*) INTO n FROM public.customers WHERE owner_id = NEW.owner_id;
    IF n >= settings.customers_limit THEN
      RAISE EXCEPTION '% plan allows up to % active customers. Upgrade to add more.', initcap(p), settings.customers_limit;
    END IF;
  ELSIF TG_TABLE_NAME = 'orders' AND settings.orders_limit IS NOT NULL THEN
    SELECT count(*) INTO n FROM public.orders
    WHERE owner_id = NEW.owner_id AND created_at >= date_trunc('month', now());
    IF n >= settings.orders_limit THEN
      RAISE EXCEPTION '% plan allows % orders per month. Upgrade for more orders.', initcap(p), settings.orders_limit;
    END IF;
  ELSIF TG_TABLE_NAME = 'materials' AND settings.materials_limit IS NOT NULL THEN
    SELECT count(*) INTO n FROM public.materials WHERE owner_id = NEW.owner_id;
    IF n >= settings.materials_limit THEN
      RAISE EXCEPTION '% plan allows up to % materials. Upgrade to add more.', initcap(p), settings.materials_limit;
    END IF;
  ELSIF TG_TABLE_NAME = 'quotations' AND p NOT IN ('growth','fleet') THEN
    RAISE EXCEPTION 'Quotations are available on the Growth and Fleet plans.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_material_plan_limits ON public.materials;
CREATE TRIGGER enforce_material_plan_limits
BEFORE INSERT ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();