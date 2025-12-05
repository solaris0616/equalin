# Design Document

## Overview

This design document outlines the technical implementation of the core bill-splitting functionality for Equalin. The system builds upon the existing group creation and user registration features to add payment tracking, participant management, and settlement calculation capabilities.

The implementation follows a client-server architecture using Next.js App Router with React Server Components and Server Actions for data mutations. The system uses Supabase (PostgreSQL) for data persistence and localStorage for client-side profile management.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Group Page   │  │ Payment Form │  │ Settlement   │      │
│  │ Component    │  │ Component    │  │ Display      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │ Server Actions │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Supabase Client │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   PostgreSQL DB  │
                    │  ┌─────────────┐ │
                    │  │   groups    │ │
                    │  │  profiles   │ │
                    │  │group_members│ │
                    │  │  payments   │ │
                    │  │payment_part.│ │
                    │  └─────────────┘ │
                    └──────────────────┘
```

### Component Structure

- **Client Components**: Handle user interactions, form state, and UI updates
- **Server Actions**: Process data mutations and complex queries
- **Database Layer**: Supabase client for database operations
- **Utility Functions**: Amount formatting, settlement calculation algorithms

## Components and Interfaces

### 1. Database Schema Extension

Add the `payment_participants` table to track which users share each expense:

```sql
CREATE TABLE payment_participants (
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, profile_id)
);
```

### 2. Type Definitions

```typescript
// Core types
type Profile = {
  id: string;
  name: string;
};

type Payment = {
  id: string;
  group_id: string;
  payer_id: string;
  amount: number; // stored as integer (cents)
  description: string | null;
  created_at: string;
};

type PaymentParticipant = {
  payment_id: string;
  profile_id: string;
};

// Extended types for display
type PaymentWithDetails = Payment & {
  payer_name: string;
  participant_names: string[];
};

type MemberBalance = {
  profile_id: string;
  name: string;
  paid: number;
  owed: number;
  balance: number; // paid - owed
};

type SettlementTransaction = {
  from: string; // profile name
  to: string; // profile name
  amount: number;
};

// Language types
type Language = 'en' | 'ja' | 'zh' | 'ko';

type TranslationKey = string; // e.g., "payment.addPayment"

type Translations = {
  [key: string]: string | Translations; // supports nested keys
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
};
```

### 3. Server Actions

```typescript
// app/actions/payments.ts
'use server';

export async function createPayment(
  groupId: string,
  payerId: string,
  amount: number,
  description: string,
  participantIds: string[]
): Promise<{ success: boolean; error?: string }>;

export async function deletePayment(
  paymentId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }>;

export async function getGroupPayments(
  groupId: string
): Promise<PaymentWithDetails[]>;

export async function getGroupMembers(
  groupId: string
): Promise<Profile[]>;

export async function calculateSettlement(
  groupId: string
): Promise<SettlementTransaction[]>;
```

### 4. UI Components

```typescript
// PaymentForm Component
interface PaymentFormProps {
  groupId: string;
  currentUserId: string;
  members: Profile[];
  onSuccess: () => void;
}

// PaymentList Component
interface PaymentListProps {
  payments: PaymentWithDetails[];
  onDelete: (paymentId: string) => Promise<void>;
}

// PaymentListItem Component (internal)
interface PaymentListItemProps {
  payment: PaymentWithDetails;
  onDelete: (paymentId: string) => Promise<void>;
}

// SettlementDisplay Component
interface SettlementDisplayProps {
  transactions: SettlementTransaction[];
}

// InviteLinkButton Component
interface InviteLinkButtonProps {
  groupId: string;
}

// LanguageSelector Component
interface LanguageSelectorProps {
  className?: string;
}

// LanguageProvider Component
interface LanguageProviderProps {
  children: React.ReactNode;
}
```

## Data Models

### Amount Representation

Amounts are stored as integers representing the smallest currency unit (cents for USD, yen for JPY, etc.):
- Input: User enters `100.50`
- Storage: Stored as `10050` (integer)
- Display: Formatted as `100.50`

This approach avoids floating-point precision issues in financial calculations.

### Payment Participant Relationship

The `payment_participants` table creates a many-to-many relationship between payments and profiles:
- One payment can have multiple participants
- One profile can participate in multiple payments
- The payer can be included or excluded from participants

### Settlement Calculation Model

The settlement algorithm follows these steps:

1. **Calculate balances**: For each member, compute `balance = total_paid - total_owed`
2. **Separate creditors and debtors**:
   - Creditors: members with positive balance (should receive money)
   - Debtors: members with negative balance (should pay money)
3. **Minimize transactions**: Use a greedy algorithm to match debtors with creditors
   - Sort both lists by absolute balance (descending)
   - Match largest debtor with largest creditor
   - Continue until all balances are settled

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 7.1, 7.2, and 7.3 (calculating paid, owed, and balance) are all part of the settlement calculation and can be combined into comprehensive settlement properties
- Properties 6.2 and 6.3 (displaying payment details and timestamp) can be combined into a single property about complete payment information display
- Properties 9.2 and 9.3 (storing as integer and displaying as decimal) form a round-trip property

### Core Properties

Property 1: Payment participant cascade deletion
*For any* payment with participants, when the payment is deleted, all associated participant records should also be deleted
**Validates: Requirements 3.2**

Property 2: Profile participant cascade deletion
*For any* profile that participates in payments, when the profile is deleted, all associated participant records should also be deleted
**Validates: Requirements 3.3**

Property 3: Valid payment creation
*For any* valid payment data (positive amount, valid payer, valid group), submitting the payment should create a record with the correct payer_id
**Validates: Requirements 4.3**

Property 4: Invalid amount rejection
*For any* non-positive amount (zero or negative), attempting to create a payment should be rejected with an error
**Validates: Requirements 4.5**

Property 5: Participant persistence
*For any* payment submission with selected participants, all selected participant IDs should be saved to the payment_participants table
**Validates: Requirements 5.3**

Property 6: Payer participation flexibility
*For any* payment, the payer can be either included or excluded from the participant list, and the system should handle both cases correctly
**Validates: Requirements 5.5**

Property 7: Payment list completeness
*For any* group with payments, all payments belonging to that group should appear in the payment list
**Validates: Requirements 6.1**

Property 8: Payment display completeness
*For any* payment displayed, the rendered output should contain the payer name, description, amount, participant names, and creation timestamp
**Validates: Requirements 6.2, 6.3**

Property 9: Payment chronological ordering
*For any* set of payments in a group, they should be displayed in descending order by creation timestamp (newest first)
**Validates: Requirements 6.4**

Property 10: Settlement balance calculation
*For any* group with payments, each member's balance should equal their total amount paid minus their total share of expenses (sum of payment_amount / participant_count for all payments they participated in)
**Validates: Requirements 7.1, 7.2, 7.3**

Property 11: Settlement debt resolution
*For any* set of settlement transactions, executing all transactions should result in all member balances becoming zero
**Validates: Requirements 7.4**

Property 12: Clipboard copy functionality
*For any* group URL, clicking the copy button should place that exact URL in the clipboard
**Validates: Requirements 8.2**

Property 13: URL format consistency
*For any* group ID, the generated URL should match the pattern `/group/[group-id]`
**Validates: Requirements 8.4**

Property 14: Decimal amount acceptance
*For any* decimal number with up to 2 decimal places and within the valid range, the system should accept it as a valid payment amount
**Validates: Requirements 9.1**

Property 15: Amount storage round-trip
*For any* amount entered by the user, storing it as an integer (cents) and then displaying it should preserve the value with exactly 2 decimal places
**Validates: Requirements 9.2, 9.3**

Property 16: Payment deletion removes record
*For any* payment in the database, when that payment is deleted, querying for that payment ID should return no results
**Validates: Requirements 10.3**

Property 17: Payment deletion cascades to participants
*For any* payment with associated participant records, when the payment is deleted, all participant records with that payment_id should also be deleted
**Validates: Requirements 10.4**

Property 18: Settlement recalculation after deletion
*For any* group with payments, deleting a payment should result in settlement calculations that reflect only the remaining payments
**Validates: Requirements 10.6**

Property 19: Language selection updates translations
*For any* supported language (en, ja, zh, ko), when that language is selected, all translation keys should return text in the selected language
**Validates: Requirements 11.2**

Property 20: Language preference persistence round-trip
*For any* supported language, when a user selects that language, it should be stored in localStorage, and upon reloading the application, the same language should be loaded
**Validates: Requirements 11.4, 11.5**

Property 21: Translation completeness
*For any* translation key defined in the English translation file, all supported languages (ja, zh, ko) should have a corresponding non-empty translation
**Validates: Requirements 11.7**

Property 22: User content language independence
*For any* user-generated content (payment descriptions), changing the interface language should not modify the content
**Validates: Requirements 11.8**

## Error Handling

### Input Validation Errors

- **Empty participant list**: Display error "Please select at least one participant"
- **Non-positive amount**: Display error "Amount must be greater than zero"
- **Amount too large**: Display error "Amount exceeds maximum allowed value"
- **Invalid decimal format**: Display error "Please enter a valid amount"

### Database Errors

- **Failed payment creation**: Display error "Failed to create payment. Please try again."
- **Failed participant save**: Rollback payment creation, display error "Failed to save participants. Please try again."
- **Failed to load payments**: Display error "Failed to load payment history"
- **Failed to load members**: Display error "Failed to load group members"
- **Failed payment deletion**: Display error "Failed to delete payment. Please try again."

### Translation Errors

- **Missing translation key**: Fall back to English translation
- **Missing language file**: Fall back to English
- **Invalid language code**: Ignore and keep current language

### Edge Cases

- **Empty payment list**: Display friendly message "No payments yet. Add your first payment to get started!"
- **Single member group**: Allow payment creation but settlement will show no transactions needed
- **Zero balance settlement**: Display message "All settled! No payments needed."
- **Rounding amounts**: Round to 2 decimal places using banker's rounding (round half to even)

## Testing Strategy

### Unit Testing

Unit tests will cover specific examples and edge cases:

1. **Amount conversion functions**
   - Test converting 100.50 to 10050 (cents)
   - Test converting 10050 back to "100.50"
   - Test rounding 100.555 to 100.56

2. **Settlement algorithm**
   - Test simple 2-person split
   - Test 3-person uneven split
   - Test case where payer is not a participant
   - Test empty payment list returns empty transactions

3. **Form validation**
   - Test empty participant list rejection
   - Test zero amount rejection
   - Test negative amount rejection
   - Test empty description acceptance

4. **UI component rendering**
   - Test payment list displays all payments
   - Test empty state message
   - Test settlement display formatting
   - Test delete button appears for each payment
   - Test language selector displays all supported languages

5. **Payment deletion**
   - Test delete confirmation dialog appears
   - Test payment removed from list after deletion
   - Test settlement updates after deletion

6. **Translation functions**
   - Test translation lookup with valid key returns correct text
   - Test translation lookup with missing key falls back to English
   - Test nested key support (e.g., "payment.addPayment")
   - Test default language is English when no preference exists
   - Test each supported language (en, ja, zh, ko) has required keys

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript/TypeScript property testing library).

Each property-based test will:
- Run a minimum of 100 iterations with random data
- Be tagged with a comment referencing the design document property
- Use the format: `**Feature: bill-splitting-core, Property {number}: {property_text}**`

Property tests to implement:

1. **Property 3: Valid payment creation** - Generate random valid payment data, verify correct storage
2. **Property 4: Invalid amount rejection** - Generate random non-positive amounts, verify rejection
3. **Property 5: Participant persistence** - Generate random participant selections, verify all saved
4. **Property 6: Payer participation flexibility** - Generate payments with payer included/excluded, verify both work
5. **Property 7: Payment list completeness** - Generate random payments, verify all appear in list
6. **Property 8: Payment display completeness** - Generate random payments, verify all fields displayed
7. **Property 9: Payment chronological ordering** - Generate payments with random timestamps, verify sort order
8. **Property 10: Settlement balance calculation** - Generate random payments and participants, verify balance formula
9. **Property 11: Settlement debt resolution** - Generate random payments, verify settlement transactions sum to zero
10. **Property 14: Decimal amount acceptance** - Generate random valid decimal amounts, verify acceptance
11. **Property 15: Amount storage round-trip** - Generate random amounts, verify storage and display preserve value
12. **Property 16: Payment deletion removes record** - Generate random payments, delete them, verify they no longer exist
13. **Property 17: Payment deletion cascades to participants** - Generate payments with participants, delete payment, verify participants removed
14. **Property 18: Settlement recalculation after deletion** - Generate payments, delete one, verify settlement reflects remaining payments
15. **Property 19: Language selection updates translations** - For each language, verify all keys return text in that language
16. **Property 20: Language preference persistence round-trip** - Select random language, reload, verify same language loaded
17. **Property 21: Translation completeness** - Verify all keys in English exist in all other languages with non-empty values
18. **Property 22: User content language independence** - Generate payment descriptions, switch languages, verify descriptions unchanged

### Integration Testing

Integration tests will verify end-to-end workflows:

1. Create payment → verify in database → verify in payment list
2. Create payment with participants → verify participants in database
3. Delete payment → verify participants also deleted → verify settlement updates
4. Calculate settlement → verify transactions balance all debts
5. Copy group link → verify clipboard contains correct URL
6. Delete payment → verify removed from list → verify settlement recalculated
7. Switch language → verify UI text updates → verify user content unchanged
8. Select language → reload page → verify language persists

### Testing Framework Configuration

```typescript
// vitest.config.ts or jest.config.js
export default {
  testEnvironment: 'jsdom', // for React component tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};

// test/setup.ts
import fc from 'fast-check';

// Configure fast-check for property tests
fc.configureGlobal({
  numRuns: 100, // minimum 100 iterations per property test
});
```

## Implementation Notes

### Database Migration

Create a new migration file to add the `payment_participants` table:

```sql
-- supabase/migrations/[timestamp]_add_payment_participants.sql
CREATE TABLE payment_participants (
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, profile_id)
);

COMMENT ON TABLE payment_participants IS 'Tracks which users participate in each payment for split calculation';
```

### Settlement Algorithm Implementation

The settlement calculation uses a greedy algorithm to minimize transactions:

```typescript
function calculateSettlement(balances: MemberBalance[]): SettlementTransaction[] {
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const transactions: SettlementTransaction[] = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    transactions.push({
      from: debtor.name,
      to: creditor.name,
      amount: amount
    });

    creditor.balance -= amount;
    debtor.balance += amount;

    if (creditor.balance === 0) i++;
    if (debtor.balance === 0) j++;
  }

  return transactions;
}
```

### Amount Formatting Utilities

```typescript
// Convert user input (decimal) to storage format (integer cents)
export function amountToInteger(amount: number): number {
  return Math.round(amount * 100);
}

// Convert storage format (integer cents) to display format (decimal)
export function integerToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

// Validate amount input
export function isValidAmount(amount: number): boolean {
  return amount > 0 && amount <= 999999999.99;
}
```

### Server Action Error Handling Pattern

```typescript
export async function createPayment(...): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate inputs
    if (participantIds.length === 0) {
      return { success: false, error: 'Please select at least one participant' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }

    // Database operations
    const { data, error } = await supabase.from('payments').insert(...);

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

### Payment Deletion Implementation

```typescript
export async function deletePayment(
  paymentId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Delete payment (CASCADE will handle participants)
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('group_id', groupId); // Verify payment belongs to group

    if (error) {
      console.error('Database error:', error);
      return { success: false, error: 'Failed to delete payment. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

### Translation Lookup Implementation

```typescript
// lib/i18n/useTranslation.ts
export function useTranslation() {
  const { language, t } = useLanguage();
  return { t, language };
}

// Translation lookup with nested key support
function getNestedTranslation(obj: Translations, path: string): string | undefined {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

// Main translation function with fallback
function translate(key: string, language: Language, translations: Record<Language, Translations>): string {
  // Try to get translation in selected language
  const translation = getNestedTranslation(translations[language], key);
  if (translation) return translation;

  // Fallback to English
  const fallback = getNestedTranslation(translations.en, key);
  if (fallback) return fallback;

  // Return key if no translation found
  return key;
}
```

## Payment Deletion Design

### Server Action

```typescript
// app/actions/payments.ts
export async function deletePayment(
  paymentId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }>;
```

### UI Component Updates

The `PaymentList` component will be updated to include a delete button for each payment:

```typescript
interface PaymentListItemProps {
  payment: PaymentWithDetails;
  onDelete: (paymentId: string) => void;
}
```

### Deletion Flow

1. User clicks delete button on a payment
2. System displays confirmation dialog
3. On confirmation, call `deletePayment` server action
4. Server action deletes payment (CASCADE deletes participants automatically)
5. Refresh payment list and settlement display

### Confirmation Dialog

Use a simple browser `confirm()` dialog or implement a custom modal:
- Message: "Are you sure you want to delete this payment? This action cannot be undone."
- Buttons: "Cancel" and "Delete"

## Multi-Language Support Design

### Architecture

The multi-language support will use a client-side internationalization approach:

```
┌─────────────────────────────────────────┐
│         Client (Browser)                │
│  ┌────────────────────────────────┐    │
│  │  Language Context Provider     │    │
│  │  - Current language state      │    │
│  │  - Translation function        │    │
│  │  - Language switcher           │    │
│  └────────────────────────────────┘    │
│              │                          │
│  ┌───────────▼──────────────────┐      │
│  │  Translation Files (JSON)    │      │
│  │  - en.json (English)         │      │
│  │  - ja.json (Japanese)        │      │
│  │  - zh.json (Chinese)         │      │
│  │  - ko.json (Korean)          │      │
│  └──────────────────────────────┘      │
│              │                          │
│  ┌───────────▼──────────────────┐      │
│  │  localStorage                │      │
│  │  Key: "equalin_language"    │      │
│  └──────────────────────────────┘      │
└─────────────────────────────────────────┘
```

### Translation File Structure

```typescript
// lib/i18n/translations/en.json
{
  "common": {
    "add": "Add",
    "delete": "Delete",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save"
  },
  "payment": {
    "title": "Payments",
    "addPayment": "Add Payment",
    "description": "Description",
    "amount": "Amount",
    "payer": "Payer",
    "participants": "Participants",
    "deleteConfirm": "Are you sure you want to delete this payment? This action cannot be undone.",
    "noPayments": "No payments yet. Add your first payment to get started!"
  },
  "settlement": {
    "title": "Settlement",
    "from": "From",
    "to": "To",
    "amount": "Amount",
    "allSettled": "All settled! No payments needed."
  },
  "errors": {
    "selectParticipants": "Please select at least one participant",
    "positiveAmount": "Amount must be greater than zero",
    "createPaymentFailed": "Failed to create payment. Please try again.",
    "deletePaymentFailed": "Failed to delete payment. Please try again."
  }
}
```

### Language Context

```typescript
// lib/i18n/LanguageContext.tsx
'use client';

type Language = 'en' | 'ja' | 'zh' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('equalin_language') as Language;
    if (saved && ['en', 'ja', 'zh', 'ko'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('equalin_language', lang);
  };

  const t = (key: string): string => {
    // Translation lookup logic
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
```

### Language Selector Component

```typescript
// components/LanguageSelector.tsx
'use client';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
  ];

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      className={className}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  );
}
```

### Translation Keys Organization

Translation keys will be organized hierarchically:
- `common.*`: Shared UI elements (buttons, labels)
- `payment.*`: Payment-related text
- `settlement.*`: Settlement-related text
- `group.*`: Group-related text
- `errors.*`: Error messages
- `validation.*`: Validation messages

### Implementation Approach

1. **Simple JSON-based approach**: Store translations in JSON files, load based on selected language
2. **No build-time compilation**: Keep it simple, load translations at runtime
3. **Fallback to English**: If a translation key is missing, fall back to English
4. **Nested key support**: Support dot notation for nested keys (e.g., `payment.addPayment`)

## Performance Considerations

- **Payment list pagination**: For groups with many payments, implement pagination or virtual scrolling
- **Settlement calculation caching**: Cache settlement results and invalidate on new payment
- **Optimistic UI updates**: Update UI immediately, rollback on error
- **Database indexes**: Add indexes on `group_id` and `created_at` for payment queries
- **Translation loading**: Load all translations at once (small file size), cache in memory

## Security Considerations

- **Input sanitization**: Validate all user inputs on server side
- **SQL injection prevention**: Use parameterized queries (Supabase client handles this)
- **Amount limits**: Enforce maximum amount to prevent overflow
- **Group access**: Verify user is a member before allowing payment operations (future enhancement)
- **XSS prevention**: Sanitize user-generated content (payment descriptions) when displaying
