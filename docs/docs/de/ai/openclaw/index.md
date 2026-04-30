---
title: "OpenClaw + NocoBase – der beliebteste AI Agent erledigt es für Sie"
description: "Binden Sie den weltweit beliebtesten Open-Source-AI-Agent OpenClaw an NocoBase an und bedienen Sie Ihr Geschäftssystem über Skills und CLI in natürlicher Sprache."
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,Lark,natürliche Sprache"
sidebar: false
---

:::warning Inhalt in Bearbeitung

Diese Seite befindet sich noch in Bearbeitung; einzelne Abschnitte können unvollständig sein oder sich noch ändern.

:::

# OpenClaw + NocoBase – der beliebteste AI Agent erledigt es für Sie

[OpenClaw](https://github.com/openclaw/openclaw) ist das weltweit beliebteste Open-Source-AI-Agent-Framework – nicht nur Chat, sondern echte Aktionsfähigkeit. Wenn Sie es an NocoBase anbinden, können Sie in natürlicher Sprache Tabellen erstellen, Seiten aufbauen, Workflows konfigurieren und es sogar rund um die Uhr autonom laufen lassen, um Ihr Geschäftssystem fortlaufend zu pflegen.

<!-- Es wird ein Screenshot eines Lark-Dialogs benötigt, in dem OpenClaw NocoBase bedient -->

## Was ist OpenClaw

OpenClaw ist ein vom Entwickler Peter Steinberger initiiertes Open-Source-AI-Agent-Framework und derzeit eines der weltweit beliebtesten AI-Agent-Projekte (GitHub 300k+ Sterne). Es positioniert sich als „KI-Assistent, der wirklich anpacken kann". Im Unterschied zu Chat-Tools wie ChatGPT oder Claude hat OpenClaw vier Kerneigenschaften:

- **Ausführungsfähigkeit** – nimmt Anweisungen in natürlicher Sprache entgegen und erledigt Aufgaben automatisch, statt nur Vorschläge zu liefern
- **Sitzungsübergreifender Speicher** – merkt sich Ihre Vorlieben und Gewohnheiten und wird mit jedem Einsatz angenehmer
- **Skills-Ökosystem** – Erweiterung der Fähigkeiten durch Installation von Skills, wie das „Beibringen neuer Fertigkeiten"
- **Rund-um-die-Uhr-Betrieb** – unterstützt geplante Aufgaben und proaktive Berichte, ohne dass Sie permanent zuschauen müssen

OpenClaw unterstützt 26+ Plattformen wie Lark, Telegram und Discord, sodass Sie direkt in den Tools Ihres Arbeitsalltags mit ihm sprechen können. Lark-Nutzer können ihn zudem mit einem Klick deployen – ganz ohne technische Vorkenntnisse.

## Warum OpenClaw

Wenn Sie zwischen verschiedenen AI Agents zur Bedienung von NocoBase auswählen, eignet sich OpenClaw besonders für folgende Szenarien:

- **Niedrige Einstiegshürde gewünscht** – Lark-Nutzer können ihn mit einem Klick deployen, ohne einen Server selbst aufzubauen
- **Team arbeitet mit Lark** – OpenClaw ist tief in Lark integriert; das Streaming von Nachrichten, das Erwähnen des Bots in Gruppenchats und mehr fühlen sich nahtlos an
- **Rund-um-die-Uhr-Verfügbarkeit nötig** – OpenClaw läuft in der Cloud und ist unabhängig vom Zustand Ihres lokalen Rechners
- **Stellenwert auf das Community-Ökosystem** – OpenClaw hat die größte Skills-Community; neben NocoBase steht eine Vielzahl weiterer Skills zur Verfügung

## Verbindungsprinzip

OpenClaw arbeitet auf folgende Weise mit NocoBase zusammen:

```
Sie (Lark / Telegram / ...)
  │
  └─→ OpenClaw Agent
        │
        ├── NocoBase Skills (lassen den Agent das NocoBase-Konfigurationsmodell verstehen)
        │
        └── NocoBase CLI (führt Erstellen, Ändern, Deployen usw. aus)
              │
              └─→ NocoBase-Dienst (Ihr Geschäftssystem)
```

- **NocoBase Skills** – Domänenwissenpakete, die OpenClaw den Umgang mit NocoBase beibringen
- **NocoBase CLI** – Kommandozeilenwerkzeug, das Datenmodellierung, Seitenaufbau und mehr tatsächlich ausführt
- **NocoBase-Dienst** – Ihre laufende NocoBase-Instanz

## Voraussetzungen

Stellen Sie vor dem Start sicher, dass die folgende Umgebung bereitsteht:

- Ein bereitgestellter OpenClaw Agent ([Lark-Ein-Klick-Deployment](https://openclaw.feishu.cn) oder lokales Deployment)
- Node.js >= 22 (zum Ausführen von NocoBase CLI und Skills)
- Falls Sie bereits eine NocoBase-Instanz haben: **Da sich die KI-Fähigkeiten schnell weiterentwickeln, unterstützt derzeit nur die neueste Beta-Version den vollständigen Funktionsumfang. Mindestens erforderliche Version: >= 2.1.0-beta.20. Es wird dringend empfohlen, auf die neueste Version zu aktualisieren.**

:::warning Hinweis

Achten Sie bei der Installation von Skills von Drittanbietern auf die Sicherheit – nutzen Sie vorzugsweise Skills aus offiziellen oder vertrauenswürdigen Quellen und installieren Sie keine ungeprüften Community-Skills.

:::

## Schnellstart

### KI-gestützte Installation mit einem Klick

Kopieren Sie den folgenden Prompt an OpenClaw; er erledigt automatisch die Installation der NocoBase CLI, die Initialisierung und die Einrichtung der Umgebung:

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

<!-- TODO: 5-8 häufige Fragen zusammenstellen, z. B.: Was tun bei einem Fehlschlag bei der Skills-Installation, wie aktualisiere ich Skills-Versionen, welche Modelle unterstützt OpenClaw, wie rolle ich fehlgeschlagene Aktionen zurück usw. -->

## Verwandte Links

- [NocoBase CLI](../quick-start.md) – Kommandozeilenwerkzeug zur Installation und Verwaltung von NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) – Domänenwissenpakete, die in einen AI Agent installiert werden können
- [Schnellstart KI-Builder](../../ai-builder/index.md) – Bauen Sie NocoBase-Anwendungen von Grund auf mit KI
- [OpenClaw Lark-Deployment-Anleitung](https://openclaw.feishu.cn) – Ein-Klick-Deployment von OpenClaw in Lark
- [Hermes Agent + NocoBase](../hermes-agent/index.md) – Sammelt Skills automatisch und versteht Ihr Geschäftssystem mit jedem Einsatz besser
- [WorkBuddy + NocoBase](../workbuddy/index.md) – Fernsteuerung von NocoBase über WeCom, Lark, DingTalk und weitere Plattformen
