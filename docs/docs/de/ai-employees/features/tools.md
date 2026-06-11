---
pkg: '@nocobase/plugin-ai'
title: 'Tools für KI-Mitarbeiter'
description: 'Tools definieren die Fähigkeiten von KI-Mitarbeitern: General Tools, Employee-specific Tools, Custom Tools, Berechtigungskonfiguration Ask/Allow.'
keywords: 'KI-Mitarbeiter Tools,Tools,Ask,Allow,Skill-Berechtigungen,NocoBase'
---

# Tools verwenden

Tools definieren, „was KI-Mitarbeiter tun können".

## Tool-Struktur

Die Tools-Seite ist in drei Kategorien unterteilt:

1. `General tools`: Werden von allen KI-Mitarbeitern gemeinsam genutzt, in der Regel schreibgeschützt.
2. `Employee-specific tools`: Spezifisch für den jeweils aktuellen Mitarbeiter.
3. `Custom tools`: Über den Workflow-Trigger „KI-Mitarbeiter-Ereignis" benutzerdefinierte Tools, die hinzugefügt, entfernt und mit Standardberechtigungen konfiguriert werden können.

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## Tool-Berechtigungen

Die Tool-Berechtigungen sind einheitlich:

- `Ask`: Vor dem Aufruf wird eine Bestätigung angefordert.
- `Allow`: Direkter Aufruf erlaubt.

Empfehlung: Tools, die Daten ändern, sollten standardmäßig auf `Ask` gesetzt werden.

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## Tool-Übersicht

### Allgemeine Tools

| Tool-Name            | Funktionsbeschreibung                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| Form filler          | Trägt Daten in das angegebene Formular ein                             |
| Chart generator      | Generiert ECharts-Diagramm-JSON-Konfigurationen                        |
| Load specific SKILLS | Lädt Skills und die für die Skills erforderlichen Tools                |
| Suggestions          | Gibt basierend auf dem aktuellen Gesprächsinhalt und Kontext Vorschläge für die nächsten Schritte |

### Spezifische Tools

| Tool-Name                    | Funktionsbeschreibung                                                  | Zugehöriger Mitarbeiter |
| ---------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| AI employee task dispatching | Aufgaben-Dispatching-Tool, weist Aufgaben basierend auf Aufgabentyp und Mitarbeiterfähigkeiten zu | Atlas                   |
| List AI employees            | Listet alle verfügbaren Mitarbeiter auf                                | Atlas                   |
| Get AI employee              | Ruft detaillierte Informationen zu einem bestimmten Mitarbeiter ab, einschließlich Skills und Tools | Atlas                   |

### Benutzerdefinierte Tools

Erstellen Sie im Workflow-Modul einen Workflow mit dem Trigger-Typ `AI employee event`.

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

Klicken Sie unter `Custom tools` auf `Add tool`, um einen Workflow als Tool hinzuzufügen, und konfigurieren Sie die Berechtigungen entsprechend dem Geschäftsrisiko.

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
