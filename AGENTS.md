# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Anime Index is a personal anime storytelling website where users catalog anime they've watched, write episode-by-episode story breakdowns with images and video clips, and organize entries with a tagging system for filtering and sorting.

## Tech Stack

- **Framework**: Next.js 16 with App Router (`src/app/`)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Database**: SQLite via Prisma ORM
- **Runtime**: Node.js, npm

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run start` — Serve production build
- `npm run lint` — Run ESLint
- `npx prisma migrate dev` — Create and apply database migrations
- `npx prisma generate` — Regenerate Prisma client after schema changes
- `npx prisma studio` — Open Prisma's database GUI
- `npx prisma db push` — Push schema changes without creating a migration (dev only)

## Architecture

### Path Aliases

All imports from `src/` use the `@/*` alias (e.g., `import { db } from "@/lib/db"`).

### Prisma

- Schema lives at `prisma/schema.prisma` with config in `prisma.config.ts`
- Prisma client is generated to `src/generated/prisma` (gitignored)
- Database URL is configured via `DATABASE_URL` in `.env` (defaults to `file:./dev.db`)
- After any schema change, run `npx prisma migrate dev` then `npx prisma generate`

### App Router Structure

All pages and API routes live under `src/app/`. This project uses Next.js App Router conventions:
- `page.tsx` — Page components
- `layout.tsx` — Layout wrappers
- `route.ts` — API route handlers (under `src/app/api/`)
- `loading.tsx` / `error.tsx` — Loading and error UI boundaries

### Styling Conventions

- Tailwind CSS v4 is configured via `postcss.config.mjs` (not `tailwind.config.js`)
- Global CSS variables and theme tokens are defined in `src/app/globals.css` using `@theme inline`
- Fonts: Geist Sans and Geist Mono loaded via `next/font/google` in the root layout

### ESLint

Config is in `eslint.config.mjs` using the flat config format with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
