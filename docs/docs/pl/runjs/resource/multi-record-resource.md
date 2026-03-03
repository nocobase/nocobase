:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Zasób (Resource) zorientowany na tabele danych: żądania zwracają tablicę i obsługują stronicowanie, filtrowanie, sortowanie oraz operacje CRUD. Jest odpowiedni dla scenariuszy z „wieloma rekordami”, takich jak tabele i listy. W przeciwieństwie do [APIResource](./api-resource.md), MultiRecordResource określa nazwę zasobu za pomocą `setResourceName()`, automatycznie buduje adresy URL, takie jak `users:list` i `users:create`, oraz posiada wbudowane funkcje stronicowania, filtrowania i wyboru wierszy.

**Dziedziczenie**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Tworzenie**: `ctx.makeResource('MultiRecordResource')` lub `ctx.initResource('MultiRecordResource')`. Przed użyciem należy wywołać `setResourceName('nazwa_kolekcji')` (np. `'users'`). W RunJS `ctx.api` jest wstrzykiwany przez środowisko wykonawcze.

---

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **Bloki tabel** | Bloki tabel i list domyślnie używają MultiRecordResource, obsługując stronicowanie, filtrowanie i sortowanie. |
| **Listy JSBlock** | Ładowanie danych z kolekcji takich jak użytkownicy czy zamówienia wewnątrz JSBlock i ich niestandardowe renderowanie. |
| **Operacje masowe** | Użycie `getSelectedRows()` do pobrania wybranych wierszy i `destroySelectedRows()` do masowego usuwania. |
| **Zasoby powiązane** | Ładowanie powiązanych kolekcji przy użyciu formatów takich jak `users.tags`, co wymaga wywołania `setSourceId(parentRecordId)`. |

---

## Format danych

- `getData()` zwraca **tablicę rekordów**, czyli pole `data` z odpowiedzi API listy.
- `getMeta()` zwraca metadane stronicowania i inne informacje: `page`, `pageSize`, `count`, `totalPage` itp.

---

## Nazwa zasobu i źródło danych

| Metoda | Opis |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nazwa zasobu, np. `'users'`, `'users.tags'` (zasób powiązany). |
| `setSourceId(id)` / `getSourceId()` | ID rekordu nadrzędnego dla zasobów powiązanych (np. dla `users.tags` należy przekazać klucz główny użytkownika). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identyfikator źródła danych (używany w scenariuszach z wieloma źródłami danych). |

---

## Parametry żądania (Filtr / Pola / Sortowanie)

| Metoda | Opis |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filtrowanie według klucza głównego (dla pojedynczego rekordu `get` itp.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Warunki filtrowania, obsługujące operatory takie jak `$eq`, `$ne`, `$in` itp. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Grupy filtrów (do łączenia wielu warunków). |
| `setFields(fields)` / `getFields()` | Żądane pola (biała lista). |
| `setSort(sort)` / `getSort()` | Sortowanie, np. `['-createdAt']` dla kolejności malejącej według czasu utworzenia. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Ładowanie powiązań (np. `['user', 'tags']`). |

---

## Stronicowanie

| Metoda | Opis |
|------|------|
| `setPage(page)` / `getPage()` | Bieżąca strona (zaczynając od 1). |
| `setPageSize(size)` / `getPageSize()` | Liczba elementów na stronę, domyślnie 20. |
| `getTotalPage()` | Całkowita liczba stron. |
| `getCount()` | Całkowita liczba rekordów (z metadanych serwera). |
| `next()` / `previous()` / `goto(page)` | Zmiana strony i wywołanie `refresh`. |

---

## Wybrane wiersze (scenariusze tabelaryczne)

| Metoda | Opis |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Dane aktualnie wybranych wierszy, używane do masowego usuwania i innych operacji. |

---

## CRUD i operacje na listach

| Metoda | Opis |
|------|------|
| `refresh()` | Pobiera listę z bieżącymi parametrami, aktualizuje `getData()` oraz metadane stronicowania i wyzwala zdarzenie `'refresh'`. |
| `get(filterByTk)` | Pobiera pojedynczy rekord i zwraca go (nie zapisuje do `getData`). |
| `create(data, options?)` | Tworzy rekord. Opcjonalne `{ refresh: false }` zapobiega automatycznemu odświeżaniu. Wyzwala `'saved'`. |
| `update(filterByTk, data, options?)` | Aktualizuje rekord według jego klucza głównego. |
| `destroy(target)` | Usuwa rekordy. `target` może być kluczem głównym, obiektem wiersza lub tablicą kluczy/obiektów (usuwanie masowe). |
| `destroySelectedRows()` | Usuwa aktualnie wybrane wiersze (zgłasza błąd, jeśli nic nie wybrano). |
| `setItem(index, item)` | Lokalnie zastępuje konkretny wiersz danych (nie wysyła żądania). |
| `runAction(actionName, options)` | Wywołuje dowolną akcję zasobu (np. akcje niestandardowe). |

---

## Konfiguracja i zdarzenia

| Metoda | Opis |
|------|------|
| `setRefreshAction(name)` | Akcja wywoływana podczas odświeżania, domyślnie `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Konfiguracja żądania dla create/update. |
| `on('refresh', fn)` / `on('saved', fn)` | Wyzwalane po zakończeniu odświeżania lub po zapisaniu. |

---

## Przykłady

### Podstawowa lista

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filtrowanie i sortowanie

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Ładowanie powiązań

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Tworzenie i stronicowanie

```js
await ctx.resource.create({ name: 'Jan Kowalski', email: 'jan.kowalski@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Masowe usuwanie wybranych wierszy

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Proszę najpierw wybrać dane');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Usunięto'));
```

### Nasłuchiwanie zdarzenia refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Zasób powiązany (podtabela)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Uwagi

- **setResourceName jest wymagane**: Należy wywołać `setResourceName('nazwa_kolekcji')` przed użyciem, w przeciwnym razie adres URL żądania nie zostanie zbudowany.
- **Zasoby powiązane**: Gdy nazwa zasobu jest w formacie `parent.child` (np. `users.tags`), należy najpierw wywołać `setSourceId(parentPrimaryKey)`.
- **Debouncing odświeżania**: Wielokrotne wywołania `refresh()` w tej samej pętli zdarzeń wykonają tylko ostatnie z nich, aby uniknąć nadmiarowych żądań.
- **getData zwraca tablicę**: Pole `data` zwracane przez API listy jest tablicą rekordów, a `getData()` zwraca tę tablicę bezpośrednio.

---

## Powiązane

- [ctx.resource](../context/resource.md) - Instancja zasobu w bieżącym kontekście.
- [ctx.initResource()](../context/init-resource.md) - Inicjalizacja i powiązanie z ctx.resource.
- [ctx.makeResource()](../context/make-resource.md) - Tworzenie nowej instancji zasobu bez powiązania.
- [APIResource](./api-resource.md) - Ogólny zasób API wywoływany przez URL.
- [SingleRecordResource](./single-record-resource.md) - Zorientowany na pojedynczy rekord.