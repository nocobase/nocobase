:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/filter-manager) voor nauwkeurige informatie.
:::

# ctx.filterManager

De Filter Connection Manager wordt gebruikt voor het beheren van de filterverbindingen tussen filterformulieren (FilterForm) en gegevensblokken (tabellen, lijsten, grafieken, enz.). Deze wordt geleverd door `BlockGridModel` en is alleen beschikbaar binnen de context daarvan (bijv. filterformulierblokken, gegevensblokken).

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **Filterformulierblok** | Beheert verbindingsconfiguraties tussen filteritems en doelblokken; ververst doelgegevens wanneer filters wijzigen. |
| **Gegevensblok (Tabel/Lijst)** | Fungeert als filterdoel en koppelt filtervoorwaarden via `bindToTarget`. |
| **Koppelingsregels / Aangepast FilterModel** | Roept `refreshTargetsByFilter` aan binnen `doFilter` of `doReset` om het verversen van doelen te activeren. |
| **Configuratie van verbindingsvelden** | Gebruikt `getConnectFieldsConfig` en `saveConnectFieldsConfig` om veldkoppelingen tussen filters en doelen te onderhouden. |

> Let op: `ctx.filterManager` is alleen beschikbaar in RunJS-contexten die een `BlockGridModel` hebben (bijv. binnen een pagina die een filterformulier bevat); het is `undefined` in reguliere JSBlocks of onafhankelijke pagina's. Het wordt aanbevolen om "optional chaining" te gebruiken voor toegang.

## Type-definities

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID van het filtermodel
  targetId: string;   // UID van het doelgegevensblokmodel
  filterPaths?: string[];  // Veldpaden van het doelblok
  operator?: string;  // Filteroperator
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Veelgebruikte methoden

| Methode | Beschrijving |
|------|------|
| `getFilterConfigs()` | Haalt alle huidige filterverbindingsconfiguraties op. |
| `getConnectFieldsConfig(filterId)` | Haalt de configuratie van de verbindingsvelden op voor een specifiek filter. |
| `saveConnectFieldsConfig(filterId, config)` | Slaat de configuratie van de verbindingsvelden op voor een filter. |
| `addFilterConfig(config)` | Voegt een filterconfiguratie toe (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Verwijdert filterconfiguraties op basis van filterId, targetId, of beide. |
| `bindToTarget(targetId)` | Bindt de filterconfiguratie aan een doelblok, waardoor de resource wordt geactiveerd om het filter toe te passen. |
| `unbindFromTarget(targetId)` | Ontkoppelt het filter van het doelblok. |
| `refreshTargetsByFilter(filterId | filterId[])` | Ververst de gegevens van de bijbehorende doelblokken op basis van de filter(s). |

## Kernconcepten

- **FilterModel**: Een model dat filtervoorwaarden levert (bijv. FilterFormItemModel), dat `getFilterValue()` moet implementeren om de huidige filterwaarde te retourneren.
- **TargetModel**: Het gegevensblok dat wordt gefilterd; de `resource` hiervan moet `addFilterGroup`, `removeFilterGroup` en `refresh` ondersteunen.

## Voorbeelden

### Filterconfiguratie toevoegen

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Doelblokken verversen

```ts
// In doFilter / doReset van een filterformulier
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Ververs doelen die aan meerdere filters zijn gekoppeld
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Configuratie van verbindingsvelden

```ts
// Verbindingsconfiguratie ophalen
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Verbindingsconfiguratie opslaan
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Configuratie verwijderen

```ts
// Verwijder alle configuraties voor een specifiek filter
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Verwijder alle filterconfiguraties voor een specifiek doel
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Gerelateerd

- [ctx.resource](./resource.md): De resource van het doelblok moet de filterinterface ondersteunen.
- [ctx.model](./model.md): Wordt gebruikt om de UID van het huidige model op te halen voor filterId / targetId.