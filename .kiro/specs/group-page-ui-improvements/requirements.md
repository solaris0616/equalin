# Requirements Document

## Introduction

This specification defines UI improvements for the group expense page to enhance user experience on mobile devices. The changes focus on prioritizing settlement information, adding real-time refresh capability, and minimizing less frequently used UI elements.

## Glossary

- **Group Page**: The main page displaying expenses and settlements for a specific group (app/group/[id]/page.tsx)
- **Settlement Display**: The component showing who owes whom and how much
- **Payment History**: The list of recorded payments/expenses
- **Invite Link**: The shareable URL for inviting new members to the group
- **Floating Button**: A button that remains fixed on the screen, typically in the bottom-right corner
- **Dropdown Menu**: A collapsible menu that reveals options when clicked

## Requirements

### Requirement 1

**User Story:** As a mobile user, I want to see settlement amounts at the top of the page, so that I can quickly understand who owes whom without scrolling.

#### Acceptance Criteria

1. WHEN a user views the group page THEN the system SHALL display the settlement display component before the payment history
2. WHEN the page loads THEN the system SHALL maintain all existing settlement information and functionality
3. WHEN settlement data updates THEN the system SHALL reflect changes in the top position immediately

### Requirement 2

**User Story:** As a user in a multi-user group, I want to refresh the page data with a button, so that I can see the latest expenses added by other members without manually reloading the browser.

#### Acceptance Criteria

1. WHEN a user views the group page on any device THEN the system SHALL display a floating refresh button in the bottom-right corner
2. WHEN a user clicks the refresh button THEN the system SHALL reload all group data including members, payments, and settlements
3. WHEN the refresh operation is in progress THEN the system SHALL provide visual feedback to indicate loading state
4. WHEN the refresh completes THEN the system SHALL update all displayed information with the latest data
5. WHILE the refresh button is displayed THEN the system SHALL ensure it does not obstruct important content or other interactive elements

### Requirement 3

**User Story:** As a user who has already invited members, I want the invite link to be less prominent, so that I have more screen space for frequently used features.

#### Acceptance Criteria

1. WHEN a user views the group page THEN the system SHALL display a dropdown menu in the header area
2. WHEN a user opens the dropdown menu THEN the system SHALL reveal both language selection and invite link copy options
3. WHEN a user selects the invite link option from the dropdown THEN the system SHALL copy the invite link to the clipboard
4. WHEN the invite link is copied THEN the system SHALL provide visual feedback confirming the action
5. WHEN a user selects a language from the dropdown THEN the system SHALL change the interface language immediately
6. WHILE the dropdown is closed THEN the system SHALL display a minimal icon or button that does not dominate the header space
