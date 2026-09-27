ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS rate numeric NOT NULL DEFAULT 0 CHECK (rate >= 0),
  ADD COLUMN IF NOT EXISTS haulage_freight numeric NOT NULL DEFAULT 0 CHECK (haulage_freight >= 0),
  ADD COLUMN IF NOT EXISTS gst_percent numeric NOT NULL DEFAULT 0 CHECK (gst_percent >= 0 AND gst_percent <= 100),
  ADD COLUMN IF NOT EXISTS advance_amount numeric NOT NULL DEFAULT 0 CHECK (advance_amount >= 0),
  ADD COLUMN IF NOT EXISTS delivery_date date,
  ADD COLUMN IF NOT EXISTS target_window text,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.delivery_sites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_site_id_idx ON public.orders(site_id);
CREATE INDEX IF NOT EXISTS orders_vehicle_id_idx ON public.orders(vehicle_id);
CREATE INDEX IF NOT EXISTS orders_driver_id_idx ON public.orders(driver_id);