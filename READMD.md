# NocoBase 3

English | [简体中文](./READMD.zh-CN.md)

**Build reliable business systems**

NocoBase is the open-source platform for building, running, and evolving business systems with AI. Agents write the code and do the work, NocoBase provides the foundation and governance, and people make the decisions.

[▶ Watch the Demo](https://static-docs.nocobase.com/nocobase-3-en.mp4)

[Website](https://www.nocobase.com/) · [Documentation](https://docs.nocobase.com/) · [Quick Start](#quick-start) · [Community](https://forum.nocobase.com/)

> This branch contains NocoBase 3. Looking for the NocoBase 2 no-code platform? Visit [NocoBase 2](https://nocode.nocobase.com/).

## Why NocoBase

**AI writes code fast. Building reliable business systems is still hard.**

Your team is already developing with AI or vibe coding. Code gets written fast, but new problems come with it.

### 01 Every project rebuilds the foundation

Even with AI writing the code, permissions, workflow engines, and approvals are hard to design from scratch. They are full of edge cases and take a lot of work to maintain.

### 02 Architecture drifts out of control

Switch developers, models, or even sessions, and the AI may improvise differently each time. The system gets harder and harder to maintain.

### 03 Parallel work outpaces human review

You juggle several projects and issues, switching between terminals and chats, while agents hand back more and more changes. There is more than anyone can review, but letting go feels too risky.

### 04 Know-how is hard to capture and share

Requirement context, business documents, and lessons learned are scattered across chat sessions on different computers. When people or agents change, they are hard to find.

## Quick Start

Create a new application with a coding agent or directly from your terminal. Both approaches use the same scaffolding tool.

Requirements:

- Node.js 24 or later
- pnpm 11
- Windows users: run the commands in WSL

The examples below use SQLite, so you do not need a separate database server.

### With a coding agent

Open a coding agent that supports Skills in an empty project directory.

Ask it to install the application creation Skill:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Select your coding agent when prompted. If the current session does not recognize the new Skill, start a new session in the same directory.

Then give it a task:

> Create a NocoBase 3 application in this empty directory for local development. Use the default template and SQLite. Follow the nocobase-create-app Skill to check the environment, create the application, initialize and validate its configuration, and start it. Tell me the application URL and how to sign in.

The agent follows the setup instructions and reports any prerequisites that need attention.

### From the terminal

Run the following commands from the directory where you keep your projects:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

The creation command installs dependencies. The configuration command creates your local `config.yml` and initializes the required secrets.

The `@beta` tags select the NocoBase 3 beta tool and template. The environment variable allows pnpm to install recently published packages for this command.

### Open your application

Open the complete `Local:` URL printed by `pnpm dev`, including the application path. Keep the terminal running.

Unless you changed the initial administrator configuration, sign in with:

- **Username:** `nocobase`
- **Password:** `admin123`

Change the default password after your first sign-in.

Once the application is created, ask your coding agent to read its `AGENTS.md` and Skills to continue building business features. See the [documentation](https://docs.nocobase.com/) for detailed setup instructions and development guides.

## The NocoBase Ecosystem

### NocoBase Core

The application foundation in this repository: reusable capabilities, project scaffolding, architecture conventions, and development Skills.

[Explore Core](https://www.nocobase.com/core/)

### NocoBase Studio

The governance platform for people and agents building software together. Coordinate development work, track progress, and keep people involved in key decisions. Available in the commercial editions.

[Explore Studio](https://www.nocobase.com/studio/)

### NocoBase Solutions

Business applications built on Core. Start from an existing application and adapt it to your own requirements.

[Explore Solutions](https://www.nocobase.com/solutions/)

## Community and Contributions

- Ask questions and share your experience in the [community forum](https://forum.nocobase.com/).
- Report reproducible bugs and request improvements through [GitHub Issues](https://github.com/nocobase/nocobase/issues).
- Read the [documentation](https://docs.nocobase.com/) to learn how the framework and plugins work.

Contributions are welcome. Before making changes to this repository, read [AGENTS.md](./AGENTS.md) and the development instructions relevant to your change.
