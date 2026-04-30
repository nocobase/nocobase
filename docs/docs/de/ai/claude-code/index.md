---
title: "Claude Code + NocoBase – das stärkste KI-Gehirn, Ihr leitender NocoBase-Architekt"
description: "Binden Sie den offiziellen KI-Programmierassistenten Claude Code von Anthropic an NocoBase an und bedienen Sie Ihr Geschäftssystem über Skills und CLI in natürlicher Sprache."
keywords: "Claude Code,NocoBase,AI Agent,Anthropic,Skills,CLI,natürliche Sprache"
sidebar: false
---

:::warning Inhalt in Bearbeitung

Diese Seite befindet sich noch in Bearbeitung; einzelne Abschnitte können unvollständig sein oder sich noch ändern.

:::

# Claude Code + NocoBase – das stärkste KI-Gehirn, Ihr leitender NocoBase-Architekt

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) ist der offizielle KI-Programmierassistent von Anthropic – er läuft direkt im Terminal, versteht Ihren gesamten Codebestand und unterstützt Sie bei vielfältigen Aufgaben vom Programmieren bis zum Systemaufbau. Wenn Sie ihn an NocoBase anbinden, können Sie in natürlicher Sprache Tabellen erstellen, Seiten aufbauen und Workflows konfigurieren – und dabei das Aufbau-Erlebnis der leistungsstärksten KI-Modelle genießen.

<!-- Es wird ein Screenshot benötigt, der Claude Code im Terminal beim Bedienen von NocoBase zeigt -->

## Was ist Claude Code

Claude Code ist ein AI Agent in CLI-Form von Anthropic, der von der Modellreihe Claude angetrieben wird. Er läuft direkt im Terminal, versteht den Projektkontext und führt Aktionen aus. Kerneigenschaften:

- **Spitzenmodellfähigkeiten** – basiert auf Claude Opus / Sonnet, mit führender Leistung bei Codeverständnis und -generierung
- **Terminal-nativ** – läuft direkt im Terminal und fügt sich nahtlos in den Workflow von Entwicklern ein
- **Projektbewusst** – versteht automatisch Projektstruktur, Abhängigkeiten und Code-Konventionen
- **Zusammenspiel mehrerer Werkzeuge** – unterstützt das Lesen und Schreiben von Dateien, das Ausführen von Befehlen, das Suchen im Code und mehr

Claude Code unterstützt zudem die Integration in IDEs wie VS Code und JetBrains und kann auch als eigenständige Desktop- oder Webanwendung eingesetzt werden.

## Warum Claude Code

Wenn Sie zwischen verschiedenen AI Agents zur Bedienung von NocoBase auswählen, eignet sich Claude Code besonders für folgende Szenarien:

- **Maximale Modellleistung** – Claude-Modelle glänzen bei komplexem Schließen und Codegenerierung
- **Tagesgeschäft von Entwicklern** – Terminal-nativ und nahtlos kombinierbar mit IDE, Git, npm und weiteren Tools
- **Tiefes Projektverständnis nötig** – Claude Code analysiert die Projektstruktur automatisch und liefert kontextgerechte Vorschläge
- **Aufbau und Entwicklung in einem** – hilft Ihnen sowohl beim Aufbau von NocoBase-Anwendungen als auch bei der Entwicklung eigener Plugins

## Verbindungsprinzip

Claude Code arbeitet auf folgende Weise mit NocoBase zusammen:

```
Sie (Terminal / VS Code / JetBrains / ...)
  │
  └─→ Claude Code
        │
        ├── NocoBase Skills (lassen den Agent das NocoBase-Konfigurationsmodell verstehen)
        │
        └── NocoBase CLI (führt Erstellen, Ändern, Deployen usw. aus)
              │
              └─→ NocoBase-Dienst (Ihr Geschäftssystem)
```

- **NocoBase Skills** – Domänenwissenpakete, die Claude Code den Umgang mit NocoBase beibringen
- **NocoBase CLI** – Kommandozeilenwerkzeug, das Datenmodellierung, Seitenaufbau und mehr tatsächlich ausführt
- **NocoBase-Dienst** – Ihre laufende NocoBase-Instanz

## Voraussetzungen

Stellen Sie vor dem Start sicher, dass die folgende Umgebung bereitsteht:

- Claude Code ist installiert (`npm install -g @anthropic-ai/claude-code`)
- Node.js >= 22 (zum Ausführen von NocoBase CLI und Skills)
- Falls Sie bereits eine NocoBase-Instanz haben: **Da sich die KI-Fähigkeiten schnell weiterentwickeln, unterstützt derzeit nur die neueste Beta-Version den vollständigen Funktionsumfang. Mindestens erforderliche Version: >= 2.1.0-beta.20. Es wird dringend empfohlen, auf die neueste Version zu aktualisieren.**

## Schnellstart

### KI-gestützte Installation mit einem Klick

Kopieren Sie den folgenden Prompt an Claude Code; er erledigt automatisch die Installation der NocoBase CLI, die Initialisierung und die Einrichtung der Umgebung:

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

<!-- TODO: 5-8 häufige Fragen zusammenstellen, z. B.: Wie konfiguriere ich den API Key, welche Modelle unterstützt Claude Code, wie nutze ich es in VS Code, was tun, wenn die Skills-Installation fehlschlägt usw. -->

## Verwandte Links

- [NocoBase CLI](../quick-start.md) – Kommandozeilenwerkzeug zur Installation und Verwaltung von NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) – Domänenwissenpakete, die in einen AI Agent installiert werden können
- [Schnellstart KI-Builder](../../ai-builder/index.md) – Bauen Sie NocoBase-Anwendungen von Grund auf mit KI
- [Offizielle Claude-Code-Dokumentation](https://docs.anthropic.com/en/docs/claude-code) – Vollständige Anleitung zu Claude Code
- [OpenClaw + NocoBase](../openclaw/index.md) – Der weltweit beliebteste Open-Source-AI-Agent, mit Lark-Ein-Klick-Deployment
- [Codex + NocoBase](../codex/index.md) – Offizieller KI-Programmierassistent von OpenAI
- [OpenCode + NocoBase](../opencode/index.md) – Open-Source-Terminal-AI-Agent mit Unterstützung für 75+ Modelle
