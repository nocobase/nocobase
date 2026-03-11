:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/filter-manager).
:::

# ctx.filterManager

Správce propojení filtrů slouží ke správě asociací filtrů mezi filtračními formuláři (FilterForm) a datovými bloky (tabulky, seznamy, grafy atd.). Je poskytován modelem `BlockGridModel` a je dostupný pouze v jeho kontextu (např. v blocích filtračních formulářů nebo datových blocích).

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Blok filtračního formuláře** | Spravuje konfigurace propojení mezi položkami filtru a cílovými bloky; při změně filtru obnovuje cílová data. |
| **Datový blok (tabulka/seznam)** | Funguje jako cíl filtrování, přičemž filtrační podmínky se vážou pomocí `bindToTarget`. |
| **Pravidla propojení / Vlastní FilterModel** | Volá `refreshTargetsByFilter` v rámci metod `doFilter` nebo `doReset` pro spuštění obnovy cílových dat. |
| **Konfigurace polí propojení** | Používá `getConnectFieldsConfig` a `saveConnectFieldsConfig` pro správu mapování polí mezi filtry a cíli. |

> **Poznámka:** `ctx.filterManager` je dostupný pouze v kontextech RunJS, které obsahují `BlockGridModel` (např. v rámci stránky s filtračním formulářem). V běžných blocích JSBlock nebo na samostatných stránkách je `undefined`. Před přístupem doporučujeme použít volitelné řetězení (optional chaining).

## Definice typů

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID modelu filtru
  targetId: string;   // UID modelu cílového datového bloku
  filterPaths?: string[];  // Cesty k polím cílového bloku
  operator?: string;  // Operátor filtru
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Běžné metody

| Metoda | Popis |
|------|------|
| `getFilterConfigs()` | Získá všechny aktuální konfigurace propojení filtrů. |
| `getConnectFieldsConfig(filterId)` | Získá konfiguraci polí propojení pro konkrétní filtr. |
| `saveConnectFieldsConfig(filterId, config)` | Uloží konfiguraci polí propojení pro daný filtr. |
| `addFilterConfig(config)` | Přidá konfiguraci filtru (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Odstraní konfigurace filtru podle filterId, targetId nebo obojího. |
| `bindToTarget(targetId)` | Naváže konfiguraci filtru na cílový blok a spustí aplikaci filtru na jeho resource. |
| `unbindFromTarget(targetId)` | Zruší vazbu filtru od cílového bloku. |
| `refreshTargetsByFilter(filterId | filterId[])` | Obnoví data asociovaných cílových bloků na základě zadaného filtru (nebo filtrů). |

## Jádrové koncepty

- **FilterModel**: Model poskytující podmínky filtru (např. FilterFormItemModel), který musí implementovat metodu `getFilterValue()` pro vrácení aktuální hodnoty filtru.
- **TargetModel**: Cílový datový blok, který je filtrován; jeho `resource` musí podporovat metody `addFilterGroup`, `removeFilterGroup` a `refresh`.

## Příklady

### Přidání konfigurace filtru

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Obnovení cílových bloků

```ts
// V metodách doFilter / doReset filtračního formuláře
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Obnovení cílů asociovaných s více filtry
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Konfigurace polí propojení

```ts
// Získání konfigurace propojení
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Uložení konfigurace propojení
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Odstranění konfigurace

```ts
// Odstranění všech konfigurací pro konkrétní filtr
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Odstranění všech filtračních konfigurací pro konkrétní cíl
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Související

- [ctx.resource](./resource.md): Resource cílového bloku musí podporovat rozhraní pro filtrování.
- [ctx.model](./model.md): Slouží k získání UID aktuálního modelu pro filterId / targetId.