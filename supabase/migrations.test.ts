import { PGlite } from "@electric-sql/pglite";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { readdir, readFile } from "node:fs/promises";

// Real PostgreSQL semantics, with only the Supabase auth identity stubbed.
const db = new PGlite();
const owner = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const guest = "00000000-0000-4000-8000-000000000003";
const group = "aaaaaaaaaaaaaaaaaaaaa";
const otherGroup = "bbbbbbbbbbbbbbbbbbbbb";
let members: string[];
let foreignMember: string;

async function asUser(id: string) {
  await db.exec("RESET ROLE; SET ROLE authenticated;");
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [id]);
}
async function save(
  id: string | null,
  participants = members.slice(0, 2),
  groupId = group
) {
  return db.query<{ id: string }>(
    "SELECT public.save_payment($1,$2,$3,1001,'test',$4) AS id",
    [groupId, id, members[0], participants]
  );
}

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
    INSERT INTO auth.users VALUES ('${owner}'), ('${other}'), ('${guest}');
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  `);
  const migrationDir = new URL("./migrations/", import.meta.url);
  for (const name of (await readdir(migrationDir))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    await db.exec(await readFile(new URL(name, migrationDir), "utf8"));
  }
  await asUser(owner);
  await db.query(
    "SELECT public.create_group($1, 'First', ARRAY['Alice','Bob','Charlie','Dana'])",
    [group]
  );
  members = (
    await db.query<{ id: string }>(
      "SELECT id FROM public.members WHERE group_id=$1 ORDER BY name",
      [group]
    )
  ).rows.map((r) => r.id);
  await asUser(other);
  await db.query("SELECT public.create_group($1, 'Second', ARRAY['X','Y'])", [
    otherGroup,
  ]);
  foreignMember = (
    await db.query<{ id: string }>(
      "SELECT id FROM public.members WHERE group_id=$1",
      [otherGroup]
    )
  ).rows[0].id;
}, 30000);
beforeEach(async () => {
  await asUser(owner);
});
afterAll(async () => {
  await db.close();
});

describe("database security and consistency", () => {
  it("does not enumerate invitation links and preserves exact link previews", async () => {
    await asUser(guest);
    expect((await db.query("SELECT * FROM public.groups")).rows).toHaveLength(
      0
    );
    await db.exec("RESET ROLE; SET ROLE anon;");
    expect((await db.query("SELECT * FROM public.groups")).rows).toHaveLength(
      0
    );
    expect(
      (await db.query("SELECT * FROM public.get_group_by_link($1)", [group]))
        .rows
    ).toHaveLength(1);
    expect(
      (await db.query("SELECT * FROM public.get_group_by_link('%')")).rows
    ).toHaveLength(0);
    await expect(save(null)).rejects.toThrow();
  });

  it("blocks direct writes and private helper calls even for an owner", async () => {
    await expect(
      db.query("UPDATE public.groups SET name='bad' WHERE id=$1", [group])
    ).rejects.toThrow();
    await expect(
      db.query("DELETE FROM public.members WHERE id=$1", [members[0]])
    ).rejects.toThrow();
    await expect(
      db.query(
        "INSERT INTO public.payment_participants VALUES (gen_random_uuid(),$1)",
        [members[0]]
      )
    ).rejects.toThrow();
    await expect(
      db.query("SELECT public.lock_group($1,false)", [group])
    ).rejects.toThrow();
  });

  it("allows idempotent joining and creation, but denies non-owner edits and deletes", async () => {
    await asUser(guest);
    await expect(save(null)).rejects.toThrow();
    await db.query("SELECT public.join_group($1)", [group]);
    await db.query("SELECT public.join_group($1)", [group]);
    const id = (await save(null)).rows[0].id;
    await expect(save(id)).rejects.toThrow();
    await expect(
      db.query("SELECT public.delete_group_payment($1,$2)", [group, id])
    ).rejects.toThrow();
    await expect(
      db.query("SELECT public.add_group_member($1,'bad')", [group])
    ).rejects.toThrow();
    await expect(
      db.query("SELECT public.set_rough_mode($1,true)", [group])
    ).rejects.toThrow();
  });

  it("rejects empty, duplicate and cross-group participants and wrong group IDs", async () => {
    await expect(save(null, [])).rejects.toThrow();
    await expect(save(null, [members[0], members[0]])).rejects.toThrow();
    await expect(save(null, [foreignMember])).rejects.toThrow();
    const id = (await save(null)).rows[0].id;
    await asUser(other);
    await expect(save(id, [foreignMember], otherGroup)).rejects.toThrow();
    await expect(
      db.query("SELECT public.delete_group_payment($1,$2)", [otherGroup, id])
    ).rejects.toThrow();
  });

  it("rolls back payment creation and participant replacement on insert failure", async () => {
    const id = (await save(null)).rows[0].id;
    const before = await db.query(
      "SELECT * FROM public.payment_participants WHERE payment_id=$1 ORDER BY member_id",
      [id]
    );
    const count = await db.query("SELECT count(*) FROM public.payments");
    await db.exec(`RESET ROLE;
      CREATE FUNCTION public.fail_participant() RETURNS trigger LANGUAGE plpgsql AS
        $$ BEGIN RAISE EXCEPTION 'Injected participant failure'; END $$;
      CREATE TRIGGER fail_participant BEFORE INSERT ON public.payment_participants
        FOR EACH ROW EXECUTE FUNCTION public.fail_participant();`);
    try {
      await asUser(owner);
      await expect(save(null)).rejects.toThrow("Injected participant failure");
      await expect(save(id, [members[2]])).rejects.toThrow(
        "Injected participant failure"
      );
      expect(
        (await db.query("SELECT count(*) FROM public.payments")).rows
      ).toEqual(count.rows);
      expect(
        (
          await db.query(
            "SELECT * FROM public.payment_participants WHERE payment_id=$1 ORDER BY member_id",
            [id]
          )
        ).rows
      ).toEqual(before.rows);
    } finally {
      await db.exec(
        "RESET ROLE; DROP TRIGGER fail_participant ON public.payment_participants; DROP FUNCTION public.fail_participant();"
      );
    }
  });

  it("protects referenced members and enforces a minimum of two", async () => {
    await save(null);
    await expect(
      db.query("SELECT public.delete_group_member($1,$2)", [group, members[0]])
    ).rejects.toThrow();
    await expect(
      db.query("SELECT public.delete_group_member($1,$2)", [group, members[1]])
    ).rejects.toThrow();
    await db.query("SELECT public.delete_group_member($1,$2)", [
      group,
      members[2],
    ]);
    await db.query("SELECT public.delete_group_member($1,$2)", [
      group,
      members[3],
    ]);
    await expect(
      db.query("SELECT public.delete_group_member($1,$2)", [group, members[0]])
    ).rejects.toThrow("At least two");
  });

  it("returns complete JSON history and retains read isolation", async () => {
    await db.exec("RESET ROLE;");
    await db.query(
      `INSERT INTO public.payments(group_id,payer_member_id,amount)
      SELECT $1,$2,1 FROM generate_series(1,1001)`,
      [group, members[0]]
    );
    await db.query(
      `INSERT INTO public.payment_participants(payment_id,member_id)
      SELECT p.id,$2 FROM public.payments p WHERE p.group_id=$1
      AND NOT EXISTS (SELECT 1 FROM public.payment_participants pp WHERE pp.payment_id=p.id)`,
      [group, members[1]]
    );
    await asUser(owner);
    const result = await db.query<{ data: unknown[] }>(
      "SELECT public.get_group_payments($1) AS data",
      [group]
    );
    expect(result.rows[0].data.length).toBeGreaterThan(1000);
    await asUser(other);
    expect(
      (
        await db.query<{ data: unknown[] }>(
          "SELECT public.get_group_payments($1) AS data",
          [group]
        )
      ).rows[0].data
    ).toEqual([]);
  });
});
