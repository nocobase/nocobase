:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/filter-manager).
:::

# ctx.filterManager

Menedżer połączeń filtrów (Filter Connection Manager) służy do zarządzania powiązaniami filtrów między formularzami filtrowania (FilterForm) a blokami danych (tabele, listy, wykresy itp.). Jest on dostarczany przez `BlockGridModel` i jest dostępny wyłącznie w jego kontekście (np. bloki formularzy filtrów, bloki danych).

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **Blok formularza filtra** | Zarządza konfiguracjami połączeń między elementami filtra a blokami docelowymi; odświeża dane docelowe po zmianie filtrów. |
| **Blok danych (Tabela/Lista)** | Działa jako cel filtrowania, wiążąc warunki filtra poprzez `bindToTarget`. |
| **Reguły powiązań / Niestandardowy FilterModel** | Wywołuje `refreshTargetsByFilter` wewnątrz `doFilter` lub `doReset`, aby wyzwolić odświeżenie celu. |
| **Konfiguracja pól połączenia** | Używa `getConnectFieldsConfig` i `saveConnectFieldsConfig` do utrzymywania mapowania pól między filtrami a celami. |

> Uwaga: `ctx.filterManager` jest dostępny tylko w kontekstach RunJS posiadających `BlockGridModel` (np. wewnątrz strony zawierającej formularz filtra); w zwykłych blokach JSBlock lub na niezależnych stronach ma wartość `undefined`. Przed uzyskaniem dostępu zaleca się stosowanie opcjonalnego łańcuchowania (optional chaining).

## Definicje typów

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID modelu filtra
  targetId: string;   // UID modelu docelowego bloku danych
  filterPaths?: string[];  // Ścieżki pól bloku docelowego
  operator?: string;  // Operator filtra
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Często używane metody

| Metoda | Opis |
|------|------|
| `getFilterConfigs()` | Pobiera wszystkie aktualne konfiguracje połączeń filtrów. |
| `getConnectFieldsConfig(filterId)` | Pobiera konfigurację pól połączenia dla określonego filtra. |
| `saveConnectFieldsConfig(filterId, config)` | Zapisuje konfigurację pól połączenia dla filtra. |
| `addFilterConfig(config)` | Dodaje konfigurację filtra (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Usuwa konfiguracje filtrów według filterId, targetId lub obu. |
| `bindToTarget(targetId)` | Wiąże konfigurację filtra z blokiem docelowym, wyzwalając jego zasób (resource) do nałożenia filtra. |
| `unbindFromTarget(targetId)` | Odwiązuje filtr od bloku docelowego. |
| `refreshTargetsByFilter(filterId | filterId[])` | Odświeża dane powiązanych bloków docelowych na podstawie filtra (filtrów). |

## Kluczowe pojęcia

- **FilterModel**: Model dostarczający warunki filtra (np. FilterFormItemModel), który musi implementować `getFilterValue()`, aby zwracać bieżącą wartość filtra.
- **TargetModel**: Blok danych podlegający filtrowaniu; jego `resource` musi obsługiwać `addFilterGroup`, `removeFilterGroup` oraz `refresh`.

## Przykłady

### Dodawanie konfiguracji filtra

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Odświeżanie bloków docelowych

```ts
// W doFilter / doReset formularza filtra
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Odświeżanie celów powiązanych z wieloma filtrami
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Konfiguracja pól połączenia

```ts
// Pobieranie konfiguracji połączenia
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Zapisywanie konfiguracji połączenia
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Usuwanie konfiguracji

```ts
// Usuwanie wszystkich konfiguracji dla określonego filtra
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Usuwanie wszystkich konfiguracji filtrów dla określonego celu
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Powiązane

- [ctx.resource](./resource.md): Zasób (resource) bloku docelowego musi obsługiwać interfejs filtrowania.
- [ctx.model](./model.md): Służy do pobierania UID aktualnego modelu dla filterId / targetId.