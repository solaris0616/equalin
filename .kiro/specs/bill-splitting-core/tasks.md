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

- [x] 4. Create PaymentForm component
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

- [x] 5. Create PaymentList component
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

- [x] 6. Implement settlement calculation logic
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

- [x] 7. Create Server Action for settlement calculation
  - Add `calculateSettlement()` action to `app/actions/payments.ts`
  - Fetch all payments and participants for the group
  - Use settlement utility functions to compute transactions
  - Return list of settlement transactions
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. Create SettlementDisplay component
  - Create `app/group/[id]/components/SettlementDisplay.tsx` file
  - Add button to trigger settlement calculation
  - Display loading state during calculation
  - Show list of transactions (who pays whom and how much)
  - Format amounts using `integerToAmount()` utility
  - Show "All settled!" message when no transactions needed
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Create InviteLinkButton component
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

- [x] 10. Integrate all components into group page
  - Update `app/group/[id]/page.tsx` to import all new components
  - Fetch group members on page load
  - Fetch payments on page load
  - Add PaymentForm component with toggle to show/hide
  - Add PaymentList component to display payment history
  - Add SettlementDisplay component
  - Add InviteLinkButton component
  - Implement refresh logic after payment creation
  - _Requirements: 4.1, 6.1, 8.1_

- [x] 11. Add TypeScript type definitions
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

- [x] 16. Implement payment deletion functionality
  - Add `deletePayment()` server action to `app/actions/payments.ts`
  - Validate payment belongs to specified group before deletion
  - Handle database errors with user-friendly messages
  - Return success/error response
  - _Requirements: 10.3_

- [ ]* 16.1 Write property test for payment deletion removes record
  - **Property 16: Payment deletion removes record**
  - **Validates: Requirements 10.3**

- [ ]* 16.2 Write property test for payment deletion cascades to participants
  - **Property 17: Payment deletion cascades to participants**
  - **Validates: Requirements 10.4**

- [x] 17. Add delete button to PaymentList component
  - Update `PaymentList.tsx` to add delete button for each payment
  - Implement confirmation dialog before deletion (use browser confirm or custom modal)
  - Call `deletePayment()` action on confirmation
  - Show loading state during deletion
  - Refresh payment list after successful deletion
  - Display error message if deletion fails
  - _Requirements: 10.1, 10.2, 10.5_

- [x] 18. Update settlement to reflect deletions
  - Verify settlement calculation automatically uses current payments
  - Test that deleting a payment updates settlement results
  - _Requirements: 10.6_

- [ ]* 18.1 Write property test for settlement recalculation after deletion
  - **Property 18: Settlement recalculation after deletion**
  - **Validates: Requirements 10.6**

- [x] 19. Create translation infrastructure
  - Create `lib/i18n/translations/` directory
  - Create translation files: `en.json`, `ja.json`, `zh.json`, `ko.json`
  - Define translation structure with nested keys (common, payment, settlement, group, errors)
  - Populate English translations for all UI text
  - Populate Japanese translations for all UI text
  - Populate Chinese (Simplified) translations for all UI text
  - Populate Korean translations for all UI text
  - _Requirements: 11.3, 11.7_

- [ ]* 19.1 Write property test for translation completeness
  - **Property 21: Translation completeness**
  - **Validates: Requirements 11.7**

- [ ] 20. Create language context and provider
  - Create `lib/i18n/LanguageContext.tsx` file
  - Define `Language` type ('en' | 'ja' | 'zh' | 'ko')
  - Implement `LanguageProvider` component with React Context
  - Add state management for current language
  - Implement translation lookup function with nested key support
  - Add fallback to English for missing translations
  - Load language preference from localStorage on mount
  - Save language preference to localStorage on change
  - Default to English when no preference exists
  - _Requirements: 11.2, 11.4, 11.5, 11.6_

- [ ]* 20.1 Write property test for language selection updates translations
  - **Property 19: Language selection updates translations**
  - **Validates: Requirements 11.2**

- [ ]* 20.2 Write property test for language preference persistence round-trip
  - **Property 20: Language preference persistence round-trip**
  - **Validates: Requirements 11.4, 11.5**

- [ ] 21. Create LanguageSelector component
  - Create `components/LanguageSelector.tsx` file
  - Display dropdown/select with all supported languages
  - Show language names in their native script (English, 日本語, 中文, 한국어)
  - Add flag emojis for visual identification
  - Call `setLanguage()` from context on selection
  - _Requirements: 11.1, 11.3_

- [ ] 22. Integrate LanguageProvider into app layout
  - Update `app/layout.tsx` to wrap app with `LanguageProvider`
  - Ensure provider is client component ('use client')
  - _Requirements: 11.2_

- [ ] 23. Update all UI components to use translations
  - Update PaymentForm component to use translation function
  - Update PaymentList component to use translation function
  - Update SettlementDisplay component to use translation function
  - Update InviteLinkButton component to use translation function
  - Update group page to use translation function
  - Replace all hardcoded text with translation keys
  - Ensure user-generated content (descriptions, names) remains unchanged
  - _Requirements: 11.2, 11.7, 11.8_

- [ ]* 23.1 Write property test for user content language independence
  - **Property 22: User content language independence**
  - **Validates: Requirements 11.8**

- [ ] 24. Add LanguageSelector to UI
  - Add LanguageSelector component to app header or navigation
  - Position it prominently for easy access
  - Style consistently with app theme
  - _Requirements: 11.1_

- [ ] 25. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 26. Write unit tests for deletion functionality
  - Test delete confirmation dialog appears
  - Test payment removed from list after deletion
  - Test error handling for failed deletion
  - _Requirements: 10.1, 10.2, 10.5_

- [ ]* 27. Write unit tests for translation functions
  - Test translation lookup with valid key returns correct text
  - Test translation lookup with missing key falls back to English
  - Test nested key support (e.g., "payment.addPayment")
  - Test default language is English when no preference exists
  - Test each supported language has required keys
  - _Requirements: 11.2, 11.6, 11.7_

- [ ]* 28. Write integration tests for new features
  - Test delete payment → verify removed from list → verify settlement recalculated
  - Test switch language → verify UI text updates → verify user content unchanged
  - Test select language → reload page → verify language persists
  - _Requirements: 10.3, 10.5, 10.6, 11.2, 11.4, 11.5, 11.8_

- [ ] 29. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
