---
title: RunJS-Plugin-Erweiterungspunkte (ctx-Dokumentation / Snippets / Szenen-Mapping)
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/flow-engine/runjs-extension-points).
:::

# RunJS-Plugin-Erweiterungspunkte (ctx-Dokumentation / Snippets / Szenen-Mapping)

Wenn ein Plugin RunJS-Funktionen hinzufügt oder erweitert, wird empfohlen, das „Kontext-Mapping / die `ctx`-Dokumentation / den Beispielcode“ über die **offiziellen Erweiterungspunkte** zu registrieren. Dies stellt sicher, dass:

- Der CodeEditor automatische Vervollständigungen für `ctx.xxx.yyy` bereitstellen kann.
- KI-Coding strukturierte `ctx`-API-Referenzen + Beispiele erhält.

Dieses Kapitel stellt zwei Erweiterungspunkte vor:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Wird verwendet, um RunJS-„Beiträge“ (Contributions) zu registrieren. Typische Verwendungszwecke sind:

- Hinzufügen/Überschreiben von `RunJSContextRegistry`-Mappings (`modelClass` -> `RunJSContext`, einschließlich `scenes`).
- Erweitern von `RunJSDocMeta` (Beschreibungen/Beispiele/Vervollständigungsvorlagen für die `ctx`-API) für `FlowRunJSContext` oder benutzerdefinierte `RunJSContext`.

### Verhaltensbeschreibung

- Beiträge werden in der Phase `setupRunJSContexts()` gesammelt ausgeführt.
- Wenn `setupRunJSContexts()` bereits abgeschlossen ist, wird eine **verspätete Registrierung sofort ausgeführt** (ein erneuter Setup-Durchlauf ist nicht erforderlich).
- Jeder Beitrag wird für jede `RunJSVersion` **höchstens einmal** ausgeführt.

### Beispiel: Hinzufügen eines JS-beschreibbaren Modell-Kontexts

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx-Dokumentation/Vervollständigung (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MeinPlugin RunJS-Kontext',
    properties: {
      myPlugin: {
        description: 'Mein Plugin-Namensraum',
        detail: 'object',
        properties: {
          hello: {
            description: 'Hallo sagen',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) Modell -> Kontext-Mapping (Szene beeinflusst Editor-Vervollständigung/Snippet-Filterung)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Wird verwendet, um Beispiel-Code-Snippets für RunJS zu registrieren, die für folgende Zwecke genutzt werden:

- Snippet-Vervollständigung im CodeEditor.
- Als Beispiele/Referenzmaterial für KI-Coding (filterbar nach Szene/Version/Sprache).

### Empfohlene ref-Benennung

Es wird empfohlen, folgendes Format zu verwenden: `plugin/<pluginName>/<topic>`, zum Beispiel:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Vermeiden Sie Konflikte mit den Namespaces `global/*` oder `scene/*` des Kernsystems.

### Konfliktstrategie

- Standardmäßig werden bestehende `ref`-Einträge nicht überschrieben (gibt `false` zurück, ohne einen Fehler auszulösen).
- Um explizit zu überschreiben, übergeben Sie `{ override: true }`.

### Beispiel: Registrieren eines Snippets

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hallo (Mein Plugin)',
    description: 'Minimales Beispiel für mein Plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// Mein Plugin-Snippet
ctx.message.success('Hallo vom Plugin');
`,
  },
}));
```

## 3. Best Practices

- **Schichtweise Wartung von Dokumentation + Snippets**:
  - `RunJSDocMeta`: Beschreibungen/Vervollständigungsvorlagen (kurz, strukturiert).
  - Snippets: Lange Beispiele (wiederverwendbar, filterbar nach Szene/Version).
- **Vermeiden Sie zu lange Prompts**: Beispiele sollten prägnant sein; bevorzugen Sie „minimal lauffähige Vorlagen“.
- **Szenen-Priorität**: Wenn Ihr JS-Code primär in Szenarien wie Formularen oder Tabellen läuft, stellen Sie sicher, dass das Feld `scenes` korrekt ausgefüllt ist, um die Relevanz von Vervollständigungen und Beispielen zu erhöhen.

## 4. Ausblenden von Vervollständigungen basierend auf dem tatsächlichen ctx: `hidden(ctx)`

Bestimmte `ctx`-APIs sind stark szenenabhängig (z. B. ist `ctx.popup` nur verfügbar, wenn ein Popup oder eine Schublade geöffnet ist). Wenn Sie diese nicht verfügbaren APIs bei der Vervollständigung ausblenden möchten, können Sie `hidden(ctx)` für den entsprechenden Eintrag in `RunJSDocMeta` definieren:

- Rückgabe von `true`: Blendet den aktuellen Knoten und seinen Unterbaum aus.
- Rückgabe von `string[]`: Blendet bestimmte Unterpfade unter dem aktuellen Knoten aus (unterstützt die Rückgabe mehrerer Pfade; Pfade sind relativ; Unterbäume werden basierend auf Präfix-Übereinstimmung ausgeblendet).

`hidden(ctx)` unterstützt `async`: Sie können `await ctx.getVar('ctx.xxx')` verwenden, um die Sichtbarkeit zu bestimmen (nach eigenem Ermessen). Es wird empfohlen, diese Logik schnell und nebenwirkungsfrei zu halten (vermeiden Sie z. B. Netzwerkanfragen).

Beispiel: Zeige `ctx.popup.*` Vervollständigungen nur an, wenn `popup.uid` existiert.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup-Kontext (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup-UID',
      },
    },
  },
});
```

Beispiel: Popup ist verfügbar, aber einige Unterpfade sind ausgeblendet (nur relative Pfade; z. B. Ausblenden von `record` und `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup-Kontext (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup-UID',
        record: 'Popup-Datensatz',
        parent: {
          properties: {
            record: 'Übergeordneter Datensatz',
          },
        },
      },
    },
  },
});
```

Hinweis: Der CodeEditor aktiviert immer die Filterung der Vervollständigung basierend auf dem tatsächlichen `ctx` (Fail-Open, löst keine Fehler aus).

## 5. Laufzeit-`info/meta` und Kontext-Informations-API (für Vervollständigungen und LLMs)

Zusätzlich zur statischen Wartung der `ctx`-Dokumentation über `FlowRunJSContext.define()` können Sie zur Laufzeit über `FlowContext.defineProperty/defineMethod` **info/meta** injizieren. Sie können dann über die folgenden APIs **serialisierbare** Kontextinformationen für den CodeEditor oder LLMs ausgeben:

- `await ctx.getApiInfos(options?)`: Statische API-Informationen.
- `await ctx.getVarInfos(options?)`: Informationen zur Variablenstruktur (bezogen aus `meta`, unterstützt Pfad-/maxDepth-Erweiterung).
- `await ctx.getEnvInfos()`: Snapshot der Laufzeitumgebung.

### 5.1 `defineMethod(name, fn, info?)`

`info` unterstützt (alle optional):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (JSDoc-ähnlich)

> Hinweis: `getApiInfos()` gibt statische API-Dokumentationen aus und enthält keine Felder wie `deprecated`, `disabled` oder `disabledReason`.

Beispiel: Bereitstellung von Dokumentationslinks für `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Daten der Zielblöcke aktualisieren',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Dokumentation' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Wird für die Benutzeroberfläche der Variablen-Auswahl verwendet (`getPropertyMetaTree` / `FlowContextSelector`). Es bestimmt die Sichtbarkeit, Baumstruktur, Deaktivierung usw. (unterstützt Funktionen/async).
  - Häufige Felder: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Wird für die statische API-Dokumentation (`getApiInfos`) und Beschreibungen für LLMs verwendet. Es beeinflusst nicht die Benutzeroberfläche der Variablen-Auswahl (unterstützt Funktionen/async).
  - Häufige Felder: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Wenn nur `meta` bereitgestellt wird (ohne `info`):

- `getApiInfos()` gibt diesen Schlüssel nicht zurück (da statische API-Dokumente nicht aus `meta` abgeleitet werden).
- `getVarInfos()` baut die Variablenstruktur basierend auf `meta` auf (verwendet für Variablen-Auswähler/dynamische Variablenbäume).

### 5.3 Kontext-Informations-API

Wird verwendet, um „verfügbare Kontext-Fähigkeitsinformationen“ auszugeben.

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Kann direkt in await ctx.getVar(getVar) verwendet werden, empfohlen mit "ctx." beginnend
  value?: any; // Aufgelöster statischer Wert (serialisierbar, wird nur zurückgegeben, wenn ableitbar)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Statische Dokumentation (oberste Ebene)
type FlowContextVarInfos = Record<string, any>; // Variablenstruktur (erweiterbar nach Pfad/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Häufige Parameter:

- `getApiInfos({ version })`: Version der RunJS-Dokumentation (Standard ist `v1`).
- `getVarInfos({ path, maxDepth })`: Kürzung und maximale Erweiterungstiefe (Standard ist 3).

Hinweis: Die von den obigen APIs zurückgegebenen Ergebnisse enthalten keine Funktionen und eignen sich zur direkten Serialisierung für LLMs.

### 5.4 `await ctx.getVar(path)`

Wenn Sie nur einen „Variablenpfad-String“ haben (z. B. aus einer Konfiguration oder Benutzereingabe) und den Laufzeitwert dieser Variable direkt abrufen möchten, verwenden Sie `getVar`:

- Beispiel: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` ist ein Ausdruckspfad, der mit `ctx.` beginnt (z. B. `ctx.record.id` / `ctx.record.roles[0].id`).

Zusätzlich: Methoden oder Eigenschaften, die mit einem Unterstrich `_` beginnen, werden als private Mitglieder behandelt und erscheinen nicht in der Ausgabe von `getApiInfos()` oder `getVarInfos()`.