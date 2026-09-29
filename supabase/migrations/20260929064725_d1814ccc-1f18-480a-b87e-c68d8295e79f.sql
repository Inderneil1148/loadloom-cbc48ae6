CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark own notifications read" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_plan_activated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active'
     AND NEW.plan IN ('starter','growth','fleet')
     AND (OLD.plan IS DISTINCT FROM NEW.plan OR OLD.status <> 'active') THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.user_id, 'Your ' || initcap(NEW.plan) || ' plan is now active',
            'All ' || initcap(NEW.plan) || ' features are now unlocked. Enjoy!', '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER notify_plan_activated AFTER UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.notify_plan_activated();

CREATE OR REPLACE FUNCTION public.notify_payment_rejected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.user_id, 'Your payment could not be verified',
            coalesce('Reason: ' || NEW.admin_note || '. ', '') || 'Please submit again or contact support.', '/choose-plan');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER notify_payment_rejected AFTER UPDATE ON public.plan_payments
FOR EACH ROW EXECUTE FUNCTION public.notify_payment_rejected();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;