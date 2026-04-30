---
title: "Mit Codex NocoBase bedienen – Aufbau und Entwicklung in einem"
description: "Binden Sie den offiziellen KI-Programmierassistenten Codex von OpenAI an NocoBase an und bedienen Sie Ihr Geschäftssystem über Skills und CLI in natürlicher Sprache."
keywords: "Codex,OpenAI,NocoBase,AI Agent,Skills,CLI,natürliche Sprache"
sidebar: false
---

:::warning Inhalt in Bearbeitung

Diese Seite befindet sich noch in Bearbeitung; einzelne Abschnitte können unvollständig sein oder sich noch ändern.

:::

# Mit Codex NocoBase bedienen – Aufbau und Entwicklung in einem

[Codex](https://github.com/openai/codex) ist der offizielle KI-Programmierassistent von OpenAI – er läuft im Terminal, kann Code lesen und schreiben, Befehle ausführen und Sie bei vielfältigen Aufgaben vom Programmieren bis zum Systemaufbau unterstützen. Wenn Sie ihn an NocoBase anbinden, können Sie in natürlicher Sprache Tabellen erstellen, Seiten aufbauen und Workflows konfigurieren – mit der Leistung der GPT-Modellreihe bauen Sie Ihr Geschäftssystem schnell auf.

<!-- Es wird ein Screenshot benötigt, der Codex im Terminal beim Bedienen von NocoBase zeigt -->

## Was ist Codex

Codex ist ein AI Agent in CLI-Form von OpenAI, der von der GPT-Modellreihe angetrieben wird (einschließlich o3, o4-mini usw.). Er läuft in einer lokalen Sandbox-Umgebung und kann dort sicher Code und Befehle ausführen. Kerneigenschaften:

- **GPT-Reihe als Antrieb** – basiert auf den neuesten Modellen von OpenAI und ist stark in Codegenerierung und Aufgabenplanung
- **Sandbox-Ausführung** – führt Befehle in einer isolierten Sandbox aus, sicher und kontrolliert
- **Multimodales Verständnis** – unterstützt Text-, Bild- und weitere Eingaben und kann UI-Layouts in Screenshots verstehen
- **Flexible Autonomiestufen** – vom Vorschlagsmodus bis zum vollautomatischen Modus entscheiden Sie über den Grad der Autonomie

## Warum Codex

Wenn Sie zwischen verschiedenen AI Agents zur Bedienung von NocoBase auswählen, eignet sich Codex besonders für folgende Szenarien:

- **Sie nutzen bereits das OpenAI-Ökosystem** – falls Sie ein ChatGPT Plus/Pro-Abonnement oder einen OpenAI API Key haben, ist Codex die natürlichste Wahl
- **Sicherheit hat Priorität** – die Sandbox-Ausführung stellt sicher, dass die Aktionen der KI Ihr System nicht versehentlich beeinträchtigen
- **Flexible Steuerung gewünscht** – Sie können die Autonomiestufe je nach Aufgabenkomplexität wechseln: einfache Aufgaben vollautomatisch, sensible Aktionen mit Bestätigung
- **Vorliebe für den OpenAI-Modellstil** – die GPT-Reihe hat eigene Stärken in Aufgabenplanung und schrittweiser Ausführung

## Verbindungsprinzip

Codex arbeitet auf folgende Weise mit NocoBase zusammen:

```
Sie (Terminal / ...)
  │
  └─→ Codex
        │
        ├── NocoBase Skills (lassen den Agent das NocoBase-Konfigurationsmodell verstehen)
        │
        └── NocoBase CLI (führt Erstellen, Ändern, Deployen usw. aus)
              │
              └─→ NocoBase-Dienst (Ihr Geschäftssystem)
```

- **NocoBase Skills** – Domänenwissenpakete, die Codex den Umgang mit NocoBase beibringen
- **NocoBase CLI** – Kommandozeilenwerkzeug, das Datenmodellierung, Seitenaufbau und mehr tatsächlich ausführt
- **NocoBase-Dienst** – Ihre laufende NocoBase-Instanz

## Voraussetzungen

Stellen Sie vor dem Start sicher, dass die folgende Umgebung bereitsteht:

- Codex ist installiert (`npm install -g @openai/codex`)
- Node.js >= 22 (zum Ausführen von NocoBase CLI und Skills)
- Falls Sie bereits eine NocoBase-Instanz haben: **Da sich die KI-Fähigkeiten schnell weiterentwickeln, unterstützt derzeit nur die neueste Beta-Version den vollständigen Funktionsumfang. Mindestens erforderliche Version: >= 2.1.0-beta.20. Es wird dringend empfohlen, auf die neueste Version zu aktualisieren.**

## Schnellstart

### KI-gestützte Installation mit einem Klick

Kopieren Sie den folgenden Prompt an Codex; er erledigt automatisch die Installation der NocoBase CLI, die Initialisierung und die Einrichtung der Umgebung:

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

<!-- TODO: 5-8 häufige Fragen zusammenstellen, z. B.: Wie konfiguriere ich den OpenAI API Key, welche Modelle unterstützt Codex, wie wähle ich die Autonomiestufe, was tun, wenn die Skills-Installation fehlschlägt usw. -->

## Verwandte Links

- [NocoBase CLI](../quick-start.md) – Kommandozeilenwerkzeug zur Installation und Verwaltung von NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) – Domänenwissenpakete, die in einen AI Agent installiert werden können
- [Schnellstart KI-Builder](../../ai-builder/index.md) – Bauen Sie NocoBase-Anwendungen von Grund auf mit KI
- [Codex GitHub](https://github.com/openai/codex) – Quellcode und Dokumentation von Codex
- [Claude Code + NocoBase](../claude-code/index.md) – Offizieller KI-Programmierassistent von Anthropic
- [OpenCode + NocoBase](../opencode/index.md) – Open-Source-Terminal-AI-Agent mit Unterstützung für 75+ Modelle
