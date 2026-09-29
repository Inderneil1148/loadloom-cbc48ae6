UPDATE public.plan_payments p
SET status = 'approved', updated_at = now()
WHERE p.status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p.user_id
      AND s.status = 'active'
      AND s.plan = p.plan
  );