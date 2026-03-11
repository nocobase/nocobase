:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/flow-engine/runjs-extension-points).
:::

# Punkty rozszerzeń wtyczki RunJS (dokumentacja ctx / fragmenty kodu / mapowanie scen)

Gdy wtyczka dodaje lub rozszerza możliwości RunJS, zaleca się zarejestrowanie „mapowania kontekstu / dokumentacji `ctx` / przykładowego kodu” poprzez **oficjalne punkty rozszerzeń**. Zapewnia to, że:

- CodeEditor może automatycznie uzupełniać `ctx.xxx.yyy`.
- Kodowanie AI może uzyskać ustrukturyzowane referencje API `ctx` oraz przykłady.

W tym rozdziale przedstawiono dwa punkty rozszerzeń:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Służy do rejestrowania „wkładów” (contributions) RunJS. Typowe zastosowania obejmują:

- Dodawanie/nadpisywanie mapowań `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, w tym `scenes`).
- Rozszerzanie `RunJSDocMeta` (opisy/przykłady/szablony uzupełniania dla API `ctx`) dla `FlowRunJSContext` lub niestandardowego `RunJSContext`.

### Opis zachowania

- Wkłady są wykonywane zbiorczo podczas fazy `setupRunJSContexts()`.
- Jeśli `setupRunJSContexts()` zostało już zakończone, **późne rejestracje zostaną wykonane natychmiast** (nie ma potrzeby ponownego uruchamiania konfiguracji).
- Każdy wkład zostanie wykonany **co najwyżej raz** dla każdej wersji `RunJSVersion`.

### Przykład: Dodawanie kontekstu modelu z możliwością zapisu JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Dokumentacja ctx/uzupełnianie (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'Kontekst RunJS MyPlugin',
    properties: {
      myPlugin: {
        description: 'Przestrzeń nazw mojej wtyczki',
        detail: 'object',
        properties: {
          hello: {
            description: 'Powiedz cześć',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) Mapowanie model -> kontekst (scena wpływa na uzupełnianie w edytorze / filtrowanie fragmentów kodu)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Służy do rejestrowania przykładowych fragmentów kodu (snippets) dla RunJS, które są używane do:

- Uzupełniania fragmentów kodu w CodeEditor.
- Służenia jako przykłady/materiały referencyjne dla kodowania AI (możliwość filtrowania według sceny/wersji/lokalizacji).

### Zalecane nazewnictwo ref

Sugeruje się używanie formatu: `plugin/<nazwaWtyczki>/<temat>`, na przykład:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Należy unikać konfliktów z rdzeniowymi (core) przestrzeniami nazw `global/*` lub `scene/*`.

### Strategia konfliktów

- Domyślnie istniejące wpisy `ref` nie są nadpisywane (zwraca `false` bez zgłaszania błędu).
- Aby jawnie nadpisać, należy przekazać `{ override: true }`.

### Przykład: Rejestrowanie fragmentu kodu

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Witaj (Moja wtyczka)',
    description: 'Minimalny przykład dla mojej wtyczki',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// Fragment kodu mojej wtyczki
ctx.message.success('Witaj z wtyczki');
`,
  },
}));
```

## 3. Najlepsze praktyki

- **Warstwowe utrzymanie dokumentacji + fragmentów kodu**:
  - `RunJSDocMeta`: Opisy/szablony uzupełniania (krótkie, ustrukturyzowane).
  - Fragmenty kodu (snippets): Długie przykłady (wielokrotnego użytku, filtrowalne według sceny/wersji).
- **Unikanie nadmiernej długości promptów**: Przykłady powinny być zwięzłe; priorytetem są „minimalne szablony możliwe do uruchomienia”.
- **Priorytet scen**: Jeśli Państwa kod JS działa głównie w scenariuszach takich jak formularze lub tabele, należy upewnić się, że pole `scenes` jest wypełnione poprawnie, aby poprawić trafność uzupełnień i przykładów.

## 4. Ukrywanie uzupełnień na podstawie rzeczywistego ctx: `hidden(ctx)`

Niektóre API `ctx` są silnie zależne od kontekstu (np. `ctx.popup` jest dostępne tylko wtedy, gdy otwarte jest okno wyskakujące lub szuflada). Jeśli chcą Państwo ukryć te niedostępne API podczas uzupełniania, można zdefiniować `hidden(ctx)` dla odpowiedniego wpisu w `RunJSDocMeta`:

- Zwraca `true`: Ukrywa bieżący węzeł i jego poddrzewo.
- Zwraca `string[]`: Ukrywa określone podścieżki pod bieżącym węzłem (obsługuje zwracanie wielu ścieżek; ścieżki są względne; poddrzewa są ukrywane na podstawie dopasowania prefiksu).

`hidden(ctx)` obsługuje `async`: Można użyć `await ctx.getVar('ctx.xxx')` do określenia widoczności (według uznania użytkownika). Zaleca się, aby logika ta była szybka i wolna od skutków ubocznych (np. unikanie żądań sieciowych).

Przykład: Pokazuj uzupełnienia `ctx.popup.*` tylko wtedy, gdy istnieje `popup.uid`.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Kontekst okna wyskakującego (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'UID okna wyskakującego',
      },
    },
  },
});
```

Przykład: Okno wyskakujące jest dostępne, ale niektóre podścieżki są ukryte (tylko ścieżki względne; np. ukrywanie `record` i `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Kontekst okna wyskakującego (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'UID okna wyskakującego',
        record: 'Rekord okna wyskakującego',
        parent: {
          properties: {
            record: 'Rekord nadrzędny',
          },
        },
      },
    },
  },
});
```

Uwaga: CodeEditor zawsze włącza filtrowanie uzupełnień na podstawie rzeczywistego `ctx` (fail-open, nie zgłasza błędów).

## 5. Środowisko wykonawcze `info/meta` i API informacji o kontekście (dla uzupełnień i LLM)

Oprócz statycznego utrzymywania dokumentacji `ctx` za pomocą `FlowRunJSContext.define()`, można również wstrzykiwać **info/meta** w czasie wykonywania poprzez `FlowContext.defineProperty/defineMethod`. Następnie można wyeksportować **serializowalne** informacje o kontekście dla CodeEditor lub modeli LLM za pomocą następujących API:

- `await ctx.getApiInfos(options?)`: Statyczne informacje o API.
- `await ctx.getVarInfos(options?)`: Informacje o strukturze zmiennych (pochodzące z `meta`, obsługuje rozwijanie ścieżek/maxDepth).
- `await ctx.getEnvInfos()`: Migawka środowiska wykonawczego.

### 5.1 `defineMethod(name, fn, info?)`

`info` obsługuje (wszystkie opcjonalne):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (w stylu JSDoc)

> Uwaga: `getApiInfos()` zwraca statyczną dokumentację API i nie zawiera pól takich jak `deprecated`, `disabled` czy `disabledReason`.

Przykład: Dostarczanie linków do dokumentacji dla `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Odśwież dane docelowych bloków',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Dokumentacja' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Używane dla interfejsu wyboru zmiennych (`getPropertyMetaTree` / `FlowContextSelector`). Decyduje o widoczności, strukturze drzewa, wyłączeniu itp. (obsługuje funkcje/async).
  - Typowe pola: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Używane dla statycznej dokumentacji API (`getApiInfos`) i opisów dla modeli LLM. Nie wpływa na interfejs wyboru zmiennych (obsługuje funkcje/async).
  - Typowe pola: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Gdy podano tylko `meta` (bez `info`):

- `getApiInfos()` nie zwróci tego klucza (ponieważ statyczna dokumentacja API nie jest wnioskowana z `meta`).
- `getVarInfos()` zbuduje strukturę zmiennych na podstawie `meta` (używane dla selektorów zmiennych / dynamicznych drzew zmiennych).

### 5.3 API informacji o kontekście

Służy do wyprowadzania „informacji o dostępnych możliwościach kontekstu”.

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Może być użyte bezpośrednio w await ctx.getVar(getVar), zaleca się zaczynać od "ctx."
  value?: any; // Rozwiązana wartość statyczna (serializowalna, zwracana tylko gdy możliwa do wywnioskowania)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Statyczna dokumentacja (poziom najwyższy)
type FlowContextVarInfos = Record<string, any>; // Struktura zmiennych (rozwijalna przez path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Typowe parametry:

- `getApiInfos({ version })`: Wersja dokumentacji RunJS (domyślnie `v1`).
- `getVarInfos({ path, maxDepth })`: Przycinanie i maksymalna głębokość rozwijania (domyślnie 3).

Uwaga: Wyniki zwracane przez powyższe API nie zawierają funkcji i nadają się do bezpośredniej serializacji dla modeli LLM.

### 5.4 `await ctx.getVar(path)`

Gdy posiadają Państwo „ciąg ścieżki zmiennej” (np. z konfiguracji lub danych wejściowych użytkownika) i chcą bezpośrednio pobrać wartość tej zmiennej w czasie wykonywania, należy użyć `getVar`:

- Przykład: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` to ścieżka wyrażenia zaczynająca się od `ctx.` (np. `ctx.record.id` / `ctx.record.roles[0].id`).

Dodatkowo: Metody lub właściwości zaczynające się od podkreślenia `_` są traktowane jako składowe prywatne i nie pojawią się w wynikach `getApiInfos()` ani `getVarInfos()`.