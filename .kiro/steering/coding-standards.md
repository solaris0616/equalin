---
inclusion: always
---

# Coding Standards for Equalin

## TypeScript Guidelines

### Type Safety
- Always use explicit types for function parameters and return values
- Avoid `any` type; use `unknown` if type is truly unknown
- Use strict mode (already enabled in tsconfig.json)
- Prefer interfaces for object shapes, types for unions/intersections

### Example
```typescript
// Good
interface PaymentFormData {
  description: string;
  amount: number;
  participantIds: string[];
}

function createPayment(data: PaymentFormData): Promise<{ success: boolean; error?: string }> {
  // implementation
}

// Avoid
function createPayment(data: any) {
  // implementation
}
```

## React Component Guidelines

### Component Structure
- Use functional components with hooks
- Prefer Server Components by default (no 'use client' unless needed)
- Add 'use client' only when using:
  - useState, useEffect, or other React hooks
  - Browser APIs (localStorage, clipboard)
  - Event handlers (onClick, onChange)

### Props and Types
```typescript
// Define props interface
interface PaymentFormProps {
  groupId: string;
  currentUserId: string;
  members: Profile[];
  onSuccess: () => void;
}

// Use in component
export function PaymentForm({ groupId, currentUserId, members, onSuccess }: PaymentFormProps) {
  // implementation
}
```

### State Management
- Use `useState` for local component state
- Use Server Actions for data mutations
- Avoid prop drilling; pass callbacks for actions

## Server Actions

### File Organization
- Place in `app/actions/` directory
- Group related actions in same file (e.g., `payments.ts`)
- Always mark with 'use server' directive

### Error Handling Pattern
```typescript
'use server';

export async function createPayment(
  groupId: string,
  payerId: string,
  amount: number,
  description: string,
  participantIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate inputs
    if (participantIds.length === 0) {
      return { success: false, error: 'Please select at least one participant' };
    }

    // Database operations
    const { data, error } = await supabase.from('payments').insert({
      group_id: groupId,
      payer_id: payerId,
      amount,
      description,
    });

    if (error) {
      console.error('Database error:', error);
      return { success: false, error: 'Failed to create payment. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

## Styling Guidelines

### Tailwind CSS
- Use Tailwind utility classes for styling
- Follow mobile-first approach (default styles for mobile, then `md:`, `lg:` for larger screens)
- Use custom theme colors from `tailwind.config.ts`
- Prefer semantic color names (e.g., `bg-primary`, `text-foreground`)

### Example
```tsx
<button className="w-full bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 transition">
  Submit
</button>
```

### Component Styling
- Keep styles inline with Tailwind classes
- Extract repeated patterns into reusable components
- Use `clsx` or `cn` utility for conditional classes

## Database Conventions

### Naming
- Tables: plural, snake_case (e.g., `payment_participants`)
- Columns: snake_case (e.g., `created_at`, `payer_id`)
- Foreign keys: `{table}_id` (e.g., `group_id`, `profile_id`)

### Migrations
- One migration per feature or change
- Name migrations descriptively: `YYYYMMDDHHMMSS_description.sql`
- Always include comments explaining purpose
- Use CASCADE DELETE for referential integrity

### Example Migration
```sql
-- Add payment_participants table for tracking expense sharing
CREATE TABLE payment_participants (
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, profile_id)
);

COMMENT ON TABLE payment_participants IS 'Tracks which users participate in each payment for split calculation';
```

## Code Formatting

### Biome Configuration
- Indentation: 2 spaces
- Quote style: single quotes for JavaScript/TypeScript
- Line length: default (80 characters recommended)
- Semicolons: required
- Trailing commas: as needed

### Running Formatter
```bash
bun run check:apply    # Auto-fix all issues
bun run format:apply   # Format only
```

### Pre-commit
- Always run `bun run check` before committing
- Fix all linting errors (warnings are acceptable if justified)

## Error Handling

### User-Facing Errors
- Provide clear, actionable error messages
- Avoid technical jargon
- Suggest solutions when possible

```typescript
// Good
return { success: false, error: 'Please select at least one participant' };

// Avoid
return { success: false, error: 'Validation failed: participants array empty' };
```

### Logging
- Log errors to console with context
- Include relevant data for debugging
- Never log sensitive information

```typescript
console.error('Failed to create payment:', {
  groupId,
  payerId,
  error: error.message
});
```

## Performance Best Practices

### Data Fetching
- Use Server Components for initial data loading
- Minimize client-side data fetching
- Use Supabase's `.select()` to fetch only needed columns

### Optimization
- Lazy load heavy components
- Use React.memo() for expensive renders (sparingly)
- Optimize images with Next.js Image component
- Minimize bundle size by importing only what's needed

## Accessibility

### ARIA and Semantics
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- Add ARIA labels for icon-only buttons
- Ensure keyboard navigation works
- Use Radix UI components for built-in accessibility

### Example
```tsx
<button
  onClick={handleCopy}
  aria-label="Copy group invitation link"
  className="..."
>
  <CopyIcon />
</button>
```

## Testing

### Test Runner
- Use **Bun's built-in test runner** (no additional dependencies required)
- Run tests with `bun test`
- Watch mode: `bun test --watch`
- Coverage: `bun test --coverage`

### Test File Naming
- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- Place tests next to source files or in `__tests__` directory

### Test Structure
Use Bun's test API with `describe`, `test`/`it`, and `expect`:

```typescript
import { describe, test, expect } from 'bun:test';
import { amountToInteger } from './currency';

describe('amountToInteger', () => {
  test('should convert decimal to cents', () => {
    expect(amountToInteger(100.50)).toBe(10050);
  });

  test('should handle zero', () => {
    expect(amountToInteger(0)).toBe(0);
  });

  test('should round to nearest cent', () => {
    expect(amountToInteger(100.555)).toBe(10056);
  });
});
```

### Running Tests
```bash
bun test                    # Run all tests
bun test settlement.test.ts # Run specific test file
bun test --watch           # Watch mode for development
bun test --coverage        # Generate coverage report
```

### Mocking
Use Bun's built-in mocking capabilities:

```typescript
import { mock } from 'bun:test';

const mockFn = mock((x: number) => x * 2);
mockFn(5); // returns 10
expect(mockFn).toHaveBeenCalledWith(5);
```

### Async Tests
```typescript
test('async operation', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Test Organization
- Group related tests with `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow AAA pattern: Arrange, Act, Assert
- Keep tests focused on a single behavior

### Example Test File
```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { calculateSettlements } from './settlement';

describe('calculateSettlements', () => {
  let payments: Payment[];

  beforeEach(() => {
    // Arrange: Set up test data
    payments = [
      { id: '1', payer_id: 'alice', amount: 3000, participants: ['alice', 'bob'] },
      { id: '2', payer_id: 'bob', amount: 5000, participants: ['alice', 'bob', 'charlie'] },
    ];
  });

  test('should calculate correct balances', () => {
    // Act
    const settlements = calculateSettlements(payments);

    // Assert
    expect(settlements).toHaveLength(2);
    expect(settlements[0].from).toBe('alice');
    expect(settlements[0].to).toBe('bob');
  });

  test('should return empty array for no payments', () => {
    const settlements = calculateSettlements([]);
    expect(settlements).toEqual([]);
  });
});
```

## Comments and Documentation

### When to Comment
- Complex algorithms or business logic
- Non-obvious workarounds
- Public API functions
- Type definitions for clarity

### JSDoc for Functions
```typescript
/**
 * Converts a decimal amount to integer cents for storage.
 * @param amount - The decimal amount (e.g., 100.50)
 * @returns The amount in cents (e.g., 10050)
 */
export function amountToInteger(amount: number): number {
  return Math.round(amount * 100);
}
```

### Avoid Obvious Comments
```typescript
// Bad
const total = a + b; // Add a and b

// Good (no comment needed)
const total = a + b;
```

## Git Commit Messages

### Conventional Commits Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Scope (Optional)
The scope provides additional contextual information:
- `payments`: Payment-related features
- `settlement`: Settlement calculation
- `ui`: User interface components
- `db`: Database changes
- `api`: API/Server Actions

### Breaking Changes
Add `!` after type/scope or add `BREAKING CHANGE:` in footer:
```
feat!: change payment amount storage to cents

BREAKING CHANGE: Payment amounts are now stored as integers (cents) instead of decimals
```

### Examples
```
feat(payments): add payment form with participant selection

Implements payment creation with description, amount input,
and checkbox list for selecting participants.

Closes #123
```

```
fix(payments): prevent negative amounts in payment form

Added validation to reject non-positive amounts and display
error message to user.
```

```
docs: add Supabase guidelines to steering files
```

```
refactor(settlement): optimize transaction minimization algorithm

Improved the greedy algorithm to reduce the number of
settlement transactions by 30% on average.
```

```
test(payments): add property-based tests for amount conversion
```

```
chore: update dependencies to latest versions
```

### Rules
- Use lowercase for type and description
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter of description
- No period at the end of description
- Body and footer are optional but recommended for complex changes
- Reference issues/PRs in footer when applicable
