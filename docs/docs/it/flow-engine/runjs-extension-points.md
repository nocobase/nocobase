:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/flow-engine/runjs-extension-points).
:::

# Punti di estensione del plugin RunJS (documentazione ctx / snippet / mappatura delle scene)

Quando un plugin aggiunge o estende le funzionalità di RunJS, si consiglia di registrare la "mappatura del contesto / documentazione `ctx` / codice di esempio" attraverso i **punti di estensione ufficiali**. Ciò garantisce che:

- Il CodeEditor possa fornire il completamento automatico per `ctx.xxx.yyy`.
- L'AI coding possa ottenere riferimenti API `ctx` strutturati ed esempi.

Questo capitolo introduce due punti di estensione:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Utilizzato per registrare i "contributi" (contribution) di RunJS. Gli usi tipici includono:

- Aggiunta/sovrascrittura delle mappature `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, incluse le `scenes`).
- Estensione di `RunJSDocMeta` (descrizioni/esempi/modelli di completamento per l'API `ctx`) per `FlowRunJSContext` o `RunJSContext` personalizzati.

### Descrizione del comportamento

- I contributi vengono eseguiti collettivamente durante la fase `setupRunJSContexts()`;
- Se `setupRunJSContexts()` è già stato completato, **le registrazioni tardive verranno eseguite immediatamente** (senza necessità di riavviare il setup);
- Ogni contributo verrà eseguito **al massimo una volta** per ogni `RunJSVersion`.

### Esempio: Aggiunta di un contesto di modello scrivibile in JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Documentazione/completamento ctx (RunJSDocMeta)
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

  // 2) Mappatura modello -> contesto (la scena influenza il completamento dell'editor/il filtraggio degli snippet)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Utilizzato per registrare frammenti di codice di esempio (snippet) per RunJS, impiegati per:

- Completamento degli snippet nel CodeEditor.
- Materiale di riferimento/esempio per l'AI coding (filtrabile per scena/versione/lingua).

### Naming consigliato per ref

Si suggerisce di utilizzare: `plugin/<nomePlugin>/<argomento>`, ad esempio:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Evitare conflitti con i namespace `global/*` o `scene/*` del core.

### Strategia di conflitto

- Per impostazione predefinita, le voci `ref` esistenti non vengono sovrascritte (restituisce `false` senza lanciare errori).
- Per sovrascrivere esplicitamente, passare `{ override: true }`.

### Esempio: Registrazione di uno snippet

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

## 3. Best Practice

- **Manutenzione stratificata di documentazione + snippet**:
  - `RunJSDocMeta`: Descrizioni/modelli di completamento (brevi, strutturati).
  - Snippet: Esempi lunghi (riutilizzabili, filtrabili per scena/versione).
- **Evitare prompt eccessivamente lunghi**: Gli esempi dovrebbero essere concisi; dare priorità a "modelli minimi eseguibili".
- **Priorità della scena**: Se il Suo codice JS viene eseguito principalmente in scenari come moduli o tabelle, si assicuri di compilare correttamente il campo `scenes` per migliorare la pertinenza dei completamenti e degli esempi.

## 4. Nascondere i completamenti in base al ctx effettivo: `hidden(ctx)`

Alcune API `ctx` sono strettamente legate al contesto (ad esempio, `ctx.popup` è disponibile solo quando un popup o un cassetto è aperto). Se desidera nascondere queste API non disponibili durante il completamento, può definire `hidden(ctx)` per la voce corrispondente in `RunJSDocMeta`:

- Restituisce `true`: Nasconde il nodo corrente e il suo sottoalbero.
- Restituisce `string[]`: Nasconde percorsi secondari specifici sotto il nodo corrente (supporta la restituzione di più percorsi; i percorsi sono relativi; i sottoalberi vengono nascosti in base alla corrispondenza del prefisso).

`hidden(ctx)` supporta `async`: può utilizzare `await ctx.getVar('ctx.xxx')` per determinare la visibilità (a discrezione dell'utente). Si raccomanda di mantenere questa logica veloce e priva di effetti collaterali (ad esempio, evitare richieste di rete).

Esempio: Mostra i completamenti di `ctx.popup.*` solo quando esiste `popup.uid`.

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

Esempio: Il popup è disponibile ma alcuni sotto-percorsi sono nascosti (solo percorsi relativi; ad esempio, nascondendo `record` e `parent.record`).

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

Nota: CodeEditor abilita sempre il filtraggio del completamento basato sul `ctx` effettivo (fail-open, non lancia errori).

## 5. `info/meta` a runtime e API delle informazioni di contesto (per completamenti e LLM)

Oltre a mantenere la documentazione `ctx` staticamente tramite `FlowRunJSContext.define()`, Lei può anche iniettare **info/meta** a runtime tramite `FlowContext.defineProperty/defineMethod`. È quindi possibile emettere informazioni di contesto **serializzabili** per CodeEditor o LLM utilizzando le seguenti API:

- `await ctx.getApiInfos(options?)`: Informazioni API statiche.
- `await ctx.getVarInfos(options?)`: Informazioni sulla struttura delle variabili (originate da `meta`, supporta l'espansione path/maxDepth).
- `await ctx.getEnvInfos()`: Snapshot dell'ambiente runtime.

### 5.1 `defineMethod(name, fn, info?)`

`info` supporta (tutti opzionali):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (stile JSDoc)

> Nota: `getApiInfos()` emette documentazione API statica e non includerà campi come `deprecated`, `disabled` o `disabledReason`.

Esempio: Fornire link alla documentazione per `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Aggiorna i dati dei blocchi di destinazione',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Documentazione' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Utilizzato per l'interfaccia utente del selettore di variabili (`getPropertyMetaTree` / `FlowContextSelector`). Determina la visibilità, la struttura ad albero, la disattivazione, ecc. (supporta funzioni/async).
  - Campi comuni: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Utilizzato per la documentazione API statica (`getApiInfos`) e le descrizioni per i modelli linguistici (LLM). Non influisce sull'interfaccia utente del selettore di variabili (supporta funzioni/async).
  - Campi comuni: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Quando viene fornito solo `meta` (senza `info`):

- `getApiInfos()` non restituirà questa chiave (poiché la documentazione API statica non viene dedotta da `meta`).
- `getVarInfos()` costruirà la struttura della variabile basandosi su `meta` (utilizzato per selettori di variabili/alberi di variabili dinamiche).

### 5.3 API delle informazioni di contesto

Utilizzata per emettere "informazioni sulle capacità del contesto disponibili".

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Può essere usato direttamente in await ctx.getVar(getVar), si consiglia di iniziare con "ctx."
  value?: any; // Valore statico risolto (serializzabile, restituito solo quando deducibile)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Documentazione statica (livello superiore)
type FlowContextVarInfos = Record<string, any>; // Struttura delle variabili (espandibile per path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Parametri comuni:

- `getApiInfos({ version })`: Versione della documentazione RunJS (predefinita `v1`).
- `getVarInfos({ path, maxDepth })`: Ritaglio e profondità massima di espansione (predefinita 3).

Nota: I risultati restituiti dalle API sopra indicate non contengono funzioni e sono adatti per la serializzazione diretta verso gli LLM.

### 5.4 `await ctx.getVar(path)`

Quando si dispone di una "stringa del percorso della variabile" (ad esempio, da una configurazione o da un input dell'utente) e si desidera recuperare direttamente il valore runtime di tale variabile, utilizzare `getVar`:

- Esempio: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` è un percorso di espressione che inizia con `ctx.` (ad esempio, `ctx.record.id` / `ctx.record.roles[0].id`).

Inoltre: i metodi o le proprietà che iniziano con un carattere di sottolineatura `_` sono trattati come membri privati e non appariranno nell'output di `getApiInfos()` o `getVarInfos()`.