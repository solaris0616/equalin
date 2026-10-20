-- Invitation links can be rotated without changing a group's internal ID.
-- Payment creation is idempotent when a client retries the same request ID.
BEGIN;

CREATE TABLE public.group_invites (
  group_id text PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.group_invites FROM PUBLIC, anon, authenticated;

INSERT INTO public.group_invites(group_id, token)
  SELECT id, replace(gen_random_uuid()::text, '-', '') FROM public.groups;

-- New groups need an invitation too; the backfill above only covers existing rows.
CREATE OR REPLACE FUNCTION public.create_group(p_id text, p_name text, p_member_names text[])
RETURNS public.groups LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_group public.groups;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_id IS NULL OR length(p_id) <> 21 OR p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 100
     OR p_member_names IS NULL OR cardinality(p_member_names) NOT BETWEEN 2 AND 100
     OR EXISTS (SELECT 1 FROM unnest(p_member_names) n WHERE n IS NULL OR length(btrim(n)) NOT BETWEEN 1 AND 100)
  THEN RAISE EXCEPTION 'Invalid group'; END IF;
  INSERT INTO public.groups(id, name, owner_id)
    VALUES(p_id, btrim(p_name), auth.uid()) RETURNING * INTO v_group;
  INSERT INTO public.group_invites(group_id, token)
    VALUES(p_id, replace(gen_random_uuid()::text, '-', ''));
  INSERT INTO public.group_collaborators VALUES(p_id, auth.uid());
  INSERT INTO public.members(group_id, name)
    SELECT p_id, btrim(n) FROM unnest(p_member_names) n;
  RETURN v_group;
END;
$$;

ALTER TABLE public.payments ADD COLUMN client_request_id uuid;
CREATE UNIQUE INDEX payments_group_client_request_id_key
  ON public.payments(group_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

-- Table reads remain available through the Data API, so expiry must be enforced
-- in RLS as well as in RPCs. Mutation grants were already revoked in 20261005.
DROP POLICY "Read own groups" ON public.groups;
CREATE POLICY "Read active own groups" ON public.groups FOR SELECT TO authenticated
  USING (expires_at > now() AND (owner_id = (SELECT auth.uid()) OR EXISTS (
    SELECT 1 FROM public.group_collaborators c
    WHERE c.group_id = groups.id AND c.user_id = (SELECT auth.uid())
  )));

DROP POLICY "Members are manageable by group collaborators" ON public.members;
CREATE POLICY "Read active group members" ON public.members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.groups g JOIN public.group_collaborators c ON c.group_id = g.id
    WHERE g.id = members.group_id AND g.expires_at > now() AND c.user_id = (SELECT auth.uid())
  ));

DROP POLICY "Collaborators can see group payments" ON public.payments;
CREATE POLICY "Read active group payments" ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.groups g JOIN public.group_collaborators c ON c.group_id = g.id
    WHERE g.id = payments.group_id AND g.expires_at > now() AND c.user_id = (SELECT auth.uid())
  ));

DROP POLICY "Collaborators can manage participants" ON public.payment_participants;
CREATE POLICY "Read active payment participants" ON public.payment_participants FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.payments p
    JOIN public.groups g ON g.id = p.group_id
    JOIN public.group_collaborators c ON c.group_id = g.id
    WHERE p.id = payment_participants.payment_id
      AND g.expires_at > now() AND c.user_id = (SELECT auth.uid())
  ));

-- All mutating functions call this helper, so expired groups cannot be changed.
CREATE OR REPLACE FUNCTION public.lock_group(p_group_id text, p_owner_only boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid;
DECLARE v_expires_at timestamptz;
BEGIN
  SELECT owner_id, expires_at INTO v_owner, v_expires_at
    FROM public.groups WHERE id = p_group_id FOR UPDATE;
  IF auth.uid() IS NULL OR v_owner IS NULL OR v_expires_at <= now() OR
     (p_owner_only AND v_owner <> auth.uid()) OR
     (NOT p_owner_only AND v_owner <> auth.uid() AND NOT EXISTS (
       SELECT 1 FROM public.group_collaborators
       WHERE group_id = p_group_id AND user_id = auth.uid()
     )) THEN
    RAISE EXCEPTION 'Group not found, expired, or permission denied' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_group_by_link(p_group_id text)
RETURNS TABLE(id text, name text, owner_id uuid, created_at timestamptz, is_rough_mode boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT g.id, g.name, g.owner_id, g.created_at, g.is_rough_mode
  FROM public.groups g
  WHERE g.id = p_group_id AND g.expires_at > now();
$$;

CREATE FUNCTION public.get_group_invitation(p_group_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT i.token
  FROM public.group_invites i
  JOIN public.groups g ON g.id = i.group_id
  WHERE i.group_id = p_group_id AND g.expires_at > now()
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.group_collaborators c
      WHERE c.group_id = i.group_id AND c.user_id = auth.uid()
    );
$$;

CREATE FUNCTION public.rotate_group_invitation(p_group_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_token text;
BEGIN
  PERFORM public.lock_group(p_group_id, true);
  UPDATE public.group_invites
    SET token = replace(gen_random_uuid()::text, '-', ''),
        created_at = timezone('utc'::text, now())
    WHERE group_id = p_group_id
    RETURNING token INTO v_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  RETURN v_token;
END;
$$;

-- The argument name changes from p_group_id to p_invite_token, which requires
-- dropping the old same-signature function before recreating it.
DROP FUNCTION public.join_group(text);
CREATE FUNCTION public.join_group(p_invite_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_group_id text;
BEGIN
  IF auth.uid() IS NULL OR p_invite_token IS NULL OR length(p_invite_token) <> 32 THEN
    RAISE EXCEPTION 'Valid invitation required' USING ERRCODE = '42501';
  END IF;
  SELECT i.group_id INTO v_group_id
    FROM public.group_invites i
    JOIN public.groups g ON g.id = i.group_id
    WHERE i.token = p_invite_token AND g.expires_at > now()
    FOR UPDATE OF g;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found or expired' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.group_collaborators(group_id, user_id)
    VALUES(v_group_id, auth.uid()) ON CONFLICT DO NOTHING;
END;
$$;

DROP FUNCTION public.save_payment(text, uuid, uuid, bigint, text, uuid[]);
CREATE FUNCTION public.save_payment(p_group_id text, p_payment_id uuid, p_payer_id uuid,
  p_amount bigint, p_description text, p_participant_ids uuid[], p_client_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM public.lock_group(p_group_id, p_payment_id IS NOT NULL);
  IF p_amount IS NULL OR p_amount NOT BETWEEN 1 AND 999999999
     OR length(p_description) > 1000 OR p_participant_ids IS NULL
     OR cardinality(p_participant_ids) NOT BETWEEN 1 AND 100
     OR cardinality(p_participant_ids) <> (SELECT count(DISTINCT id) FROM unnest(p_participant_ids) id)
     OR NOT EXISTS (SELECT 1 FROM public.members WHERE id = p_payer_id AND group_id = p_group_id)
     OR EXISTS (SELECT 1 FROM unnest(p_participant_ids) AS x(member_id) WHERE NOT EXISTS (
       SELECT 1 FROM public.members m WHERE m.id = x.member_id AND m.group_id = p_group_id
     )) THEN RAISE EXCEPTION 'Invalid payment'; END IF;
  IF p_payment_id IS NULL THEN
    IF p_client_request_id IS NULL THEN RAISE EXCEPTION 'Request ID required'; END IF;
    SELECT id INTO v_id FROM public.payments
      WHERE group_id = p_group_id AND client_request_id = p_client_request_id;
    IF FOUND THEN RETURN v_id; END IF;
    INSERT INTO public.payments(group_id, payer_member_id, amount, description, client_request_id)
      VALUES(p_group_id, p_payer_id, p_amount, p_description, p_client_request_id)
      RETURNING id INTO v_id;
  ELSE
    IF p_client_request_id IS NOT NULL THEN RAISE EXCEPTION 'Request ID is only valid for creation'; END IF;
    UPDATE public.payments SET payer_member_id = p_payer_id, amount = p_amount, description = p_description
      WHERE id = p_payment_id AND group_id = p_group_id RETURNING id INTO v_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
    DELETE FROM public.payment_participants WHERE payment_id = v_id;
  END IF;
  INSERT INTO public.payment_participants(payment_id, member_id)
    SELECT v_id, id FROM unnest(p_participant_ids) id;
  RETURN v_id;
END;
$$;

-- Page history independently of settlement. The initial dashboard holds 50 rows,
-- while balances still include every payment and preserve whole-yen allocation.
CREATE FUNCTION public.get_group_payment_history(
  p_group_id text, p_before_created_at timestamptz DEFAULT NULL, p_before_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH active_group AS (
    SELECT g.id FROM public.groups g
    WHERE g.id = p_group_id AND g.expires_at > now() AND auth.uid() IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.group_collaborators c
        WHERE c.group_id = g.id AND c.user_id = auth.uid())
  ), records AS (
    SELECT p.id, p.group_id, p.payer_member_id, p.amount, p.description, p.created_at
    FROM public.payments p JOIN active_group g ON g.id = p.group_id
    WHERE p_before_created_at IS NULL OR (p.created_at, p.id) < (p_before_created_at, p_before_id)
    ORDER BY p.created_at DESC, p.id DESC LIMIT 51
  ), page_records AS (
    SELECT * FROM records ORDER BY created_at DESC, id DESC LIMIT 50
  )
  SELECT jsonb_build_object(
    'payments', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', p.id, 'group_id', p.group_id, 'payer_member_id', p.payer_member_id,
      'amount', p.amount, 'description', p.description, 'created_at', p.created_at,
      'payer', jsonb_build_object('name', payer.name),
      'participants', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'member_id', pp.member_id, 'member', jsonb_build_object('name', participant.name)
      ) ORDER BY pp.member_id), '[]'::jsonb)
      FROM public.payment_participants pp
      JOIN public.members participant ON participant.id = pp.member_id
      WHERE pp.payment_id = p.id)
    ) ORDER BY p.created_at DESC, p.id DESC) FROM page_records p
    JOIN public.members payer ON payer.id = p.payer_member_id), '[]'::jsonb),
    'next_cursor', CASE WHEN EXISTS (SELECT 1 FROM records OFFSET 50)
      THEN (SELECT jsonb_build_object('created_at', p.created_at, 'id', p.id)
        FROM page_records p ORDER BY p.created_at ASC, p.id ASC LIMIT 1)
      ELSE NULL END
  );
$$;

-- A single SQL statement supplies a consistent, small dashboard response.
CREATE FUNCTION public.get_group_dashboard(p_group_id text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH active_group AS (
    SELECT g.* FROM public.groups g
    WHERE g.id = p_group_id AND g.expires_at > now() AND auth.uid() IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.group_collaborators c
        WHERE c.group_id = g.id AND c.user_id = auth.uid())
  ), member_rows AS (
    SELECT m.id, m.group_id, m.name FROM public.members m
    JOIN active_group g ON g.id = m.group_id ORDER BY m.created_at, m.id
  ), payment_rows AS (
    SELECT p.id, p.payer_member_id, p.amount FROM public.payments p
    JOIN active_group g ON g.id = p.group_id
  ), participant_rows AS (
    SELECT pp.member_id, p.amount,
      count(*) OVER (PARTITION BY p.id) AS participant_count,
      row_number() OVER (PARTITION BY p.id ORDER BY pp.member_id) AS participant_rank
    FROM payment_rows p JOIN public.payment_participants pp ON pp.payment_id = p.id
  ), paid_totals AS (
    SELECT payer_member_id AS member_id, sum(amount)::bigint AS paid
    FROM payment_rows GROUP BY payer_member_id
  ), owed_totals AS (
    SELECT member_id, sum((amount / participant_count) +
      CASE WHEN participant_rank <= amount % participant_count THEN 1 ELSE 0 END)::bigint AS owed
    FROM participant_rows GROUP BY member_id
  ), history AS (
    SELECT public.get_group_payment_history(g.id) AS data FROM active_group g
  )
  SELECT (
    SELECT jsonb_build_object(
      'group', jsonb_build_object('id', g.id, 'name', g.name, 'is_rough_mode', g.is_rough_mode),
      'members', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', m.id, 'group_id', m.group_id, 'name', m.name)) FROM member_rows m), '[]'::jsonb),
      'payments', coalesce((SELECT data->'payments' FROM history), '[]'::jsonb),
      'next_payment_cursor', (SELECT data->'next_cursor' FROM history),
      'balances', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'member_id', m.id, 'name', m.name, 'paid', coalesce(p.paid, 0),
        'owed', coalesce(o.owed, 0), 'balance', coalesce(p.paid, 0) - coalesce(o.owed, 0)
      ) ORDER BY m.id) FROM member_rows m
        LEFT JOIN paid_totals p ON p.member_id = m.id
        LEFT JOIN owed_totals o ON o.member_id = m.id), '[]'::jsonb),
      'invite_token', (SELECT token FROM public.group_invites WHERE group_id = g.id)
    ) FROM active_group g
  );
$$;

DROP FUNCTION public.get_group_payments(text);

REVOKE ALL ON FUNCTION public.get_group_invitation(text), public.rotate_group_invitation(text),
  public.get_group_dashboard(text), public.get_group_payment_history(text,timestamptz,uuid),
  public.save_payment(text,uuid,uuid,bigint,text,uuid[],uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_invitation(text), public.get_group_dashboard(text),
  public.get_group_payment_history(text,timestamptz,uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_group_invitation(text),
  public.save_payment(text,uuid,uuid,bigint,text,uuid[],uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.join_group(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_group(text) TO authenticated;
COMMIT;
