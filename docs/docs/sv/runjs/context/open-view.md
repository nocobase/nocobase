:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/open-view).
:::

# ctx.openView()

Öppna en angiven vy (låda, dialogruta, inbäddad sida etc.) programmatiskt. Den tillhandahålls av `FlowModelContext` och används för att öppna konfigurerade `ChildPage`- eller `PopupAction`-vyer i scenarier som `JSBlock`, tabellceller och arbetsflöden.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock** | Öppna en detalj- eller redigeringsdialogruta efter ett knapptryck, och skicka med den aktuella radens `filterByTk`. |
| **Tabellcell** | Rendera en knapp i en cell som öppnar en dialogruta för raddetaljer vid klick. |
| **Arbetsflöde / JSAction** | Öppna nästa vy eller en dialogruta efter en lyckad åtgärd. |
| **Associationsfält** | Öppna en dialogruta för val eller redigering via `ctx.runAction('openView', params)`. |

> **Observera:** `ctx.openView` är tillgänglig i en RunJS-miljö där en `FlowModel`-kontext existerar. Om modellen som motsvarar `uid` inte existerar, kommer en `PopupActionModel` att skapas och sparas automatiskt.

## Signatur

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Parametrar

### uid

Vymodellens unika identifierare. Om den inte existerar kommer den att skapas och sparas automatiskt. Det rekommenderas att ni använder ett stabilt UID, såsom `${ctx.model.uid}-detail`, så att konfigurationen kan återanvändas när samma dialogruta öppnas flera gånger.

### Vanliga fält i options

| Fält | Typ | Beskrivning |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Öppningsmetod: låda (drawer), dialogruta (dialog) eller inbäddad (embed). Standardvärde är `drawer`. |
| `size` | `small` / `medium` / `large` | Storlek på dialogrutan eller lådan. Standardvärde är `medium`. |
| `title` | `string` | Vyns titel. |
| `params` | `Record<string, any>` | Valfria parametrar som skickas till vyn. |
| `filterByTk` | `any` | Primärnyckelvärde, används för detalj- eller redigeringsvyer för en enskild post. |
| `sourceId` | `string` | Källpostens ID, används i associationsscenarier. |
| `dataSourceKey` | `string` | Datakälla. |
| `collectionName` | `string` | Samlingens namn. |
| `associationName` | `string` | Namn på associationsfältet. |
| `navigation` | `boolean` | Om ruttnavigering ska användas. Om `defineProperties` eller `defineMethods` anges, tvingas detta till `false`. |
| `preventClose` | `boolean` | Om stängning ska förhindras. |
| `defineProperties` | `Record<string, PropertyOptions>` | Injicera egenskaper dynamiskt i modellen inuti vyn. |
| `defineMethods` | `Record<string, Function>` | Injicera metoder dynamiskt i modellen inuti vyn. |

## Exempel

### Grundläggande användning: Öppna en låda

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Detaljer'),
});
```

### Skicka med aktuell radkontext

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Raddetaljer'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Öppna via runAction

När en modell är konfigurerad med en `openView`-åtgärd (som associationsfält eller klickbara fält), kan ni anropa:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Injicera anpassad kontext

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Relation till ctx.viewer och ctx.view

| Syfte | Rekommenderad användning |
|------|----------|
| **Öppna en konfigurerad flödesvy** | `ctx.openView(uid, options)` |
| **Öppna anpassat innehåll (utan flöde)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Hantera den aktuella öppna vyn** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` öppnar en `FlowPage` (`ChildPageModel`), som renderar en komplett flödessida internt; `ctx.viewer` öppnar valfritt React-innehåll.

## Observera

- Det rekommenderas att ni associerar `uid` med `ctx.model.uid` (t.ex. `${ctx.model.uid}-xxx`) för att undvika konflikter mellan olika block.
- När `defineProperties` eller `defineMethods` skickas med, tvingas `navigation` till `false` för att förhindra att kontexten går förlorad vid en uppdatering.
- Inuti dialogrutan refererar `ctx.view` till den aktuella vyinstansen, och `ctx.view.inputArgs` kan användas för att läsa de parametrar som skickades vid öppnandet.

## Relaterat

- [ctx.view](./view.md): Den aktuella öppna vyinstansen.
- [ctx.model](./model.md): Den aktuella modellen, används för att skapa ett stabilt `popupUid`.