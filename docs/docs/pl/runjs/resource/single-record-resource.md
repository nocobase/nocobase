:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Zasób (Resource) zorientowany na **pojedynczy rekord**: dane stanowią pojedynczy obiekt, obsługujący pobieranie według klucza głównego, tworzenie/aktualizację (save) oraz usuwanie. Jest odpowiedni dla scenariuszy takich jak „szczegóły” czy „formularze”. W przeciwieństwie do [MultiRecordResource](./multi-record-resource.md), metoda `getData()` w `SingleRecordResource` zwraca pojedynczy obiekt. Klucz główny określa się za pomocą `setFilterByTk(id)`, a metoda `save()` automatycznie wywołuje `create` lub `update` w zależności od stanu `isNewRecord`.

**Dziedziczenie**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Sposób tworzenia**: `ctx.makeResource('SingleRecordResource')` lub `ctx.initResource('SingleRecordResource')`. Przed użyciem należy wywołać `setResourceName('nazwa_kolekcji')`. Podczas wykonywania operacji na kluczu głównym należy użyć `setFilterByTk(id)`. W RunJS `ctx.api` jest wstrzykiwane przez środowisko uruchomieniowe.

---

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **Blok szczegółów** | Blok szczegółów domyślnie używa `SingleRecordResource` do ładowania pojedynczego rekordu według klucza głównego. |
| **Blok formularza** | Formularze tworzenia/edycji używają `SingleRecordResource`, gdzie `save()` automatycznie rozróżnia operacje `create` i `update`. |
| **JSBlock szczegóły** | Ładowanie pojedynczego użytkownika, zamówienia itp. wewnątrz JSBlock i niestandardowe wyświetlanie danych. |
| **Zasoby powiązane** | Ładowanie powiązanych pojedynczych rekordów w formacie `users.profile`, co wymaga użycia `setSourceId(ID_rekordu_nadrzędnego)`. |

---

## Format danych

- `getData()` zwraca **pojedynczy obiekt rekordu**, który odpowiada polu `data` w odpowiedzi API get.
- `getMeta()` zwraca metadane (jeśli są dostępne).

---

## Nazwa zasobu i klucz główny

| Metoda | Opis |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nazwa zasobu, np. `'users'`, `'users.profile'` (zasób powiązany). |
| `setSourceId(id)` / `getSourceId()` | ID rekordu nadrzędnego dla zasobów powiązanych (np. `users.profile` wymaga klucza głównego rekordu z `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identyfikator źródła danych (używany w środowiskach z wieloma źródłami danych). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Klucz główny bieżącego rekordu; po jego ustawieniu `isNewRecord` zmienia wartość na `false`. |

---

## Stan

| Właściwość/Metoda | Opis |
|----------|------|
| `isNewRecord` | Czy zasób jest w stanie „nowy” (true, jeśli nie ustawiono `filterByTk` lub rekord został właśnie utworzony). |

---

## Parametry zapytania (Filtrowanie / Pola)

| Metoda | Opis |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filtrowanie (dostępne, gdy zasób nie jest w stanie „nowy”). |
| `setFields(fields)` / `getFields()` | Żądane pola. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Rozwinięcie powiązań (appends). |

---

## CRUD

| Metoda | Opis |
|------|------|
| `refresh()` | Wykonuje żądanie `get` na podstawie bieżącego `filterByTk` i aktualizuje `getData()`; nie wykonuje zapytania w stanie „nowym”. |
| `save(data, options?)` | Wywołuje `create` w stanie „nowym”, w przeciwnym razie wywołuje `update`; opcja `{ refresh: false }` zapobiega automatycznemu odświeżaniu. |
| `destroy(options?)` | Usuwa rekord na podstawie bieżącego `filterByTk` i czyści dane lokalne. |
| `runAction(actionName, options)` | Wywołuje dowolną akcję zasobu. |

---

## Konfiguracja i zdarzenia

| Metoda | Opis |
|------|------|
| `setSaveActionOptions(options)` | Konfiguracja żądania dla akcji `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | Wyzwalane po zakończeniu odświeżania lub po zapisaniu. |

---

## Przykłady

### Podstawowe pobieranie i aktualizacja

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Aktualizacja
await ctx.resource.save({ name: 'Jan Kowalski' });
```

### Tworzenie nowego rekordu

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Anna Nowak', email: 'annanowak@example.com' });
```

### Usuwanie rekordu

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Po wykonaniu destroy(), getData() zwraca null
```

### Rozwinięcie powiązań i pola

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Zasoby powiązane (np. users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Klucz główny rekordu nadrzędnego
res.setFilterByTk(profileId);    // filterByTk można pominąć, jeśli profile to relacja hasOne
await res.refresh();
const profile = res.getData();
```

### save bez automatycznego odświeżania

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// getData() zachowuje starą wartość, ponieważ odświeżanie nie zostało wywołane po zapisie
```

### Nasłuchiwanie zdarzeń refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Użytkownik: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Zapisano pomyślnie');
});
await ctx.resource?.refresh?.();
```

---

## Uwagi

- **setResourceName jest wymagane**: Przed użyciem należy wywołać `setResourceName('nazwa_kolekcji')`, w przeciwnym razie adres URL żądania nie zostanie zbudowany.
- **filterByTk a isNewRecord**: Jeśli `setFilterByTk` nie zostanie wywołane, `isNewRecord` wynosi `true`, a `refresh()` nie zainicjuje żądania; `save()` wykona akcję `create`.
- **Zasoby powiązane**: Gdy nazwa zasobu jest w formacie `parent.child` (np. `users.profile`), należy najpierw wywołać `setSourceId(nadrzędny_klucz_główny)`.
- **getData zwraca obiekt**: Dane zwracane przez API dla pojedynczego rekordu są obiektem; `getData()` zwraca ten obiekt bezpośrednio. Po operacji `destroy()` przyjmuje wartość `null`.

---

## Powiązane

- [ctx.resource](../context/resource.md) – Instancja zasobu w bieżącym kontekście.
- [ctx.initResource()](../context/init-resource.md) – Inicjalizacja i powiązanie z `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) – Utworzenie nowej instancji zasobu bez powiązania.
- [APIResource](./api-resource.md) – Ogólny zasób API wywoływany przez URL.
- [MultiRecordResource](./multi-record-resource.md) – Zorientowany na kolekcje/listy, obsługujący CRUD i stronicowanie.