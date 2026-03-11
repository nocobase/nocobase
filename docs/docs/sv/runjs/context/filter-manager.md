:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/filter-manager).
:::

# ctx.filterManager

Hanteraren för filterkopplingar används för att hantera kopplingar mellan filterformulär (FilterForm) och datablock (tabeller, listor, diagram, etc.). Den tillhandahålls av `BlockGridModel` och är endast tillgänglig inom dess kontext (t.ex. filterformulärblock, datablock).

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **Filterformulärblock** | Hanterar konfigurationsinställningar för kopplingar mellan filterobjekt och målblock; uppdaterar måldata när filter ändras. |
| **Datablock (tabell/lista)** | Fungerar som ett filtermål och binder filtervillkor via `bindToTarget`. |
| **Länkningsregler / Anpassad FilterModel** | Anropar `refreshTargetsByFilter` i `doFilter` eller `doReset` för att utlösa uppdatering av målet. |
| **Konfiguration av kopplingsfält** | Använder `getConnectFieldsConfig` och `saveConnectFieldsConfig` för att underhålla fältmappningar mellan filter och mål. |

> Observera: `ctx.filterManager` är endast tillgänglig i RunJS-kontexter som har en `BlockGridModel` (t.ex. på en sida som innehåller ett filterformulär); den är `undefined` i vanliga JSBlocks eller fristående sidor. Vi rekommenderar att ni använder "optional chaining" innan åtkomst.

## Typdefinitioner

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID för filtermodell
  targetId: string;   // UID för måldatablockets modell
  filterPaths?: string[];  // Fältsökvägar för målblocket
  operator?: string;  // Filteroperator
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Vanliga metoder

| Metod | Beskrivning |
|------|------|
| `getFilterConfigs()` | Hämtar alla aktuella konfigurationer för filterkopplingar. |
| `getConnectFieldsConfig(filterId)` | Hämtar konfigurationen för kopplingsfält för ett specifikt filter. |
| `saveConnectFieldsConfig(filterId, config)` | Sparar konfigurationen för kopplingsfält för ett filter. |
| `addFilterConfig(config)` | Lägger till en filterkonfiguration (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Tar bort filterkonfigurationer baserat på filterId, targetId eller båda. |
| `bindToTarget(targetId)` | Binder filterkonfigurationen till ett målblock, vilket gör att dess resurs (resource) tillämpar filtret. |
| `unbindFromTarget(targetId)` | Kopplar bort filtret från målblocket. |
| `refreshTargetsByFilter(filterId | filterId[])` | Uppdaterar associerad data i målblocket baserat på filtret/filtren. |

## Kärnbegrepp

- **FilterModel**: En modell som tillhandahåller filtervillkor (t.ex. FilterFormItemModel), vilken måste implementera `getFilterValue()` för att returnera det aktuella filtervärdet.
- **TargetModel**: Datablocket som filtreras; dess `resource` måste stödja `addFilterGroup`, `removeFilterGroup` och `refresh`.

## Exempel

### Lägg till filterkonfiguration

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Uppdatera målblock

```ts
// I doFilter / doReset för ett filterformulär
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Uppdatera mål associerade med flera filter
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Konfiguration av kopplingsfält

```ts
// Hämtar kopplingskonfiguration
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Sparar kopplingskonfiguration
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Ta bort konfiguration

```ts
// Ta bort alla konfigurationer för ett specifikt filter
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Ta bort alla filterkonfigurationer för ett specifikt mål
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Relaterat

- [ctx.resource](./resource.md): Målblockets resurs (resource) måste stödja filtergränssnittet.
- [ctx.model](./model.md): Används för att hämta den aktuella modellens UID för filterId / targetId.