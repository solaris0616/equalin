# Supabase persistence and security

## Schema and trust boundaries

- `groups`: NanoID URL identifier, name, owner (`auth.users`), rough mode, timestamps.
- `group_invites`: rotatable, opaque invitation token per group.
- `members`: named people in a group, separate from authenticated users.
- `group_collaborators`: authenticated users who joined through a known link.
- `payments`: whole Japanese yen (1–999,999,999), payer member, group.
- `payment_participants`: members sharing a payment.

Anonymous Auth users have the `authenticated` role. The publishable key is public:
authorization must hold for direct Data API calls, not just Server Actions.
All tables retain RLS. Groups are selectable only by owners and collaborators.
`group_invites` has no direct client privilege; invitation tokens are read and
rotated only through narrowly granted RPCs.
Collaboration SELECT exposes only the caller's own membership to avoid recursive policies.
`get_group_by_link` supports exact-ID invitation previews without ID enumeration.
The 20261020 migration replaces group-ID invitations with opaque, rotatable
tokens. Anyone holding a current token can join; rotated tokens immediately stop
working. Group pages use noindex and no-referrer metadata.

## Transactional mutations

The 20261005 migration revokes table mutations from PUBLIC, anon and authenticated.
Use RPCs through repositories registered in `src/core/registry.ts`:

| RPC                       | Permission / behavior                                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create_group`            | Authenticated; atomic group, owner collaboration and 2–100 members                                                                                          |
| `join_group`              | Authenticated with a current opaque invitation token; idempotent                                                                                            |
| `rotate_group_invitation` | Owner; changes the token and invalidates previous invitation links                                                                                          |
| `add_group_member`        | Owner; name 1–100 characters; maximum 100 members                                                                                                           |
| `delete_group_member`     | Owner; at least two remain; referenced members cannot be removed                                                                                            |
| `save_payment`            | Collaborator creates with a UUID request ID; owner edits; validates group membership, amount, unique nonempty participants, description; atomic replacement |
| `delete_group_payment`    | Owner; explicit group/payment pair; missing rows are errors                                                                                                 |
| `set_rough_mode`          | Owner; missing or unauthorized groups are errors                                                                                                            |

Functions use SECURITY DEFINER, empty search_path, fully qualified relations,
explicit auth.uid() checks and narrow EXECUTE grants. The internal lock_group
helper has no client EXECUTE grant. Group row locks serialize member and payment
mutations. The app does not use a service-role key.
Payment-member foreign keys use NO ACTION instead of deleting financial history.
Migration aborts on existing empty/cross-group payment membership or invalid amounts.
Investigate and repair historical data deliberately. Previously deleted history
cannot be reconstructed automatically.

## Reads and errors

`get_group_dashboard` returns the group, members, first 50 history rows and
database-computed balances in one consistent snapshot. `get_group_payment_history`
uses a `(created_at, id)` cursor for subsequent pages. This avoids a full-history
payload or DOM while keeping settlement correct over every payment.
Repositories map snake_case to camelCase and distinguish lookup errors from absence.
Dashboard failures must never appear as zero balances. Mutation errors shown to
users are generic; technical detail stays in server logs.

Use new SSR clients per request. src/proxy.ts invokes updateSession, which calls
auth.getClaims() to refresh cookies in both request and response. Browser clients
use lib/supabase/client; repositories use lib/supabase/server.

## Verification and rollout

`bun run test` includes PGlite PostgreSQL tests of migrations, grants, RLS,
rollback, cross-group references, owner restrictions, invitation rotation,
idempotent payment creation and paged history with >1,000 payments.
Auth identity is stubbed; real Supabase Auth, PostgREST and multi-connection
concurrency require staging smoke tests.

Deploy the 20261005 and 20261020 migrations with the corresponding app in a
maintenance window. Existing group-ID-only links can display the group preview but
cannot add new collaborators after 20261020; a collaborator must copy a newly
issued tokenized link. Old clients' direct table writes will be rejected. Back up
and inspect existing data first. Never restore public group SELECT as a rollback
shortcut.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[database functions](https://supabase.com/docs/guides/database/functions),
[SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
