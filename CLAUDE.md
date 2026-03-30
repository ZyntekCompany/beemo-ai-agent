# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Development (all apps simultaneously)
pnpm dev
# Starts: Convex backend (localhost:3030), web (localhost:3000), widget (localhost:3001)

# Individual apps
pnpm --filter @workspace/backend dev   # Convex backend only
pnpm --filter web dev                  # Web dashboard only (port 3000)
pnpm --filter widget dev               # Widget only (port 3001)

# Build
pnpm build                             # All packages
pnpm --filter web build
pnpm --filter widget build

# Type checking
pnpm --filter web typecheck
pnpm --filter widget typecheck

# Lint & format
pnpm lint
pnpm format                            # Prettier over ts/tsx/md

# Deploy Convex backend
pnpm dlx convex deploy                 # Run from packages/backend/convex/
```

No test suite is currently configured.

## Architecture

This is a **Turborepo + pnpm monorepo** for an AI customer support platform called Beemo.

### Apps

- **`apps/web`** — Operator dashboard (Next.js 16 App Router, port 3000). Requires Clerk auth + organization. Modules: `conversations`, `files` (knowledge base), `customization`, `plugins`, `integrations`, `billing`, `dashboard`.
- **`apps/widget`** — Embeddable customer-facing chat widget (Next.js 16, port 3001). Light auth: name + email creates a contact session, no Clerk required. Optional Vapi voice integration.
- **`apps/embed`** — Minimal Vite app for injecting the widget on external sites (port 3002).

### Packages

- **`packages/backend`** — All Convex serverless functions, data schema, AI agent, RAG pipeline. This is the single backend for both apps.
- **`packages/ui`** — Shared design system (~59 components) built on shadcn/ui + Radix UI + TailwindCSS 4.
- **`packages/eslint-config`**, **`packages/typescript-config`** — Shared tooling configs.

### Backend (Convex) Structure

```
packages/backend/convex/
├── schema.ts              # All table definitions
├── auth.config.ts         # Clerk JWT auth config
├── convex.config.ts       # Agent & RAG plugin registration
├── http.ts                # Webhook routes (Clerk, YCloud)
├── private/               # Auth-required mutations/queries (operators)
├── public/                # Public API (widget, anonymous)
└── system/ai/
    ├── agents/supportAgent.ts   # Beemo AI agent (GPT-4o-mini, Spanish instructions)
    ├── rag.ts                   # OpenAI embeddings setup (text-embedding-3-small, 1536d)
    ├── constants.ts             # AI model/config constants
    └── tools/
        ├── search.ts            # RAG knowledge base lookup
        └── resolveConversation.ts
```

### Key Data Models

- **`conversations`**: `threadId`, `type: "widget"|"whatsapp"`, `organizationId`, `status: "unresolved"|"resolved"|"escalated"`
- **`contactSessions`**: Visitor name/email, browser metadata, expiry — created by widget on first contact
- **`widgetSettings`**: Per-org greeting, suggestions, Vapi assistant config
- **`plugins`**: Active integrations per org (Vapi, YCloud)
- **`reservations`**: Barber booking system (organizationId, barberName, customerName, startTime/endTime, status)

### AI & RAG

- **Support agent** (`system/ai/agents/supportAgent.ts`): Uses `@convex-dev/agent`, operates in Spanish, tools: search KB, escalate, resolve conversation.
- **RAG** (`system/ai/rag.ts`): `@convex-dev/rag` with OpenAI `text-embedding-3-small` (1536 dims), namespaced by `organizationId`. When adding new knowledge sources, update this file to align embedding model/dimensions.
- **`convex.config.ts`**: Registers the agent and RAG components — must be updated if adding new Convex components.

### Auth Flow

- **Web app**: Clerk handles auth; Next.js middleware (`apps/web/middleware.ts`) redirects to org selection if no org is chosen.
- **Widget**: Light-auth only — visitors provide name + email, backend creates a `contactSession` with browser metadata.
- **Convex functions**: `private/` functions require Clerk JWT; `public/` functions are unauthenticated.

### External Integrations

- **Clerk**: User/org management, subscription webhooks at `POST /clerk-webhook`
- **YCloud**: WhatsApp messages received at `POST /webhooks/ycloud/{organizationId}`
- **Vapi**: Voice/phone integration; credentials stored per-org in AWS Secrets Manager at `tenant/{organizationId}/vapi`
- **OpenAI**: RAG embeddings + GPT-4o-mini for the support agent

### Environment Variables

**`apps/web/.env.local`**: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, `OPENAI_API_KEY`

**`apps/widget/.env.local`**: `NEXT_PUBLIC_CONVEX_URL` only (Vapi credentials fetched dynamically from backend)

**`packages/backend/convex/.env.local`**: `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, `OPENAI_API_KEY`, `CONVEX_DEPLOYMENT` (prod only), `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (for Vapi/Secrets Manager)
