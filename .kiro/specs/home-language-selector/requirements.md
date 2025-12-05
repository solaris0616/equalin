# Requirements Document

## Introduction

This feature adds language selection capability to the home page (group creation page) of Equalin. Currently, the LanguageSelector component exists and is used in group pages, but it is not available on the initial landing page where users create new groups. This enhancement will allow users to select their preferred language before creating a group, improving the user experience for international users.

## Glossary

- **Equalin**: The web application for fair and effortless bill splitting
- **Home Page**: The initial landing page at the root path ("/") where users can create a new group
- **LanguageSelector Component**: An existing React component that provides a dropdown interface for selecting between supported languages (English, Japanese, Chinese, Korean)
- **LanguageProvider**: A React context provider that manages the current language state and provides translation functions
- **Translation System**: The i18n infrastructure that retrieves localized strings using dot-notation keys from translation JSON files (e.g., "home.title")
- **localStorage**: Browser storage mechanism for persisting user preferences across sessions

## Requirements

### Requirement 1

**User Story:** As a user visiting Equalin for the first time, I want to select my preferred language on the home page, so that I can understand the interface before creating a group.

#### Acceptance Criteria

1. WHEN a user visits the Home Page THEN the Home Page SHALL display the LanguageSelector Component in a visible location
2. WHEN a user selects a language from the LanguageSelector Component THEN the Home Page SHALL update all displayed text to the selected language immediately
3. WHEN a user selects a language from the LanguageSelector Component THEN the LanguageProvider SHALL persist the language preference to localStorage
4. WHEN a user creates a group after selecting a language THEN the Translation System SHALL maintain the selected language on the group page
5. WHEN a user returns to the Home Page THEN the Home Page SHALL display content in the previously selected language from localStorage

### Requirement 2

**User Story:** As a user, I want the home page text to be translated into my selected language, so that I can understand the purpose and actions available.

#### Acceptance Criteria

1. WHEN the Home Page renders THEN the Translation System SHALL display the title using the translation key "home.title"
2. WHEN the Home Page renders THEN the Translation System SHALL display the subtitle using the translation key "home.subtitle"
3. WHEN the Home Page renders THEN the Translation System SHALL display the create group button text using the translation key "home.createGroup"
4. WHEN translation keys are missing for the selected language THEN the Translation System SHALL fall back to English translations
5. WHEN translation keys are missing in all languages THEN the Translation System SHALL display the translation key itself

### Requirement 3

**User Story:** As a user, I want the language selector to be visually integrated with the home page design, so that it feels like a natural part of the interface.

#### Acceptance Criteria

1. WHEN the Home Page renders THEN the Home Page SHALL position the LanguageSelector Component in the top-right corner of the page
2. WHEN the LanguageSelector Component is displayed THEN the LanguageSelector Component SHALL apply styles consistent with the existing design system
3. WHEN the Home Page is viewed on mobile devices THEN the LanguageSelector Component SHALL remain accessible and usable
4. WHEN the LanguageSelector Component receives focus THEN the LanguageSelector Component SHALL display visible focus indicators for accessibility
5. WHILE the user interacts with the LanguageSelector Component THEN the Home Page SHALL maintain the overall page layout without shifting other elements
