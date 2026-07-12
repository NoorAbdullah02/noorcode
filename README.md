<div align="center">

<br />
<br />

<h1>NoorCode</h1>

<p>A terminal-based AI coding agent.</p>

<p>Plan, chat, and build inside your local project with a Bun-powered CLI, Hono API, Prisma ORM, Clerk auth, and AI SDK streaming.</p>

<br />

<p>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" /></a>&nbsp;
  <a href="https://opentui.dev"><img src="https://img.shields.io/badge/OpenTUI-111111?style=for-the-badge" alt="OpenTUI" /></a>&nbsp;
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>&nbsp;
  <a href="https://hono.dev"><img src="https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white" alt="Hono" /></a>&nbsp;
  <a href="https://neon.tech"><img src="https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black" alt="Neon" /></a>&nbsp;
  <a href="https://clerk.com"><img src="https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" /></a>&nbsp;
  <a href="https://polar.sh"><img src="https://img.shields.io/badge/Polar-000000?style=for-the-badge&logo=polar&logoColor=white" alt="Polar" /></a>
</p>

</div>

<br />

## Overview

NoorCode is a full-stack terminal AI coding assistant that runs entirely inside your terminal. It connects a React + OpenTUI CLI front-end to a Hono API back-end that streams AI model responses using the AI SDK. Sessions and messages are persisted in Postgres via Prisma. Users authenticate through a browser-based Clerk OAuth flow, and AI usage is metered and billed through Polar credits.

The agent operates in two modes:

- **PLAN** — Read-only exploration. The AI can read files, list directories, glob, and grep, but cannot make any changes. Use this to analyse a codebase and draft a plan before touching anything.
- **BUILD** — Full implementation. In addition to all PLAN tools, the AI can write files, edit files, and execute shell commands inside the current project directory.

---

## Features

- **Terminal AI Chat** — Run an AI coding assistant directly in your terminal with an OpenTUI + React interface rendered at 60 fps
- **Plan and Build Modes** — Use read-only planning tools or enable write, edit, and shell execution tools for implementation
- **Streaming Responses** — Stream model output through the Vercel AI SDK with persisted session history
- **Local Project Tools** — Read files, list directories, glob, grep, write files, edit files, and run shell commands scoped to the current project
- **Multi-Model Support** — Choose from Anthropic Claude models (Opus, Sonnet, Haiku), Cerebras models (`gemma-4-31b`, `zai-glm-4.7`, `gpt-oss-120b`), Mistral via Bynara, and free DeepSeek/Nemotron models via OpenCode
- **Persistent Sessions** — Store authenticated user sessions and full message history in Postgres via Prisma ORM
- **Clerk OAuth** — Authenticate the CLI through a browser-based Clerk OAuth 2.0 + PKCE flow without embedding long-lived secrets in the terminal
- **Usage Billing** — Meter AI token usage as credits through Polar before allowing session and chat actions; users purchase top-ups through a Polar checkout link
- **Automatic Updates** — CLI automatically checks npm for newer versions and displays a top-level banner notifying you to update when a new version is available

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| CLI renderer | [OpenTUI](https://opentui.dev) + [React](https://react.dev) |
| Routing (CLI) | [React Router](https://reactrouter.com) (memory router) |
| API server | [Hono](https://hono.dev) |
| AI streaming | [Vercel AI SDK](https://sdk.vercel.ai) |
| Database ORM | [Prisma](https://www.prisma.io) |
| Database host | [Neon](https://neon.tech) (Postgres) |
| Auth | [Clerk](https://clerk.com) OAuth 2.0 + PKCE |
| Billing | [Polar](https://polar.sh) credits meter |
| Validation | [Zod](https://zod.dev) |

---

## Supported AI Models

| Model ID | Provider | Input (per M tokens) | Output (per M tokens) |
|----------|----------|---------------------|----------------------|
| `claude-opus-4-6` *(default)* | Anthropic | $5.00 | $25.00 |
| `claude-sonnet-4-6` | Anthropic | $3.00 | $15.00 |
| `claude-haiku-4-5` | Anthropic | $1.00 | $5.00 |
| `gemma-4-31b` | Cerebras | Free | Free |
| `zai-glm-4.7` | Cerebras | Free | Free |
| `gpt-oss-120b` | Cerebras | Free | Free |
| `mistral-large` | Bynara | $2.00 | $6.00 |
| `deepseek-v4-flash-free` | OpenCode | Free | Free |
| `nemotron-3-ultra-free` | OpenCode | Free | Free |

The default model is `claude-opus-4-6`. Users can switch models from the CLI session screen.

---

## Agent Tools

### PLAN mode (read-only)

| Tool | Description |
|------|-------------|
| `readFile` | Read a file from the current project directory |
| `listDirectory` | List entries in a directory |
| `glob` | Find files matching a glob pattern (e.g. `**/*.ts`) |
| `grep` | Search file contents with a regular expression |

### BUILD mode (read + write)

Includes all PLAN tools, plus:

| Tool | Description |
|------|-------------|
| `writeFile` | Create or overwrite a file |
| `editFile` | Replace exact text in a file (the `oldString` must be unique in the file) |
| `bash` | Run a shell command in the current project directory |

---

## Getting Started

### Prerequisites
- **Bun** installed on your machine.
  - **Windows (PowerShell)**:
    1. Run: `powershell -c "irm bun.sh/install.ps1 | iex"`
    2. *Note: If `'bun'` is not recognized after installation, add `C:\Users\<YourUsername>\.bun\bin` to your User Environment Variables PATH (replace `<YourUsername>` with your Windows account name) and restart your terminal.*
  - **macOS / Linux**: Run `curl -fsSL https://bun.sh/install | bash`
- PostgreSQL database, such as [Neon](https://neon.tech)
- [Clerk](https://clerk.com) application configured for OAuth
- An Anthropic API key (and optionally other provider keys)
- [Polar](https://polar.sh) account and credits meter

### 1. Clone and install

```bash
git clone git@github.com:code-with-antonio/noorcode.git
cd noorcode
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the required values:

```bash
# Server URL the CLI calls
API_URL=http://localhost:3000

# Postgres connection string (e.g. from Neon)
DATABASE_URL=

# AI provider keys
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
CEREBRAS_API_KEY=

# Clerk OAuth application credentials
CLERK_FRONTEND_API=
CLERK_OAUTH_CLIENT_SECRET=
CLERK_OAUTH_CLIENT_ID=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Secret used to sign JWTs issued after OAuth
JWT_SECRET=jwt-secret

# Polar billing credentials
POLAR_ACCESS_TOKEN=
POLAR_PRODUCT_ID=
POLAR_SERVER=sandbox
POLAR_CREDITS_METER_ID=
```

### 3. Set up Clerk OAuth

NoorCode authenticates the CLI through a browser-based Clerk OAuth 2.0 + PKCE flow. The CLI opens Clerk's authorization URL in the browser, Clerk redirects to the server at `/auth/callback`, and the server forwards the authorization code back to a local callback server running inside the CLI.

In your [Clerk dashboard](https://clerk.com):

1. Go to **Configure → Developers → OAuth applications**.
2. Click **Add OAuth application**.
3. Name it anything, for example `NoorCode`.
4. Select these four scopes: `openid`, `email`, `profile`, and `offline_access`.
5. Turn on **Public** — required for the Authorization Code with PKCE flow used by the CLI.
6. Turn on **Consent screen** so users can approve the requested scopes.
7. Add `http://localhost:3000/auth/callback` as a redirect URI for local development.
8. Add your deployed callback URL as another redirect URI for production (e.g. `https://your-deployment.com/auth/callback`).

Copy the generated credentials into `.env`:

| Environment variable | Clerk value |
|----------------------|-------------|
| `CLERK_OAUTH_CLIENT_ID` | OAuth application Client ID |
| `CLERK_OAUTH_CLIENT_SECRET` | OAuth application Client Secret |
| `CLERK_FRONTEND_API` | Clerk Frontend API URL |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |

### 4. Set up Polar billing

NoorCode uses Polar credits to gate new work and bill completed AI usage. The server checks the user's active meter balance before creating sessions or sending chat requests, then ingests usage events after AI responses finish.

In your [Polar dashboard](https://polar.sh), use **sandbox mode** for local development.

**Step 1 — Create the meter:**

| Setting | Value |
|---------|-------|
| Meter name | `noorcode_credits` |
| Filter | Name equals `noorcode_usage` |
| Aggregation | Sum |
| Aggregation property | `credits` |

The event name and metadata key must match exactly. The server ingests usage events in this shape:

```ts
{
  name: "noorcode_usage",
  metadata: { credits }
}
```

**Step 2 — Create a credits product:**

1. Create a benefit using the `noorcode_credits` meter.
2. Set the credited units, for example `1000` credits.
3. Create a one-time purchase product, for example `$20` for `1000` credits.
4. Attach the credits benefit to that product.
5. Set customer portal visibility to **private** so purchases go through API-generated checkout links.

**Step 3 — Copy Polar values into `.env`:**

| Environment variable | Where to find it |
|----------------------|------------------|
| `POLAR_ACCESS_TOKEN` | Polar developer settings → Access tokens |
| `POLAR_PRODUCT_ID` | Product detail page URL |
| `POLAR_SERVER` | `sandbox` for local dev, `production` for live billing |
| `POLAR_CREDITS_METER_ID` | Meter detail page URL |

The CLI billing flow:
- **Upgrade** — calls `/billing/checkout`, which returns a Polar checkout URL the CLI opens in the browser.
- **Portal** — calls `/billing/portal`, which returns the customer's Polar portal URL.

### 5. Set up the database

Generate the Prisma client:

```bash
bun run --cwd packages/database db:generate
```

Push the Prisma schema to your Postgres database:

```bash
cd packages/database && bunx prisma db push
```

Or use Prisma Migrate for a tracked migration history:

```bash
cd packages/database && bunx prisma migrate dev
```

### 6. Run the server

```bash
bun run dev:server
```

The Hono API starts on `http://localhost:3000`.

### 7. Run the CLI

In a separate terminal window:

```bash
bun run dev:cli
```

To build and globally link the `noorcode` binary so you can run it from anywhere:

```bash
bun run link:cli
noorcode
```

---

## Project Structure

```
noorcode/
├── .env.example                     # Environment variable template
├── package.json                     # Root workspace scripts
├── tsconfig.base.json               # Shared TypeScript base config
└── packages/
    ├── cli/                         # Terminal client (OpenTUI + React)
    │   ├── bin/
    │   │   └── noorcode             # Executable entry shim
    │   ├── dist/                    # Bundled output + tree-sitter WASM grammars
    │   └── src/
    │       ├── index.tsx            # Entry point — mounts the React app in the terminal
    │       ├── theme.ts             # Color and style tokens
    │       ├── components/          # Terminal UI components, dialogs, message bubbles
    │       ├── hooks/               # Chat, auth, billing, and UI state hooks
    │       ├── layouts/             # Root terminal layout shell
    │       ├── lib/                 # API client, auth helpers, OAuth flow, local tool runner
    │       ├── providers/           # Dialog, keyboard, prompt, theme, and toast providers
    │       └── screens/
    │           ├── home.tsx         # Session list and navigation
    │           ├── new-session.tsx  # Model and mode picker for new sessions
    │           └── session.tsx      # Active chat session screen
    ├── database/                    # Prisma ORM layer
    │   ├── prisma/
    │   │   └── schema.prisma        # Database schema (Session model)
    │   ├── prisma.config.ts         # Prisma configuration
    │   └── src/
    │       ├── client.ts            # Prisma client singleton
    │       └── index.ts             # Database package exports
    ├── server/                      # Hono API back-end
    │   └── src/
    │       ├── index.ts             # Server entry — routes, error handling, auth middleware
    │       ├── system-prompt.ts     # Builds the AI system prompt for PLAN and BUILD modes
    │       ├── middleware/
    │       │   └── require-auth.ts  # JWT verification middleware
    │       └── routes/
    │           ├── auth.ts          # /auth — OAuth callback and token exchange
    │           ├── billing.ts       # /billing — checkout and portal URLs
    │           ├── sessions.ts      # /sessions — CRUD for chat sessions
    │           └── chat.ts          # /chat — AI SDK streaming endpoint
    └── shared/                      # Types and contracts shared between CLI and server
        └── src/
            ├── index.ts             # Package barrel export
            ├── models.ts            # Supported model registry with pricing
            └── schemas.ts           # Zod schemas, PLAN/BUILD tool contracts, mode enum
```

---

## API Routes

All `/sessions/*`, `/chat/*`, and `/billing/checkout|portal` routes require a valid JWT (set in the `Authorization: Bearer <token>` header).

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/auth/callback` | No | Receives Clerk OAuth redirect; exchanges code for tokens and issues a signed JWT |
| `GET` | `/billing/checkout` | Yes | Returns a Polar checkout URL for purchasing credits |
| `GET` | `/billing/portal` | Yes | Returns the user's Polar customer portal URL |
| `GET` | `/sessions` | Yes | List all sessions for the authenticated user |
| `POST` | `/sessions` | Yes | Create a new session (checks credit balance first) |
| `GET` | `/sessions/:id` | Yes | Get a single session with its message history |
| `DELETE` | `/sessions/:id` | Yes | Delete a session |
| `POST` | `/chat` | Yes | Stream an AI response; ingests Polar usage after completion |

---

## Database Schema

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Json     @default("[]")

  @@index([userId])
}
```

Messages are stored as a JSON array on the `Session` record. Each message object follows the Vercel AI SDK `CoreMessage` shape (`role`, `content`, `tool_call_id`, etc.).

---

## Scripts

Run these from the repo root unless noted otherwise:

| Command | Description |
|---------|-------------|
| `bun run dev:cli` | Start the CLI in watch mode (re-runs on file changes) |
| `bun run dev:server` | Start the Hono server with hot reload |
| `bun run build:cli` | Bundle the CLI package |
| `bun run link:cli` | Build and globally link the `noorcode` executable via `bun link` |
| `bun run --cwd packages/database db:generate` | Re-generate the Prisma client after schema changes |

---

## Packages

| Package | Description |
|---------|-------------|
| `@noorcode/cli` | Terminal UI, React screens, client-side tool execution, auth + billing flows |
| `@noorcode/server` | Hono API, AI SDK streaming, Clerk JWT auth middleware, Polar billing ingestion |
| `@noorcode/database` | Prisma client singleton and database schema |
| `@noorcode/shared` | Zod schemas, AI tool contracts (PLAN + BUILD), supported model registry |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `API_URL` | Yes | Base URL of the Hono server (default: `http://localhost:3000`) |
| `DATABASE_URL` | Yes | Postgres connection string |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key for Claude models |
| `OPENAI_API_KEY` | No | OpenAI API key (for future OpenAI model support) |
| `CEREBRAS_API_KEY` | No | Cerebras API key for GLM, Gemma, and GPT-OSS models |
| `CLERK_FRONTEND_API` | Yes | Clerk Frontend API URL |
| `CLERK_OAUTH_CLIENT_ID` | Yes | Clerk OAuth application Client ID |
| `CLERK_OAUTH_CLIENT_SECRET` | Yes | Clerk OAuth application Client Secret |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `JWT_SECRET` | Yes | Secret for signing JWTs after OAuth (change from default in production) |
| `POLAR_ACCESS_TOKEN` | Yes | Polar API access token |
| `POLAR_PRODUCT_ID` | Yes | Polar product ID for the credits top-up product |
| `POLAR_SERVER` | Yes | `sandbox` or `production` |
| `POLAR_CREDITS_METER_ID` | Yes | Polar meter ID for the `noorcode_credits` meter |

\* At least one AI provider key is required to use the chat feature.

---

## Troubleshooting

**CLI exits immediately or shows a blank screen**  
Make sure `bun run dev:server` is running first and that `API_URL` in `.env` points to it.

**`401 Unauthorized` on chat requests**  
Run `noorcode` and log in again — the JWT may have expired. The CLI stores the token locally and will prompt for re-authentication when needed.

**Polar returns "insufficient credits"**  
Use the Upgrade option in the CLI to open a sandbox checkout. Complete the test purchase, then retry. Make sure `POLAR_SERVER=sandbox` matches your Polar dashboard environment.

**Prisma client not found**  
Run `bun run --cwd packages/database db:generate` after any schema change or after a fresh clone.

**Tree-sitter WASM grammars missing**  
Run `bun run build:cli` — the WASM files are bundled into `packages/cli/dist/` during the build step.

---

## License

MIT © NoorCode.org contributors
