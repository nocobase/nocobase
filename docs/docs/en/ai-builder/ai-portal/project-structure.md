---
title: "Project Structure and Tech Stack"
description: "The AI Portal template's tech stack, directory conventions, environment variables, and common commands, so you can tell whether the AI put its code in the right place."
keywords: "AI Portal,project structure,tech stack,React,Vite,Refine,Tailwind CSS,shadcn/ui,environment variables"
---

# Project Structure and Tech Stack

:::tip Prerequisites

Before reading this page, make sure you have your first Portal running by following the [AI Portal Quick Start](./index.md).

:::

Most day-to-day development can be left to the AI. Still, knowing the template's structure lets you tell whether the AI put its code in the right place, and makes problems easier to locate.

## Tech stack

The Portal template is based on `@nocobase/portal-template-default`, with source at [nocobase/portal-template-default](https://github.com/nocobase/portal-template-default).

| Technology | Purpose |
| --- | --- |
| React 19 + TypeScript | Frontend framework |
| Vite | Dev server and build tool |
| [Refine](https://refine.dev/docs/) | Data layer framework, handling resources, routing, forms, and permissions |
| Tailwind CSS 4 | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | Component base, source owned by the project |
| lucide | Icon library |
| pnpm | Package manager |

This combination is the frontend stack AI is most familiar with today, which makes what it writes more accurate.

The Portal is a pure frontend project for now, with business logic handled through NocoBase's API, standard components, and so on. Support for having the AI Agent write Portal backend code is coming.

## Directory structure

```text
src/
├── app/            Routing and extension loading
├── pages/          Login, registration, forgot password, and so on
├── components/     Components
│   ├── ui/         shadcn/ui component base
│   ├── app-shell/  Layout, navigation, loading states
│   ├── auth/       Authentication components
│   └── ...
├── extensions/     Extensions, active once installed
├── lib/            NocoBase client wrapper and ACL logic
├── providers/      Refine providers
├── hooks/          Custom hooks
└── locales/        Localized strings
```

A few key locations:

- **`src/app/routes.tsx`** — Route structure. Authenticated and unauthenticated routes are separate, and routes provided by extensions are mounted automatically
- **`src/app/extensions.tsx`** — Extension loading, using `import.meta.glob` to scan `src/extensions/*/extension.tsx`
- **`src/providers/data.ts`** — Refine's data provider, translating Refine's query syntax into NocoBase API parameters
- **`src/lib/nocobase/client.ts`** — `NocoBaseClient`, the low-level wrapper behind every request
- **`src/components/ui/`** — 60-odd shadcn/ui components, ready to use

Business pages usually go under `src/extensions/`, one directory per feature module. See [Standard Components and Extensions](./components.md).

## Key files

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Development conventions for the AI Agent. You can add your own project rules here |
| `components.json` | shadcn/ui configuration, including style, icon library, and path aliases |
| `.env` / `.env.local` | Environment variables, refreshed automatically by `nb portal dev` and `deploy` |
| `vite.config.ts` | Build configuration, including the API proxy used during development |

## Environment variables

| Variable | Description |
| --- | --- |
| `NOCOBASE_API_URL` | NocoBase REST API root, **must end with `/api`**. Usually `/api` for same-origin deployments |
| `NOCOBASE_PORTAL_BASE` | Public path the Portal is mounted at. `/` for local development, the actual deployment path such as `/x/main/` for builds |
| `NOCOBASE_AUTHENTICATOR` | Authenticator name, `basic` by default |
| `NOCOBASE_API_TOKEN` | Temporary token for development. Don't commit a real value |
| `API_CLIENT_STORAGE_PREFIX` | Token storage prefix. Keep it aligned if the server customizes it |
| `API_CLIENT_STORAGE_TYPE` | Token storage method, `localStorage` by default |
| `API_CLIENT_SHARE_TOKEN` | Whether to share the token, `false` by default |

`nb portal dev` and `nb portal deploy` write these for you, so you usually don't need to touch them. The last three only need aligning when the server has customized how auth tokens are stored.

During development, if `NOCOBASE_API_URL` is an absolute address, Vite sets up a proxy to forward requests, so you don't have to deal with CORS yourself.

## Common commands

These are the ones you'll use day to day. Dependency installation, environment variable refreshing, and builds are all handled by the CLI behind the scenes:

| Command | Purpose |
| --- | --- |
| `nb portal list` | See which Portals the current application has |
| `nb portal info <portal>` | Check a Portal's dev path, deploy path, and access URL |
| `nb portal create <portal>` | Create a new Portal's dev workspace from the template |
| `nb portal pull <portal>` | Pull the remote Portal source into the local dev workspace |
| `nb portal dev <portal>` | Start the local dev server and see changes live |
| `nb portal push <portal>` | Push local source changes to the remote |
| `nb portal deploy <portal>` | Build and deploy, making changes live for users |
| `nb portal config <portal>` | Adjust source storage, Git settings, and the dev workspace path |
| `nb portal destroy <portal>` | Delete the Portal record and its deployed files |

For the full parameters of each command, see the [`nb portal` Command Reference](../../api/cli/portal/index.md).

## Where the dev workspace lives

A Portal's dev workspace goes into the directory you were in when you ran `nb portal create` or `nb portal pull`:

```text
./<portal>
```

You can point it elsewhere with `--path` when creating or pulling. The built deployment artifacts go somewhere else — under the target application's storage, kept in sync by `nb portal deploy`, and not something you normally deal with.

If you're not sure where a Portal's dev workspace is, just check:

```bash
nb portal info main
```

## Related Links

- [AI Portal Quick Start](./index.md) — Get your first AI-written frontend entry running
- [Standard Components and Extensions](./components.md) — The shadcn/ui component base and the extension mechanism
- [Deployment and Source Management](./deploy.md) — The build and deploy flow, and source storage
- [Building with an AI Agent](./agent-workflow.md) — Drive the AI to write pages in natural language
- [`nb portal info`](../../api/cli/portal/info.md) — Check where a Portal's dev workspace is
