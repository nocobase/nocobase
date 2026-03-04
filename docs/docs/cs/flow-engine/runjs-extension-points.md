:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/flow-engine/runjs-extension-points).
:::

# Rozšiřující body pluginu RunJS (dokumentace ctx / snippety / mapování scén)

Pokud plugin přidává nebo rozšiřuje možnosti RunJS, doporučujeme zaregistrovat „mapování kontextu / dokumentaci `ctx` / ukázkový kód“ prostřednictvím **oficiálních rozšiřujících bodů**. To zajistí, že:

- CodeEditor bude moci automaticky doplňovat `ctx.xxx.yyy`.
- AI kódování získá strukturované reference API `ctx` + příklady.

Tato kapitola představuje dva rozšiřující body:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Slouží k registraci „příspěvků“ (contributions) pro RunJS. Typické použití zahrnuje:

- Přidání/přepsání mapování `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, včetně `scenes`).
- Rozšíření `RunJSDocMeta` (popisy/příklady/šablony doplňování pro API `ctx`) pro `FlowRunJSContext` nebo vlastní `RunJSContext`.

### Popis chování

- Příspěvky se provádějí hromadně během fáze `setupRunJSContexts()`.
- Pokud již `setupRunJSContexts()` proběhlo, **pozdní registrace se provede okamžitě** (není třeba znovu spouštět setup).
- Každý příspěvek se pro každou verzi `RunJSVersion` provede **maximálně jednou**.

### Příklad: Přidání nového kontextu modelu s podporou zápisu JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx dokumentace/doplňování (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'Jmenný prostor mého pluginu',
        detail: 'object',
        properties: {
          hello: {
            description: 'Pozdravit',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) mapování model -> kontext (scéna ovlivňuje doplňování v editoru / filtrování snippetů)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Slouží k registraci ukázkových fragmentů kódu (snippetů) pro RunJS, které se používají pro:

- Doplňování snippetů v CodeEditoru.
- Jako ukázky/referenční materiály pro AI kódování (lze filtrovat podle scény/verze/lokalizace).

### Doporučené pojmenování ref

Doporučujeme používat formát: `plugin/<názevPluginu>/<téma>`, například:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Vyhněte se konfliktům s jádrem (`global/*`, `scene/*`).

### Strategie při konfliktu

- Ve výchozím nastavení se stávající `ref` nepřepisuje (vrací `false`, ale nevyhazuje chybu).
- Pokud je přepsání vyžadováno, předejte explicitně `{ override: true }`.

### Příklad: Registrace snippetu

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (Můj Plugin)',
    description: 'Minimální příklad pro můj plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// Snippet mého pluginu
ctx.message.success('Pozdrav z pluginu');
`,
  },
}));
```

## 3. Nejlepší praxe

- **Vrstvená údržba dokumentace + snippetů**:
  - `RunJSDocMeta`: Popisy/šablony doplňování (krátké, strukturované).
  - Snippety: Dlouhé příklady (znovupoužitelné, filtrovatelné podle scény/verze).
- **Vyhněte se příliš dlouhým promptům**: Příklady by neměly být příliš četné; upřednostňujte „minimální spustitelné šablony“.
- **Priorita scén**: Pokud váš JS kód běží hlavně v situacích, jako jsou formuláře nebo tabulky, vyplňte správně pole `scenes`, aby se zvýšila relevance doplňování a příkladů.

## 4. Skrytí doplňování na základě skutečného ctx: `hidden(ctx)`

Některá API `ctx` jsou silně vázána na scénu (např. `ctx.popup` je k dispozici pouze tehdy, když je otevřeno vyskakovací okno nebo postranní panel). Pokud si přejete tato nedostupná API při doplňování skrýt, můžete v `RunJSDocMeta` pro odpovídající položku definovat `hidden(ctx)`:

- Vrátí `true`: Skryje aktuální uzel a jeho podstrom.
- Vrátí `string[]`: Skryje konkrétní podcesty pod aktuálním uzlem (podporuje vrácení více cest najednou; cesty jsou relativní; podstromy jsou skryty na základě shody předpony).

`hidden(ctx)` podporuje `async`: K rozhodnutí můžete použít `await ctx.getVar('ctx.xxx')` (na uvážení vývojáře). Doporučujeme, aby tato logika byla rychlá a bez vedlejších účinků (např. neodesílala síťové požadavky).

Příklad: Zobrazit doplňování `ctx.popup.*` pouze tehdy, když existuje `popup.uid`.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Kontext vyskakovacího okna (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'UID vyskakovacího okna',
      },
    },
  },
});
```

Příklad: Vyskakovací okno je k dispozici, ale některé podcesty jsou skryté (pouze relativní cesty; např. skrytí `record` a `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Kontext vyskakovacího okna (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'UID vyskakovacího okna',
        record: 'Záznam vyskakovacího okna',
        parent: {
          properties: {
            record: 'Nadřazený záznam',
          },
        },
      },
    },
  },
});
```

Poznámka: CodeEditor vždy povoluje filtrování doplňování na základě skutečného `ctx` (v režimu fail-open, nevyhazuje chyby).

## 5. Runtime `info/meta` a API pro informace o kontextu (pro doplňování a LLM)

Kromě statické údržby dokumentace `ctx` přes `FlowRunJSContext.define()` můžete za běhu vkládat **info/meta** pomocí `FlowContext.defineProperty/defineMethod`. Poté můžete pomocí následujících API exportovat **serializovatelné** informace o kontextu pro CodeEditor nebo LLM:

- `await ctx.getApiInfos(options?)`: Statické informace o API.
- `await ctx.getVarInfos(options?)`: Informace o struktuře proměnných (zdrojem je `meta`, podporuje rozbalení podle path/maxDepth).
- `await ctx.getEnvInfos()`: Snímek běhového prostředí.

### 5.1 `defineMethod(name, fn, info?)`

`info` podporuje (vše volitelné):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (ve stylu JSDoc)

> Poznámka: `getApiInfos()` vrací statickou dokumentaci API a nebude obsahovat pole jako `deprecated`, `disabled` nebo `disabledReason`.

Příklad: Poskytnutí odkazu na dokumentaci pro `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Obnovit data cílových bloků',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Dokumentace' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Používá se pro UI výběru proměnných (`getPropertyMetaTree` / `FlowContextSelector`). Určuje viditelnost, strukturu stromu, zakázání atd. (podporuje funkce/async).
  - Častá pole: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Používá se pro statickou dokumentaci API (`getApiInfos`) a popisy pro LLM. Neovlivňuje UI výběru proměnných (podporuje funkce/async).
  - Častá pole: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Pokud je poskytnuto pouze `meta` (bez `info`):

- `getApiInfos()` tento klíč nevrátí (protože statická dokumentace API se z `meta` nevyvozuje).
- `getVarInfos()` sestaví strukturu proměnných na základě `meta` (používá se pro výběry proměnných / dynamické stromy proměnných).

### 5.3 API pro informace o kontextu

Slouží k výstupu „dostupných informací o schopnostech kontextu“.

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Lze použít přímo v await ctx.getVar(getVar), doporučeno začínat "ctx."
  value?: any; // Vyřešená statická hodnota (serializovatelná, vrací se pouze pokud ji lze vyvodit)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Statická dokumentace (nejvyšší úroveň)
type FlowContextVarInfos = Record<string, any>; // Struktura proměnných (rozbalitelná podle path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Časté parametry:

- `getApiInfos({ version })`: Verze dokumentace RunJS (výchozí `v1`).
- `getVarInfos({ path, maxDepth })`: Ořezání a maximální hloubka rozbalení (výchozí 3).

Poznámka: Výsledky vrácené výše uvedenými API neobsahují funkce a jsou vhodné pro přímou serializaci pro LLM.

### 5.4 `await ctx.getVar(path)`

Pokud máte „řetězec cesty k proměnné“ (např. z konfigurace nebo uživatelského vstupu) a chcete přímo získat běhovou hodnotu této proměnné, použijte `getVar`:

- Příklad: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` je cesta výrazu začínající na `ctx.` (např. `ctx.record.id` / `ctx.record.roles[0].id`).

Doplňující informace: Metody nebo vlastnosti začínající podtržítkem `_` jsou považovány za soukromé členy a neobjeví se ve výstupu `getApiInfos()` ani `getVarInfos()`.