:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/resource/api-resource).
:::

# APIResource

**Uniwersalny zasób API** oparty na adresie URL, odpowiedni dla dowolnego interfejsu HTTP. Dziedziczy po klasie bazowej `FlowResource` i rozszerza ją o konfigurację żądań oraz metodę `refresh()`. W przeciwieństwie do [MultiRecordResource](./multi-record-resource.md) i [SingleRecordResource](./single-record-resource.md), `APIResource` nie zależy od nazwy zasobu; wysyła żądania bezpośrednio pod wskazany adres URL, co czyni go odpowiednim dla niestandardowych interfejsów, zewnętrznych API i innych podobnych scenariuszy.

**Sposób tworzenia**: `ctx.makeResource('APIResource')` lub `ctx.initResource('APIResource')`. Przed użyciem należy ustawić adres URL za pomocą `setURL()`. W kontekście RunJS `ctx.api` (APIClient) jest wstrzykiwany automatycznie, więc nie ma potrzeby ręcznego wywoływania `setAPIClient`.

---

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **Niestandardowy interfejs** | Wywoływanie nieformalnych API zasobów (np. `/api/custom/stats`, `/api/reports/summary`). |
| **Zewnętrzne API** | Żądania do usług zewnętrznych poprzez pełny adres URL (wymaga obsługi CORS przez cel). |
| **Jednorazowe zapytanie** | Tymczasowe pobieranie danych, które są usuwane po użyciu i nie muszą być powiązane z `ctx.resource`. |
| **Wybór między APIResource a ctx.request** | Należy użyć `APIResource`, gdy potrzebne są dane reaktywne, zdarzenia lub stany błędów; do prostych, jednorazowych żądań można użyć `ctx.request()`. |

---

## Możliwości klasy bazowej (FlowResource)

Wszystkie zasoby (Resource) posiadają następujące funkcje:

| Metoda | Opis |
|------|------|
| `getData()` | Pobiera aktualne dane. |
| `setData(value)` | Ustawia dane (tylko lokalnie). |
| `hasData()` | Sprawdza, czy dane istnieją. |
| `getMeta(key?)` / `setMeta(meta)` | Odczyt/zapis metadanych. |
| `getError()` / `setError(err)` / `clearError()` | Zarządzanie stanem błędu. |
| `on(event, callback)` / `once` / `off` / `emit` | Subskrypcja i wyzwalanie zdarzeń. |

---

## Konfiguracja żądania

| Metoda | Opis |
|------|------|
| `setAPIClient(api)` | Ustawia instancję APIClient (w RunJS zazwyczaj wstrzykiwana automatycznie). |
| `getURL()` / `setURL(url)` | Adres URL żądania. |
| `loading` | Odczyt/zapis stanu ładowania (get/set). |
| `clearRequestParameters()` | Czyści parametry żądania. |
| `setRequestParameters(params)` | Scala i ustawia parametry żądania. |
| `setRequestMethod(method)` | Ustawia metodę żądania (np. `'get'`, `'post'`, domyślnie `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Nagłówki żądania. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Dodawanie, usuwanie lub sprawdzanie pojedynczego parametru. |
| `setRequestBody(data)` | Ciało żądania (używane przy POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Ogólne opcje żądania. |

---

## Format adresu URL

- **Styl zasobowy**: Obsługuje skróty zasobów NocoBase, takie jak `users:list` lub `posts:get`, które zostaną połączone z `baseURL`.
- **Ścieżka względna**: np. `/api/custom/endpoint`, łączona z `baseURL` aplikacji.
- **Pełny adres URL**: Używany przy żądaniach między domenami; cel musi mieć skonfigurowany CORS.

---

## Pobieranie danych

| Metoda | Opis |
|------|------|
| `refresh()` | Inicjuje żądanie na podstawie aktualnego adresu URL, metody, parametrów, nagłówków i danych. Zapisuje odpowiedź `data` za pomocą `setData(data)` i wyzwala zdarzenie `'refresh'`. W przypadku niepowodzenia ustawia `setError(err)` i rzuca `ResourceError`, nie wyzwalając zdarzenia `refresh`. Wymaga wcześniejszego ustawienia `api` oraz adresu URL. |

---

## Przykłady

### Podstawowe żądanie GET

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### Adres URL w stylu zasobowym

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### Żądanie POST (z ciałem żądania)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Nasłuchiwanie zdarzenia refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Statystyki: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Obsługa błędów

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Żądanie nie powiodło się');
}
```

### Niestandardowe nagłówki żądania

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'wartość');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Uwagi

- **Zależność od ctx.api**: W RunJS `ctx.api` jest wstrzykiwany przez środowisko; ręczne wywołanie `setAPIClient` zazwyczaj nie jest konieczne. Jeśli zasób jest używany poza kontekstem, należy go ustawić samodzielnie.
- **Refresh oznacza żądanie**: Metoda `refresh()` inicjuje żądanie na podstawie bieżącej konfiguracji; metoda, parametry, dane itp. muszą zostać skonfigurowane przed jej wywołaniem.
- **Błędy nie aktualizują danych**: W przypadku niepowodzenia żądania `getData()` zachowuje poprzednią wartość; informacje o błędzie można pobrać za pomocą `getError()`.
- **Porównanie z ctx.request**: Do prostych, jednorazowych żądań należy używać `ctx.request()`; `APIResource` jest lepszym wyborem, gdy wymagane są dane reaktywne, zdarzenia i zarządzanie stanem błędów.

---

## Powiązane

- [ctx.resource](../context/resource.md) - Instancja zasobu w bieżącym kontekście
- [ctx.initResource()](../context/init-resource.md) - Inicjalizacja i powiązanie z `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Tworzenie nowej instancji zasobu bez powiązania
- [ctx.request()](../context/request.md) - Ogólne żądanie HTTP, odpowiednie dla prostych wywołań
- [MultiRecordResource](./multi-record-resource.md) - Przeznaczony dla kolekcji/list, obsługuje CRUD i stronicowanie
- [SingleRecordResource](./single-record-resource.md) - Przeznaczony dla pojedynczych rekordów