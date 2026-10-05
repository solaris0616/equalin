-- Link possession permits joining, but must never permit listing other links.
-- API writes go through explicit, authenticated transactional functions.
BEGIN;

-- Do not hide existing corruption by dropping invalid rows during joins.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM public.payments p JOIN public.members m ON m.id = p.payer_member_id
    WHERE p.group_id <> m.group_id OR NOT EXISTS (
      SELECT 1 FROM public.payment_participants pp WHERE pp.payment_id = p.id
    )
  ) OR EXISTS (
    SELECT 1 FROM public.payment_participants pp
    JOIN public.payments p ON p.id = pp.payment_id
    JOIN public.members m ON m.id = pp.member_id WHERE m.group_id <> p.group_id
  ) THEN RAISE EXCEPTION 'Existing invalid payment membership: audit and repair before migrating';
  END IF;
END $$;

DROP POLICY "Groups are readable by anyone with ID" ON public.groups;
DROP POLICY "Collaborators are manageable by owner or self" ON public.group_collaborators;
CREATE POLICY "Read own collaboration" ON public.group_collaborators
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Read own groups" ON public.groups FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR EXISTS (
    SELECT 1 FROM public.group_collaborators c
    WHERE c.group_id = groups.id AND c.user_id = (SELECT auth.uid())
  ));

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.groups, public.members, public.group_collaborators,
     public.payments, public.payment_participants FROM PUBLIC, anon, authenticated;

-- Fail rather than silently repair historical invalid amounts.
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_valid
  CHECK (amount BETWEEN 1 AND 999999999);
ALTER TABLE public.payments DROP CONSTRAINT payments_payer_member_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_payer_member_id_fkey
  FOREIGN KEY (payer_member_id) REFERENCES public.members(id) ON DELETE NO ACTION;
ALTER TABLE public.payment_participants DROP CONSTRAINT payment_participants_member_id_fkey;
ALTER TABLE public.payment_participants ADD CONSTRAINT payment_participants_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE NO ACTION;
CREATE INDEX idx_payments_group_created_id ON public.payments(group_id, created_at DESC, id);

-- Serialize mutations in one group (including member deletion and payment edits).
CREATE FUNCTION public.lock_group(p_group_id text, p_owner_only boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.groups WHERE id = p_group_id FOR UPDATE;
  IF auth.uid() IS NULL OR v_owner IS NULL OR
     (p_owner_only AND v_owner <> auth.uid()) OR
     (NOT p_owner_only AND v_owner <> auth.uid() AND NOT EXISTS (
       SELECT 1 FROM public.group_collaborators WHERE group_id = p_group_id AND user_id = auth.uid()
     )) THEN
    RAISE EXCEPTION 'Group not found or permission denied' USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.lock_group(text, boolean) FROM PUBLIC, anon, authenticated;

-- Exact equality only: this endpoint cannot enumerate group IDs.
CREATE FUNCTION public.get_group_by_link(p_group_id text)
RETURNS TABLE(id text, name text, owner_id uuid, created_at timestamptz, is_rough_mode boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT g.id, g.name, g.owner_id, g.created_at, g.is_rough_mode
  FROM public.groups g WHERE g.id = p_group_id;
$$;
REVOKE ALL ON FUNCTION public.get_group_by_link(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_by_link(text) TO anon, authenticated;

CREATE FUNCTION public.create_group(p_id text, p_name text, p_member_names text[])
RETURNS public.groups LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_group public.groups;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_id IS NULL OR length(p_id) <> 21 OR p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 100
     OR p_member_names IS NULL OR cardinality(p_member_names) NOT BETWEEN 2 AND 100
     OR EXISTS (SELECT 1 FROM unnest(p_member_names) n WHERE n IS NULL OR length(btrim(n)) NOT BETWEEN 1 AND 100)
  THEN RAISE EXCEPTION 'Invalid group'; END IF;
  INSERT INTO public.groups(id, name, owner_id) VALUES(p_id, btrim(p_name), auth.uid()) RETURNING * INTO v_group;
  INSERT INTO public.group_collaborators VALUES(p_id, auth.uid());
  INSERT INTO public.members(group_id, name) SELECT p_id, btrim(n) FROM unnest(p_member_names) n;
  RETURN v_group;
END;
$$;

CREATE FUNCTION public.join_group(p_group_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM 1 FROM public.groups WHERE id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Group not found'; END IF;
  INSERT INTO public.group_collaborators VALUES(p_group_id, auth.uid()) ON CONFLICT DO NOTHING;
END;
$$;

CREATE FUNCTION public.add_group_member(p_group_id text, p_name text)
RETURNS public.members LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member public.members;
BEGIN
  PERFORM public.lock_group(p_group_id, true);
  IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 100 OR
    (SELECT count(*) FROM public.members WHERE group_id = p_group_id) >= 100
  THEN RAISE EXCEPTION 'Invalid member or member limit reached'; END IF;
  INSERT INTO public.members(group_id, name) VALUES(p_group_id, btrim(p_name)) RETURNING * INTO v_member;
  RETURN v_member;
END;
$$;

CREATE FUNCTION public.delete_group_member(p_group_id text, p_member_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.lock_group(p_group_id, true);
  IF (SELECT count(*) FROM public.members WHERE group_id = p_group_id) <= 2
  THEN RAISE EXCEPTION 'At least two members required'; END IF;
  -- Foreign keys reject deleting a payer or participant used in history.
  DELETE FROM public.members WHERE id = p_member_id AND group_id = p_group_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Member not found'; END IF;
END;
$$;

CREATE FUNCTION public.save_payment(p_group_id text, p_payment_id uuid, p_payer_id uuid,
  p_amount bigint, p_description text, p_participant_ids uuid[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  -- UI contract: collaborators create; only the owner edits/deletes.
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
    INSERT INTO public.payments(group_id, payer_member_id, amount, description)
      VALUES(p_group_id, p_payer_id, p_amount, p_description) RETURNING id INTO v_id;
  ELSE
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

CREATE FUNCTION public.delete_group_payment(p_group_id text, p_payment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.lock_group(p_group_id, true);
  DELETE FROM public.payments WHERE id = p_payment_id AND group_id = p_group_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
END;
$$;

CREATE FUNCTION public.set_rough_mode(p_group_id text, p_enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.lock_group(p_group_id, true);
  IF p_enabled IS NULL THEN RAISE EXCEPTION 'Mode required'; END IF;
  UPDATE public.groups SET is_rough_mode = p_enabled WHERE id = p_group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_group(text,text,text[]), public.join_group(text),
  public.add_group_member(text,text), public.delete_group_member(text,uuid),
  public.save_payment(text,uuid,uuid,bigint,text,uuid[]), public.delete_group_payment(text,uuid),
  public.set_rough_mode(text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_group(text,text,text[]), public.join_group(text),
  public.add_group_member(text,text), public.delete_group_member(text,uuid),
  public.save_payment(text,uuid,uuid,bigint,text,uuid[]), public.delete_group_payment(text,uuid),
  public.set_rough_mode(text,boolean) TO authenticated;
COMMIT;
