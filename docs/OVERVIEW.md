# Equalin Project Overview

Equalin is an open-source web application designed for simple and fair split-billing. It records group expenses and automatically calculates who owes whom and how much.

## Core Features
- **Group Management**: Create groups and share via invitation links.
- **Expense Logging**: Select payer, amount, and participants. Supports editing after entry.
- **Settlement Calculation**: Algorithm to settle debts with the minimum number of transactions.
- **Anonymous Usage**: No sign-up required. Secure profile management via Supabase Anonymous Auth.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19
- **Backend**: Supabase (PostgreSQL, SSR Client)
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, Presentation)
- **Tooling**: Bun, Biome, TypeScript, Tailwind CSS

## System Architecture
Strict adherence to Clean Architecture:

1. **Domain Layer (`src/core/domain/`)**:
   - `entities/`: Business entity definitions (Payment, Profile). No external dependencies.
   - `services/`: Pure business logic (SettlementService).
   - `repositories/`: Persistence interfaces.
2. **Application Layer (`src/core/application/`)**:
   - `use-cases/`: Specific business flows (e.g., Settlement calculation).
3. **Infrastructure Layer (`src/core/infrastructure/`)**:
   - `repositories/`: Implementations using Supabase SDK.
4. **Presentation Layer (`src/app/actions/`, `src/app/group/`)**:
   - Server Actions and React components.

## Development Principles
1. **Logic Isolation**: Core logic resides in `domain/services`, detached from DB or external libs.
2. **Dependency Inversion**: High-level layers depend on interfaces, not concrete implementations.
3. **Lean UI**: Maintain a fast, intuitive UI without excessive decoration.
