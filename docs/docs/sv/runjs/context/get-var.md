:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/get-var).
:::

# ctx.getVar()

Läser variabelvärden **asynkront** från den aktuella körningskontexten. Variabelupplösningen är konsekvent med `{{ctx.xxx}}` i SQL och mallar, och kommer vanligtvis från den aktuella användaren, den aktuella posten, vyparametrar, popup-kontext, etc.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock / JSField** | Hämta information om den aktuella posten, användaren, resursen, etc. för rendering eller logik. |
| **Länkregler / Arbetsflöden** | Läs `ctx.record`, `ctx.formValues`, etc. för villkorsstyrd logik. |
| **Formler / Mallar** | Använder samma regler för variabelupplösning som `{{ctx.xxx}}`. |

## Typdefinition

```ts
getVar(path: string): Promise<any>;
```

| Parameter | Typ | Beskrivning |
|------|------|------|
| `path` | `string` | Variabelväg; **måste börja med `ctx.`**. Stöder punktnotation och matrisindex. |

**Returvärde**: `Promise<any>`. Använd `await` för att hämta det upplösta värdet; returnerar `undefined` om variabeln inte finns.

> Om en sökväg som inte börjar med `ctx.` skickas med, kommer ett fel att kastas: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Vanliga variabelvägar

| Sökväg | Beskrivning |
|------|------|
| `ctx.record` | Aktuell post (tillgänglig när ett formulär- eller detaljblock är bundet till en post) |
| `ctx.record.id` | Primärnyckel för aktuell post |
| `ctx.formValues` | Aktuella formulärvärden (används ofta i länkregler och arbetsflöden; i formulärscenarier bör ni föredra `ctx.form.getFieldsValue()` för realtidsavläsning) |
| `ctx.user` | Aktuell inloggad användare |
| `ctx.user.id` | Aktuell användares ID |
| `ctx.user.nickname` | Aktuell användares smeknamn |
| `ctx.user.roles.name` | Aktuell användares rollnamn (matris) |
| `ctx.popup.record` | Post inom en popup |
| `ctx.popup.record.id` | Primärnyckel för posten inom en popup |
| `ctx.urlSearchParams` | URL-sökparametrar (tolkade från `?key=value`) |
| `ctx.token` | Aktuell API-token |
| `ctx.role` | Aktuell roll |

## ctx.getVarInfos()

Hämtar **strukturinformation** (typ, titel, underegenskaper, etc.) för upplösningsbara variabler i den aktuella kontexten, vilket gör det enklare att utforska tillgängliga sökvägar. Returvärdet är en statisk beskrivning baserad på `meta` och inkluderar inte faktiska körningsvärden.

### Typdefinition

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

I returvärdet är varje nyckel en variabelväg, och värdet är strukturinformationen för den sökvägen (inklusive `type`, `title`, `properties`, etc.).

### Parametrar

| Parameter | Typ | Beskrivning |
|------|------|------|
| `path` | `string \| string[]` | Trunkeringssökväg; samlar endast in variabelstrukturen under denna sökväg. Stöder `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; en matris representerar sammanslagning av flera sökvägar. |
| `maxDepth` | `number` | Maximalt expansionsdjup, standard är `3`. När `path` inte anges har egenskaper på toppnivå `depth=1`. När `path` anges har noden som motsvarar sökvägen `depth=1`. |

### Exempel

```ts
// Hämta variabelstrukturen under record (expanderad upp till 3 nivåer)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Hämta strukturen för popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Hämta den fullständiga variabelstrukturen på toppnivå (standard maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Skillnad från ctx.getValue

| Metod | Scenario | Beskrivning |
|------|----------|------|
| `ctx.getValue()` | Redigerbara fält som JSField eller JSItem | Hämtar värdet för det **aktuella fältet** synkront; kräver formulärbindning. |
| `ctx.getVar(path)` | Valfri RunJS-kontext | Hämtar **valfri ctx-variabel** asynkront; sökvägen måste börja med `ctx.`. |

I ett JSField använder ni `getValue`/`setValue` för att läsa eller skriva det aktuella fältet; använd `getVar` för att komma åt andra kontextvariabler (såsom `record`, `user`, `formValues`).

## Observera

- **Sökvägen måste börja med `ctx.`**: t.ex. `ctx.record.id`, annars kastas ett fel.
- **Asynkron metod**: Ni måste använda `await` för att hämta resultatet, t.ex. `const id = await ctx.getVar('ctx.record.id')`.
- **Variabeln finns inte**: Returnerar `undefined`. Ni kan använda `??` efter resultatet för att ange ett standardvärde: `(await ctx.getVar('ctx.user.nickname')) ?? 'Gäst'`.
- **Formulärvärden**: `ctx.formValues` måste hämtas via `await ctx.getVar('ctx.formValues')`; det exponeras inte direkt som `ctx.formValues`. I en formulärkontext bör ni föredra att använda `ctx.form.getFieldsValue()` för att läsa de senaste värdena i realtid.

## Exempel

### Hämta ID för aktuell post

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Aktuell post: ${recordId}`);
}
```

### Hämta post inom en popup

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Aktuell popuppost: ${recordId}`);
}
```

### Läs underobjekt i ett matrisfält

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Returnerar en matris med rollnamn, t.ex. ['admin', 'member']
```

### Ange standardvärde

```ts
// getVar har ingen defaultValue-parameter; använd ?? efter resultatet
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Gäst';
```

### Läs formulärfältvärden

```ts
// Både ctx.formValues och ctx.form är för formulärscenarier; använd getVar för att läsa nästlade fält
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Läs URL-sökparametrar

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Motsvarar ?id=xxx
```

### Utforska tillgängliga variabler

```ts
// Hämta variabelstrukturen under record (expanderad upp till 3 nivåer)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars ser ut som { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Relaterat

- [ctx.getValue()](./get-value.md) - Hämtar det aktuella fältvärdet synkront (endast JSField/JSItem etc.)
- [ctx.form](./form.md) - Formulärinstans; `ctx.form.getFieldsValue()` kan läsa formulärvärden i realtid
- [ctx.model](./model.md) - Modellen där den aktuella körningskontexten finns
- [ctx.blockModel](./block-model.md) - Föräldrablock där aktuell JS finns
- [ctx.resource](./resource.md) - Resursinstansen i den aktuella kontexten
- `{{ctx.xxx}}` i SQL / Mallar - Använder samma upplösningsregler som `ctx.getVar('ctx.xxx')`