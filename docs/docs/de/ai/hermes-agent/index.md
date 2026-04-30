---
title: "Hermes Agent – der NocoBase-Assistent, der Sie immer besser versteht"
description: "Binden Sie Hermes Agent an NocoBase an und lassen Sie die KI durch sitzungsübergreifenden Speicher und automatisches Sammeln von Skills Ihr Geschäftssystem immer besser verstehen."
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,Selbstlernen,Self-Hosted"
sidebar: false
---

:::warning Inhalt in Bearbeitung

Diese Seite befindet sich noch in Bearbeitung; einzelne Abschnitte können unvollständig sein oder sich noch ändern.

:::

# Hermes Agent – der NocoBase-Assistent, der Sie immer besser versteht

[Hermes Agent](https://github.com/nousresearch/hermes-agent) ist ein selbst gehosteter Open-Source-AI-Agent – nach jeder erfolgreichen Aktion legt er automatisch ein wiederverwendbares Skill-Dokument an und versteht Ihr System mit jedem Einsatz besser. Wenn Sie ihn an NocoBase anbinden, können Sie nicht nur in natürlicher Sprache aufbauen und verwalten, sondern auch lassen, dass er Ihre geschäftlichen Konventionen und Vorlieben Schritt für Schritt erlernt.

<!-- Es wird ein Screenshot eines Terminals oder eines Lark-Dialogs benötigt, in dem Hermes Agent NocoBase bedient -->

## Was ist Hermes Agent

Hermes Agent wird von Nous Research entwickelt (GitHub 35,7k Sterne); das Kernkonzept lautet „Je länger Sie ihn nutzen, desto klüger wird er". Anders als andere AI Agents verfügt Hermes über einen vollständigen Lernkreislauf:

- **Sitzungsübergreifender Speicher** – Volltextsuche in Verbindung mit LLM-Zusammenfassungen ermöglichen den Rückgriff auf den Kontext von Konversationen mehrerer Wochen
- **Automatisches Sammeln von Skills** – nach jeder erfolgreich abgeschlossenen komplexen Aufgabe wird automatisch ein wiederverwendbares Skill-Dokument erstellt
- **Kontinuierliche Selbstverbesserung** – Skills werden im wiederholten Einsatz fortlaufend optimiert und werden mit der Nutzung präziser
- **Unterstützung für 400+ Modelle** – kompatibel mit den wichtigsten LLM-Anbietern, ohne Bindung an ein bestimmtes Modell

Hermes unterstützt 8 Plattformen wie Lark, Telegram, Discord und Slack und kann auch direkt im Terminal genutzt werden.

:::tip Hinweis

Hermes Agent läuft auf Ihrem eigenen Server; alle Daten und Speicherinhalte werden lokal gespeichert – ideal für Szenarien mit erhöhten Anforderungen an die Datensicherheit.

:::

## Warum Hermes Agent

Wenn Sie zwischen verschiedenen AI Agents zur Bedienung von NocoBase auswählen, eignet sich Hermes besonders für folgende Szenarien:

- **Langfristige Pflege desselben Systems** – das Speichermechanismus von Hermes lässt ihn Ihr Geschäft mit der Zeit immer besser verstehen, ohne dass Sie den Kontext jedes Mal neu erklären müssen
- **Self-Hosting im Team erforderlich** – Daten bleiben vollständig lokal und werden nicht an einen Cloud-Drittanbieter weitergegeben
- **Standardisierte Arbeitsabläufe** – die von Hermes automatisch gesammelten Skill-Dokumente können als Bedienhandbuch des Teams dienen
- **Vorliebe für die Terminal-Bedienung** – Hermes unterstützt CLI-Interaktion nativ und passt zum Alltag technischer Teams

## Verbindungsprinzip

Hermes Agent arbeitet auf folgende Weise mit NocoBase zusammen:

```
Sie (Lark / Telegram / Terminal / ...)
  │
  └─→ Hermes Agent
        │
        ├── NocoBase Skills (lassen den Agent das NocoBase-Konfigurationsmodell verstehen)
        │
        ├── NocoBase CLI (führt Erstellen, Ändern, Deployen usw. aus)
        │
        └── Speicher & Skill-Dokumente (automatisch gesammelt, fortlaufend wiederverwendet)
              │
              └─→ NocoBase-Dienst (Ihr Geschäftssystem)
```

Im Unterschied zu anderen Agents aktualisiert Hermes nach jeder Aktion seinen Speicher und seine Skill-Dokumente. Diese Informationen werden lokal gespeichert und in späteren Aktionen automatisch wiederverwendet.

## Voraussetzungen

Stellen Sie vor dem Start sicher, dass die folgende Umgebung bereitsteht:

- Ein Server, auf dem Hermes Agent läuft (Linux / macOS, Python 3.10+)
- Node.js >= 22 (zum Ausführen von NocoBase CLI und Skills)
- Falls Sie bereits eine NocoBase-Instanz haben: **Da sich die KI-Fähigkeiten schnell weiterentwickeln, unterstützt derzeit nur die neueste Beta-Version den vollständigen Funktionsumfang. Mindestens erforderliche Version: >= 2.1.0-beta.20. Es wird dringend empfohlen, auf die neueste Version zu aktualisieren.**

Die Installation von Hermes erfolgt mit einem einzigen Befehl:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning Hinweis

Hermes Agent muss selbst bereitgestellt und gewartet werden. Wenn Sie eine sofort einsatzbereite Lösung ohne Konfigurationsaufwand wünschen, sollten Sie [OpenClaw](../openclaw/index.md) (Lark-Ein-Klick-Deployment) oder [WorkBuddy](../workbuddy/index.md) (Tencent-gehostet) in Betracht ziehen.

:::

## Schnellstart

### KI-gestützte Installation mit einem Klick

Kopieren Sie den folgenden Prompt an Hermes Agent; er erledigt automatisch die Installation der NocoBase CLI, die Initialisierung und die Einrichtung der Umgebung:

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

<!-- TODO: 5-8 häufige Fragen zusammenstellen, z. B.: Wo werden die Speicherdateien abgelegt, wie migriere ich auf einen neuen Server, welche Modelle werden unterstützt, wie lösche ich falsche Speicherinhalte, was ist der Unterschied zwischen Hermes und OpenClaw usw. -->

## Verwandte Links

- [NocoBase CLI](../quick-start.md) – Kommandozeilenwerkzeug zur Installation und Verwaltung von NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) – Domänenwissenpakete, die in einen AI Agent installiert werden können
- [Schnellstart KI-Builder](../../ai-builder/index.md) – Bauen Sie NocoBase-Anwendungen von Grund auf mit KI
- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) – Quellcode und Dokumentation von Hermes Agent
- [OpenClaw + NocoBase](../openclaw/index.md) – Der weltweit beliebteste Open-Source-AI-Agent, mit Lark-Ein-Klick-Deployment
- [WorkBuddy + NocoBase](../workbuddy/index.md) – Fernsteuerung von NocoBase über WeCom, Lark, DingTalk und weitere Plattformen
