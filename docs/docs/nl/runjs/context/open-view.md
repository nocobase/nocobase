:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/open-view) voor nauwkeurige informatie.
:::

# ctx.openView()

Programmatisch een opgegeven weergave openen (lade, dialoogvenster, ingesloten pagina, enz.). Geleverd door `FlowModelContext`, wordt het gebruikt om geconfigureerde `ChildPage` of `PopupAction` weergaven te openen in scenario's zoals `JSBlock`, tabelcellen en workflows.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock** | Open een detail-/bewerkingsvenster na een klik op een knop, waarbij de `filterByTk` van de huidige rij wordt doorgegeven. |
| **Tabelcel** | Render een knop in een cel die bij het klikken een dialoogvenster met rijdetails opent. |
| **Workflow / JSAction** | Open de volgende weergave of een dialoogvenster na een succesvolle bewerking. |
| **Associatieveld** | Open een selectie-/bewerkingsvenster via `ctx.runAction('openView', params)`. |

> Let op: `ctx.openView` is beschikbaar in een RunJS-omgeving waar een `FlowModel`-context bestaat. Als het model dat overeenkomt met de `uid` niet bestaat, wordt er automatisch een `PopupActionModel` aangemaakt en opgeslagen.

## Handtekening

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Parameters

### uid

De unieke identificatie van het weergavemodel. Als deze niet bestaat, wordt deze automatisch aangemaakt en opgeslagen. Het wordt aanbevolen om een stabiele UID te gebruiken, zoals `${ctx.model.uid}-detail`, zodat de configuratie kan worden hergebruikt wanneer hetzelfde dialoogvenster meerdere keren wordt geopend.

### Veelgebruikte opties (options)

| Veld | Type | Beschrijving |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Openingsmethode: lade (drawer), dialoogvenster (dialog) of ingesloten (embed). Standaard `drawer`. |
| `size` | `small` / `medium` / `large` | Grootte van het dialoogvenster of de lade. Standaard `medium`. |
| `title` | `string` | Titel van de weergave. |
| `params` | `Record<string, any>` | Willekeurige parameters die aan de weergave worden doorgegeven. |
| `filterByTk` | `any` | Waarde van de primaire sleutel, gebruikt voor scenario's met details of bewerken van een enkele record. |
| `sourceId` | `string` | ID van de bronrecord, gebruikt in associatiescenario's. |
| `dataSourceKey` | `string` | Gegevensbron. |
| `collectionName` | `string` | Naam van de collectie. |
| `associationName` | `string` | Naam van het associatieveld. |
| `navigation` | `boolean` | Of er routenavigatie moet worden gebruikt. Als `defineProperties` of `defineMethods` worden opgegeven, wordt dit geforceerd op `false`. |
| `preventClose` | `boolean` | Of sluiten moet worden voorkomen. |
| `defineProperties` | `Record<string, PropertyOptions>` | Dynamisch eigenschappen injecteren in het model binnen de weergave. |
| `defineMethods` | `Record<string, Function>` | Dynamisch methoden injecteren in het model binnen de weergave. |

## Voorbeelden

### Basisgebruik: Een lade openen

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Details'),
});
```

### Context van de huidige rij doorgeven

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Rijdetails'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Openen via runAction

Wanneer een model is geconfigureerd met een `openView`-actie (zoals associatievelden of klikbare velden), kunt u deze aanroepen:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Aangepaste context injecteren

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

## Relatie met ctx.viewer en ctx.view

| Doel | Aanbevolen gebruik |
|------|----------|
| **Een geconfigureerde workflow-weergave openen** | `ctx.openView(uid, options)` |
| **Aangepaste inhoud openen (geen workflow)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **De huidige geopende weergave bedienen** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` opent een `FlowPage` (`ChildPageModel`), die intern een volledige workflow-pagina rendert; `ctx.viewer` opent willekeurige React-inhoud.

## Aandachtspunten

- Het wordt aanbevolen om de `uid` te koppelen aan `ctx.model.uid` (bijv. `${ctx.model.uid}-xxx`) om conflicten tussen meerdere blokken te voorkomen.
- Wanneer `defineProperties` of `defineMethods` worden doorgegeven, wordt `navigation` geforceerd op `false` om verlies van context na een verversing te voorkomen.
- Binnen het dialoogvenster verwijst `ctx.view` naar de huidige weergave-instantie, en `ctx.view.inputArgs` kan worden gebruikt om de parameters te lezen die tijdens het openen zijn doorgegeven.

## Gerelateerd

- [ctx.view](./view.md): De huidige geopende weergave-instantie.
- [ctx.model](./model.md): Het huidige model, gebruikt om een stabiele `popupUid` te construeren.