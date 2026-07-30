---
title: "Integrierten AI-Mitarbeiter definieren"
description: "Einführung in die Erstellung integrierter AI-Mitarbeiter in NocoBase-Plugins unter Verwendung von defineAIEmployee, prompt.md sowie den Verzeichnissen skills und tools."
keywords: "NocoBase,integrierter AI-Mitarbeiter,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# Integrierten AI-Mitarbeiter definieren

Integrierte AI-Mitarbeiter werden zusammen mit dem Plugin registriert. Beim ersten Laden des Plugins erstellt NocoBase den entsprechenden Mitarbeiterdatensatz und markiert diesen als integrierten Mitarbeiter. Bei nachfolgenden Ladevorgängen des Plugins werden die Standardprofile, Prompts, Skills und Tools des Mitarbeiters basierend auf dem Code aktualisiert.

## Einzeldateien und Verzeichnisstrukturen

Wenn die Profilinformationen einfach sind und keine separaten Prompts oder exklusiven Ressourcen benötigt werden, kann eine Einzeldatei verwendet werden:

```text
src/ai/ai-employees/lina.ts
```

Wenn `prompt.md`, ein exklusiver Skill oder ein exklusives Tool benötigt wird, verwenden Sie ein Verzeichnis:

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

Die Verzeichnisstruktur eignet sich besser für die langfristige Wartung.

## Verwendung von `defineAIEmployee()`

`index.ts` verwendet `defineAIEmployee()`, das von `@nocobase/ai` bereitgestellt wird:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Helps developers understand plugin structure and complete small development tasks.',
  greeting: 'Hello, I can help you start a NocoBase plugin development task. What would you like to build?',
});
```

Die wichtigsten Felder sind wie folgt:

| Feld | Funktion |
| --- | --- |
| `username` | Eindeutige Kennung des AI-Mitarbeiters, erforderlich und muss langfristig stabil bleiben |
| `category` | Kategorie des Mitarbeiters, z. B. `developer` oder `business` |
| `description` | Interne Beschreibung und Abrufinformationen |
| `avatar` | Avatar-Kennung |
| `nickname` | Dem Benutzer angezeigter Name |
| `position` | Position |
| `bio` | Kurzbiografie |
| `greeting` | Begrüßung für neue Konversationen |
| `systemPrompt` | Standard-Systemprompt |
| `skills` | Explizit gebundene Skill-Namen |
| `tools` | Explizite Tool-Konfigurationen |
| `chatSettings` | Chat-Einstellungen, wie z. B. ob Skills und Tools aktiviert sind sowie der Modus des Systemprompts |
| `sort` | Sortierung der integrierten Mitarbeiter |

Der Typ von `tools` ist derzeit ein Array von Objekten:

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter 的 scope 必须是 CUSTOM
]
```

`autoCall` wird nur verwendet, um die Aufrufrechte des aktuellen AI-Mitarbeiters für `CUSTOM`-Tools zu überschreiben. Für `GENERAL`- und `SPECIFIED`-Tools gilt zur Laufzeit weiterhin die `defaultPermission` des Tools selbst. Wenn ein `CUSTOM`-Tool keine Konfiguration auf Mitarbeiterebene besitzt, wird ebenfalls auf die `defaultPermission` des Tools zurückgegriffen.

Automatisch im Verzeichnis entdeckte Tools werden als `{ name: 'toolName' }` normiert.

## Lange Prompts in `prompt.md` auslagern

Wenn ein AI-Mitarbeiter in Form eines Verzeichnisses definiert ist, kann der Systemprompt in eine gleichnamige `prompt.md` Datei im selben Verzeichnis gelegt werden:

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

Wenn `prompt.md` existiert, überschreibt es den `systemPrompt` in `index.ts`. Lange Prompts in einer Markdown-Datei zu hinterlegen, erleichtert die Überprüfung und vermeidet Probleme mit Escaping-Sequenzen in TypeScript-Template-Strings.

## Beispiel für einen integrierten AI-Mitarbeiter: Nathan

Das Mitarbeiterprofil in `packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` ist sehr kurz:

```ts
export default defineAIEmployee({
  username: 'nathan',
  category: 'developer',
  description: 'AI employee for coding',
  avatar: 'nocobase-002-male',
  nickname: 'Nathan',
  position: 'Frontend code engineer',
  greeting: 'Hello, I’m Nathan, your frontend code engineer...',
});
```

Die vollständigen Fähigkeiten von Nathan stammen aus anderen Ressourcen im selben Verzeichnis:

```text
nathan/
├── index.ts
├── prompt.md
└── skills/
    └── frontend-developer/
        ├── SKILLS.md
        └── tools/
            ├── getContextApis.ts
            ├── getContextEnvs.ts
            ├── getContextVars.ts
            ├── lintAndTestJS.ts
            ├── patchJSCode.ts
            ├── readJSCode.ts
            └── writeJSCode.ts
```

Der Ladevorgang führt automatisch eine dreistufige Bindung durch:

1. Dateien in `tools/` werden als Tools registriert
2. Tools werden automatisch dem `frontend-developer`-Skill zugeordnet
3. Der Skill wird automatisch Nathan zugeordnet

Daher ist es nicht erforderlich, die gesamten `skills` und `tools` in `index.ts` erneut aufzuführen.

## Verwandte Links

- [Entwicklung von AI-Mitarbeiter-Plugins](./index.md) — Das Zusammenspiel von integriertem AI-Mitarbeiter, Tool und Skill kennenlernen
- [Skill definieren](./define-skill.md) — Einen mitarbeiterspezifischen Skill erstellen
- [Vollständiges Beispiel: Integrierten AI-Mitarbeiter erstellen](./complete-example.md) — Das vollständige Mitarbeiterverzeichnis und den Registrierungsprozess ansehen
- [Internationalisierung von AI-Mitarbeiter-Plugins](./internationalization.md) — Unterschiede bei der Lokalisierung von Mitarbeiterprofilen sowie Tool- und Skill-Texten kennenlernen
