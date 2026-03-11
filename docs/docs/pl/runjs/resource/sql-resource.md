:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/resource/sql-resource).
:::

# SQLResource

Zasób (Resource) wykonujący zapytania na podstawie **zapisanej konfiguracji SQL** lub **dynamicznego SQL**. Źródłem danych są interfejsy takie jak `flowSql:run` / `flowSql:runById`. Jest on odpowiedni dla raportów, statystyk, niestandardowych list SQL i innych podobnych scenariuszy. W przeciwieństwie do [MultiRecordResource](./multi-record-resource.md), SQLResource nie zależy od kolekcji; wykonuje zapytania SQL bezpośrednio i obsługuje stronicowanie, wiązanie parametrów, zmienne szablonów (`{{ctx.xxx}}`) oraz kontrolę typu wyniku.

**Relacja dziedziczenia**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Sposób tworzenia**: `ctx.makeResource('SQLResource')` lub `ctx.initResource('SQLResource')`. Aby wykonać zapytanie na podstawie zapisanej konfiguracji, należy użyć `setFilterByTk(uid)` (UID szablonu SQL). Podczas debugowania można użyć `setDebug(true)` + `setSQL(sql)`, aby wykonać SQL bezpośrednio. W RunJS `ctx.api` jest wstrzykiwane przez środowisko uruchomieniowe.

---

## Scenariusze zastosowania

| Scenariusz | Opis |
|------|------|
| **Raporty / Statystyki** | Złożone agregacje, zapytania między tabelami i niestandardowe wskaźniki statystyczne. |
| **Niestandardowe listy JSBlock** | Implementacja specjalnego filtrowania, sortowania lub powiązań za pomocą SQL z niestandardowym renderowaniem. |
| **Bloki wykresów** | Zasilanie źródeł danych wykresów zapisanymi szablonami SQL, z obsługą stronicowania. |
| **Wybór między SQLResource a ctx.sql** | Należy używać SQLResource, gdy wymagane jest stronicowanie, zdarzenia lub reaktywne dane; do prostych, jednorazowych zapytań można użyć `ctx.sql.run()` / `ctx.sql.runById()`. |

---

## Format danych

- `getData()` zwraca różne formaty w zależności od `setSQLType()`:
  - `selectRows` (domyślnie): **Tablica**, wyniki wielowierszowe.
  - `selectRow`: **Pojedynczy obiekt**.
  - `selectVar`: **Wartość skalarna** (np. COUNT, SUM).
- `getMeta()` zwraca metadane, takie jak informacje o stronicowaniu: `page`, `pageSize`, `count`, `totalPage` itp.

---

## Konfiguracja SQL i tryby wykonywania

| Metoda | Opis |
|------|------|
| `setFilterByTk(uid)` | Ustawia UID szablonu SQL do wykonania (odpowiada `runById`; szablon musi zostać wcześniej zapisany w panelu administracyjnym). |
| `setSQL(sql)` | Ustawia surowy kod SQL (używany dla `runBySQL` tylko wtedy, gdy włączony jest tryb debugowania `setDebug(true)`). |
| `setSQLType(type)` | Typ wyniku: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Gdy ustawione na `true`, `refresh` wywołuje `runBySQL()`; w przeciwnym razie wywołuje `runById()`. |
| `run()` | Wywołuje `runBySQL()` lub `runById()` w zależności od stanu debugowania. |
| `runBySQL()` | Wykonuje zapytanie przy użyciu SQL zdefiniowanego w `setSQL` (wymaga `setDebug(true)`). |
| `runById()` | Wykonuje zapisany szablon SQL przy użyciu bieżącego UID. |

---

## Parametry i kontekst

| Metoda | Opis |
|------|------|
| `setBind(bind)` | Wiąże zmienne. Należy użyć obiektu dla symboli zastępczych `:name` lub tablicy dla symboli `?`. |
| `setLiquidContext(ctx)` | Kontekst szablonu (Liquid), używany do parsowania `{{ctx.xxx}}`. |
| `setFilter(filter)` | Dodatkowe warunki filtrowania (przekazywane w danych żądania). |
| `setDataSourceKey(key)` | Identyfikator źródła danych (używany w środowiskach z wieloma źródłami danych). |

---

## Stronicowanie

| Metoda | Opis |
|------|------|
| `setPage(page)` / `getPage()` | Bieżąca strona (domyślnie 1). |
| `setPageSize(size)` / `getPageSize()` | Liczba elementów na stronę (domyślnie 20). |
| `next()` / `previous()` / `goto(page)` | Przechodzi między stronami i wyzwala `refresh`. |

W SQL można użyć `{{ctx.limit}}` i `{{ctx.offset}}` do odwołania się do parametrów stronicowania. SQLResource automatycznie wstrzykuje `limit` i `offset` do kontekstu.

---

## Pobieranie danych i zdarzenia

| Metoda | Opis |
|------|------|
| `refresh()` | Wykonuje SQL (`runById` lub `runBySQL`), zapisuje wynik w `setData(data)`, aktualizuje metadane i wyzwala zdarzenie `'refresh'`. |
| `runAction(actionName, options)` | Wywołuje podstawowe akcje (np. `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Wyzwalane po zakończeniu odświeżania lub po rozpoczęciu ładowania. |

---

## Przykłady

### Wykonywanie za pomocą zapisanego szablonu (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID zapisanego szablonu SQL
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count itp.
```

### Tryb debugowania: Bezpośrednie wykonywanie SQL (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Stronicowanie i nawigacja

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Nawigacja
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Typy wyników

```js
// Wiele wierszy (domyślnie)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Pojedynczy wiersz
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Pojedyncza wartość (np. COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Używanie zmiennych szablonu

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Nasłuchiwanie zdarzenia refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Uwagi

- **runById wymaga wcześniejszego zapisania szablonu**: UID użyty w `setFilterByTk(uid)` musi być identyfikatorem szablonu SQL zapisanym wcześniej w panelu administracyjnym. Można go zapisać za pomocą `ctx.sql.save({ uid, sql })`.
- **Tryb debugowania wymaga uprawnień**: `setDebug(true)` korzysta z `flowSql:run`, co wymaga, aby bieżąca rola posiadała uprawnienia do konfiguracji SQL. `runById` wymaga jedynie zalogowania użytkownika.
- **Debouncing odświeżania**: Wielokrotne wywołania `refresh()` w tej samej pętli zdarzeń wykonają tylko ostatnie z nich, aby uniknąć nadmiarowych żądań.
- **Wiązanie parametrów w celu zapobiegania wstrzykiwaniu**: Należy używać `setBind()` z symbolami zastępczymi `:name` lub `?` zamiast łączenia ciągów znaków, aby zapobiec wstrzykiwaniu SQL (SQL Injection).

---

## Powiązane

- [ctx.sql](../context/sql.md) – Wykonywanie i zarządzanie SQL; `ctx.sql.runById` jest odpowiednie dla prostych, jednorazowych zapytań.
- [ctx.resource](../context/resource.md) – Instancja zasobu w bieżącym kontekście.
- [ctx.initResource()](../context/init-resource.md) – Inicjalizuje i wiąże z `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) – Tworzy nową instancję zasobu bez wiązania.
- [APIResource](./api-resource.md) – Ogólny zasób API.
- [MultiRecordResource](./multi-record-resource.md) – Zaprojektowany dla kolekcji i list.