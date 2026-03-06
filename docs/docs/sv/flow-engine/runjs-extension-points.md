:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/flow-engine/runjs-extension-points).
:::

# RunJS-pluginens utökningspunkter (ctx-dokumentation / snippets / scenmappning)

När en plugin lägger till eller utökar RunJS-funktioner rekommenderas det att registrera "kontextmappning / `ctx`-dokumentation / exempelkod" via de **officiella utökningspunkterna**. Detta säkerställer att:

- CodeEditor kan erbjuda automatisk komplettering för `ctx.xxx.yyy`.
- AI-kodning kan erhålla strukturerade `ctx` API-referenser och exempel.

Detta kapitel introducerar två utökningspunkter:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Används för att registrera RunJS-"bidrag" (contributions). Typiska användningsområden inkluderar:

- Lägga till/skriva över `RunJSContextRegistry`-mappningar (`modelClass` -> `RunJSContext`, inklusive `scenes`).
- Utöka `RunJSDocMeta` (beskrivningar/exempel/kompletteringsmallar för `ctx` API) för `FlowRunJSContext` eller en anpassad `RunJSContext`.

### Beteendebeskrivning

- Bidrag körs samlat under fasen `setupRunJSContexts()`.
- Om `setupRunJSContexts()` redan har slutförts, kommer **sena registreringar att köras omedelbart** (ingen omstart av setup krävs).
- Varje bidrag körs **högst en gång** för varje `RunJSVersion`.

### Exempel: Lägga till en JS-skrivbar modellkontext

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx-dokumentation/komplettering (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) modell -> kontextmappning (scen påverkar editorns komplettering/filtrering av snippets)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Används för att registrera exempelkod (snippets) för RunJS, vilka används för:

- Snippet-komplettering i CodeEditor.
- Fungera som exempel/referensmaterial för AI-kodning (kan filtreras efter scen/version/språk).

### Rekommenderad ref-namngivning

Vi föreslår att ni använder: `plugin/<pluginNamn>/<ämne>`, till exempel:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Undvik konflikter med kärnans (core) namnrymder `global/*` eller `scene/*`.

### Konfliktstrategi

- Som standard skrivs inte befintliga `ref`-poster över (returnerar `false` utan att kasta fel).
- För att uttryckligen skriva över, skicka med `{ override: true }`.

### Exempel: Registrera en snippet

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. Bästa praxis

- **Lagerindelat underhåll av dokumentation + snippets**:
  - `RunJSDocMeta`: Beskrivningar/kompletteringsmallar (korta, strukturerade).
  - Snippets: Långa exempel (återanvändbara, filtrerbara efter scen/version).
- **Undvik för långa prompts**: Exempel bör vara koncisa; prioritera "minimala körbara mallar".
- **Scenprioritet**: Om er JS-kod främst körs i scenarier som formulär eller tabeller, se till att fältet `scenes` fylls i korrekt för att förbättra relevansen för kompletteringar och exempel.

## 4. Dölja kompletteringar baserat på faktisk ctx: `hidden(ctx)`

Vissa `ctx` API:er är mycket kontextspecifika (t.ex. är `ctx.popup` endast tillgänglig när ett popup-fönster eller en låda är öppen). Om ni vill dölja dessa otillgängliga API:er under komplettering kan ni definiera `hidden(ctx)` för motsvarande post i `RunJSDocMeta`:

- Returnerar `true`: Döljer den aktuella noden och dess underträd.
- Returnerar `string[]`: Döljer specifika undersökvägar under den aktuella noden (stöder retur av flera sökvägar; sökvägar är relativa; underträd döljs baserat på prefixmatchning).

`hidden(ctx)` stöder `async`: Ni kan använda `await ctx.getVar('ctx.xxx')` för att avgöra synlighet (efter användarens gottfinnande). Det rekommenderas att hålla denna logik snabb och fri från sidoeffekter (undvik t.ex. nätverksanrop).

Exempel: Visa `ctx.popup.*`-kompletteringar endast när `popup.uid` existerar.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

Exempel: Popup är tillgänglig men vissa undersökvägar är dolda (endast relativa sökvägar; t.ex. dölja `record` och `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

Observera: CodeEditor aktiverar alltid filtrering av kompletteringar baserat på den faktiska `ctx` (fail-open, kastar inte fel).

## 5. Runtime `info/meta` och API för kontextinformation (för kompletteringar och LLM)

Förutom att underhålla `ctx`-dokumentation statiskt via `FlowRunJSContext.define()`, kan ni även injicera **info/meta** vid körning via `FlowContext.defineProperty/defineMethod`. Ni kan sedan exportera **serialiserbar** kontextinformation för CodeEditor eller stora språkmodeller (LLM) med hjälp av följande API:er:

- `await ctx.getApiInfos(options?)`: Statisk API-information.
- `await ctx.getVarInfos(options?)`: Information om variabelstruktur (hämtas från `meta`, stöder expansion av path/maxDepth).
- `await ctx.getEnvInfos()`: Ögonblicksbild av körtidsmiljön.

### 5.1 `defineMethod(name, fn, info?)`

`info` stöder (allt valfritt):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (JSDoc-liknande)

> Observera: `getApiInfos()` returnerar statisk API-dokumentation och inkluderar inte fält som `deprecated`, `disabled` eller `disabledReason`.

Exempel: Tillhandahålla dokumentationslänkar för `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Uppdatera data i målblocken',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Används för gränssnittet för variabelväljaren (`getPropertyMetaTree` / `FlowContextSelector`). Det avgör synlighet, trädstruktur, inaktivering etc. (stöder funktioner/async).
  - Vanliga fält: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Används för statisk API-dokumentation (`getApiInfos`) och beskrivningar för LLM. Det påverkar inte gränssnittet för variabelväljaren (stöder funktioner/async).
  - Vanliga fält: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

När endast `meta` tillhandahålls (utan `info`):

- `getApiInfos()` kommer inte att returnera denna nyckel (eftersom statisk API-dokumentation inte härleds från `meta`).
- `getVarInfos()` kommer att bygga variabelstrukturen baserat på `meta` (används för variabelväljare/dynamiska variabelträd).

### 5.3 API för kontextinformation

Används för att exportera "tillgänglig information om kontextens förmågor".

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Kan användas direkt i await ctx.getVar(getVar), rekommenderas att börja med "ctx."
  value?: any; // Upplöst statiskt värde (serialiserbart, returneras endast när det kan härledas)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Statisk dokumentation (toppnivå)
type FlowContextVarInfos = Record<string, any>; // Variabelstruktur (expanderbar via path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Vanliga parametrar:

- `getApiInfos({ version })`: Version för RunJS-dokumentation (standard är `v1`).
- `getVarInfos({ path, maxDepth })`: Beskärning och maximalt expansionsdjup (standard är 3).

Observera: Resultaten som returneras av ovanstående API:er innehåller inga funktioner och är lämpliga för direkt serialisering till LLM.

### 5.4 `await ctx.getVar(path)`

När ni har en "variabelsökvägssträng" (t.ex. från konfiguration eller användarinmatning) och vill hämta körtidsvärdet för den variabeln direkt, använd `getVar`:

- Exempel: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` är en uttryckssökväg som börjar med `ctx.` (t.ex. `ctx.record.id` / `ctx.record.roles[0].id`).

Dessutom: Metoder eller egenskaper som börjar med ett understreck `_` betraktas som privata medlemmar och kommer inte att visas i utdata från `getApiInfos()` eller `getVarInfos()`.