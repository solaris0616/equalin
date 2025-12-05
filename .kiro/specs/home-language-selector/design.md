# Design Document

## Overview

This feature integrates the existing LanguageSelector component into the home page of Equalin. The implementation leverages the already-established i18n infrastructure (LanguageProvider, translation files, and useLanguage hook) to provide language selection capability on the initial landing page. The design focuses on minimal code changes while ensuring a seamless user experience across language transitions.

## Architecture

### Component Hierarchy

```
RootLayout (app/layout.tsx)
└── LanguageProvider
    └── HomePage (app/page.tsx)
        ├── LanguageSelector (positioned absolutely)
        └── Main Content
            ├── Title (translated)
            ├── Subtitle (translated)
            └── Create Group Button (translated)
```

### Data Flow

1. User selects language from LanguageSelector dropdown
2. LanguageSelector calls `setLanguage()` from useLanguage hook
3. LanguageProvider updates language state and saves to localStorage
4. React re-renders HomePage with new language
5. All text elements use `t()` function to retrieve translated strings
6. Translation system returns strings from appropriate language JSON file

### Initial Load Flow

1. HomePage loads and LanguageProvider initializes
2. LanguageProvider checks localStorage for saved language preference
3. If found, LanguageProvider sets language state to saved value
4. If not found, LanguageProvider defaults to English
5. HomePage renders with appropriate language from initial state

## Components and Interfaces

### Modified Components

#### HomePage (app/page.tsx)

**Current State:**
- Client component with hardcoded English text
- Creates group and navigates to group page

**Required Changes:**
- Import and use `useLanguage` hook
- Import and render `LanguageSelector` component
- Replace hardcoded strings with `t()` function calls
- Add positioning container for LanguageSelector

**Interface:**
```typescript
// No props - root page component
export default function Page(): JSX.Element
```

### Existing Components (No Changes Required)

#### LanguageSelector (components/LanguageSelector.tsx)
- Already implements dropdown with all supported languages
- Already handles language change via useLanguage hook
- Accepts optional className prop for styling

#### LanguageProvider (lib/i18n/LanguageContext.tsx)
- Already manages language state
- Already persists to localStorage
- Already provides translation function

## Data Models

### Translation Keys

The following keys already exist in translation files and will be used:

```typescript
{
  "home": {
    "title": string,        // "Equalin"
    "subtitle": string,     // "The simplest way to split expenses."
    "createGroup": string   // "Create a New Group"
  }
}
```

### Language State

```typescript
type Language = 'en' | 'ja' | 'zh' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Language persistence across navigation

*For any* language selection made on the home page, when a user creates a group and navigates to the group page, the selected language should remain active.

**Validates: Requirements 1.4**

### Property 5: Language persistence on return

*For any* language selection made on the home page, when a user navigates away and returns to the home page, the selected language should be restored from localStorage and displayed.

**Validates: Requirements 1.5**

### Property 2: Translation key fallback consistency

*For any* translation key used on the home page, if the translation is missing in the selected language, the system should return the English translation or the key itself (never undefined or null).

**Validates: Requirements 2.4, 2.5**

### Property 3: Language selector visibility

*For any* viewport size (mobile, tablet, desktop), the language selector should remain visible and interactive without overlapping or obscuring other page content.

**Validates: Requirements 3.1, 3.3**

### Property 4: Immediate translation update

*For any* language change on the home page, all translated text elements should update synchronously within the same render cycle.

**Validates: Requirements 1.2**

### Property 6: Layout stability during interaction

*For any* interaction with the LanguageSelector (opening dropdown, selecting option), the positions of other page elements should remain unchanged (no layout shift).

**Validates: Requirements 3.5**

## Error Handling

### Translation Errors

**Scenario:** Translation key missing in selected language
- **Handling:** Fall back to English translation (already implemented in LanguageProvider)
- **User Impact:** User sees English text for missing translations
- **Logging:** No logging needed (expected behavior)

**Scenario:** Translation key missing in all languages
- **Handling:** Display the key itself (already implemented)
- **User Impact:** User sees technical key (e.g., "home.title")
- **Logging:** No logging needed (indicates missing translation)

### State Errors

**Scenario:** localStorage unavailable (private browsing, disabled)
- **Handling:** Language selection works but doesn't persist (already handled by try-catch in LanguageProvider)
- **User Impact:** Language resets to English on page reload
- **Logging:** Silent failure (acceptable degradation)

**Scenario:** Invalid language code in localStorage
- **Handling:** Validation in LanguageProvider defaults to English (already implemented)
- **User Impact:** User sees English until they select a language
- **Logging:** No logging needed

### UI Errors

**Scenario:** LanguageSelector component fails to render
- **Handling:** Page still functions, just without language selection
- **User Impact:** User sees English text, cannot change language
- **Logging:** React error boundary would catch (if implemented)

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Translation key resolution**
   - Test that `t('home.title')` returns correct string for each language
   - Test that missing keys fall back to English
   - Test that completely missing keys return the key itself

2. **Component rendering**
   - Test that HomePage renders LanguageSelector
   - Test that HomePage renders translated text
   - Test that LanguageSelector appears in correct position

### Property-Based Tests

Property-based tests will verify universal properties using **fast-check** (JavaScript/TypeScript property-based testing library). Each test should run a minimum of 100 iterations.

1. **Property 1: Language persistence across navigation**
   - Generate random language selections
   - Verify language persists to localStorage
   - Verify language remains after navigation
   - **Tag:** `Feature: home-language-selector, Property 1: Language persistence across navigation`
   - **Validates: Requirements 1.4**

2. **Property 2: Translation key fallback consistency**
   - Generate random translation keys (valid and invalid)
   - Generate random language selections
   - Verify translation function never returns undefined/null
   - Verify fallback chain works correctly
   - **Tag:** `Feature: home-language-selector, Property 2: Translation key fallback consistency`
   - **Validates: Requirements 2.4, 2.5**

3. **Property 3: Language selector visibility**
   - Generate random viewport dimensions
   - Verify LanguageSelector remains visible
   - Verify no overlap with other elements
   - **Tag:** `Feature: home-language-selector, Property 3: Language selector visibility`
   - **Validates: Requirements 3.1, 3.3**

4. **Property 4: Immediate translation update**
   - Generate random language changes
   - Verify all text updates in same render
   - Verify no intermediate states with mixed languages
   - **Tag:** `Feature: home-language-selector, Property 4: Immediate translation update`
   - **Validates: Requirements 1.2**

5. **Property 5: Language persistence on return**
   - Generate random language selections
   - Simulate navigation away and return
   - Verify language is restored from localStorage
   - Verify page renders with correct language
   - **Tag:** `Feature: home-language-selector, Property 5: Language persistence on return`
   - **Validates: Requirements 1.5**

6. **Property 6: Layout stability during interaction**
   - Generate random viewport sizes
   - Simulate dropdown interactions
   - Verify no layout shifts occur
   - Verify element positions remain stable
   - **Tag:** `Feature: home-language-selector, Property 6: Layout stability during interaction`
   - **Validates: Requirements 3.5**

### Integration Tests

Integration tests will verify the complete user flow:

1. **Home page language selection flow**
   - Load home page
   - Select language from dropdown
   - Verify all text updates
   - Create group
   - Verify language persists on group page

2. **Language persistence flow**
   - Select language on home page
   - Navigate away and return
   - Verify language is still selected

### Testing Framework

- **Unit Testing:** Vitest (already used in project, see `lib/utils/settlement.test.ts`)
- **Property-Based Testing:** fast-check
- **Component Testing:** React Testing Library with Vitest
- **Test Location:** Co-located with source files using `.test.ts` or `.test.tsx` suffix

### Test Configuration

```typescript
// Property-based test configuration
import fc from 'fast-check';

// Minimum 100 iterations for each property test
fc.assert(
  fc.property(/* generators */, /* test function */),
  { numRuns: 100 }
);
```

## Implementation Notes

### Styling Approach

The LanguageSelector will be positioned using absolute positioning within a relative container to prevent layout shifts:

```tsx
<div className="relative min-h-screen">
  <div className="absolute top-4 right-4 z-10">
    <LanguageSelector className="..." />
  </div>
  {/* Main content */}
</div>
```

**Rationale for absolute positioning:**
- Removes LanguageSelector from document flow, preventing layout shifts when dropdown opens
- Ensures consistent positioning across different viewport sizes
- Maintains visual hierarchy with z-index layering
- Allows main content to remain centered without offset

### Responsive Design

- Desktop: Top-right corner with adequate spacing
- Mobile: Top-right corner, smaller size if needed
- Use Tailwind responsive classes (e.g., `top-4 md:top-6`)

### Accessibility

- LanguageSelector already includes `aria-label="Select language"` for screen readers
- Focus indicators are provided by Tailwind focus classes (e.g., `focus:ring-2`, `focus:ring-primary`)
- Keyboard navigation works with native `<select>` element (Tab to focus, Arrow keys to select, Enter to confirm)
- Focus state is visually distinct to meet WCAG 2.1 Level AA requirements
- Color contrast ratios meet accessibility standards

### Performance

- No additional network requests (translations already loaded)
- No additional state management (uses existing LanguageProvider)
- Minimal re-renders (only when language changes)
