# Requirements Document

## Introduction

This specification defines the core bill-splitting functionality for Equalin, a web application that enables groups to track shared expenses and calculate fair settlements. The system allows users to record payments, specify participants for each expense, view payment history, and automatically calculate who owes whom.

## Glossary

- **System**: The Equalin web application
- **User**: A person who has joined a group by providing their name
- **Group**: A collection of users who share expenses together
- **Payment**: A record of money spent by one user on behalf of multiple participants
- **Participant**: A user who shares the cost of a specific payment
- **Payer**: The user who initially paid for an expense
- **Settlement**: The calculated result showing who should pay whom to balance all debts
- **Group Link**: The URL that allows users to join a specific group

## Requirements

### Requirement 1: Group Creation

**User Story:** As a user, I want to create a new expense-sharing group, so that I can start tracking shared expenses with others.

#### Acceptance Criteria

1. WHEN a user visits the home page, THE System SHALL display a button to create a new group
2. WHEN a user clicks the create group button, THE System SHALL generate a new group with a unique identifier
3. WHEN a group is created, THE System SHALL redirect the user to the group page
4. THE System SHALL store the group creation timestamp
5. THE System SHALL set a default expiration date of 30 days from creation

### Requirement 2: User Profile Registration

**User Story:** As a new visitor to a group page, I want to set my name for this group, so that other members can identify me in expense records.

#### Acceptance Criteria

1. WHEN a user visits a group page for the first time, THE System SHALL check for an existing profile in local storage
2. WHEN no profile exists for the current group, THE System SHALL display a name input form
3. WHEN a user submits a name, THE System SHALL create a profile record with a client-generated unique identifier
4. WHEN a profile is created, THE System SHALL save the profile to the profiles table
5. WHEN a profile is created, THE System SHALL add the user as a member of the group
6. WHEN a profile is created, THE System SHALL store the profile identifier in local storage with a group-specific key
7. WHEN a user submits an empty name, THE System SHALL reject the submission and display an error message
8. WHEN a user returns to the same group, THE System SHALL retrieve their profile from local storage

### Requirement 3: Payment Participants Table

**User Story:** As a developer, I want a database table to track which users participate in each payment, so that the system can calculate fair splits.

#### Acceptance Criteria

1. THE System SHALL provide a `payment_participants` table with columns for `payment_id` and `profile_id`
2. WHEN a payment record is deleted, THE System SHALL automatically delete all associated participant records
3. WHEN a profile is deleted, THE System SHALL automatically delete all associated participant records
4. THE System SHALL enforce that each payment-participant combination is unique

### Requirement 4: Payment Recording

**User Story:** As a user, I want to record a payment with description and amount, so that the group knows what expenses have been made.

#### Acceptance Criteria

1. WHEN a user is viewing a group page, THE System SHALL display a button to add a new payment
2. WHEN a user clicks the add payment button, THE System SHALL display a form with fields for description and amount
3. WHEN a user submits a payment form with valid data, THE System SHALL save the payment with the current user as payer
4. WHEN a user submits a payment form with empty description, THE System SHALL accept the submission and store an empty description
5. WHEN a user submits a payment form with non-positive amount, THE System SHALL reject the submission and display an error message

### Requirement 5: Participant Selection

**User Story:** As a user recording a payment, I want to select which group members share this expense, so that costs are split fairly among the right people.

#### Acceptance Criteria

1. WHEN a user opens the payment form, THE System SHALL display a list of all group members with checkboxes
2. WHEN a user opens the payment form, THE System SHALL pre-select all group members by default
3. WHEN a user submits a payment form, THE System SHALL save all selected members as participants
4. WHEN a user attempts to submit a payment with no participants selected, THE System SHALL reject the submission and display an error message
5. THE System SHALL allow the payer to be included or excluded from the participant list

### Requirement 6: Payment History Display

**User Story:** As a user, I want to see all payments made in the group, so that I can track our shared expenses.

#### Acceptance Criteria

1. WHEN a user views a group page, THE System SHALL display a list of all payments for that group
2. WHEN displaying a payment, THE System SHALL show the payer name, description, amount, and participant names
3. WHEN displaying a payment, THE System SHALL show the date and time the payment was created
4. WHEN displaying the payment list, THE System SHALL order payments from newest to oldest
5. WHEN no payments exist for a group, THE System SHALL display a message indicating the list is empty

### Requirement 7: Settlement Calculation

**User Story:** As a user, I want to see who owes money to whom, so that we can settle our debts fairly.

#### Acceptance Criteria

1. WHEN a user requests settlement calculation, THE System SHALL calculate each member's total amount paid
2. WHEN a user requests settlement calculation, THE System SHALL calculate each member's total share of expenses based on their participation
3. WHEN a user requests settlement calculation, THE System SHALL compute the balance for each member as amount paid minus amount owed
4. WHEN a user requests settlement calculation, THE System SHALL generate a list of transactions showing who should pay whom and how much
5. WHEN displaying settlement results, THE System SHALL minimize the number of transactions required to settle all debts

### Requirement 8: Group Invitation

**User Story:** As a user, I want to easily share the group link with others, so that they can join and participate in expense tracking.

#### Acceptance Criteria

1. WHEN a user views a group page, THE System SHALL display the current group URL
2. WHEN a user clicks a copy link button, THE System SHALL copy the group URL to the clipboard
3. WHEN the URL is copied successfully, THE System SHALL display a confirmation message to the user
4. THE System SHALL generate group URLs in the format `/group/[group-id]`
5. WHEN a new user visits a group URL, THE System SHALL allow them to join by entering their name

### Requirement 9: Amount Input Handling

**User Story:** As a user entering payment amounts, I want flexible input options, so that I can quickly record expenses in my preferred format.

#### Acceptance Criteria

1. THE System SHALL accept payment amounts as decimal numbers with up to 2 decimal places
2. THE System SHALL store payment amounts internally as integers representing the smallest currency unit
3. WHEN displaying payment amounts, THE System SHALL format them as decimal numbers with 2 decimal places
4. WHEN a user enters an amount with more than 2 decimal places, THE System SHALL round to 2 decimal places
5. THE System SHALL accept amounts up to 999,999,999.99 in the base currency unit

### Requirement 10: Payment Deletion

**User Story:** As a user, I want to delete a payment that was recorded incorrectly, so that the expense history and settlement calculations remain accurate.

#### Acceptance Criteria

1. WHEN a user views a payment in the payment list, THE System SHALL display a delete button for that payment
2. WHEN a user clicks the delete button, THE System SHALL prompt for confirmation before deletion
3. WHEN a user confirms deletion, THE System SHALL remove the payment record from the database
4. WHEN a payment is deleted, THE System SHALL automatically remove all associated participant records
5. WHEN a payment is deleted, THE System SHALL update the payment list to reflect the deletion
6. WHEN a payment is deleted, THE System SHALL recalculate settlement balances automatically

### Requirement 11: Multi-Language Support

**User Story:** As a user, I want to switch the interface language between English, Japanese, Chinese, and Korean, so that I can use the application in my preferred language.

#### Acceptance Criteria

1. THE System SHALL provide a language selector in the user interface
2. WHEN a user selects a language, THE System SHALL update all interface text to the selected language
3. THE System SHALL support English, Japanese, Chinese (Simplified), and Korean languages
4. WHEN a user selects a language, THE System SHALL store the language preference in local storage
5. WHEN a user returns to the application, THE System SHALL load their previously selected language from local storage
6. WHEN no language preference exists, THE System SHALL default to English
7. THE System SHALL translate all static UI elements including labels, buttons, messages, and placeholders
8. THE System SHALL maintain user-generated content in its original language regardless of interface language selection
