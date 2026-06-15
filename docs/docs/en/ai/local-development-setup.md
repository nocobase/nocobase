---
title: Local Development Setup
description: Prepare the local operating system environment for NocoBase CLI and NocoBase apps, covering Windows WSL, macOS, Linux, Node.js, Yarn, and Docker.
---

# Local Development Setup

This page helps you prepare a local environment for NocoBase CLI and NocoBase apps. It is intended for local development, feature evaluation, and AI Agents installing or managing NocoBase on your computer.

For real user-facing deployment, see [Production system requirements](../get-started/system-requirements.md).

## Windows: Use WSL

For local setup on Windows, we recommend keeping the main development environment inside WSL 2: install Node.js, Yarn, and NocoBase CLI in the Linux distribution in WSL, and run related commands from the WSL terminal.

WSL is closer to the Linux environments where NocoBase is commonly deployed. This gives you several benefits:

- Dependency installation, build, startup, and log troubleshooting are closer to the actual server workflow
- After Docker Desktop WSL integration is enabled, you can run `docker` commands directly inside WSL
- You can avoid extra issues from native Windows path formats, file permissions, symlinks, and native dependency builds
- It is better for AI Agent workflows. When an agent runs commands such as `nb`, `yarn`, or `docker`, it uses one consistent Linux file path, shell syntax, and runtime environment, which makes troubleshooting more direct

If the WSL-based local development environment is not ready yet, see [Set Up a Local Development Environment on Windows with WSL](./windows-wsl.md).

Recommended setup:

- Windows 10 / 11
- WSL 2
- Ubuntu LTS
- Node.js >= 22
- Yarn 1.x
- Docker Desktop, if you plan to install NocoBase with Docker

Usually, Node.js, Yarn, and NocoBase CLI should all be installed inside WSL. If you use Docker Desktop, enable WSL integration in Docker Desktop so WSL can access Docker.

Check the environment:

```bash
node -v
yarn -v
docker version
```

:::tip Note

NocoBase can also be installed on Windows Server. WSL is recommended here for local development and AI Agent setup on personal computers. It does not mean Windows Server cannot be used for deployment.

:::

## macOS

On macOS, you can use the local terminal directly.

Prepare:

- Node.js >= 22
- Yarn 1.x
- Docker Desktop, OrbStack, or Colima, if you plan to install NocoBase with Docker

Check the environment:

```bash
node -v
yarn -v
docker version
```

If you do not use Docker, you can skip `docker version`.

## Linux

Linux can be used directly as a local development environment. Ubuntu, Debian, or other common distributions are recommended.

Prepare:

- Node.js >= 22
- Yarn 1.x
- Docker Engine, if you plan to install NocoBase with Docker

Check the environment:

```bash
node -v
yarn -v
docker version
```

If you do not use Docker, you can skip `docker version`.

## Next Steps

- [Installation and Version Comparison](../get-started/quickstart.md) — Compare installation methods and version channels first
- [Install NocoBase App](./install-nocobase-app.md) — Initialize a local app with NocoBase CLI
- [AI Agent Integration Guide](./quick-start.mdx) — Let an AI Agent connect to and operate NocoBase
