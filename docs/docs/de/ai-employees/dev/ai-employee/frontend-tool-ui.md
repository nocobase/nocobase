---
title: "Frontend-Interaktion für ein Tool hinzufügen"
description: "Einführung in Karten (cards), Modale (modals), decisions.edit und die Frontend-Ausführung (frontend execution) für NocoBase AI-Mitarbeiter-Tools sowie das Hinzufügen einer Auswahlkarte für den Dev Helper."
keywords: "NocoBase,Tool Frontend-Karten,ToolsUIProperties,decisions.edit,SuggestionsOptionsCard,Frontend-Tool"
---

# Frontend-Interaktion für ein Tool hinzufügen

Einige Tools müssen nur serverseitig ausgeführt werden und benötigen keine benutzerdefinierte Benutzeroberfläche. Andere Tools erfordern die Bestätigung, Auswahl oder Bearbeitung von Parametern durch den Benutzer; in diesen Fällen kann eine Frontend-Karte für das Tool mit demselben Namen registriert werden.

:::tip Zwei Konzepte unterscheiden

**Frontend-Karten** sind nur für die Darstellung und die Mensch-Maschine-Interaktion des `ToolCall` verantwortlich und bedeuten nicht zwangsläufig, dass die Geschäftslogik des Tools im Browser ausgeführt wird.

Wenn lediglich Optionen wie bei `suggestions` angezeigt werden sollen und nach der Auswahl des Benutzers `invoke()` serverseitig fortgesetzt wird, behalten Sie die Standardeinstellung `execution: 'backend'` bei. Nur wenn die eigentliche Logik des Tools auf die aktuelle Browserseite, das `FlowModel` oder den Editor-Status zugreifen muss, sollte `execution: 'frontend'` gesetzt und eine Frontend-`invoke`-Methode implementiert werden.

:::

## Zuerst Parameter und Ausführungslogik serverseitig definieren

Das integrierte `suggestions`-Tool befindet sich unter:

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

Sein Schema enthält sowohl die Auswahlmöglichkeiten als auch die endgültige Auswahl des Benutzers:

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

Gemäß der Tool-Beschreibung sollte das Modell beim ersten Aufruf nur `options` generieren. Da dieses Tool nicht auf `defaultPermission: 'ALLOW'` gesetzt ist, ist die Standardberechtigung `ASK`, und der `ToolCall` wird pausiert, bis der Benutzer eine Aktion ausführt.

Nach der Auswahl des Benutzers fügt das Frontend über `decisions.edit()` die `option` zu den ursprünglichen Parametern hinzu und setzt den `ToolCall` fort. Das serverseitige `invoke()` gibt schließlich den ausgewählten Inhalt zurück:

```ts
return {
  status: 'success',
  content: args?.option,
};
```

Die integrierte Implementierung schreibt das Auswahlergebnis zudem zurück in `aiMessages.toolCalls`, sodass bei einem erneuten Rendern der Nachrichtenverläufe weiterhin sichtbar ist, welche Option der Benutzer ausgewählt hat.

## Karten-Komponenten schreiben

Frontend-Karten erhalten `ToolsUIProperties`:

```tsx
import { useState } from 'react';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { Button, Flex } from 'antd';

interface DeveloperChoiceArgs {
  options?: string[] | string;
  option?: string;
}

const parseOptions = (value: DeveloperChoiceArgs['options']): string[] => {
  if (Array.isArray(value)) {
    return value.filter((option): option is string => typeof option === 'string');
  }
  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
  } catch {
    return [];
  }
};

export const DeveloperChoiceCard = ({
  toolCall,
  decisions,
}: ToolsUIProperties<DeveloperChoiceArgs>) => {
  const [submitting, setSubmitting] = useState(false);
  const options = parseOptions(toolCall.args?.options);

  const handleSelect = async (option: string) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await decisions.edit({
        ...toolCall.args,
        option,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex gap="small" wrap="wrap">
      {options.map((option, index) => (
        <Button
          key={`${option}-${index}`}
          disabled={toolCall.invokeStatus !== 'interrupted' || submitting}
          onClick={() => handleSelect(option)}
        >
          {option}
        </Button>
      ))}
    </Flex>
  );
};
```

:::warning Hinweis

Diese Komponente demonstriert die allgemeine Verwendung von `decisions.edit()` und behandelt Doppelklicks sowie JSON-String-Parameter. Für den produktiven Einsatz müssen zudem conversationspezifische Details wie schreibgeschützte Dialoge, die aktuell aktive Nachricht und historische Auswahlzustände entsprechend der Chat-Oberfläche berücksichtigt werden. Eine vollständige Implementierung finden Sie unter `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`.

:::

`decisions` bietet drei Operationen:

| Methode | Wirkung |
| --- | --- |
| `approve()` | Mit den ursprünglichen Parametern fortfahren |
| `edit(args)` | Nach der Änderung der Parameter fortfahren |
| `reject(message?)` | Ausführung ablehnen und den Grund an den Gesprächsfluss zurückgeben |

`SuggestionsOptionsCard.tsx` behandelt zusätzlich folgende Details:

- Kompatibel mit `options` sowohl als Array als auch als JSON-String
- Zeigt ein Lade-Symbol (Loading), solange der `ToolCall` generiert wird
- Auswahl nur für `ToolCall` im Status `interrupted` zulässig
- Schaltflächen werden nach dem Klicken sofort deaktiviert, um mehrfache Übermittlungen zu vermeiden
- In historischen Nachrichten wird die ausgewählte Option beibehalten und hervorgehoben
- Operationen sind nur in derzeit bearbeitbaren Konversationen zulässig

## Im Client-Plugin registrieren

Der Registrierungsname im Frontend muss exakt mit dem Namen des serverseitigen Tools übereinstimmen:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Wenn die serverseitige Datei `src/ai/tools/developerChoice.ts` ist, registrieren Sie hier `developerChoice`.

Der Registrierungsprozess für das integrierte `suggestions`-Tool erfolgt ebenfalls auf diese Weise:

```ts
export const suggestionsTool = [
  'suggestions',
  {
    ui: {
      card: SuggestionsOptionsCard,
    },
  },
];
```

Anschließend ruft `PluginAIClientV2.load()` die Methode `registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)` auf, wodurch die Karten in die vom Server zurückgegebene Tool-Definition mit demselben Namen integriert werden.

## Karte, Modal oder Frontend-Ausführung auswählen

Im Folgenden sind gängige Konfigurationen für `ToolsOptions` auf der Client-Seite aufgeführt. Die vollständigen Typen finden Sie unter `packages/core/client-v2/src/ai/tools-manager/types.ts`.

```ts
type ToolsOptions = {
  ui?: {
    card?: ComponentType<ToolsUIProperties>;
    modal?: {
      title?: string;
      okText?: string;
      Component?: ComponentType;
      footer?: ComponentType;
      hideOkButton?: boolean;
      // modal.props、useOnOk 等配置请查看完整类型。
    };
  };
  invoke?: (app, params) => unknown | Promise<unknown>;
  // useHooks 等其他配置请查看完整类型。
};
```

### Karte verwenden

Verwenden Sie standardmäßig `card`. Eine Karte eignet sich für kurze Bestätigungen, Auswahlen und einfache Parameteränderungen.

### Modal verwenden

Verwenden Sie `modal` nur bei umfangreicheren Inhalten, Bedarf an einer größeren Vorschau oder komplexer Parameterbearbeitung.

### Tool im Browser ausführen

Wenn ein serverseitiges Tool auf `execution: 'frontend'` gesetzt ist, muss der Client zusätzlich eine `invoke`-Methode bereitstellen. Solche Tools eignen sich zum Auslesen des aktuellen Seitenkontexts, von Editor-Inhalten oder des Status der `FlowEngine`. Sie sind nicht für Datenschreibvorgänge geeignet, die einen serverseitigen Berechtigungsschutz erfordern.

## Vollständiges Beispiel: Auswahlkarte für einen integrierten AI-Mitarbeiter hinzufügen

Nachdem Sie [Vollständiges Beispiel: Integrierten AI-Mitarbeiter erstellen](./complete-example.md) abgeschlossen haben, können Sie die Rückfrage von `Dev Helper` in anklickbare Optionen umwandeln. Definieren Sie dazu ein weiteres `developerChoice`-Tool und registrieren Sie eine Frontend-Karte. Die serverseitige Datei befindet sich unter:

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

Dieses Tool ist für die Definition der Optionen und den Empfang der Benutzerauswahl zuständig:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  introduction: {
    title: '{{t("ai.tools.developerChoice.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.developerChoice.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'developerChoice',
    description: 'Show a short list of plugin-development directions for the user to choose from.',
    schema: z.object({
      options: z.array(z.string()).min(2).max(4),
      option: z.string().optional(),
    }),
  },
  invoke: async (_ctx: Context, args: { options: string[]; option?: string }) => {
    return {
      status: 'success',
      content: args.option,
    };
  },
});
```
Da sich `developerChoice.ts` im `tools/`-Verzeichnis des `welcome-developer`-Skills befindet, wird es automatisch mit diesem Skill verknüpft. Eine Verknüpfung bedeutet jedoch nur, dass das Modell das Tool verwenden *kann*, nicht dass es dies zwangsläufig tun wird.

Zudem muss der Workflow in `SKILLS.md` entsprechend angepasst werden, indem die ursprünglichen Schritte 5–6 durch Folgendes ersetzt werden:

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

Die Frontend-Karte verwendet die zuvor definierte `DeveloperChoiceCard` und wird unter folgendem Pfad gespeichert:

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

Registrieren Sie diese abschließend in `src/client-v2/plugin.tsx`:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Nachdem die Karte registriert wurde, bauen Sie den Client neu. Wenn im Gespräch der Punkt `developerChoice` erreicht wird, pausiert der `ToolCall` und zeigt die anklickbaren Optionen an.

<!-- Benötigt einen Screenshot, der die anklickbaren Optionen von developerChoice im Gespräch zeigt -->

## Verwandte Links

- [Serverseitiges Tool definieren](./define-tool.md) — Das serverseitige Tool für die entsprechende Frontend-Interaktion definieren
- [Vollständiges Beispiel: Integrierten AI-Mitarbeiter erstellen](./complete-example.md) — Zuerst das Basisbeispiel ohne Frontend-Code fertigstellen
- [Internationalisierung von AI-Mitarbeiter-Plugins](./internationalization.md) — Texte der Verwaltungsoberfläche von Tools und Skills übersetzen
- [Client-Plugin](../../../plugin-development/client/plugin.md) — Client-Plugin-Einstiegspunkte und die Methode `load()` kennenlernen
