---
title: "OpenCode + NocoBase – die offene, freie und nicht gebundene Art, NocoBase aufzubauen"
description: "Binden Sie den Open-Source-KI-Programmierassistenten OpenCode an NocoBase an, wählen Sie Ihre Modelle frei und bedienen Sie Ihr Geschäftssystem in natürlicher Sprache."
keywords: "OpenCode,NocoBase,AI Agent,Open Source,Multi-Model,Skills,CLI,natürliche Sprache"
sidebar: false
---

:::warning Inhalt in Bearbeitung

Diese Seite befindet sich noch in Bearbeitung; einzelne Abschnitte können unvollständig sein oder sich noch ändern.

:::

# OpenCode + NocoBase – die offene, freie und nicht gebundene Art, NocoBase aufzubauen

[OpenCode](https://github.com/opencode-ai/opencode) ist ein Open-Source-Terminal-AI-Agent – mit Unterstützung für 75+ Modelle (Claude, GPT, Gemini, DeepSeek usw.) und ohne Bindung an einen Anbieter wählen Sie das jeweils am besten passende Modell. Wenn Sie ihn an NocoBase anbinden, können Sie in natürlicher Sprache Tabellen erstellen, Seiten aufbauen und Workflows konfigurieren – und behalten dabei volle Kontrolle über Modellauswahl und Kosten.

<!-- Es wird ein Screenshot benötigt, der OpenCode im Terminal beim Bedienen von NocoBase zeigt -->

## Was ist OpenCode

OpenCode wird von Anomaly Innovations entwickelt (GitHub 140k+ Sterne) und positioniert sich als „Terminal-AI-Agent ohne Anbieterbindung". Es ist in Go geschrieben und bietet eine ansprechende TUI-Oberfläche. Kerneigenschaften:

- **Unterstützung für 75+ Modelle** – Claude, GPT, Gemini, DeepSeek, lokale Modelle und mehr, frei wechselbar
- **Kein Vendor-Lock-in** – mit eigenem API Key, abgerechnet nach tatsächlicher Nutzung, ohne zusätzliches Abonnement
- **Multi-Agent-Architektur** – fünf integrierte Agent-Rollen: Build, Plan, Review, Debug, Docs
- **Datenschutz an erster Stelle** – speichert weder Code noch Kontext; alle Daten verbleiben lokal

OpenCode unterstützt zudem Editor-Integrationen wie VS Code, JetBrains, Zed und Neovim sowie eine eigenständige Desktop-Anwendung.

## Warum OpenCode

Wenn Sie zwischen verschiedenen AI Agents zur Bedienung von NocoBase auswählen, eignet sich OpenCode besonders für folgende Szenarien:

- **Keine Bindung an ein einzelnes Modell** – heute Claude, morgen GPT, übermorgen DeepSeek – ein Werkzeug für alles
- **Kostenkontrolle wichtig** – eigener API Key mit nutzungsbasierter Abrechnung, Verwendung bestehender ChatGPT-Plus-Abonnements möglich
- **Erhöhte Datenschutzanforderungen** – Code und Kontext werden nicht an Dritte weitergegeben, lokale Modelle werden unterstützt
- **Hohe Anpassbarkeit gewünscht** – YAML-Konfiguration zur individuellen Definition des Agent-Verhaltens, ideal für besondere Teamanforderungen

## Verbindungsprinzip

OpenCode arbeitet auf folgende Weise mit NocoBase zusammen:

```
Sie (Terminal / VS Code / JetBrains / ...)
  │
  └─→ OpenCode
        │
        ├── NocoBase Skills (lassen den Agent das NocoBase-Konfigurationsmodell verstehen)
        │
        └── NocoBase CLI (führt Erstellen, Ändern, Deployen usw. aus)
              │
              └─→ NocoBase-Dienst (Ihr Geschäftssystem)
```

- **NocoBase Skills** – Domänenwissenpakete, die OpenCode den Umgang mit NocoBase beibringen
- **NocoBase CLI** – Kommandozeilenwerkzeug, das Datenmodellierung, Seitenaufbau und mehr tatsächlich ausführt
- **NocoBase-Dienst** – Ihre laufende NocoBase-Instanz

## Voraussetzungen

Stellen Sie vor dem Start sicher, dass die folgende Umgebung bereitsteht:

- OpenCode ist installiert ([Installationsanleitung](https://opencode.ai/docs/))
- Node.js >= 22 (zum Ausführen von NocoBase CLI und Skills)
- Falls Sie bereits eine NocoBase-Instanz haben: **Da sich die KI-Fähigkeiten schnell weiterentwickeln, unterstützt derzeit nur die neueste Beta-Version den vollständigen Funktionsumfang. Mindestens erforderliche Version: >= 2.1.0-beta.20. Es wird dringend empfohlen, auf die neueste Version zu aktualisieren.**

## Schnellstart

### KI-gestützte Installation mit einem Klick

Kopieren Sie den folgenden Prompt an OpenCode; er erledigt automatisch die Installation der NocoBase CLI, die Initialisierung und die Einrichtung der Umgebung:

```
Hilf mir, die NocoBase CLI zu installieren und die Initialisierung abzuschließen: https://docs.nocobase.com/de/ai/ai-quick-start.md (Bitte direkt den Inhalt des Links abrufen)
```

### Manuelle Installation

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Der Browser öffnet automatisch eine visuelle Konfigurationsseite und führt Sie durch die Installation der NocoBase Skills, die Datenbankkonfiguration und den Anwendungsstart. Detaillierte Schritte siehe [Schnellstart](../quick-start.md).

Führen Sie nach Abschluss der Installation `nb env list` aus, um den Status der Umgebung zu prüfen:

```bash
nb env list
```

Vergewissern Sie sich, dass die Ausgabe eine konfigurierte Umgebung samt Laufstatus enthält.

## Häufige Fragen

<!-- TODO: 5-8 häufige Fragen zusammenstellen, z. B.: Wie konfiguriere ich die API Keys verschiedener Modelle, wie wechsle ich Modelle, wie nutze ich lokale Modelle, was tun, wenn die Skills-Installation fehlschlägt usw. -->

## Verwandte Links

- [NocoBase CLI](../quick-start.md) – Kommandozeilenwerkzeug zur Installation und Verwaltung von NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) – Domänenwissenpakete, die in einen AI Agent installiert werden können
- [Schnellstart KI-Builder](../../ai-builder/index.md) – Bauen Sie NocoBase-Anwendungen von Grund auf mit KI
- [Offizielle OpenCode-Dokumentation](https://opencode.ai/docs/) – Vollständige Anleitung zu OpenCode
- [Claude Code + NocoBase](../claude-code/index.md) – Offizieller KI-Programmierassistent von Anthropic
- [Codex + NocoBase](../codex/index.md) – Offizieller KI-Programmierassistent von OpenAI
