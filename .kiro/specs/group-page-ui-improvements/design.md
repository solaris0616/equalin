# Design Document

## Overview

This design document outlines the UI improvements for the group expense page to enhance mobile user experience. The changes reorganize the page layout to prioritize settlement information, add real-time data refresh capability, and consolidate less frequently used features into a compact menu.

## Architecture

### Component Structure

The changes will affect the following components:

1. **GroupPage** (`app/group/[id]/page.tsx`)
   - Main page component that orchestrates layout changes
   - Reorders child components to display settlement first
   - Adds floating refresh button
   - Integrates new header menu component

2. **HeaderMenu** (new component: `app/group/[id]/components/HeaderMenu.tsx`)
   - Combines language selection and invite link functionality
   - Implements dropdown menu pattern
   - Replaces separate LanguageSelector and InviteLinkButton in header
   - Triggers toast notification on successful invite link copy

3. **Toast** (new component: `app/group/[id]/components/Toast.tsx`)
   - Displays temporary notification messages at bottom of screen
   - Auto-dismisses after configurable duration (default 3 seconds)
   - Supports success, error, and info message types

4. **RefreshButton** (new component: `app/group/[id]/components/RefreshButton.tsx`)
   - Floating action button for refreshing page data
   - Fixed positioning in bottom-right corner
   - Provides loading state feedback

5. **SettlementDisplay** (`app/group/[id]/components/SettlementDisplay.tsx`)
   - No structural changes required
   - Will be repositioned in parent layout

6. **PaymentList** (`app/group/[id]/components/PaymentList.tsx`)
   - No changes required
   - Will be repositioned after settlement display

## Components and Interfaces

### HeaderMenu Component

```typescript
interface HeaderMenuProps {
  groupId: string;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  className?: string;
}

export function HeaderMenu({ groupId, onShowToast, className }: HeaderMenuProps): JSX.Element
```

**Responsibilities:**
- Display a compact menu button/icon in the header
- Show dropdown menu with language selection and invite link options
- Handle invite link copying with clipboard API
- Trigger toast notification on successful copy

**State:**
- `isOpen: boolean` - Controls dropdown visibility
- `error: string | null` - Stores error messages

### Toast Component

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number; // milliseconds, default 3000
  onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps): JSX.Element
```

**Responsibilities:**
- Display notification message at bottom of screen
- Auto-dismiss after specified duration
- Provide visual styling based on message type (success/error/info)
- Support manual dismissal via close button
- Animate entrance and exit

**State:**
- No internal state (controlled by parent component)

### RefreshButton Component

```typescript
interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  className?: string;
}

export function RefreshButton({ onRefresh, className }: RefreshButtonProps): JSX.Element
```

**Responsibilities:**
- Display floating button with refresh icon
- Trigger data refresh when clicked
- Show loading spinner during refresh operation
- Maintain fixed position on scroll

**State:**
- `isRefreshing: boolean` - Tracks refresh operation status

### Updated GroupPage Layout

The page layout will be reorganized as follows:

```
┌─────────────────────────────────────┐
│ Header                              │
│ - Title & Welcome                   │
│ - HeaderMenu (Language + Invite)    │
├─────────────────────────────────────┤
│ Add Payment Button/Form             │
├─────────────────────────────────────┤
│ Settlement Display (MOVED UP)       │
├─────────────────────────────────────┤
│ Payment List                        │
└─────────────────────────────────────┘
                                    ┌──┐
                                    │🔄│ Floating Refresh Button
                                    └──┘
┌─────────────────────────────────────┐
│ 招待リンクをコピーしました！ ✓      │ Toast Notification (bottom)
└─────────────────────────────────────┘
```

**GroupPage State Management:**

```typescript
// Toast state
const [toastMessage, setToastMessage] = useState<string | null>(null);
const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

// Toast handler
const showToast = (message: string, type: 'success' | 'error' | 'info') => {
  setToastMessage(message);
  setToastType(type);
};

const hideToast = () => {
  setToastMessage(null);
};
```

## Data Models

No new data models are required. The changes only affect UI layout and interaction patterns.

### Existing Data Flow

```typescript
// GroupPage data fetching
const loadGroupData = async () => {
  const [members, payments] = await Promise.all([
    getGroupMembers(groupId),
    getGroupPayments(groupId),
  ]);
  setMembers(members);
  setPayments(payments);
  setSettlementRefreshTrigger(prev => prev + 1);
};
```

This function will be reused by the RefreshButton component.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Settlement display position invariant

*For any* group page render, the settlement display component should appear before the payment list component in the DOM order
**Validates: Requirements 1.1**

### Property 2: Refresh updates all data

*For any* refresh operation, all three data sources (members, payments, settlement) should be updated with the latest values from the database
**Validates: Requirements 2.2, 2.4**

### Property 3: Dropdown menu contains required options

*For any* header menu render, the dropdown should contain both language selection and invite link copy options
**Validates: Requirements 3.2**

### Property 4: Floating button visibility

*For any* scroll position on the group page, the refresh button should remain visible and accessible in the bottom-right corner
**Validates: Requirements 2.5**

### Property 5: Invite link copy functionality

*For any* invite link copy action from the dropdown menu, the system should copy the correct group URL to the clipboard and display a toast notification
**Validates: Requirements 3.3, 3.4**

### Property 6: Toast notification auto-dismiss

*For any* toast notification displayed, the notification should automatically disappear after the specified duration (default 3 seconds)
**Validates: Requirements 3.5**

## Error Handling

### Clipboard API Errors

When copying the invite link fails:
- Catch clipboard API exceptions
- Display error toast notification in Japanese
- Log technical details to console
- Auto-dismiss error toast after 3 seconds

```typescript
try {
  await navigator.clipboard.writeText(groupUrl);
  onShowToast(t('success.inviteLinkCopied'), 'success');
} catch (err) {
  console.error('Failed to copy to clipboard:', err);
  onShowToast(t('errors.copyLinkFailed'), 'error');
}
```

### Refresh Operation Errors

When data refresh fails:
- Catch async operation errors
- Display error message to user
- Maintain current data state (don't clear existing data)
- Allow user to retry refresh

```typescript
try {
  await loadGroupData();
} catch (error) {
  console.error('Error refreshing data:', error);
  setError(t('errors.refreshFailed'));
}
```

### Dropdown Menu Edge Cases

- Close dropdown when clicking outside
- Close dropdown when pressing Escape key
- Prevent dropdown from being cut off by viewport edges
- Handle touch events on mobile devices

## Testing Strategy

### Unit Tests

1. **HeaderMenu Component**
   - Test dropdown opens and closes correctly
   - Test invite link copy functionality
   - Test language selection changes
   - Test error handling for clipboard failures
   - Test toast callback is triggered on successful copy

2. **Toast Component**
   - Test toast displays with correct message and type
   - Test toast auto-dismisses after specified duration
   - Test manual dismissal via close button
   - Test entrance and exit animations

3. **RefreshButton Component**
   - Test button triggers refresh callback
   - Test loading state during refresh
   - Test button remains clickable after refresh completes
   - Test button positioning on different screen sizes

4. **GroupPage Layout**
   - Test settlement display appears before payment list
   - Test all components render in correct order
   - Test refresh button integration
   - Test toast notification integration

### Property-Based Tests

Property-based testing will use **fast-check** library for TypeScript/React. Each test should run a minimum of 100 iterations.

1. **Property 1: Settlement display position invariant**
   - Generate random group data
   - Render GroupPage component
   - Assert settlement display DOM node appears before payment list DOM node

2. **Property 2: Refresh updates all data**
   - Generate random initial and updated group data
   - Trigger refresh operation
   - Assert all three data sources reflect updated values

3. **Property 3: Dropdown menu contains required options**
   - Render HeaderMenu component
   - Open dropdown
   - Assert presence of language selector and invite link option

4. **Property 4: Floating button visibility**
   - Generate random scroll positions
   - Simulate scroll events
   - Assert refresh button remains in viewport

5. **Property 5: Invite link copy functionality**
   - Generate random group IDs
   - Trigger copy action
   - Assert correct URL is copied to clipboard
   - Assert toast notification is displayed

6. **Property 6: Toast notification auto-dismiss**
   - Generate random toast messages
   - Display toast with specified duration
   - Assert toast disappears after duration expires

### Integration Tests

1. Test complete user flow: view page → refresh data → see updated settlements
2. Test mobile responsiveness of floating button
3. Test dropdown menu interaction on touch devices
4. Test language change persists across refresh

### Manual Testing Checklist

- [ ] Settlement display appears at top on mobile devices
- [ ] Refresh button is easily tappable on mobile (minimum 44x44px touch target)
- [ ] Dropdown menu is accessible and doesn't overlap content
- [ ] All translations work correctly in dropdown
- [ ] Invite link copies successfully on iOS Safari
- [ ] Invite link copies successfully on Android Chrome
- [ ] Toast notification appears at bottom of screen with correct message
- [ ] Toast notification auto-dismisses after 3 seconds
- [ ] Toast notification doesn't overlap with floating refresh button
- [ ] Page layout looks good on various screen sizes (320px to 1920px width)

## Implementation Notes

### Mobile-First Considerations

1. **Touch Targets**: Ensure all interactive elements meet minimum 44x44px size
2. **Floating Button**: Position with adequate padding from screen edges (16px minimum)
3. **Dropdown Menu**: Use native-like animations for smooth mobile experience
4. **Loading States**: Provide clear visual feedback for all async operations
5. **Toast Positioning**: Position toast at bottom with adequate padding, ensure it doesn't overlap with floating button

### Accessibility

1. **ARIA Labels**: Add appropriate labels for icon-only buttons
2. **Keyboard Navigation**: Ensure dropdown can be operated with keyboard
3. **Focus Management**: Trap focus within dropdown when open
4. **Screen Readers**: Announce state changes (copied, loading, etc.)

### Performance

1. **Debounce Refresh**: Prevent rapid repeated refresh clicks
2. **Optimistic UI**: Show loading state immediately on refresh
3. **Memoization**: Use React.memo for components that don't need frequent re-renders
4. **Lazy Loading**: Consider code-splitting for dropdown menu if it grows

### Browser Compatibility

1. **Clipboard API**: Provide fallback for older browsers
2. **CSS Position Sticky/Fixed**: Test on iOS Safari
3. **Dropdown Positioning**: Use Radix UI Dropdown for cross-browser consistency

## Migration Strategy

### Phase 1: Create New Components
- Implement Toast component
- Implement HeaderMenu component with toast integration
- Implement RefreshButton component
- Add unit tests for new components

### Phase 2: Update GroupPage Layout
- Add toast state management to GroupPage
- Reorder components (settlement before payment list)
- Integrate HeaderMenu in header with toast callback
- Add RefreshButton to page
- Add Toast component to page
- Update styling for new layout

### Phase 3: Remove Old Components
- Remove standalone InviteLinkButton from header
- Remove standalone LanguageSelector from header
- Clean up unused imports

### Phase 4: Testing and Refinement
- Run full test suite
- Test on multiple devices and browsers
- Test toast notification on various screen sizes
- Gather user feedback
- Make adjustments as needed

## Future Enhancements

1. **Auto-refresh**: Implement periodic auto-refresh or real-time updates using Supabase subscriptions
2. **Pull-to-refresh**: Add native pull-to-refresh gesture on mobile
3. **Offline Support**: Cache data and show stale data when offline
4. **Refresh Indicator**: Show timestamp of last refresh
5. **Selective Refresh**: Allow refreshing only specific sections (payments vs settlements)
