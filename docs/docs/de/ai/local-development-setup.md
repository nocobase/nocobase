---
title: Lokale Entwicklungsumgebung einrichten
description: Bereite die lokale Betriebssystemumgebung für NocoBase CLI und NocoBase Apps vor, einschließlich Windows WSL, macOS, Linux, Node.js, Yarn und Docker.
---

# Lokale Entwicklungsumgebung einrichten

Diese Seite hilft dir, eine lokale Umgebung für NocoBase CLI und NocoBase Apps vorzubereiten. Sie eignet sich für lokale Entwicklung, Funktionstests und dafür, dass AI Agents NocoBase auf deinem Computer installieren und verwalten können.

Wenn du NocoBase für echte Benutzer bereitstellen möchtest, lies zuerst die [Systemanforderungen für die Produktion](../get-started/system-requirements.md).

## Windows: WSL verwenden

Für die lokale Einrichtung unter Windows empfehlen wir, die Hauptentwicklungsumgebung in WSL 2 zu halten: Installiere Node.js, Yarn und NocoBase CLI in der Linux-Distribution innerhalb von WSL und führe die zugehörigen Befehle im WSL-Terminal aus.

WSL ist näher an den Linux-Umgebungen, in denen NocoBase üblicherweise bereitgestellt wird. Das hat mehrere Vorteile:

- Installation von Abhängigkeiten, Build, Start und Log-Analyse ähneln stärker dem Ablauf auf dem Server
- Nach Aktivierung der Docker Desktop WSL integration kannst du `docker` direkt in WSL ausführen
- Zusätzliche Probleme durch Windows-Pfade, Dateiberechtigungen, symbolische Links und native Dependency-Builds werden reduziert
- AI-Agent-Workflows werden einfacher. Wenn ein Agent Befehle wie `nb`, `yarn` oder `docker` ausführt, verwendet er konsistente Linux-Pfade, Shell-Syntax und Laufzeitumgebung, was die Fehlersuche direkter macht

Wenn die WSL-basierte lokale Entwicklungsumgebung noch nicht bereit ist, lies [Lokale Entwicklungsumgebung unter Windows mit WSL einrichten](./windows-wsl.md).

Empfohlene Kombination:

- Windows 10 / 11
- WSL 2
- Ubuntu LTS
- Node.js >= 22
- Yarn 1.x
- Docker Desktop, wenn du NocoBase mit Docker installieren möchtest

Normalerweise werden Node.js, Yarn und NocoBase CLI alle innerhalb von WSL installiert. Wenn du Docker Desktop verwendest, aktiviere die WSL integration in Docker Desktop, damit WSL auf Docker zugreifen kann.

Umgebung prüfen:

```bash
node -v
yarn -v
docker version
```

:::tip Hinweis

NocoBase kann auch auf Windows Server installiert werden. WSL wird hier für lokale Entwicklung und AI-Agent-Setup auf persönlichen Computern empfohlen. Das bedeutet nicht, dass Windows Server nicht für Deployments verwendet werden kann.

:::

## macOS

Unter macOS kannst du direkt das lokale Terminal verwenden.

Vorbereiten:

- Node.js >= 22
- Yarn 1.x
- Docker Desktop, OrbStack oder Colima, wenn du NocoBase mit Docker installieren möchtest

Umgebung prüfen:

```bash
node -v
yarn -v
docker version
```

Wenn du Docker nicht verwendest, kannst du `docker version` überspringen.

## Linux

Linux kann direkt als lokale Entwicklungsumgebung verwendet werden. Empfohlen werden Ubuntu, Debian oder andere verbreitete Distributionen.

Vorbereiten:

- Node.js >= 22
- Yarn 1.x
- Docker Engine, wenn du NocoBase mit Docker installieren möchtest

Umgebung prüfen:

```bash
node -v
yarn -v
docker version
```

Wenn du Docker nicht verwendest, kannst du `docker version` überspringen.

## Nächste Schritte

- [Installationsmethoden und Versionsvergleich](../get-started/quickstart.md) — Vergleiche zuerst Installationsmethoden und Versionskanäle
- [NocoBase App installieren](./install-nocobase-app.md) — Initialisiere eine lokale App mit NocoBase CLI
- [AI Agent Integrationsanleitung](./quick-start.mdx) — Lasse einen AI Agent mit NocoBase verbinden und arbeiten
