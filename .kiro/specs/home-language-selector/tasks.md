# Implementation Plan

- [ ] 1. Update home page to support language selection
  - Modify `app/page.tsx` to import and use the `useLanguage` hook
  - Import the `LanguageSelector` component
  - Replace hardcoded English strings with `t()` function calls for translation
  - Add positioning container for the LanguageSelector component
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1_

- [ ]* 1.1 Write property test for immediate translation update
  - **Property 4: Immediate translation update**
  - **Validates: Requirements 1.2**

- [ ]* 1.2 Write property test for language persistence to localStorage
  - **Property 1: Language persistence across navigation** (localStorage part)
  - **Validates: Requirements 1.3**

- [ ]* 1.3 Write unit tests for home page rendering
  - Test that LanguageSelector is rendered
  - Test that title uses "home.title" translation key
  - Test that subtitle uses "home.subtitle" translation key
  - Test that button uses "home.createGroup" translation key
  - Test that LanguageSelector is positioned in top-right corner
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1_

- [ ] 2. Add responsive styling for language selector
  - Apply Tailwind classes for absolute positioning in top-right corner
  - Add responsive classes for mobile, tablet, and desktop viewports
  - Ensure adequate spacing and z-index for visibility
  - _Requirements: 3.1, 3.3_

- [ ]* 2.1 Write property test for language selector visibility across viewports
  - **Property 3: Language selector visibility**
  - **Validates: Requirements 3.1, 3.3**

- [ ]* 2.2 Write property test for layout stability during interaction
  - Test that opening dropdown doesn't cause layout shifts
  - **Validates: Requirements 3.5**

- [ ] 3. Verify language persistence across navigation
  - Test that language selection persists when creating a group
  - Test that language selection persists when returning to home page
  - _Requirements: 1.4, 1.5_

- [ ]* 3.1 Write property test for language persistence across navigation
  - **Property 1: Language persistence across navigation** (navigation part)
  - **Validates: Requirements 1.4, 1.5**

- [ ] 4. Verify translation fallback behavior
  - Ensure missing translations fall back to English
  - Ensure completely missing keys return the key itself
  - _Requirements: 2.4, 2.5_

- [ ]* 4.1 Write property test for translation key fallback consistency
  - **Property 2: Translation key fallback consistency**
  - **Validates: Requirements 2.4, 2.5**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
