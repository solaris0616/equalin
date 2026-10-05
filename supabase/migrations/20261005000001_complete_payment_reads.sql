-- Scalar JSON aggregation avoids PostgREST's row limit silently truncating
-- financial history. Invoker rights retain the payments/members RLS checks.
CREATE FUNCTION public.get_group_payments(p_group_id text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT coalesce(jsonb_agg(row_data ORDER BY created_at DESC, id), '[]'::jsonb)
  FROM (
    SELECT p.id, p.created_at, jsonb_build_object(
      'id', p.id, 'group_id', p.group_id, 'payer_member_id', p.payer_member_id,
      'amount', p.amount, 'description', p.description, 'created_at', p.created_at,
      'payer', jsonb_build_object('name', m.name),
      'participants', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'member_id', pp.member_id, 'member', jsonb_build_object('name', pm.name)
      ) ORDER BY pp.member_id), '[]'::jsonb)
      FROM public.payment_participants pp JOIN public.members pm ON pm.id = pp.member_id
      WHERE pp.payment_id = p.id)
    ) AS row_data
    FROM public.payments p JOIN public.members m ON m.id = p.payer_member_id
    WHERE p.group_id = p_group_id
  ) records;
$$;
REVOKE ALL ON FUNCTION public.get_group_payments(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_payments(text) TO authenticated;
