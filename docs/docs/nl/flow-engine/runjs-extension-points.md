---
title: RunJS Plugin Uitbreidingspunten (ctx-documentatie / snippets / scène-mapping)
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/flow-engine/runjs-extension-points) voor nauwkeurige informatie.
:::

# RunJS Plugin Uitbreidingspunten (ctx-documentatie / snippets / scène-mapping)

Wanneer een plugin RunJS-mogelijkheden toevoegt of uitbreidt, wordt aanbevolen om de "context-mapping / `ctx`-documentatie / voorbeeldcode" te registreren via de **officiële uitbreidingspunten**. Dit zorgt ervoor dat:

- De CodeEditor automatisch aanvullingen (auto-completion) kan bieden voor `ctx.xxx.yyy`.
- AI-coding gestructureerde `ctx` API-referenties en voorbeelden kan verkrijgen.

In dit hoofdstuk worden twee uitbreidingspunten geïntroduceerd:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Wordt gebruikt om RunJS-"bijdragen" (contributions) te registreren. Typische toepassingen zijn:

- Het toevoegen/overschrijven van `RunJSContextRegistry`-mappings (`modelClass` -> `RunJSContext`, inclusief `scenes`).
- Het uitbreiden van `RunJSDocMeta` (beschrijvingen/voorbeelden/aanvullings-sjablonen voor de `ctx` API) voor `FlowRunJSContext` of een aangepaste `RunJSContext`.

### Gedragsbeschrijving

- Bijdragen worden gezamenlijk uitgevoerd tijdens de `setupRunJSContexts()`-fase.
- Als `setupRunJSContexts()` al is voltooid, worden **late registraties onmiddellijk uitgevoerd** (u hoeft de setup niet opnieuw uit te voeren).
- Elke bijdrage wordt **maximaal één keer** uitgevoerd voor elke `RunJSVersion`.

### Voorbeeld: Een JS-schrijfbare modelcontext toevoegen

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx-documentatie/aanvulling (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'Mijn plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Zeg hallo',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) model -> context mapping (scène beïnvloedt editor-aanvulling/snippet-filtering)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Wordt gebruikt om voorbeeldcode-fragmenten (snippets) voor RunJS te registreren, die worden gebruikt voor:

- CodeEditor snippet-aanvulling.
- Als voorbeeld/referentiemateriaal voor AI-coding (kan worden gefilterd op scène/versie/taal).

### Aanbevolen ref-naamgeving

Het wordt aanbevolen om de volgende structuur te gebruiken: `plugin/<pluginNaam>/<onderwerp>`, bijvoorbeeld:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Vermijd conflicten met de `global/*` of `scene/*` namespaces van de core.

### Conflictstrategie

- Standaard worden bestaande `ref`-vermeldingen niet overschreven (retourneert `false` zonder een foutmelding te geven).
- Om expliciet te overschrijven, geeft u `{ override: true }` mee.

### Voorbeeld: Een snippet registreren

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hallo (Mijn Plugin)',
    description: 'Minimaal voorbeeld voor mijn plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// Mijn plugin snippet
ctx.message.success('Hallo vanuit de plugin');
`,
  },
}));
```

## 3. Best practices

- **Gelaagd onderhoud van documentatie + snippets**:
  - `RunJSDocMeta`: Beschrijvingen/aanvullings-sjablonen (kort, gestructureerd).
  - Snippets: Lange voorbeelden (herbruikbaar, filterbaar op scène/versie).
- **Vermijd overmatige prompt-lengte**: Voorbeelden moeten beknopt zijn; geef prioriteit aan "minimaal uitvoerbare sjablonen".
- **Scèneprioriteit**: Als uw JS-code voornamelijk draait in scenario's zoals formulieren of tabellen, zorg er dan voor dat het veld `scenes` correct is ingevuld om de relevantie van aanvullingen en voorbeelden te verbeteren.

## 4. Aanvullingen verbergen op basis van de actuele ctx: `hidden(ctx)`

Bepaalde `ctx` API's zijn zeer contextspecifiek (bijv. `ctx.popup` is alleen beschikbaar wanneer een pop-up of lade geopend is). Als u deze niet-beschikbare API's wilt verbergen tijdens de aanvulling, kunt u `hidden(ctx)` definiëren voor de overeenkomstige vermelding in `RunJSDocMeta`:

- Retourneert `true`: Verbergt de huidige node en de bijbehorende subboom.
- Retourneert `string[]`: Verbergt specifieke subpaden onder de huidige node (ondersteunt het retourneren van meerdere paden; paden zijn relatief; subbomen worden verborgen op basis van prefix-matching).

`hidden(ctx)` ondersteunt `async`: U kunt `await ctx.getVar('ctx.xxx')` gebruiken om de zichtbaarheid te bepalen (naar eigen inzicht). Het wordt aanbevolen om deze logica snel en vrij van bijwerkingen te houden (vermijd bijvoorbeeld netwerkverzoeken).

Voorbeeld: Toon `ctx.popup.*` aanvullingen alleen wanneer `popup.uid` bestaat.

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

Voorbeeld: Pop-up is beschikbaar, maar sommige subpaden zijn verborgen (alleen relatieve paden; bijv. het verbergen van `record` en `parent.record`).

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
            record: 'Ouder record',
          },
        },
      },
    },
  },
});
```

Opmerking: CodeEditor schakelt altijd filtering van aanvullingen in op basis van de actuele `ctx` (fail-open, genereert geen fouten).

## 5. Runtime `info/meta` en contextinformatie-API (voor aanvullingen en LLM's)

Naast het statisch onderhouden van `ctx`-documentatie via `FlowRunJSContext.define()`, kunt u ook **info/meta** injecteren tijdens runtime via `FlowContext.defineProperty/defineMethod`. U kunt vervolgens **serialiseerbare** contextinformatie uitvoeren voor CodeEditor of LLM's met behulp van de volgende API's:

- `await ctx.getApiInfos(options?)`: Statische API-informatie.
- `await ctx.getVarInfos(options?)`: Informatie over de variabelestructuur (afkomstig van `meta`, ondersteunt pad/maxDepth-uitbreiding).
- `await ctx.getEnvInfos()`: Snapshot van de runtime-omgeving.

### 5.1 `defineMethod(name, fn, info?)`

`info` ondersteunt (allemaal optioneel):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (JSDoc-achtig)

> Opmerking: `getApiInfos()` geeft statische API-documentatie uit en bevat geen velden zoals `deprecated`, `disabled` of `disabledReason`.

Voorbeeld: Documentatielinks aanbieden voor `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Gegevens van de doelblokken vernieuwen',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Wordt gebruikt voor de UI van de variabele-selector (`getPropertyMetaTree` / `FlowContextSelector`). Het bepaalt de zichtbaarheid, boomstructuur, uitschakeling, enz. (ondersteunt functies/async).
  - Veelvoorkomende velden: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Wordt gebruikt voor statische API-documentatie (`getApiInfos`) en beschrijvingen voor LLM's. Het heeft geen invloed op de UI van de variabele-selector (ondersteunt functies/async).
  - Veelvoorkomende velden: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Wanneer alleen `meta` wordt verstrekt (zonder `info`):

- `getApiInfos()` zal deze sleutel niet retourneren (aangezien statische API-documentatie niet wordt afgeleid van `meta`).
- `getVarInfos()` zal de variabelestructuur opbouwen op basis van `meta` (gebruikt voor variabele-selectors/dynamische variabele-bomen).

### 5.3 Contextinformatie-API

Wordt gebruikt om "beschikbare context-capaciteitsinformatie" uit te voeren.

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Kan direct worden gebruikt in await ctx.getVar(getVar), aanbevolen om te beginnen met "ctx."
  value?: any; // Opgeloste statische waarde (serialiseerbaar, alleen geretourneerd indien afleidbaar)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Statische documentatie (top-level)
type FlowContextVarInfos = Record<string, any>; // Variabelestructuur (uitbreidbaar via pad/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Veelvoorkomende parameters:

- `getApiInfos({ version })`: RunJS-documentatieversie (standaard `v1`).
- `getVarInfos({ path, maxDepth })`: Bijsnijden en maximale uitbreidingsdiepte (standaard 3).

Opmerking: De resultaten die door de bovenstaande API's worden geretourneerd, bevatten geen functies en zijn geschikt voor directe serialisatie naar LLM's.

### 5.4 `await ctx.getVar(path)`

Wanneer u een "variabele-padstring" heeft (bijv. uit configuratie of gebruikersinvoer) en de runtime-waarde van die variabele direct wilt ophalen, gebruikt u `getVar`:

- Voorbeeld: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` is een expressiepad dat begint met `ctx.` (bijv. `ctx.record.id` / `ctx.record.roles[0].id`).

Aanvullend: Methoden of eigenschappen die beginnen met een underscore `_` worden behandeld als privé-leden en verschijnen niet in de uitvoer van `getApiInfos()` of `getVarInfos()`.