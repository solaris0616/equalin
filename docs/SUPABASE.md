# Supabase persistence and security

## Schema and trust boundaries

- `groups`: NanoID invitation URL, name, owner (`auth.users`), rough mode, timestamps.
- `members`: named people in a group, separate from authenticated users.
- `group_collaborators`: authenticated users who joined through a known link.
- `payments`: whole Japanese yen (1–999,999,999), payer member, group.
- `payment_participants`: members sharing a payment.

Anonymous Auth users have the `authenticated` role. The publishable key is public:
authorization must hold for direct Data API calls, not just Server Actions.
All tables retain RLS. Groups are selectable only by owners and collaborators.
Collaboration SELECT exposes only the caller's own membership to avoid recursive policies.
`get_group_by_link` supports exact-ID invitation previews without ID enumeration.
Anyone holding a link can join; links are bearer capabilities. Group pages use
noindex and no-referrer metadata.

## Transactional mutations

The 20261005 migration revokes table mutations from PUBLIC, anon and authenticated.
Use RPCs through repositories registered in `src/core/registry.ts`:

| RPC                    | Permission / behavior                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `create_group`         | Authenticated; atomic group, owner collaboration and 2–100 members                                                                   |
| `join_group`           | Authenticated with exact group ID; idempotent                                                                                        |
| `add_group_member`     | Owner; name 1–100 characters; maximum 100 members                                                                                    |
| `delete_group_member`  | Owner; at least two remain; referenced members cannot be removed                                                                     |
| `save_payment`         | Collaborator creates; owner edits; validates group membership, amount, unique nonempty participants, description; atomic replacement |
| `delete_group_payment` | Owner; explicit group/payment pair; missing rows are errors                                                                          |
| `set_rough_mode`       | Owner; missing or unauthorized groups are errors                                                                                     |

Functions use SECURITY DEFINER, empty search_path, fully qualified relations,
explicit auth.uid() checks and narrow EXECUTE grants. The internal lock_group
helper has no client EXECUTE grant. Group row locks serialize member and payment
mutations. The app does not use a service-role key.
Payment-member foreign keys use NO ACTION instead of deleting financial history.
Migration aborts on existing empty/cross-group payment membership or invalid amounts.
Investigate and repair historical data deliberately. Previously deleted history
cannot be reconstructed automatically.

## Reads and errors

`get_group_payments` uses invoker permissions and scalar JSON aggregation in one
SQL statement to avoid PostgREST row caps silently dropping settlement history.
It still loads full history; large groups need measured pagination/aggregation work.
Repositories map snake_case to camelCase and distinguish lookup errors from absence.
Dashboard failures must never appear as zero balances. Mutation errors shown to
users are generic; technical detail stays in server logs.

Use new SSR clients per request. src/proxy.ts invokes updateSession, which calls
auth.getClaims() to refresh cookies in both request and response. Browser clients
use lib/supabase/client; repositories use lib/supabase/server.

## Verification and rollout

`bun run test` includes PGlite PostgreSQL tests of migrations, grants, RLS,
rollback, cross-group references, owner restrictions and >1,000 payment reads.
Auth identity is stubbed; real Supabase Auth, PostgREST and multi-connection
concurrency require staging smoke tests.

Deploy both 20261005 migrations with the corresponding app in a maintenance window.
Old clients' direct table writes will be rejected. Back up and inspect existing
data first. Never restore public group SELECT as a rollback shortcut.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[database functions](https://supabase.com/docs/guides/database/functions),
[SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
