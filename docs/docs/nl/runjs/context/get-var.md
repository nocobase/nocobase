:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/get-var) voor nauwkeurige informatie.
:::

# ctx.getVar()

Leest **asynchroon** variabele waarden uit de huidige runtime-context. De resolutie van variabelen komt overeen met `{{ctx.xxx}}` in SQL en sjablonen, meestal afkomstig van de huidige gebruiker, het huidige record, weergaveparameters, popup-context, enz.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock / JSField** | Informatie ophalen over het huidige record, de gebruiker, bron, enz. voor weergave of logica. |
| **Koppelingsregels / Workflow** | `ctx.record`, `ctx.formValues`, enz. lezen voor voorwaardelijke logica. |
| **Formules / Sjablonen** | Gebruikt dezelfde regels voor variabele-resolutie als `{{ctx.xxx}}`. |

## Type-definitie

```ts
getVar(path: string): Promise<any>;
```

| Parameter | Type | Beschrijving |
|------|------|------|
| `path` | `string` | Variabelepad; **moet beginnen met `ctx.`**. Ondersteunt puntnotatie en array-indices. |

**Retourwaarde**: `Promise<any>`. Gebruik `await` om de opgeloste waarde te verkrijgen; retourneert `undefined` als de variabele niet bestaat.

> Als een pad wordt doorgegeven dat niet begint met `ctx.`, wordt er een fout gegenereerd: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Veelvoorkomende variabelepaden

| Pad | Beschrijving |
|------|------|
| `ctx.record` | Huidig record (beschikbaar wanneer een formulier-/detailblok aan een record is gekoppeld) |
| `ctx.record.id` | Primaire sleutel van het huidige record |
| `ctx.formValues` | Huidige formulierwaarden (veelgebruikt in koppelingsregels en workflows; geef in formulierscenario's de voorkeur aan `ctx.form.getFieldsValue()` voor real-time uitlezen) |
| `ctx.user` | Huidige ingelogde gebruiker |
| `ctx.user.id` | ID van de huidige gebruiker |
| `ctx.user.nickname` | Bijnaam van de huidige gebruiker |
| `ctx.user.roles.name` | Rolnamen van de huidige gebruiker (array) |
| `ctx.popup.record` | Record binnen een popup |
| `ctx.popup.record.id` | Primaire sleutel van het record binnen een popup |
| `ctx.urlSearchParams` | URL-queryparameters (geparseerd uit `?key=value`) |
| `ctx.token` | Huidige API-token |
| `ctx.role` | Huidige rol |

## ctx.getVarInfos()

Haalt de **structurele informatie** op (type, titel, sub-eigenschappen, enz.) van oplosbare variabelen in de huidige context, wat het verkennen van beschikbare paden vergemakkelijkt. De retourwaarde is een statische beschrijving gebaseerd op `meta` en bevat geen werkelijke runtime-waarden.

### Type-definitie

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

In de retourwaarde is elke sleutel een variabelepad en de waarde is de structurele informatie voor dat pad (inclusief `type`, `title`, `properties`, enz.).

### Parameters

| Parameter | Type | Beschrijving |
|------|------|------|
| `path` | `string \| string[]` | Pad voor inkorting; verzamelt alleen de variabelestructuur onder dit pad. Ondersteunt `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; een array staat voor het samenvoegen van meerdere paden. |
| `maxDepth` | `number` | Maximale diepte van uitbreiding, standaard `3`. Wanneer `path` niet wordt opgegeven, hebben eigenschappen op het hoogste niveau `depth=1`. Wanneer `path` wel wordt opgegeven, heeft de knoop die overeenkomt met het pad `depth=1`. |

### Voorbeeld

```ts
// Haal de variabelestructuur op onder record (uitgebreid tot 3 niveaus)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Haal de structuur van popup.record op
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Haal de volledige variabelestructuur van het hoogste niveau op (standaard maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Verschil met ctx.getValue

| Methode | Scenario | Beschrijving |
|------|----------|------|
| `ctx.getValue()` | Bewerkbare velden zoals JSField of JSItem | Haalt synchroon de waarde van het **huidige veld** op; vereist formulierbinding. |
| `ctx.getVar(path)` | Elke RunJS-context | Haalt asynchroon **elke willekeurige ctx-variabele** op; pad moet beginnen met `ctx.`. |

Gebruik in een JSField `getValue`/`setValue` om het huidige veld te lezen of te schrijven; gebruik `getVar` om toegang te krijgen tot andere contextvariabelen (zoals `record`, `user`, `formValues`).

## Aandachtspunten

- **Pad moet beginnen met `ctx.`**: bijv. `ctx.record.id`, anders wordt er een fout gegenereerd.
- **Asynchrone methode**: U moet `await` gebruiken om het resultaat te verkrijgen, bijv. `const id = await ctx.getVar('ctx.record.id')`.
- **Variabele bestaat niet**: Retourneert `undefined`. U kunt `??` na het resultaat gebruiken om een standaardwaarde in te stellen: `(await ctx.getVar('ctx.user.nickname')) ?? 'Gast'`.
- **Formulierwaarden**: `ctx.formValues` moet worden opgehaald via `await ctx.getVar('ctx.formValues')`; het wordt niet direct blootgesteld als `ctx.formValues`. Geef in een formuliercontext de voorkeur aan `ctx.form.getFieldsValue()` om de nieuwste waarden in real-time te lezen.

## Voorbeelden

### Huidig record-ID ophalen

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Huidig record: ${recordId}`);
}
```

### Record binnen een popup ophalen

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Huidig record in popup: ${recordId}`);
}
```

### Sub-items van een array-veld lezen

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Retourneert een array van rolnamen, bijv. ['admin', 'member']
```

### Standaardwaarde instellen

```ts
// getVar heeft geen defaultValue parameter; gebruik ?? na het resultaat
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Gast';
```

### Formulierveldwaarden lezen

```ts
// Zowel ctx.formValues als ctx.form zijn voor formulierscenario's; gebruik getVar om geneste velden te lezen
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### URL-queryparameters lezen

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Komt overeen met ?id=xxx
```

### Beschikbare variabelen verkennen

```ts
// Haal de variabelestructuur op onder record (uitgebreid tot 3 niveaus)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars ziet eruit als { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Gerelateerd

- [ctx.getValue()](./get-value.md) - Haalt synchroon de huidige veldwaarde op (alleen JSField/JSItem)
- [ctx.form](./form.md) - Formulierinstantie; `ctx.form.getFieldsValue()` kan formulierwaarden in real-time lezen
- [ctx.model](./model.md) - Het model waarin de huidige uitvoeringscontext zich bevindt
- [ctx.blockModel](./block-model.md) - Het bovenliggende blok waarin de huidige JS zich bevindt
- [ctx.resource](./resource.md) - De resource-instantie in de huidige context
- `{{ctx.xxx}}` in SQL / Sjablonen - Gebruikt dezelfde resolutieregels als `ctx.getVar('ctx.xxx')`