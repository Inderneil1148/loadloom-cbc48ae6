CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _user_id AND lower(u.email) = 'inderneilkanagali@gmail.com')
$$;

-- Announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'general' CHECK (kind IN ('general','maintenance','release')),
  audience text NOT NULL DEFAULT 'all',
  recipient_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin reads announcements" ON public.announcements FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE TABLE public.announcement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'general' CHECK (kind IN ('general','maintenance','release')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_templates TO authenticated;
GRANT ALL ON public.announcement_templates TO service_role;
ALTER TABLE public.announcement_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages templates" ON public.announcement_templates FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS announcement_id uuid;

CREATE OR REPLACE FUNCTION public.send_announcement(_title text, _body text, _kind text, _audience text, _plan text, _user_ids uuid[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE aid uuid; n integer; prefix text;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF coalesce(trim(_title),'') = '' THEN RAISE EXCEPTION 'Title is required'; END IF;
  IF _kind NOT IN ('general','maintenance','release') THEN RAISE EXCEPTION 'Invalid type'; END IF;
  prefix := CASE _kind WHEN 'maintenance' THEN 'Maintenance: ' WHEN 'release' THEN 'New: ' ELSE '' END;
  INSERT INTO public.announcements (title, body, kind, audience, created_by)
  VALUES (_title, _body, _kind, CASE WHEN _audience = 'plan' THEN 'plan:' || coalesce(_plan,'') WHEN _audience = 'users' THEN 'selected users' ELSE 'all' END, auth.uid())
  RETURNING id INTO aid;
  INSERT INTO public.notifications (user_id, title, body, link, announcement_id)
  SELECT s.user_id, prefix || _title, _body, NULL, aid FROM public.subscriptions s
  WHERE s.user_id NOT IN (SELECT user_id FROM public.demo_users)
    AND (_audience = 'all'
      OR (_audience = 'plan' AND public.current_plan(s.user_id) = _plan)
      OR (_audience = 'users' AND s.user_id = ANY(coalesce(_user_ids, '{}'::uuid[]))));
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE public.announcements SET recipient_count = n WHERE id = aid;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.announcement_reads()
RETURNS TABLE(announcement_id uuid, read_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT n.announcement_id, count(*) FILTER (WHERE n.read_at IS NOT NULL)
  FROM public.notifications n WHERE n.announcement_id IS NOT NULL AND public.is_super_admin(auth.uid())
  GROUP BY n.announcement_id
$$;

-- Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  email text,
  kind text NOT NULL DEFAULT 'bug' CHECK (kind IN ('bug','feedback','feature')),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','resolved')),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create own tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'open' AND NOT public.is_demo_user(auth.uid()));
CREATE POLICY "Users read own tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Super admin updates tickets" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.ticket_status_times()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN NEW.resolved_at := now();
  ELSIF NEW.status <> 'resolved' THEN NEW.resolved_at := NULL; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER support_ticket_times BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.ticket_status_times();

CREATE TABLE public.ticket_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  note text NOT NULL CHECK (char_length(note) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_notes TO authenticated;
GRANT ALL ON public.ticket_notes TO service_role;
ALTER TABLE public.ticket_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin reads notes" ON public.ticket_notes FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admin writes notes" ON public.ticket_notes FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));

-- Audit log (append-only, trigger-written)
CREATE TABLE public.admin_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor uuid,
  action text NOT NULL,
  target_user uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin reads audit log" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.block_audit_changes()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Audit log entries cannot be changed'; END $$;
CREATE TRIGGER audit_log_immutable BEFORE UPDATE OR DELETE ON public.admin_audit_log FOR EACH ROW EXECUTE FUNCTION public.block_audit_changes();

CREATE OR REPLACE FUNCTION public.write_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE act text; tgt uuid; det jsonb;
BEGIN
  IF TG_TABLE_NAME = 'subscriptions' THEN
    tgt := NEW.user_id;
    IF NEW.status = 'suspended' AND OLD.status <> 'suspended' THEN act := 'Account suspended';
    ELSIF OLD.status = 'suspended' AND NEW.status <> 'suspended' THEN act := 'Account restored';
    ELSIF NEW.plan IS DISTINCT FROM OLD.plan THEN act := 'Plan changed';
    ELSIF NEW.auto_pay IS DISTINCT FROM OLD.auto_pay THEN act := 'Auto pay ' || CASE WHEN NEW.auto_pay THEN 'on' ELSE 'off' END;
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN act := 'Status changed';
    ELSE RETURN NEW; END IF;
    det := jsonb_build_object('email', NEW.email, 'from_plan', OLD.plan, 'to_plan', NEW.plan, 'from_status', OLD.status, 'to_status', NEW.status);
  ELSIF TG_TABLE_NAME = 'plan_payments' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
    tgt := NEW.user_id; act := 'Payment ' || NEW.status;
    det := jsonb_build_object('email', NEW.email, 'plan', NEW.plan, 'amount', NEW.amount);
  ELSIF TG_TABLE_NAME = 'deletion_requests' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
    tgt := NEW.user_id; act := 'Deletion request ' || NEW.status;
    det := jsonb_build_object('email', NEW.email);
  ELSIF TG_TABLE_NAME = 'plan_settings' THEN
    act := 'Plan settings changed';
    det := jsonb_build_object('plan', NEW.plan, 'before', to_jsonb(OLD) - 'updated_at' - 'created_at', 'after', to_jsonb(NEW) - 'updated_at' - 'created_at');
  ELSIF TG_TABLE_NAME = 'payment_settings' THEN
    act := 'Payment settings changed';
    det := jsonb_build_object('upi_id', NEW.upi_id, 'payee_name', NEW.payee_name);
  ELSIF TG_TABLE_NAME = 'user_roles' THEN
    act := 'Role ' || lower(TG_OP); tgt := coalesce(NEW.user_id, OLD.user_id);
    det := jsonb_build_object('role', coalesce(NEW.role, OLD.role));
    INSERT INTO public.admin_audit_log (actor, action, target_user, details) VALUES (auth.uid(), act, tgt, det);
    RETURN coalesce(NEW, OLD);
  END IF;
  INSERT INTO public.admin_audit_log (actor, action, target_user, details) VALUES (auth.uid(), act, tgt, det);
  RETURN NEW;
END $$;

CREATE TRIGGER audit_subscriptions AFTER UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_plan_payments AFTER UPDATE ON public.plan_payments FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_deletion_requests AFTER UPDATE ON public.deletion_requests FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_plan_settings AFTER UPDATE ON public.plan_settings FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_payment_settings AFTER UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.write_audit();

-- Reports
CREATE OR REPLACE FUNCTION public.super_admin_report()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT jsonb_build_object(
    'signups_daily', (SELECT coalesce(jsonb_agg(x ORDER BY x.d), '[]') FROM (SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') d, count(*) n FROM auth.users WHERE created_at > now() - interval '30 days' GROUP BY 1) x),
    'signups_weekly', (SELECT coalesce(jsonb_agg(x ORDER BY x.d), '[]') FROM (SELECT to_char(date_trunc('week', created_at), 'YYYY-MM-DD') d, count(*) n FROM auth.users WHERE created_at > now() - interval '12 weeks' GROUP BY 1) x),
    'signups_monthly', (SELECT coalesce(jsonb_agg(x ORDER BY x.d), '[]') FROM (SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') d, count(*) n FROM auth.users WHERE created_at > now() - interval '12 months' GROUP BY 1) x),
    'total_users', (SELECT count(*) FROM auth.users),
    'dau', (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '1 day'),
    'wau', (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '7 days'),
    'mau', (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '30 days'),
    'revenue_monthly', (SELECT coalesce(jsonb_agg(x ORDER BY x.d), '[]') FROM (SELECT to_char(date_trunc('month', updated_at), 'YYYY-MM') d, sum(amount) n FROM public.plan_payments WHERE status = 'approved' GROUP BY 1) x),
    'revenue_total', (SELECT coalesce(sum(amount),0) FROM public.plan_payments WHERE status = 'approved'),
    'plans', (SELECT coalesce(jsonb_agg(x), '[]') FROM (SELECT coalesce(public.current_plan(user_id),'free') plan, count(*) n FROM public.subscriptions GROUP BY 1) x),
    'suspended', (SELECT count(*) FROM public.subscriptions WHERE status = 'suspended'),
    'cancellations', (SELECT count(*) FROM public.deletion_requests WHERE status IN ('pending','approved')),
    'orders_total', (SELECT count(*) FROM public.orders),
    'orders_monthly', (SELECT coalesce(jsonb_agg(x ORDER BY x.d), '[]') FROM (SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') d, count(*) n FROM public.orders WHERE created_at > now() - interval '12 months' GROUP BY 1) x),
    'usage', (SELECT coalesce(jsonb_agg(x ORDER BY x.orders DESC), '[]') FROM (
      SELECT s.email, s.business_name, coalesce(public.current_plan(s.user_id),'free') plan,
        (SELECT count(*) FROM public.orders o WHERE o.owner_id = s.user_id) orders,
        (SELECT count(*) FROM public.vehicles v WHERE v.owner_id = s.user_id) trucks,
        (SELECT count(*) FROM public.invoices i WHERE i.owner_id = s.user_id) invoices,
        (SELECT count(*) FROM public.quotations q WHERE q.owner_id = s.user_id) quotations
      FROM public.subscriptions s) x),
    'my_last_sign_in', (SELECT last_sign_in_at FROM auth.users WHERE id = auth.uid())
  ) INTO r;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.super_admin_health()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, storage AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN jsonb_build_object(
    'db_time', now(),
    'db_size', pg_database_size(current_database()),
    'storage', (SELECT coalesce(jsonb_agg(x), '[]') FROM (
      SELECT b.id bucket, count(o.id) files, coalesce(sum((o.metadata->>'size')::bigint),0) bytes
      FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id = b.id GROUP BY b.id) x)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.super_admin_report() FROM anon;
REVOKE EXECUTE ON FUNCTION public.super_admin_health() FROM anon;
REVOKE EXECUTE ON FUNCTION public.send_announcement(text,text,text,text,text,uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.announcement_reads() FROM anon;