---
title: "Entwicklung von AI-Mitarbeiter-Plugins"
description: "Einführung in die Beziehung zwischen Tools, Skills, integrierten AI-Mitarbeitern und der Frontend-Tool-UI in NocoBase-Plugins, Verzeichnisvereinbarungen und Lernpfade."
keywords: "NocoBase, AI-Mitarbeiter-Plugin-Entwicklung, Tool, Skill, defineAIEmployee, src/ai"
---

# Entwicklung von AI-Mitarbeiter-Plugins

In NocoBase können Plugins ihre Geschäftsfunktionen an AI-Mitarbeiter übertragen. Drei Erweiterungspunkte sind jeweils für unterschiedliche Ebenen verantwortlich:

- **Tool** — führt spezifische Operationen wie Datenabfragen, API-Aufrufe oder das Ändern von Datensätzen aus
- **Skill** — teilt dem Modell mit, wann ein Tool verwendet werden soll und in welchen Schritten die Aufgabe erledigt werden sollte
- **Integrierter AI-Mitarbeiter (Built-in AI Employee)** — kombiniert Rollenprofile, System-Prompts, Skills und Tools zu einem sofort einsatzbereiten Mitarbeiter

Im Allgemeinen müssen Sie die Registrierungsschnittstelle nicht manuell aufrufen. Wenn Sie Dateien in das konventionelle Verzeichnis `src/ai` des Plugins legen, scannt NocoBase diese beim Laden des Plugins automatisch und schließt die Registrierung ab. Nur wenn ein Tool benutzerdefinierte Karten, Popups oder browserseitige Ausführungslogik benötigt, müssen die entsprechenden Frontend-Komponenten oder Ausführungslogiken in der `src/client-v2/plugin.tsx` des Plugins registriert werden.

Stellen Sie vor Beginn sicher, dass die Anwendung `@nocobase/plugin-ai` installiert und aktiviert hat. Der Plugin-Code kann die Typen und Definitionsfunktionen verwenden, die von `@nocobase/ai` und `@nocobase/actions` bereitgestellt werden.

:::tip Vorab lesen

- [Ihr erstes Plugin schreiben](../../../plugin-development/write-your-first-plugin.md) — Wenn Sie noch keine Erfahrung in der Plugin-Entwicklung haben, erfahren Sie hier mehr über Plugin-Verzeichnisse, den Build-Prozess und den Aktivierungsvorgang
- [AI-Mitarbeiter](../../index.md) — Machen Sie sich zuerst mit der Konfiguration und der grundlegenden Verwendung von AI-Mitarbeitern vertraut

:::


## Schnellzugriff

| Ich möchte … | Wo finde ich das? |
| --- | --- |
| Die AI einen serverseitigen Vorgang aufrufen lassen | [Serverseitiges Tool definieren](./define-tool.md) |
| Den Aufrufablauf mehrerer Tools festlegen | [Skill definieren](./define-skill.md) |
| Eine feste AI-Rolle mit dem Plugin bereitstellen | [Integrierten AI-Mitarbeiter definieren](./define-ai-employee.md) |
| Das vollständige Zusammenspiel von Tool, Skill und Mitarbeiter ansehen | [Vollständiges Beispiel: Integrierten AI-Mitarbeiter erstellen](./complete-example.md) |
| Eine Bestätigungs-, Auswahl- oder Bearbeitungsoberfläche für ein Tool hinzufügen | [Frontend-Interaktion für ein Tool hinzufügen](./frontend-tool-ui.md) |
| Übersetzungen für die Verwaltungsoberfläche von Tools und Skills hinzufügen | [Internationalisierung von AI-Mitarbeiter-Plugins](./internationalization.md) |
| Probleme bei Registrierung, Bindung und Ausführung beheben | [Häufige Probleme](./troubleshooting.md) |

## Entscheiden Sie zuerst, welche Ebene erweitert werden soll

Tool, Skill und integrierter AI-Mitarbeiter sind keine drei unabhängigen Funktionen, sondern Fähigkeiten, die von unten nach oben schichtweise kombiniert werden. Nicht jedes Plugin muss alle drei Ebenen implementieren.

```text
Tool: lässt die AI eine konkrete Aktion ausführen
  ↓
Skill: lässt die AI eine Aufgabenart nach einem festen Verfahren erledigen
  ↓
Integrierter AI-Mitarbeiter: kombiniert diese Fähigkeiten zu einer festen Rolle und einem festen Einstiegspunkt
```

Sie können je nach Bedarf entscheiden, auf welcher Ebene Sie beginnen:

- Wenn die AI lediglich Daten abfragen, APIs aufrufen oder Datensätze ändern soll, reicht die Definition eines Tools aus
- Wenn die Reihenfolge der Tool-Aufrufe, Bestätigungsschritte und das Ausgabeformat festgelegt werden müssen, definieren Sie zusätzlich einen Skill für diese Tools
- Wenn das Plugin nach der Aktivierung direkt eine feste Rolle bereitstellen soll, erstellen Sie einen integrierten AI-Mitarbeiter und binden Sie die entsprechenden Skills und Tools ein

Wenn alle drei Ebenen verwendet werden, wird eine Aufgabe in der folgenden Reihenfolge ausgeführt:

1. Der Benutzer stellt dem AI-Mitarbeiter eine Aufgabe
2. Der AI-Mitarbeiter entscheidet basierend auf dem System-Prompt, welcher Skill verwendet werden soll
3. Der Skill teilt dem Modell mit, welche Tools in welcher Reihenfolge aufgerufen werden sollen
4. Das Tool führt die Abfrage, den Schreibvorgang oder die externe Anfrage aus und gibt das Ergebnis zurück
5. Der AI-Mitarbeiter erstellt basierend auf dem Tool-Ergebnis die endgültige Antwort

Die Frontend-Karte eines Tools ist keine vierte Ebene. Sie dient lediglich als ergänzende Interaktionsschnittstelle für den ToolCall, wenn das Tool eine Benutzerbestätigung, eine Auswahl von Optionen oder die Bearbeitung von Parametern erfordert.

## AI-Ressourcen in `src/ai` platzieren

NocoBase erkennt AI-Ressourcen in Plugins basierend auf Verzeichnisvereinbarungen. Bei Verwendung der Standard-Plugin-Struktur legen Sie Tools, Skills und integrierte AI-Mitarbeiter einfach in `src/ai` ab; eine Einzelregistrierung in der `load()`-Methode von `src/server/plugin.ts` ist nicht erforderlich.

Ein vollständiges Verzeichnis kann wie folgt organisiert werden:

```text
src/ai/
├── tools/
│   └── searchDocs.ts
├── skills/
│   └── document-search/
│       ├── SKILLS.md
│       └── tools/
│           └── readDocument.ts
└── ai-employees/
    ├── translator.ts
    └── developer/
        ├── index.ts
        ├── prompt.md
        ├── skills/
        └── tools/
```

Unterschiedliche Positionen entsprechen unterschiedlichen Registrierungsmethoden:

| Datei oder Verzeichnis | Verarbeitung durch NocoBase |
| --- | --- |
| `src/ai/tools/<name>.ts` | Registriert ein unabhängiges Tool |
| `src/ai/skills/<name>/SKILLS.md` | Registriert einen Skill |
| `tools/` im Skill-Verzeichnis | Registriert Tools und bindet sie automatisch an den aktuellen Skill |
| `src/ai/ai-employees/<name>.ts` | Registriert einen integrierten AI-Mitarbeiter in einer Einzeldatei |
| `src/ai/ai-employees/<name>/index.ts` | Registriert einen integrierten AI-Mitarbeiter in Verzeichnisform |
| `prompt.md` im Mitarbeiter-Verzeichnis | Dient als Standard-System-Prompt für diesen Mitarbeiter |
| `skills/` und `tools/` im Mitarbeiter-Verzeichnis | Registriert Ressourcen und bindet sie automatisch an den aktuellen Mitarbeiter |

Beim Laden des Plugins führt NocoBase diese Schritte in der folgenden Reihenfolge aus, bevor die eigene `load()`-Methode des Plugins aufgerufen wird:

1. Scannen und Registrieren von Tools
2. Parsen von `SKILLS.md` und Binden von Tools im Skill-Verzeichnis an den entsprechenden Skill
3. Laden integrierter AI-Mitarbeiter und Zusammenführen von `prompt.md`, Skills und Tools aus dem Mitarbeiter-Verzeichnis

`src/client-v2` ist nicht Teil dieses automatischen Scan-Verzeichnisses. Zusätzliche Registrierungen in `src/client-v2/plugin.tsx` sind nur erforderlich, wenn ein Tool Frontend-Karten, Popups oder browserseitige Ausführungslogik benötigt.

## Kurzübersicht der Erweiterungspunkte und Verzeichnisse

| Erweiterungspunkt | Verantwortlich für | Standardort |
| --- | --- | --- |
| Tool | Ausführung spezifischer Operationen wie Abfragen, Schreibvorgänge oder externe Anfragen | `src/ai/**/tools/` |
| Skill | Festlegung von Prozessabläufen, Tool-Aufrufsequenzen und Ausgabebeschränkungen | `src/ai/**/skills/<name>/SKILLS.md` |
| Integrierter AI-Mitarbeiter | Definition einer festen Rolle und Kombination von System-Prompts, Skills und Tools | `src/ai/ai-employees/` |
| Tool-Frontend-Karte | Anzeige des ToolCall sowie Erfassung von Bestätigungs-, Bearbeitungs- oder Ablehnungsaktionen | `src/client-v2/` |

Implementieren Sie standardmäßig zuerst das Tool. Fügen Sie einen Skill hinzu, wenn ein fester Workflow erforderlich ist, und erstellen Sie einen integrierten AI-Mitarbeiter, wenn ein fester Rollenzugang benötigt wird; Frontend-Karten werden nur hinzugefügt, wenn das Tool Browser-Interaktionen erfordert.

## Verwandte Links

- [Ihr erstes Plugin schreiben](../../../plugin-development/write-your-first-plugin.md) — Erstellen und Ausführen eines NocoBase-Plugins von Grund auf
- [AI-Mitarbeiter Übersicht](../../index.md) — Erfahren Sie mehr über die Zugangspunkte für AI-Mitarbeiter
- [Prompt-Engineering-Leitfaden](../../configuration/prompt-engineering-guide.md) — Schreiben von System-Prompts und Aufgabenbeschränkungen
