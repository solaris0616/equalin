# Implementation Plan

- [ ] 1. Create Toast component
  - Create new component file at `app/group/[id]/components/Toast.tsx`
  - Implement toast notification with message and type (success/error/info)
  - Add auto-dismiss functionality with configurable duration (default 3 seconds)
  - Add manual close button
  - Style for mobile-first design at bottom of screen
  - Add entrance and exit animations
  - Ensure toast doesn't overlap with floating refresh button
  - _Requirements: 3.4, 3.5_

- [ ]* 1.1 Write unit tests for Toast component
  - Test toast displays with correct message and type
  - Test auto-dismiss after specified duration
  - Test manual dismissal via close button
  - Test entrance and exit animations
  - _Requirements: 3.4, 3.5_

- [ ] 2. Update HeaderMenu component to use toast
  - Update HeaderMenu to accept onShowToast callback prop
  - Remove internal copied state management
  - Trigger toast notification on successful invite link copy
  - Trigger error toast on clipboard API failure
  - _Requirements: 3.3, 3.4_

- [ ]* 2.1 Write unit tests for updated HeaderMenu component
  - Test dropdown open/close functionality
  - Test invite link copy triggers toast callback
  - Test language selection changes
  - Test error handling triggers error toast
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 3. Create RefreshButton component
  - Create new component file at `app/group/[id]/components/RefreshButton.tsx`
  - Implement floating action button with fixed positioning
  - Add loading state with spinner animation
  - Style for mobile with minimum 44x44px touch target
  - Position in bottom-right corner with adequate padding (16px)
  - Ensure button doesn't obstruct other content
  - Add debounce to prevent rapid repeated clicks
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ]* 3.1 Write unit tests for RefreshButton component
  - Test button triggers refresh callback
  - Test loading state during refresh operation
  - Test button remains clickable after refresh completes
  - Test debounce functionality
  - _Requirements: 2.2, 2.3_

- [ ] 4. Update GroupPage layout and integrate new components
  - Add toast state management (toastMessage, toastType, showToast, hideToast)
  - Import HeaderMenu, RefreshButton, and Toast components
  - Replace LanguageSelector and InviteLinkButton in header with HeaderMenu
  - Pass showToast callback to HeaderMenu
  - Reorder page sections: move SettlementDisplay before PaymentList
  - Add RefreshButton with loadGroupData callback
  - Add Toast component with conditional rendering
  - Update styling to accommodate new layout
  - Ensure responsive design works on mobile and desktop
  - _Requirements: 1.1, 2.1, 2.4, 3.1, 3.4, 3.5_

- [ ]* 4.1 Write integration tests for updated GroupPage
  - Test settlement display appears before payment list in DOM
  - Test refresh button triggers data reload
  - Test all components render in correct order
  - Test toast notification integration
  - Test mobile responsiveness
  - _Requirements: 1.1, 2.2, 2.4, 3.4, 3.5_

- [ ] 5. Add error handling for refresh operation
  - Add error state to GroupPage for refresh failures
  - Display user-friendly error message when refresh fails
  - Maintain current data state on error (don't clear existing data)
  - Allow user to retry refresh after error
  - Add translation keys for error messages
  - _Requirements: 2.2, 2.4_

- [ ] 6. Update translation files
  - Add translation key for toast success message: "招待リンクをコピーしました！"
  - Add translation keys for HeaderMenu labels
  - Add translation keys for refresh button
  - Add translation keys for new error messages
  - Update all supported languages (en, ja, zh, ko)
  - _Requirements: 2.1, 3.2, 3.4, 3.5_

- [ ] 7. Clean up unused code
  - Remove standalone InviteLinkButton import from GroupPage
  - Remove standalone LanguageSelector import from GroupPage (if not used elsewhere)
  - Clean up any unused CSS classes
  - Remove any dead code from refactoring
  - _Requirements: 3.6_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 9. Manual testing on multiple devices
  - Test on iOS Safari (iPhone)
  - Test on Android Chrome
  - Test on desktop browsers (Chrome, Firefox, Safari)
  - Verify touch targets are adequate on mobile
  - Verify dropdown menu doesn't overlap content
  - Verify floating button doesn't obstruct important content
  - Verify invite link copy works on all platforms
  - Verify toast notification appears with correct message
  - Verify toast auto-dismisses after 3 seconds
  - Verify toast doesn't overlap with floating button
  - Test various screen sizes (320px to 1920px width)
  - _Requirements: 1.1, 2.1, 2.5, 3.1, 3.4, 3.5, 3.6_
