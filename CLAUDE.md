# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

羽球排點王 (Badminton Court Allocation King) - A React/TypeScript web application for fair badminton court allocation. Manages players, organizes courts, and facilitates match assignments with smart team balancing.

## Development Commands

All commands run from the `fronent/` directory:

```bash
cd fronent
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000, host 0.0.0.0)
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report

# Run a single test file
npx vitest run test/utils.test.ts
```

## Tech Stack

- **React 19** with TypeScript 5.8 (strict mode)
- **Vite 6** as build tool
- **Vitest** for unit testing
- **Tailwind CSS** (via CDN in index.html)
- **localStorage** for persistence (key: `badminton-app-state-v6`, 500ms debounce)

## Architecture

```
fronent/
├── App.tsx              # Main component - orchestrates hooks and UI
├── types.ts             # TypeScript interfaces (Player, Court, MatchRecord, RoundRecord)
├── utils.ts             # Utility functions including smart allocation algorithm
├── hooks/               # Custom React hooks (re-exported via index.ts)
│   ├── useLocalStorage  # Persistent state with debounce
│   ├── useToast         # Toast notifications
│   ├── useModalState    # All modal states
│   ├── usePlayerManagement # Player CRUD operations
│   ├── useCourtManagement  # Court operations, smart allocation
│   ├── useMatchHistory     # Match recording
│   └── useConfirm          # Confirmation dialogs
├── components/          # Reusable UI components
│   ├── ErrorBoundary    # Error boundary for crash recovery
│   ├── ConfirmModal     # Confirmation dialog (replaces native confirm)
│   └── ...
├── utils/
│   └── validation.ts    # Form validation functions
└── test/                # Test files
    ├── setup.ts         # Test configuration
    ├── utils.test.ts    # Utils unit tests
    ├── validation.test.ts # Validation unit tests
    └── hooks.test.ts    # Hooks unit tests
```

### Core Data Models

- **Player**: id, name, isActive, gender (M/F), level (1-18)
- **Court**: id, name, type (A/B for multi-hall), status (allocating/playing), playerIds[4]
- **RoundRecord**: Match history with timestamps and results

### Smart Allocation Algorithm (`utils.ts:smartAllocation`)

The key algorithm that makes this app useful:
1. Respects courts in 'playing' status (locked)
2. Excludes players currently in playing courts
3. Allocates remaining active players to 'allocating' courts
4. **Priority**: Least Played > Most Rested > Random tie-breaking
5. **S-Curve distribution** to balance skill levels across courts
6. **Intra-court balancing**: [Best, Worst] vs [2nd, 3rd] for fair teams

### Component Patterns

- **Button**: variants (primary/secondary/danger/ghost/outline), sizes (sm/md/lg/icon)
- **Modal**: Portal-based with ESC key handler
- **Toast**: Auto-dismiss notifications (success/error/info)
- **ConfirmModal**: Custom confirmation dialog with variants (danger/warning/info)
- **CourtCard**: 4-slot drag-drop with team visualization
- **ErrorBoundary**: Catches React errors with recovery UI

### Validation

Form validation uses `utils/validation.ts`:
- `validatePlayerName`: 1-20 characters
- `validatePlayerLevel`: integer 1-18
- `validateCourtName`: 1-30 characters

## Path Aliases

`@/*` maps to root directory (configured in tsconfig.json and vite.config.ts)

## Deployment

GitHub Pages deployment with base path `/badminton/` (configured in vite.config.ts).

## Known Issues

- Frontend folder is named `fronent` (typo) - maintained for compatibility
