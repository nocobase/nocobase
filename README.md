<h1 align="center">
  <picture>
    <img src="https://github.com/user-attachments/assets/37038107-f934-47c7-872c-0f577f38bfc4" width="340" alt="NocoBase">
  </picture>
</h1>

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

English | [Español](./README.es-ES.md) | [Français](./README.fr-FR.md) | [Deutsch](./README.de-DE.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [Bahasa Indonesia](./README.id-ID.md) | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja-JP.md) | [한국어](./README.ko-KR.md)

NocoBase is the open-source platform for building, running, and evolving business systems with AI. Agents write the code and do the work, NocoBase provides the foundation and governance, and people make the decisions.

https://github.com/user-attachments/assets/7bb8ec09-8065-49d7-b6e1-e47cfb88a89b

[Website](https://www.nocobase.com/) · [Documentation](https://docs.nocobase.com/) · [Quick Start](#quick-start) · [Community](https://forum.nocobase.com/)

## Why NocoBase

**AI writes code fast. Building reliable business systems is still hard.**

Your team is already developing with AI or vibe coding. Code gets written fast, but new problems come with it.

- **Every project rebuilds the foundation**

  Even with AI writing the code, permissions, workflow engines, and approvals are hard to design from scratch. They are full of edge cases and take a lot of work to maintain.

- **Architecture drifts out of control**

  Switch developers, models, or even sessions, and the AI may improvise differently each time. The system gets harder and harder to maintain.

- **Parallel work outpaces human review**

  You juggle several projects and issues, switching between terminals and chats, while agents hand back more and more changes. There is more than anyone can review, but letting go feels too risky.

- **Know-how is hard to capture and share**

  Requirement context, business documents, and lessons learned are scattered across chat sessions on different computers. When people or agents change, they are hard to find.

## Quick Start

Requires Node.js 24+ and pnpm 11. Windows users should use WSL. These examples use SQLite, so no separate database server is needed.

### With a coding agent

Open a coding agent that supports Skills in an empty directory and install the application creation Skill:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Select your coding agent during installation. If it does not recognize the new Skill, start a new session. Then send:

```text
Follow the nocobase-create-app Skill to create and start a NocoBase 3 application in the current empty directory, using the default template and SQLite.
```

### From the terminal

Run the following commands from the parent directory where you keep your projects:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

See the [documentation](https://docs.nocobase.com/) for more setup instructions and development guides.

## The NocoBase Ecosystem

- **[NocoBase Core](https://www.nocobase.com/core/)**

  **Let agents focus on your business logic. The foundation is ready.**

  NocoBase Core is the open-source application foundation for business systems built and run with AI. Permissions, workflows, files, and other building blocks come ready to use, so agents build only what is specific to your business, all on one consistent architecture.

- **[NocoBase Studio](https://www.nocobase.com/studio/)**

  **Agents keep the work moving. Your team stays in control.**

  NocoBase Studio is the governance platform for people and agents building software together. It brings Claude Code, Codex, and OpenCode into one agent team that moves issues forward on its own. Progress is clear at a glance, and people make the key decisions.

- **[NocoBase Solution](https://www.nocobase.com/solutions/)**

  **Open-source business apps. AI-driven, ready out of the box.**

  NocoBase Solution is a line of agent-driven business apps built on Core. Agents do most of the work, and people make only the key decisions.

## Community and Contributions

- Ask questions and share your experience in the [community forum](https://forum.nocobase.com/).
- Report reproducible bugs and request improvements through [GitHub Issues](https://github.com/nocobase/nocobase/issues).
- Read the [documentation](https://docs.nocobase.com/) to learn how the framework and plugins work.

Contributions are welcome. Before making changes to this repository, read [AGENTS.md](./AGENTS.md) and the development instructions relevant to your change.
