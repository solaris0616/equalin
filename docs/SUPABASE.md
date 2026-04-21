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
- RLS is not currently enabled for Equalin (anonymous access model)
- All tables are publicly accessible via the anon key

### Future Considerations
If authentication is added later, enable RLS:

```sql
-- Enable RLS on a table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view payments in their groups"
  ON payments
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE profile_id = auth.uid()
    )
  );
```

## Performance Optimization

### Query Optimization

1. **Select Only Needed Columns**
   ```typescript
   // Good
   .select('id, name, created_at')

   // Avoid (unless you need all columns)
   .select('*')
   ```

2. **Use Indexes**
   - Add indexes on frequently queried columns
   - Especially for foreign keys and timestamp columns

3. **Limit Results**
   ```typescript
   .select('*')
   .limit(50)
   .range(0, 49) // For pagination
   ```

4. **Use Filters Efficiently**
   ```typescript
   // Apply filters before joins when possible
   .select('*')
   .eq('group_id', groupId)
   .order('created_at', { ascending: false })
   ```

### Connection Pooling

- Supabase handles connection pooling automatically
- Use the provided connection string from Supabase dashboard
- For serverless environments, use the pooler connection string

## Real-time Subscriptions (Future)

If real-time updates are needed:

```typescript
// Subscribe to payment changes
const subscription = supabase
  .channel('payments')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'payments',
      filter: `group_id=eq.${groupId}`,
    },
    (payload) => {
      console.log('New payment:', payload.new);
      // Update UI
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

## Environment Variables

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Security Notes

- The `NEXT_PUBLIC_` prefix makes these variables available in the browser
- The anon key is safe to expose (protected by RLS policies)
- Never expose the service role key in client-side code
- Store sensitive keys in `.env.local` (not committed to git)

## Common Patterns

### Transaction-like Operations

Supabase doesn't support transactions in the client, but you can:

1. **Use Database Functions**
   ```sql
   CREATE OR REPLACE FUNCTION create_payment_with_participants(
     p_group_id TEXT,
     p_payer_id TEXT,
     p_amount BIGINT,
     p_description TEXT,
     p_participant_ids TEXT[]
   ) RETURNS TEXT AS $$
   DECLARE
     v_payment_id TEXT;
   BEGIN
     -- Insert payment
     INSERT INTO payments (group_id, payer_id, amount, description)
     VALUES (p_group_id, p_payer_id, p_amount, p_description)
     RETURNING id INTO v_payment_id;

     -- Insert participants
     INSERT INTO payment_participants (payment_id, profile_id)
     SELECT v_payment_id, unnest(p_participant_ids);

     RETURN v_payment_id;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Handle Rollback in Application**
   ```typescript
   const { data: payment, error: paymentError } = await supabase
     .from('payments')
     .insert(paymentData)
     .select()
     .single();

   if (paymentError) {
     return { success: false, error: 'Failed to create payment' };
   }

   const { error: participantsError } = await supabase
     .from('payment_participants')
     .insert(participantData);

   if (participantsError) {
     // Rollback: delete the payment
     await supabase.from('payments').delete().eq('id', payment.id);
     return { success: false, error: 'Failed to add participants' };
   }
   ```

## Debugging

### Enable Logging

```typescript
// In development, log all queries
const supabase = createClient();

if (process.env.NODE_ENV === 'development') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session);
  });
}
```

### Common Issues

1. **"relation does not exist"**
   - Migration not applied
   - Wrong schema/table name
   - Solution: Run `supabase db reset`

2. **"null value in column violates not-null constraint"**
   - Missing required field in insert
   - Solution: Check table schema and provide all required fields

3. **"duplicate key value violates unique constraint"**
   - Trying to insert duplicate primary key
   - Solution: Use `.upsert()` or check for existing records first

4. **Empty results when data exists**
   - RLS policy blocking access (if enabled)
   - Wrong filter conditions
   - Solution: Check RLS policies and query filters
