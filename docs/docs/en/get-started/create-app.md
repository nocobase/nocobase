---
title: 'Create with an AI Agent'
description: 'Create and start a NocoBase 3 application with an AI Agent, then continue development in a new session.'
---

# Create with an AI Agent

Ask your AI Agent to check the environment, create a project, and start it locally.

## Install application creation Skills

Prepare Node.js 24 or later and pnpm 11, then use a Bash terminal, or WSL on Windows, to install the global NocoBase 3 Skills:

```bash
npx skills@latest add nocobase/skills-v3 --skill '*' -g
```

Select your Coding Agent when prompted and start a new Agent session. The [lightweight distribution repository](https://github.com/nocobase/skills-v3) provides `nocobase-create-app` to guide environment checks, application creation, and startup. After generation, development follows the project Skills in the application directory.

## Create the application

1. **Start an AI Agent session**

   Start a new session with an empty application directory as its working directory:

   - **CLI:** create an empty directory, enter it in your terminal, then launch your AI Agent and start a new session
   - **Desktop client:** create an empty directory, add it as a project or workspace, then create a new session within it

   :::tip Directory naming requirements

   **The directory name becomes the application's default name.** It must start with a lowercase English letter or digit and contain only lowercase English letters, digits, dots (`.`), hyphens (`-`), or underscores (`_`). Chinese characters, spaces, and uppercase letters are not allowed. Suggested names include `my-app`, `crm-demo`, and `order-system`.

   :::

2. **Create the application**

   Copy and send this prompt in the session you just started:

   ```text
   Create a NocoBase 3 application for me: https://v3.docs.nocobase.com/get-started/create-app-with-agent.md (read the linked file directly)
   ```

   Your AI Agent will check the environment, initialize the application in the current empty directory, read its project guidance, confirm your database requirements, and start the service.

   After startup, open the URL provided by your AI Agent.

   :::warning Note

   **After the application starts, start a new session before you continue development.**

   Creating the application synchronizes its development Skills into `.agents/skills/` in the project directory. These files appear after the current session starts, so it may not load them automatically. Start a new session in the application directory before continuing development.

   :::

## Sign in

The browser opens the sign-in page:

![Sign-in page of a new application](https://static-docs.nocobase.com/nb3-docs-20260916-login-en.png)

Your AI Agent should provide the URL and sign-in instructions after startup. When using the template’s initial administrator, the credentials are:

| Field    | Initial value        |
| -------- | -------------------- |
| Email    | `admin@nocobase.com` |
| Password | `admin123`           |

Use this account for the first local walkthrough. Change the initial password and configure production access before exposing the application. If you configured your own administrator during installation or connected an existing database, use those credentials.

After signing in, you see the application home page. Use “Language” in the account menu at the top right to switch languages.

![Application home, with the order menu added by the next step; interface shown in Chinese](https://static-docs.nocobase.com/nb3-docs-20260916-home-cn.png)

The order menu shown here is added on the next page. A newly created application does not have it yet.

## Stop and restart

Ask your AI Agent to stop the development service. Next time, start a session in the same application directory and ask it to start the existing application. If you manage the terminal yourself, press `Ctrl+C` to stop and run `pnpm dev` from the application directory to restart. Do not recreate the project.

Use `pnpm dev` during development. `pnpm build` followed by `pnpm start` runs a built application; keep development mode for this walkthrough.

## Next step

Start a new session rooted in your application directory and [build your first feature](./first-feature). The AI Agent's installation, account, and model access must be prepared separately.

Next, hand the project to your AI Agent and let it start building. To build a CRM application, for example, tell it:

```text
Build a CRM application based on this NocoBase 3 project template.
```

Describe the business goal, the roles involved, and any existing tables or processes; the AI Agent turns that into pages, data models, and flows.
