:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/request).
:::

# ctx.request()

Inicjowanie uwierzytelnionych żądań HTTP w RunJS. Żądanie automatycznie przenosi `baseURL` bieżącej aplikacji, `Token`, `locale`, `role` itp. oraz stosuje logikę przechwytywania żądań i obsługi błędów aplikacji.

## Scenariusze użycia

Może być używane w dowolnym scenariuszu w RunJS, w którym konieczne jest zainicjowanie zdalnego żądania HTTP, takim jak JSBlock, JSField, JSItem, JSColumn, przepływ pracy, powiązania (linkage), JSAction itp.

## Definicja typu

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` rozszerza `AxiosRequestConfig` z biblioteki Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Czy pominąć globalne komunikaty o błędach w przypadku niepowodzenia żądania
  skipAuth?: boolean;                                 // Czy pominąć przekierowanie uwierzytelniania (np. brak przekierowania do strony logowania przy błędzie 401)
};
```

## Często używane parametry

| Parametr | Typ | Opis |
|------|------|------|
| `url` | string | URL żądania. Obsługuje styl zasobów (np. `users:list`, `posts:create`) lub pełny adres URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | Metoda HTTP, domyślnie `'get'` |
| `params` | object | Parametry zapytania, serializowane do adresu URL |
| `data` | any | Treść żądania (body), używana w post/put/patch |
| `headers` | object | Niestandardowe nagłówki żądania |
| `skipNotify` | boolean \| (error) => boolean | Jeśli ma wartość true lub funkcja zwraca true, globalne komunikaty o błędach nie będą wyświetlane w przypadku niepowodzenia |
| `skipAuth` | boolean | Jeśli ma wartość true, błędy takie jak 401 nie będą wyzwalać przekierowania uwierzytelniania (np. do strony logowania) |

## Adresy URL w stylu zasobów

Interfejs API zasobów NocoBase obsługuje skrócony format `zasób:akcja`:

| Format | Opis | Przykład |
|------|------|------|
| `collection:action` | CRUD dla pojedynczej kolekcji | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Zasoby powiązane (wymaga przekazania klucza głównego przez `resourceOf` lub URL) | `posts.comments:list` |

Ścieżki względne zostaną połączone z `baseURL` aplikacji (zazwyczaj `/api`); żądania między domenami (cross-origin) muszą używać pełnego adresu URL, a usługa docelowa musi mieć skonfigurowany CORS.

## Struktura odpowiedzi

Zwracana wartość to obiekt odpowiedzi Axios. Typowe pola:

- `response.data`: Treść odpowiedzi
- Interfejsy list zazwyczaj zwracają `data.data` (tablica rekordów) + `data.meta` (stronicowanie itp.)
- Interfejsy pojedynczego rekordu/tworzenia/aktualizacji zazwyczaj zwracają rekord w `data.data`

## Przykłady

### Zapytanie o listę

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Informacje o stronicowaniu itp.
```

### Przesyłanie danych

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Jan Kowalski', email: 'jan.kowalski@example.com' },
});

const newRecord = res?.data?.data;
```

### Z filtrowaniem i sortowaniem

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Pominięcie powiadomienia o błędzie

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Nie wyświetlaj globalnego komunikatu w przypadku niepowodzenia
});

// Lub zdecyduj o pominięciu na podstawie typu błędu
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Żądanie między domenami (Cross-Origin)

W przypadku korzystania z pełnego adresu URL do żądania innych domen, usługa docelowa musi być skonfigurowana z CORS, aby zezwolić na pochodzenie bieżącej aplikacji. Jeśli interfejs docelowy wymaga własnego tokena, można go przekazać w nagłówkach:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <token_usługi_docelowej>',
  },
});
```

### Wyświetlanie za pomocą ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Lista użytkowników') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Uwagi

- **Obsługa błędów**: Niepowodzenie żądania spowoduje wyrzucenie wyjątku, a domyślnie pojawi się globalny komunikat o błędzie. Użyj `skipNotify: true`, aby samodzielnie przechwycić i obsłużyć błąd.
- **Uwierzytelnianie**: Żądania w obrębie tej samej domeny automatycznie przenoszą Token, ustawienia regionalne (locale) i rolę bieżącego użytkownika; żądania między domenami wymagają obsługi CORS przez cel i przekazania tokena w nagłówkach, jeśli jest to wymagane.
- **Uprawnienia do zasobów**: Żądania podlegają ograniczeniom ACL i mogą uzyskiwać dostęp tylko do zasobów, do których bieżący użytkownik ma uprawnienia.

## Powiązane

- [ctx.message](./message.md) - Wyświetlanie lekkich komunikatów po zakończeniu żądania
- [ctx.notification](./notification.md) - Wyświetlanie powiadomień po zakończeniu żądania
- [ctx.render](./render.md) - Renderowanie wyników żądania w interfejsie
- [ctx.makeResource](./make-resource.md) - Budowanie obiektu zasobu do łańcuchowego ładowania danych (alternatywa dla bezpośredniego `ctx.request`)