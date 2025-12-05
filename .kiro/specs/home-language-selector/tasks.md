# Implementation Plan

- [x] 1. Update home page to support language selection
  - Modify `app/page.tsx` to import and use the `useLanguage` hook
  - Import the `LanguageSelector` component
  - Replace hardcoded English strings with `t()` function calls for translation
  - Add positioning container for the LanguageSelector component
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1_

- [ ]* 1.1 Write property test for immediate translation update
  - **Property 4: Immediate translation update**
  - **Validates: Requirements 1.2**

- [ ]* 1.2 Write property test for language persistence to localStorage
  - **Property 1: Language persistence across navigation**
  - **Validates: Requirements 1.3, 1.4**

- [ ]* 1.3 Write property test for language persistence on return
  - **Property 5: Language persistence on return**
  - **Validates: Requirements 1.5**

- [ ]* 1.4 Write unit tests for home page rendering
  - Test that LanguageSelector is rendered
  - Test that title uses "home.title" translation key
  - Test that subtitle uses "home.subtitle" translation key
  - Test that button uses "home.createGroup" translation key
  - Test that LanguageSelector is positioned in top-right corner
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1_

- [x] 2. Add responsive styling for language selector
  - Apply Tailwind classes for absolute positioning in top-right corner
  - Add responsive classes for mobile, tablet, and desktop viewports
  - Ensure adequate spacing and z-index for visibility
  - _Requirements: 3.1, 3.3_
  - _Completed: Responsive positioning (top-3/4/6, right-3/4/6), sizing (px-2/3, py-1.5/2, text-sm/base), z-20, shadow effects_

- [ ]* 2.1 Write property test for language selector visibility across viewports
  - **Property 3: Language selector visibility**
  - **Validates: Requirements 3.1, 3.3**

- [ ]* 2.2 Write property test for layout stability during interaction
  - **Property 6: Layout stability during interaction**
  - **Validates: Requirements 3.5**

- [x] 3. Verify accessibility requirements
  - Verify LanguageSelector has proper aria-label
  - Verify focus indicators are visible and meet WCAG standards
  - Verify keyboard navigation works correctly
  - _Requirements: 3.4_

- [ ]* 3.1 Write unit tests for accessibility features
  - Test aria-label presence
  - Test focus state styling
  - Test keyboard navigation (Tab, Arrow keys, Enter)
  - _Requirements: 3.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
