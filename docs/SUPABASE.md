---
inclusion: always
---

# Supabase Guidelines for Equalin

## Client Configuration

### Client Types

We use two types of Supabase clients:

1. **Browser Client** (`lib/supabase/client.ts`)
   - For Client Components
   - Uses `createBrowserClient` from `@supabase/ssr`
   - Accesses environment variables directly

2. **Server Client** (`lib/supabase/server.ts`)
   - For Server Components and Server Actions
   - Uses `createServerClient` from `@supabase/ssr`
   - Handles cookies for session management
   - **Important**: Always create a new instance, never store in global variable

### Usage Examples

```typescript
// In Client Component
'use client';
import { createClient } from '@/lib/supabase/client';

export function MyComponent() {
  const supabase = createClient();
  // use supabase client
}

// In Server Component or Server Action
'use server';
import { createClient } from '@/lib/supabase/server';

export async function myAction() {
  const supabase = await createClient();
  // use supabase client
}
```

## Database Operations

### Querying Data

#### Select with Joins
```typescript
// Fetch payments with payer information
const { data, error } = await supabase
  .from('payments')
  .select(`
    *,
    payer:profiles!payer_id(id, name),
    participants:payment_participants(
      profile:profiles(id, name)
    )
  `)
  .eq('group_id', groupId)
  .order('created_at', { ascending: false });
```

#### Filtering
```typescript
// Get members of a specific group
const { data, error } = await supabase
  .from('group_members')
  .select('profile:profiles(id, name)')
  .eq('group_id', groupId);
```

### Inserting Data

#### Single Insert
```typescript
const { data, error } = await supabase
  .from('payments')
  .insert({
    group_id: groupId,
    payer_id: payerId,
    amount: amountInCents,
    description: description || null,
  })
  .select()
  .single();
```

#### Multiple Inserts
```typescript
// Insert multiple participants
const participants = participantIds.map(profileId => ({
  payment_id: paymentId,
  profile_id: profileId,
}));

const { error } = await supabase
  .from('payment_participants')
  .insert(participants);
```

### Updating Data

```typescript
const { error } = await supabase
  .from('payments')
  .update({ description: newDescription })
  .eq('id', paymentId);
```

### Deleting Data

```typescript
// Delete will cascade to payment_participants due to ON DELETE CASCADE
const { error } = await supabase
  .from('payments')
  .delete()
  .eq('id', paymentId);
```

## Error Handling

### Check for Errors
Always check the `error` object returned by Supabase operations:

```typescript
const { data, error } = await supabase
  .from('payments')
  .select('*');

if (error) {
  console.error('Database error:', error);
  return { success: false, error: 'Failed to fetch payments' };
}

// Use data safely here
```

### Common Error Scenarios

1. **Constraint Violations**
   - Duplicate primary key
   - Foreign key violation
   - Check constraint failure

2. **Permission Errors**
   - Row Level Security (RLS) policies blocking access
   - Missing table permissions

3. **Network Errors**
   - Connection timeout
   - Network unavailable

### Error Response Pattern

```typescript
try {
  const { data, error } = await supabase.from('table').insert(data);

  if (error) {
    // Log technical details
    console.error('Supabase error:', error.message, error.details);

    // Return user-friendly message
    return {
      success: false,
      error: 'Failed to save data. Please try again.'
    };
  }

  return { success: true, data };
} catch (error) {
  console.error('Unexpected error:', error);
  return {
    success: false,
    error: 'An unexpected error occurred'
  };
}
```

## Type Safety

### Generate Types from Database

```bash
# Generate TypeScript types from Supabase schema
supabase gen types typescript --local > types/supabase.ts
```

### Use Generated Types

```typescript
import { Database } from '@/types/supabase';

type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type PaymentUpdate = Database['public']['Tables']['payments']['Update'];
```

### Custom Types

For complex queries with joins, define custom types:

```typescript
type PaymentWithDetails = {
  id: string;
  group_id: string;
  payer_id: string;
  amount: number;
  description: string | null;
  created_at: string;
  payer_name: string;
  participant_names: string[];
};
```

## Migrations

### Creating Migrations

```bash
# Create a new migration
supabase migration new add_payment_participants_table
```

### Migration Best Practices

1. **One Change Per Migration**
   - Keep migrations focused on a single feature or change
   - Easier to review and rollback if needed

2. **Include Comments**
   ```sql
   -- Add payment_participants table for tracking expense sharing
   CREATE TABLE payment_participants (
     payment_id TEXT REFERENCES payments(id) ON DELETE CASCADE,
     profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
     PRIMARY KEY (payment_id, profile_id)
   );
   ```

3. **Use Constraints**
   - PRIMARY KEY for uniqueness
   - FOREIGN KEY with CASCADE for referential integrity
   - CHECK constraints for data validation
   - NOT NULL where appropriate

4. **Add Indexes**
   ```sql
   -- Add index for faster queries
   CREATE INDEX idx_payments_group_id ON payments(group_id);
   CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
   ```

5. **Add Table Comments**
   ```sql
   COMMENT ON TABLE payment_participants IS 'Tracks which users participate in each payment for split calculation';
   COMMENT ON COLUMN payments.amount IS 'Amount in smallest currency unit (cents)';
   ```

### Testing Migrations Locally

```bash
# Reset local database and apply all migrations
supabase db reset

# Check migration status
supabase migration list
```

### Applying Migrations to Production

```bash
# Push migrations to remote Supabase project
supabase db push
```

## Row Level Security (RLS)

### Current Status
- **Strictly Enforced**: All tables have RLS enabled.
- **Anonymous Auth**: Using Supabase's Anonymous Auth. Anonymous users have the `authenticated` role but are restricted by group-level policies.

### Core Policy Patterns

#### Group-based Access
Most data is protected by checking if the user is a member of the group:
```sql
CREATE POLICY "Members can see group payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = payments.group_id AND profile_id = auth.uid()
    )
  );
```

#### Avoiding Recursion
In `group_members`, avoid recursive SELECT policies. Instead, use a simpler policy for membership listing while protecting individual's names in the `profiles` table.

#### Management Access
Only the creator/payer of a record should be allowed to DELETE or UPDATE it:
```sql
CREATE POLICY "Payers can delete their own payments" ON payments
  FOR DELETE USING (auth.uid() = payer_id);
```

### Common Issues & Solutions

1. **"infinite recursion detected"**
   - Occurs when an RLS policy for Table A queries Table A.
   - Solution: Simplify the `USING` clause or use a different table to verify permissions.

2. **"duplicate key value violates unique constraint"**
   - Often occurs during fast delete-then-insert operations.
   - Solution: Use `.upsert()` for relational junction tables like `payment_participants`.

3. **"new row violates row-level security policy"**
   - Ensure the policy allows all necessary actions for a command (e.g., `upsert` needs both `INSERT` and `UPDATE` permissions).
   - Check `auth.uid()` matches the ID being inserted.

