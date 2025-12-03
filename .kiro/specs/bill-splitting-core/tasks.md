# Implementation Plan

- [x] 1. Add payment_participants table to database
  - Create new Supabase migration file
  - Add CREATE TABLE statement with CASCADE DELETE constraints
  - Add PRIMARY KEY constraint for uniqueness
  - Run migration to update database schema
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Create utility functions for amount handling
  - Create `lib/utils/currency.ts` file
  - Implement `amountToInteger()` function to convert decimal to cents
  - Implement `integerToAmount()` function to convert cents to decimal string
  - Implement `isValidAmount()` validation function
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 2.1 Write property test for amount round-trip
  - **Property 15: Amount storage round-trip**
  - **Validates: Requirements 9.2, 9.3**

- [x] 3. Create Server Actions for payment operations
  - Create `app/actions/payments.ts` file
  - Implement `createPayment()` action with validation and error handling
  - Implement `getGroupPayments()` action to fetch payments with payer and participant details
  - Implement `getGroupMembers()` action to fetch all members of a group
  - Add proper TypeScript types for all actions
  - _Requirements: 4.3, 4.4, 4.5, 5.3, 6.1, 6.2_

- [ ]* 3.1 Write property test for valid payment creation
  - **Property 3: Valid payment creation**
  - **Validates: Requirements 4.3**

- [ ]* 3.2 Write property test for invalid amount rejection
  - **Property 4: Invalid amount rejection**
  - **Validates: Requirements 4.5**

- [ ]* 3.3 Write property test for participant persistence
  - **Property 5: Participant persistence**
  - **Validates: Requirements 5.3**

- [ ] 4. Create PaymentForm component
  - Create `app/group/[id]/components/PaymentForm.tsx` file
  - Add form state management for description, amount, and participant selection
  - Implement member list with checkboxes (all pre-selected by default)
  - Add amount input with decimal validation
  - Add form submission handler that calls `createPayment()` action
  - Add error display for validation failures
  - Add loading state during submission
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.1 Write property test for payer participation flexibility
  - **Property 6: Payer participation flexibility**
  - **Validates: Requirements 5.5**

- [ ] 5. Create PaymentList component
  - Create `app/group/[id]/components/PaymentList.tsx` file
  - Display list of payments with payer name, description, amount, and participants
  - Format amounts using `integerToAmount()` utility
  - Display creation timestamp in readable format
  - Show empty state message when no payments exist
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ]* 5.1 Write property test for payment list completeness
  - **Property 7: Payment list completeness**
  - **Validates: Requirements 6.1**

- [ ]* 5.2 Write property test for payment display completeness
  - **Property 8: Payment display completeness**
  - **Validates: Requirements 6.2, 6.3**

- [ ]* 5.3 Write property test for payment chronological ordering
  - **Property 9: Payment chronological ordering**
  - **Validates: Requirements 6.4**

- [ ] 6. Implement settlement calculation logic
  - Create `lib/utils/settlement.ts` file
  - Implement function to calculate each member's total paid
  - Implement function to calculate each member's total owed (share of expenses)
  - Implement function to compute balances (paid - owed)
  - Implement greedy algorithm to generate minimal settlement transactions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 6.1 Write property test for settlement balance calculation
  - **Property 10: Settlement balance calculation**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ]* 6.2 Write property test for settlement debt resolution
  - **Property 11: Settlement debt resolution**
  - **Validates: Requirements 7.4**

- [ ] 7. Create Server Action for settlement calculation
  - Add `calculateSettlement()` action to `app/actions/payments.ts`
  - Fetch all payments and participants for the group
  - Use settlement utility functions to compute transactions
  - Return list of settlement transactions
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Create SettlementDisplay component
  - Create `app/group/[id]/components/SettlementDisplay.tsx` file
  - Add button to trigger settlement calculation
  - Display loading state during calculation
  - Show list of transactions (who pays whom and how much)
  - Format amounts using `integerToAmount()` utility
  - Show "All settled!" message when no transactions needed
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9. Create InviteLinkButton component
  - Create `app/group/[id]/components/InviteLinkButton.tsx` file
  - Display current group URL
  - Add copy button that uses Clipboard API
  - Show success confirmation message after copy
  - Handle clipboard API errors gracefully
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 9.1 Write property test for clipboard copy functionality
  - **Property 12: Clipboard copy functionality**
  - **Validates: Requirements 8.2**

- [ ]* 9.2 Write property test for URL format consistency
  - **Property 13: URL format consistency**
  - **Validates: Requirements 8.4**

- [ ] 10. Integrate all components into group page
  - Update `app/group/[id]/page.tsx` to import all new components
  - Fetch group members on page load
  - Fetch payments on page load
  - Add PaymentForm component with toggle to show/hide
  - Add PaymentList component to display payment history
  - Add SettlementDisplay component
  - Add InviteLinkButton component
  - Implement refresh logic after payment creation
  - _Requirements: 4.1, 6.1, 8.1_

- [ ] 11. Add TypeScript type definitions
  - Create `types/payment.ts` file
  - Define `Payment`, `PaymentParticipant`, `PaymentWithDetails` types
  - Define `MemberBalance`, `SettlementTransaction` types
  - Export all types for use across the application
  - _Requirements: All_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 13. Setup testing framework
  - Install fast-check library for property-based testing
  - Create test setup file with fast-check configuration (100 iterations minimum)
  - Create test utilities for generating random test data
  - _Requirements: All_

- [ ]* 14. Write unit tests for edge cases
  - Test empty description acceptance
  - Test zero participant rejection
  - Test amount rounding with >2 decimal places
  - Test maximum amount boundary
  - Test empty payment list display
  - Test single member group settlement
  - _Requirements: 4.4, 5.4, 6.5, 9.4, 9.5_

- [ ]* 15. Write integration tests
  - Test complete payment creation flow (form → database → list)
  - Test payment with participants (verify participants saved)
  - Test payment deletion cascades to participants
  - Test profile deletion cascades to participants
  - Test end-to-end settlement calculation
  - Test copy link to clipboard
  - _Requirements: 3.2, 3.3, All_

- [ ]* 15.1 Write property test for payment participant cascade deletion
  - **Property 1: Payment participant cascade deletion**
  - **Validates: Requirements 3.2**

- [ ]* 15.2 Write property test for profile participant cascade deletion
  - **Property 2: Profile participant cascade deletion**
  - **Validates: Requirements 3.3**

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
