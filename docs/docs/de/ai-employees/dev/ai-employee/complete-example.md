---
title: "Vollständiges Beispiel: Integrierten AI-Mitarbeiter erstellen"
description: "Definition von Tool, Skill, System-Prompts und einem integrierten AI-Mitarbeiter in einem NocoBase-Plugin anhand eines vollständigen Beispiels."
keywords: "NocoBase,Dev Helper,AI-Mitarbeiter-Beispiel,defineTools,defineAIEmployee,SKILLS.md"
---

# Vollständiges Beispiel: Integrierten AI-Mitarbeiter erstellen

Dieses vollständige Beispiel erstellt einen integrierten AI-Mitarbeiter, der Benutzer beim Einstieg in die Plugin-Entwicklung unterstützt. Der Mitarbeiter heißt `Dev Helper` und erhält ein Tool, einen Skill und einen System-Prompt. Wenn ein Benutzer sagt: „Bitte grüße Alice“, lädt der Mitarbeiter den Skill `welcome-developer`, ruft das Tool `greetDeveloper` auf, um den Namen zu bestätigen, und generiert anschließend eine Begrüßung in der aktuellen Sprache des Benutzers.

:::tip Vorab lesen

- [Serverseitiges Tool definieren](./define-tool.md) — Grundstruktur von `defineTools()` und Tools kennenlernen
- [Skill definieren](./define-skill.md) — `SKILLS.md` und die Tool-Bindung kennenlernen
- [Integrierten AI-Mitarbeiter definieren](./define-ai-employee.md) — `defineAIEmployee()` und Mitarbeiterverzeichnisse kennenlernen

:::

## Endergebnis

Nach der Fertigstellung bietet dieses Plugin die folgenden Funktionen:

- Erstellung eines integrierten AI-Mitarbeiters namens `Dev Helper`
- Automatische Bindung des Skills `welcome-developer` an den Mitarbeiter
- Aufruf des Tools `greetDeveloper` über den Skill zur Bestätigung des Entwicklernamens
- Generierung von Begrüßungen und Anschlussfragen basierend auf der aktuell verwendeten Sprache des Benutzers

<!-- Hier ist ein Screenshot der AI-Mitarbeiter-Verwaltungsseite erforderlich, auf der Dev Helper als integrierter Mitarbeiter markiert ist -->

## Endgültige Verzeichnisstruktur

```text
src/ai/ai-employees/dev-helper/
├── index.ts
├── prompt.md
└── skills/
    └── welcome-developer/
        ├── SKILLS.md
        └── tools/
            └── greetDeveloper.ts
```

Dieses Beispiel erfordert keinen Frontend-Code und muss nicht manuell in `src/server/plugin.ts` registriert werden.

## Schritt 1: Tool definieren

Erstellen Sie `src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts`:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'greetDeveloper',
    description: 'Validate the developer name before the assistant writes a welcome message.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name provided by the user.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: {
        name: args.name,
      },
    };
  },
});
```

## Schritt 2: Skill definieren

Erstellen Sie `src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md`:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and guide them to the next NocoBase plugin-development step.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You welcome developers who are starting NocoBase plugin development.

# Workflow

1. Read the developer name from the user's request.
2. If the name is missing, ask the user for it.
3. Call `greetDeveloper` exactly once.
4. Wait for a tool result with `status: "success"`.
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Ask which plugin capability the developer wants to build next, using the same language as the user.

# Constraints

- Do not invent a name.
- Do not claim the Tool succeeded before receiving its result.
- Write both the welcome message and the follow-up question in the same language as the user.
```

Da sich `greetDeveloper.ts` im `tools/`-Verzeichnis des aktuellen Skills befindet, ist die Angabe von `tools: [greetDeveloper]` nicht erforderlich.

## Schritt 3: AI-Mitarbeiter-Profil definieren

Erstellen Sie `src/ai/ai-employees/dev-helper/index.ts`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Welcomes developers and guides them into a small, verifiable plugin-development task.',
  greeting: 'Hello, I can help you begin a NocoBase plugin development task. Who are we welcoming today?',
});
```

`username` ist die eindeutige Kennung in der Datenbank. Ändern Sie diese nach der Veröffentlichung nicht willkürlich, da NocoBase den neuen Wert sonst als einen anderen integrierten AI-Mitarbeiter behandeln würde.

:::warning Hinweis

`username` muss nicht nur stabil bleiben, sondern darf auch nicht mit anderen Plugins oder bestehenden AI-Mitarbeitern kollidieren. Wenn bereits derselbe `username` in der Datenbank existiert, wird beim Laden des Plugins der entsprechende Datensatz aktualisiert, anstatt einen neuen, isolierten Mitarbeiter zu erstellen.

Beim Neuladen des Plugins können die in Code definierten Werte für `category`, `nickname`, `position`, `avatar`, `bio`, `greeting`, die Standard-System-Prompts, Skill- und Tool-Bindungen, `chatSettings` sowie `sort` erneut in die Datenbank geschrieben werden. Für offizielle Plugins wird empfohlen, Namen mit einem Plugin-Präfix zu verwenden, z. B. `developer-helper-dev-assistant`.

:::

## Schritt 4: System-Prompt definieren

Erstellen Sie `src/ai/ai-employees/dev-helper/prompt.md`:

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

Damit ist die Verzeichnisstruktur automatisch gebunden:

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## Schritt 5: Aktivieren und Verifizieren

Bauen Sie die Anwendung neu oder starten Sie den Entwicklungsdienst neu und stellen Sie sicher, dass das Plugin, das diese Dateien enthält, aktiviert ist. Überprüfen Sie anschließend die Verwaltungsseite für AI-Mitarbeiter:

- `Dev Helper` ist sichtbar
- Der Mitarbeiter ist als integrierter Mitarbeiter markiert
- Der exklusive Skill des Mitarbeiters enthält `welcome-developer`
- `greetDeveloper` kann verwendet werden, nachdem der Skill geladen wurde

Geben Sie im Chat ein:

```text
请向 Alice 打个招呼。
```

Der erwartete Ablauf ist wie folgt:

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

Wenn Sie nicht möchten, dass das Tool vor jedem Aufruf eine Benutzerbestätigung anfordert, setzen Sie `defaultPermission: 'ALLOW'`. Bei Tools, die Löschungen, Massenänderungen oder externe Seiteneffekte beinhalten, ist es angemessener, standardmäßig `ASK` beizubehalten.

## Zusammenfassung

| Datei | Aufgabe |
| --- | --- |
| `greetDeveloper.ts` | Validiert die Eingabe und gibt ein strukturiertes Tool-Ergebnis zurück |
| `SKILLS.md` | Legt den Tool-Aufruf und den Antwortablauf fest |
| `prompt.md` | Definiert die Mitarbeiterrolle und globale Einschränkungen |
| `index.ts` | Definiert das Profil des integrierten AI-Mitarbeiters |

## Verwandte Links

- [Entwicklung von AI-Mitarbeiter-Plugins](./index.md) — Das Zusammenspiel von Tool, Skill und integriertem AI-Mitarbeiter kennenlernen
- [Serverseitiges Tool definieren](./define-tool.md) — Die vollständige Konfiguration von `defineTools()` ansehen
- [Skill definieren](./define-skill.md) — Felder und Schreibweise von `SKILLS.md` ansehen
- [Integrierten AI-Mitarbeiter definieren](./define-ai-employee.md) — `defineAIEmployee()` und die Verzeichnisbindung ansehen
- [Internationalisierung von AI-Mitarbeiter-Plugins](./internationalization.md) — Übersetzungen für die Texte der Verwaltungsoberfläche im Beispiel hinzufügen
