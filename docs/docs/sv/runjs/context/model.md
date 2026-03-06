:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/model).
:::

# ctx.model

`FlowModel`-instansen där den aktuella RunJS-exekveringskontexten befinner sig. Den fungerar som standardingång för scenarier som JSBlock, JSField och JSAction. Den specifika typen varierar beroende på kontexten: det kan vara en underklass som `BlockModel`, `ActionModel` eller `JSEditableFieldModel`.

## Tillämpningsscenarier

| Scenario | Beskrivning |
|------|------|
| **JSBlock** | `ctx.model` är den aktuella blockmodellen. Ni kan komma åt `resource`, `samling`, `setProps`, etc. |
| **JSField / JSItem / JSColumn** | `ctx.model` är fältmodellen. Ni kan komma åt `setProps`, `dispatchEvent`, etc. |
| **Åtgärdshändelser / ActionModel** | `ctx.model` är åtgärdsmodellen. Ni kan läsa/skriva stegparametrar, skicka händelser, etc. |

> Tips: Om ni behöver komma åt det **överordnade blocket som innehåller den aktuella JS-koden** (t.ex. ett formulär- eller tabellblock), använd `ctx.blockModel`. För att komma åt **andra modeller**, använd `ctx.getModel(uid)`.

## Typdefinition

```ts
model: FlowModel;
```

`FlowModel` är basklassen. Vid körning är det en instans av olika underklasser (såsom `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, etc.). Tillgängliga egenskaper och metoder beror på den specifika typen.

## Vanliga egenskaper

| Egenskap | Typ | Beskrivning |
|------|------|------|
| `uid` | `string` | Modellens unika identifierare. Kan användas för `ctx.getModel(uid)` eller UID-bindning för popup-fönster. |
| `collection` | `Collection` | Samlingen som är bunden till den aktuella modellen (finns när blocket/fältet är bundet till data). |
| `resource` | `Resource` | Associerad resursinstans, används för att uppdatera, hämta valda rader, etc. |
| `props` | `object` | UI/beteendekonfiguration för modellen. Kan uppdateras med `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Samling av undermodeller (t.ex. fält i ett formulär, kolumner i en tabell). |
| `parent` | `FlowModel` | Överordnad modell (om sådan finns). |

## Vanliga metoder

| Metod | Beskrivning |
|------|------|
| `setProps(partialProps: any): void` | Uppdaterar modellkonfigurationen och utlöser omrendering (t.ex. `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Skickar en händelse till modellen, vilket utlöser arbetsflöden som är konfigurerade på den modellen och som lyssnar på händelsenamnet. Valfri `payload` skickas till arbetsflödets hanterare; `options.debounce` aktiverar debounce (antistuds). |
| `getStepParams?.(flowKey, stepKey)` | Läser stegparametrar för konfigurationsflöden (används i inställningspaneler, anpassade åtgärder, etc.). |
| `setStepParams?.(flowKey, stepKey, params)` | Skriver stegparametrar för konfigurationsflöden. |

## Relation till ctx.blockModel och ctx.getModel

| Behov | Rekommenderad användning |
|------|----------|
| **Modell för den aktuella exekveringskontexten** | `ctx.model` |
| **Överordnat block för den aktuella JS-koden** | `ctx.blockModel`. Används ofta för att komma åt `resource`, `form` eller `samling`. |
| **Hämta valfri modell via UID** | `ctx.getModel(uid)` eller `ctx.getModel(uid, true)` (sökning över vy-stackar). |

I ett JSField är `ctx.model` fältmodellen, medan `ctx.blockModel` är det formulär- eller tabellblock som innehåller fältet.

## Exempel

### Uppdatera block-/åtgärdsstatus

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Skicka modellhändelser

```ts
// Skicka en händelse för att utlösa ett arbetsflöde konfigurerat på denna modell som lyssnar på detta händelsenamn
await ctx.model.dispatchEvent('remove');

// När en payload tillhandahålls skickas den till arbetsflödeshanterarens ctx.inputArgs
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Använda UID för popup-bindning eller åtkomst mellan modeller

```ts
const myUid = ctx.model.uid;
// I popup-konfigurationen kan ni skicka med openerUid: myUid för association
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Relaterat

- [ctx.blockModel](./block-model.md): Den överordnade blockmodellen där den aktuella JS-koden finns.
- [ctx.getModel()](./get-model.md): Hämta andra modeller via UID.