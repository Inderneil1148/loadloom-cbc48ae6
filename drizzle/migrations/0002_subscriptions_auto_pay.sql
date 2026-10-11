ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS auto_pay boolean NOT NULL DEFAULT false;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS auto_pay_updated_at timestamptz;