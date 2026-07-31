---
title: "Serverseitiges Tool definieren"
description: "Einführung in defineTools, scope, schema, invoke, Berechtigungen und die Verzeichnisregistrierung für serverseitige Tools von NocoBase AI-Mitarbeitern."
keywords: "NocoBase, AI-Mitarbeiter Tool, defineTools, ToolsOptions, Zod, invoke"
---

# Serverseitiges Tool definieren

## Die Minimalstruktur eines Tools

Serverseitige Tools werden mit `defineTools()`, bereitgestellt durch `@nocobase/ai`, definiert. Das folgende Tool empfängt einen Namen und gibt eine Begrüßung zurück:

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
    description: 'Generate a short greeting for the developer named by the user.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name to greet.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: `Hello ${args.name}, welcome to NocoBase plugin development!`,
    };
  },
});
```

Wenn der Dateipfad `src/ai/tools/greetDeveloper.ts` lautet, verwendet der Loader den Dateinamen `greetDeveloper` als finalen Tool-Namen. Selbst wenn `definition.name` auf einen anderen Wert gesetzt ist, wird dieser bei der Registrierung durch den Dateinamen überschrieben.

Daher wird empfohlen, standardmäßig den Dateinamen, `definition.name`, den in der Skill referenzierten Namen und den im Frontend registrierten Namen konsistent zu halten.

## Tool-Konfigurationsoptionen

Die Hauptkonfigurationen von `defineTools()` sind wie folgt:

| Konfiguration | Funktion | Standardwert |
| --- | --- | --- |
| `scope` | Legt den Verfügbarkeitsbereich des Tools fest | Erforderlich |
| `execution` | Gibt an, ob die Logik im `backend` oder `frontend` ausgeführt wird | `backend` |
| `defaultPermission` | Ob der Aufruf des Tools direkt erlaubt wird oder eine Bestätigung angefordert wird | `ASK` |
| `silence` | Ob die Tool-Aufrufinformationen im Dialog ausgeblendet werden sollen | `false` |
| `introduction` | Titel und Beschreibung für die Anzeige in der Verwaltungsoberfläche | Tool-Name |
| `definition` | Name, Beschreibung und Parameterschema, die an das Modell übermittelt werden | Erforderlich |
| `invoke` | Die tatsächliche Ausführungslogik des Tools | Erforderlich |

Die Wahl des `scope` beeinflusst direkt, wie das Tool in den Kontext des AI-Mitarbeiters integriert wird:

| `scope` | Verwendung |
| --- | --- |
| `GENERAL` | Wird von allen AI-Mitarbeitern gemeinsam genutzt, normalerweise für allgemeine Basisfunktionen |
| `SPECIFIED` | Kann nur von Skills oder AI-Mitarbeitern verwendet werden, an die dieses Tool gebunden ist |
| `CUSTOM` | Administratoren können es manuell in der Konfiguration des AI-Mitarbeiters hinzufügen und auf „Nachfragen“ oder „Erlauben“ setzen |

Standardmäßig wird `SPECIFIED` empfohlen. Verwenden Sie `GENERAL` nur, wenn sichergestellt ist, dass jeder AI-Mitarbeiter diese Fähigkeit benötigt; verwenden Sie `CUSTOM`, wenn Administratoren die Auswahl pro Mitarbeiter treffen sollen.

## `definition` ist für das Modell gedacht

`definition.description` und `definition.schema` beeinflussen, ob das Modell dieses Tool auswählt und wie die Parameter konstruiert werden. Die Beschreibung sollte drei Dinge klären:

- In welchen Fällen es aufgerufen wird
- Was jeder Parameter repräsentiert
- Welche Aufgaben nicht von diesem Tool bearbeitet werden sollten

Für das Parameterschema wird die Verwendung von Zod empfohlen:

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

Der Tool-Name muss ebenfalls stabil bleiben. Skills, AI-Mitarbeiter-Konfigurationen, Frontend-Karten und bereits gespeicherte Chat-Nachrichten finden das Tool über den Namen.

## Was `invoke()` erhält

Das serverseitige `invoke()` empfängt drei Parameter:

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：当前 NocoBase action Context
  // args：模型根据 schema 生成的参数
  // runtime.toolCallId：当前 ToolCall ID
  // runtime.writer(chunk)：流式写出中间结果
}
```

Über `ctx` können auf die aktuelle Anwendung, die Datenbank, Authentifizierungsinformationen und Action-Parameter zugegriffen werden. Zum Beispiel:

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

Ein Tool sollte eine Struktur zurückgeben, anhand derer Erfolg oder Misserfolg beurteilt werden kann. Integrierte Tools verwenden normalerweise folgendes Format:

```ts
return {
  status: 'success',
  content: result,
};
```

Bei erwartbaren Geschäftsfehlern sollte ebenfalls ein klarer Status und Grund zurückgegeben werden, damit das Modell nicht raten muss, ob die Operation erfolgreich war.

## Lange Beschreibungen in einem Verzeichnis speichern

Neben einer einzelnen Datei können Tools auch als Verzeichnis organisiert werden:

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` exportiert standardmäßig das Ergebnis von `defineTools()`. Wenn `description.md` vorhanden ist, ersetzt der gesamte Dateiinhalt `definition.description`. Das eignet sich besonders für längere Tool-Beschreibungen.

Der Verzeichnisname `documentSearch` wird zum endgültigen Registrierungsnamen.

## Beispiel eines integrierten Tools: `subAgentWebSearch`

`packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` zeigt ein vollständiges serverseitiges Tool:

```ts
export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Web search")}}',
    about: '{{t("Use web search to quickly find up-to-date information from the internet.")}}',
  },
  definition: {
    name: 'subAgentWebSearch',
    description: 'Search the web for current information...',
    schema: z.object({
      query: z.array(z.string()),
    }),
  },
  invoke: async (ctx, args) => {
    // 获取 AI 插件和当前会话使用的模型配置。
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
      reasoning: { mode: 'off' },
    });

    // 独立查询并行执行，最后统一返回。
    const result = await Promise.all(
      args.query.map(async (query) => {
        const content = await provider.invoke(/* messages */);
        return { query, result: content.text };
      }),
    );

    return { status: 'success', content: result };
  },
});
```

Diese Implementierung enthält einige wiederverwendbare Ansätze:

- `SPECIFIED` beschränkt das Tool auf bestimmte Mitarbeiter oder Skills
- Zod validiert die vom Modell generierten Parameter
- Die aktuelle AI-Sitzungskonfiguration wird aus `ctx.action.params.values` gelesen
- Mehrere unabhängige Abfragen werden in einem ToolCall gebündelt und mit `Promise.all()` parallel ausgeführt
- Strukturierte Ergebnisse mit klarer Herkunft ermöglichen dem übergeordneten Modell die Weiterverarbeitung

## Verwandte Links

- [Entwicklung von AI-Mitarbeiter-Plugins](./index.md) — Die passende Erweiterungsebene auswählen
- [Skill definieren](./define-skill.md) — Den Aufrufablauf mehrerer Tools mit einem Skill organisieren
- [Vollständiges Beispiel: Integrierten AI-Mitarbeiter erstellen](./complete-example.md) — Ein ausführbares Tool-Beispiel ansehen
- [Frontend-Interaktion für ein Tool hinzufügen](./frontend-tool-ui.md) — Bestätigungs-, Auswahl- und Bearbeitungsoberflächen für ToolCalls hinzufügen
