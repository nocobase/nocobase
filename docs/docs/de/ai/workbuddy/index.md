---
title: "Hände frei – treiben Sie NocoBase mit WorkBuddy an"
description: "Steuern Sie NocoBase mit Tencent WorkBuddy aus der Ferne, mit Anbindung an WeCom, Lark, DingTalk und weitere Plattformen."
keywords: "WorkBuddy,NocoBase,AI Agent,Tencent,WeCom,Lark,DingTalk,Fernsteuerung"
sidebar: false
---

:::warning Inhalt in Bearbeitung

Diese Seite befindet sich noch in Bearbeitung; einzelne Abschnitte können unvollständig sein oder sich noch ändern.

:::

# Hände frei – treiben Sie NocoBase mit WorkBuddy an

[WorkBuddy](https://www.codebuddy.cn) ist der von Tencent vorgestellte allumfassende KI-Workplace-Agent – Sie beschreiben Ihren Bedarf in einem Satz, und er plant und führt die Schritte selbständig aus. Wenn Sie ihn an NocoBase anbinden, können Sie Ihr Geschäftssystem aus WeCom, Lark, DingTalk und weiteren Plattformen aus der Ferne steuern und Ihre täglichen Verwaltungsaufgaben erledigen, ohne den Browser zu öffnen.

<!-- Es wird ein Screenshot eines WeCom-Dialogs benötigt, in dem WorkBuddy NocoBase bedient -->

## Was ist WorkBuddy

WorkBuddy ist der von Tencent vorgestellte „allumfassende KI-Agent-Desktop-Workplace". Anders als gewöhnliche KI-Dialogtools zerlegt WorkBuddy eine Aufgabe nach Erhalt automatisch, plant sie, führt sie aus und liefert ein abnehmbares Ergebnis – ohne dass Sie ihn Schritt für Schritt anleiten müssen.

Kerneigenschaften:

- **Selbstständige Planung und Ausführung** – nach Erhalt einer Aufgabe werden die Schritte automatisch zerlegt, einzeln ausgeführt und ein vollständiges Ergebnis geliefert
- **Multi-Plattform-Anbindung** – unterstützt die führenden chinesischen Office-Plattformen wie WeCom, Lark, DingTalk und QQ
- **20+ integrierte Skills** – Dokumenterstellung, Datenanalyse, PPT-Erstellung, E-Mail-Bearbeitung und mehr direkt einsatzbereit
- **Lokale Dateioperationen** – kann von Ihnen autorisierte lokale Dateien lesen und verarbeiten

Kurz gesagt: Klassische KI-Tools machen Vorschläge und Sie legen selbst Hand an; WorkBuddy erledigt die Aufgabe direkt.

| Klassischer KI-Dialog     | WorkBuddy              |
| ---------------- | ---------------------- |
| Nur Dialog, nur Vorschläge | Tatsächliches Ausführen von Aufgaben         |
| Manuelle Dateioperationen erforderlich | Automatische Bearbeitung lokaler Dateien       |
| Einschritt-Aufgaben einfacher Art   | Automatische Zerlegung mehrschrittiger komplexer Aufgaben |
| Textantworten als Ausgabe     | Lieferung abnehmbarer Ergebnisse                 |

## Warum WorkBuddy

Wenn Sie zwischen verschiedenen AI Agents zur Bedienung von NocoBase auswählen, eignet sich WorkBuddy besonders für folgende Szenarien:

- **Team nutzt WeCom / Lark / DingTalk** – WorkBuddy unterstützt das breiteste Spektrum chinesischer Office-Plattformen mit der größten Reichweite
- **Mobile Bedienung von NocoBase nötig** – verwalten Sie Ihr System unterwegs jederzeit, unabhängig vom Endgerät
- **Sofort einsatzbereit gewünscht** – aus dem Hause Tencent, mit über 20 integrierten Skills und niedriger Konfigurationshürde
- **Schwerpunkt auf Aufgabenautomatisierung** – WorkBuddy zerlegt mehrschrittige Aufgaben selbständig und ist ideal für tägliche Wartung und Verwaltung

## Verbindungsprinzip

WorkBuddy arbeitet auf folgende Weise mit NocoBase zusammen:

```
Sie (WeCom / Lark / DingTalk / ...)
  │
  └─→ WorkBuddy
        │
        ├── NocoBase Skills (lassen den Agent das NocoBase-Konfigurationsmodell verstehen)
        │
        └── NocoBase CLI (führt Erstellen, Ändern, Deployen usw. aus)
              │
              └─→ NocoBase-Dienst (Ihr Geschäftssystem)
```

Sie senden eine Anweisung über eine beliebige unterstützte Plattform; im Backend bedient WorkBuddy NocoBase über Skills und CLI und überträgt das Ergebnis in Echtzeit zurück in Ihr Dialogfenster.

## Voraussetzungen

Stellen Sie vor dem Start sicher, dass die folgende Umgebung bereitsteht:

- Ein WorkBuddy-Konto ([Registrierung](https://www.codebuddy.cn))
- Node.js >= 22 (zum Ausführen von NocoBase CLI und Skills)
- Falls Sie bereits eine NocoBase-Instanz haben: **Da sich die KI-Fähigkeiten schnell weiterentwickeln, unterstützt derzeit nur die neueste Beta-Version den vollständigen Funktionsumfang. Mindestens erforderliche Version: >= 2.1.0-beta.20. Es wird dringend empfohlen, auf die neueste Version zu aktualisieren.**

:::warning Hinweis

WorkBuddy befindet sich derzeit in schneller Weiterentwicklung; einzelne Funktionen können sich ändern. Wir empfehlen, die [offizielle WorkBuddy-Dokumentation](https://www.codebuddy.cn/docs/workbuddy/Overview) im Auge zu behalten, um aktuelle Informationen zu erhalten.

:::

## Schnellstart

### KI-gestützte Installation mit einem Klick

Kopieren Sie den folgenden Prompt an WorkBuddy; er erledigt automatisch die Installation der NocoBase CLI, die Initialisierung und die Einrichtung der Umgebung:

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

<!-- TODO: 5-8 häufige Fragen zusammenstellen, z. B.: Welche Plattformen unterstützt WorkBuddy, wie hoch ist das kostenlose Kontingent, wie gehe ich mit fehlgeschlagenen Aktionen um, können mehrere Personen denselben WorkBuddy zur Bedienung derselben NocoBase-Instanz nutzen usw. -->

## Verwandte Links

- [NocoBase CLI](../quick-start.md) – Kommandozeilenwerkzeug zur Installation und Verwaltung von NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) – Domänenwissenpakete, die in einen AI Agent installiert werden können
- [Schnellstart KI-Builder](../../ai-builder/index.md) – Bauen Sie NocoBase-Anwendungen von Grund auf mit KI
- [Offizielle WorkBuddy-Dokumentation](https://www.codebuddy.cn/docs/workbuddy/Overview) – Vollständige Anleitung zu WorkBuddy
- [OpenClaw + NocoBase](../openclaw/index.md) – Der weltweit beliebteste Open-Source-AI-Agent, mit Lark-Ein-Klick-Deployment
- [Hermes Agent + NocoBase](../hermes-agent/index.md) – Sammelt Skills automatisch und versteht Ihr Geschäftssystem mit jedem Einsatz besser
