---
inclusion: always
---

# Equalin Project Overview

## Project Description

Equalin is an open-source web application for fair and effortless bill splitting. It enables groups to track shared expenses and automatically calculate who owes whom.

## Core Features

- **Group Management**: Create groups and invite members via shareable links
- **Expense Tracking**: Record payments with descriptions and amounts
- **Participant Selection**: Choose which members share each expense
- **Settlement Calculation**: Automatically calculate optimal payment transactions
- **Anonymous Usage**: No login required, profile stored in localStorage

## Technology Stack

### Frontend
- **Framework**: Next.js (latest) with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4 with custom theme
- **Component Library**: Radix UI (checkbox, dropdown, label, slot)
- **Icons**: lucide-react
- **Theme Management**: next-themes

### Backend
- **Database**: Supabase (PostgreSQL)
- **Data Fetching**: Supabase SSR client
- **Server Actions**: Next.js Server Actions for mutations

### Development Tools
- **Runtime**: Bun (package manager and runtime)
- **Linter/Formatter**: Biome 2.3.1 (replaces ESLint + Prettier)
- **Type Checking**: TypeScript strict mode
- **Version Control**: Git

### Build & Deploy
- **Build Tool**: Next.js with Turbopack (dev mode)
- **CSS Processing**: PostCSS with Autoprefixer
- **Animations**: tailwindcss-animate

## Project Structure

```
equalin/
├── app/                    # Next.js App Router pages
│   ├── group/[id]/        # Dynamic group pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility functions and clients
│   ├── supabase/         # Supabase client configurations
│   └── utils.ts          # General utilities
├── types/                 # TypeScript type definitions (to be created)
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
├── .kiro/                # Kiro IDE configuration
│   ├── specs/           # Feature specifications
│   └── steering/        # Project guidelines (this file)
└── docs/                 # Documentation (if needed)
```

## Key Conventions

### File Naming
- Components: PascalCase (e.g., `PaymentForm.tsx`)
- Utilities: camelCase (e.g., `currency.ts`)
- Server Actions: camelCase in `actions/` directory
- Types: PascalCase in `types/` directory

### Import Aliases
- `@/*` maps to project root (configured in tsconfig.json)
- Example: `import { createClient } from '@/lib/supabase/client'`

### Component Organization
- Page components in `app/` directory
- Reusable components in `app/[route]/components/` or shared `components/` directory
- Server Actions in `app/actions/` directory

## Database Schema

### Tables
- `groups`: Expense-sharing groups
- `profiles`: User profiles (client-generated UUIDs)
- `group_members`: Junction table for group membership
- `payments`: Payment records
- `payment_participants`: Junction table for payment participation

### Key Principles
- Use UUIDs for all primary keys
- CASCADE DELETE for referential integrity
- Store monetary amounts as BIGINT (cents/smallest unit)
- Use TIMESTAMPTZ for all timestamps

## Development Workflow

### Running the Project
```bash
bun dev          # Start development server with Turbopack
bun build        # Build for production
bun start        # Start production server
```

### Code Quality
```bash
bun run check           # Run Biome checks (lint + format)
bun run check:apply     # Auto-fix issues
bun run format          # Check formatting only
bun run format:apply    # Auto-format files
```

### Database Migrations
```bash
bunx supabase migration new <name>    # Create new migration
bunx supabase db reset                # Reset local database
bunx supabase db push                 # Push migrations to remote
```

## Environment Variables

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/public key

## Design Principles

1. **Simplicity First**: Keep UI clean and intuitive
2. **No Authentication**: Use localStorage for anonymous profiles
3. **Mobile-Friendly**: Responsive design for all screen sizes
4. **Fast Performance**: Optimize for quick load times
5. **Type Safety**: Leverage TypeScript for reliability
6. **Accessibility**: Follow WCAG guidelines with Radix UI

## References

- Spec Documents: `.kiro/specs/bill-splitting-core/`
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Radix UI: https://www.radix-ui.com/
