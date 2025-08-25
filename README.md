# Lucas AI Monorepo

A monorepo containing a React SPA + Fastify API setup with TypeScript, Prisma, and modern tooling.

## Project Structure

```
root/
├── apps/
│   ├── web/              # React SPA 
│   └── api/              # Fastify API server
└── packages/
    ├── db/               # Prisma schema + client
    └── lib/              # Shared utilities and types
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm db:generate

# Build shared packages
pnpm build
```

## Available Commands

### Database Commands (from root)

```bash
# Generate Prisma Client
pnpm db:generate

# Create and run migrations
pnpm db:migrate

# Push schema changes directly (dev only)
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Build all apps and packages
pnpm build
```

## Tech Stack

### Frontend (apps/web)
- React + Vite
- TypeScript
- TanStack Query
- React Router
- Tailwind CSS
- React Hook Form + Zod

### Backend (apps/api)
- Fastify
- TypeScript
- Prisma ORM
- PostgreSQL

### Shared
- TypeScript
- Zod for validation
- Prisma for database access
- pnpm workspaces for monorepo management

## Database Schema

Current models:

\`\`\`prisma
model University {
  id         String   @id @default(cuid())
  name       String
  location   String
  state      String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
\`\`\`

## Environment Variables

### API (.env)
```env
DATABASE_URL="postgresql://..."
COOKIE_SECRET="your-secret"
```

### Web (.env)
```env
VITE_API_URL="http://localhost:3001"
```
