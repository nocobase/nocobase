:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# ResourceManager Zarządzanie zasobami

Funkcja zarządzania zasobami w NocoBase automatycznie konwertuje istniejące tabele danych (kolekcje) i powiązania (associations) w zasoby. Oferuje również wbudowane typy operacji, aby pomóc deweloperom szybko tworzyć operacje na zasobach REST API. W przeciwieństwie do tradycyjnych REST API, operacje na zasobach w NocoBase nie polegają na metodach żądań HTTP, lecz określają konkretną operację do wykonania poprzez jawne zdefiniowanie `:action`.

## Automatyczne generowanie zasobów

NocoBase automatycznie konwertuje `kolekcje` i `powiązania` zdefiniowane w bazie danych w zasoby. Na przykład, zdefiniujmy dwie kolekcje: `posts` i `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Spowoduje to automatyczne wygenerowanie następujących zasobów:

*   zasób `posts`
*   zasób `tags`
*   zasób powiązania `posts.tags`

Przykłady żądań:

| Metoda   | Ścieżka                     | Operacja                   |
| -------- | -------------------------- | -------------------------- |
| `GET`    | `/api/posts:list`          | Zapytanie o listę          |
| `GET`    | `/api/posts:get/1`         | Zapytanie o pojedynczy element |
| `POST`   | `/api/posts:create`        | Utwórz                     |
| `POST`   | `/api/posts:update/1`      | Aktualizuj                 |
| `POST`   | `/api/posts:destroy/1`     | Usuń                       |

| Metoda   | Ścieżka                    | Operacja                   |
| -------- | ------------------------- | -------------------------- |
| `GET`    | `/api/tags:list`          | Zapytanie o listę          |
| `GET`    | `/api/tags:get/1`         | Zapytanie o pojedynczy element |
| `POST`   | `/api/tags:create`        | Utwórz                     |
| `POST`   | `/api/tags:update/1`      | Aktualizuj                 |
| `POST`   | `/api/tags:destroy/1`     | Usuń                       |

| Metoda   | Ścieżka                            | Operacja                                     |
| -------- | ---------------------------------- | -------------------------------------------- |
| `GET`    | `/api/posts/1/tags:list`           | Zapytanie o wszystkie tagi powiązane z danym `postem` |
| `GET`    | `/api/posts/1/tags:get/1`          | Zapytanie o pojedynczy tag pod danym `postem` |
| `POST`   | `/api/posts/1/tags:create`         | Utwórz pojedynczy tag pod danym `postem`     |
| `POST`   | `/api/posts/1/tags:update/1`       | Aktualizuj pojedynczy tag pod danym `postem` |
| `POST`   | `/api/posts/1/tags:destroy/1`      | Usuń pojedynczy tag pod danym `postem`       |
| `POST`   | `/api/posts/1/tags:add`            | Dodaj powiązane tagi do danego `posta`       |
| `POST`   | `/api/posts/1/tags:remove`         | Usuń powiązane tagi z danego `posta`         |
| `POST`   | `/api/posts/1/tags:set`            | Ustaw wszystkie powiązane tagi dla danego `posta` |
| `POST`   | `/api/posts/1/tags:toggle`         | Przełącz powiązanie tagów dla danego `posta` |

:::tip Wskazówka

Operacje na zasobach w NocoBase nie zależą bezpośrednio od metod żądań, lecz określają operacje poprzez jawne zdefiniowanie `:action`.

:::

## Operacje na zasobach

NocoBase oferuje bogaty zestaw wbudowanych typów operacji, aby sprostać różnym potrzebom biznesowym.

### Podstawowe operacje CRUD

| Nazwa operacji   | Opis                                    | Typy zasobów, do których ma zastosowanie | Metoda żądania | Przykładowa ścieżka                |
| ---------------- | --------------------------------------- | ---------------------------------------- | -------------- | ----------------------------------- |
| `list`           | Zapytanie o dane listy                  | Wszystkie                                | GET/POST       | `/api/posts:list`                   |
| `get`            | Zapytanie o pojedynczy element danych   | Wszystkie                                | GET/POST       | `/api/posts:get/1`                  |
| `create`         | Utwórz nowy rekord                      | Wszystkie                                | POST           | `/api/posts:create`                 |
| `update`         | Aktualizuj rekord                       | Wszystkie                                | POST           | `/api/posts:update/1`               |
| `destroy`        | Usuń rekord                             | Wszystkie                                | POST           | `/api/posts:destroy/1`              |
| `firstOrCreate`  | Znajdź pierwszy rekord, utwórz jeśli nie istnieje | Wszystkie                                | POST           | `/api/users:firstOrCreate`          |
| `updateOrCreate` | Aktualizuj rekord, utwórz jeśli nie istnieje | Wszystkie                                | POST           | `/api/users:updateOrCreate`         |

### Operacje na relacjach

| Nazwa operacji | Opis                       | Typy relacji, do których ma zastosowanie         | Przykładowa ścieżka                   |
| -------------- | -------------------------- | ------------------------------------------------ | -------------------------------------- |
| `add`          | Dodaj powiązanie           | `hasMany`, `belongsToMany`                       | `/api/posts/1/tags:add`                |
| `remove`       | Usuń powiązanie            | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove`         |
| `set`          | Zresetuj powiązanie        | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`            |
| `toggle`       | Dodaj lub usuń powiązanie  | `belongsToMany`                                  | `/api/posts/1/tags:toggle`             |

### Parametry operacji

Typowe parametry operacji obejmują:

*   `filter`: Warunki zapytania
*   `values`: Wartości do ustawienia
*   `fields`: Określ pola do zwrócenia
*   `appends`: Dołącz powiązane dane
*   `except`: Wyklucz pola
*   `sort`: Zasady sortowania
*   `page`, `pageSize`: Parametry paginacji
*   `paginate`: Czy włączyć paginację
*   `tree`: Czy zwrócić strukturę drzewiastą
*   `whitelist`, `blacklist`: Biała/czarna lista pól
*   `updateAssociationValues`: Czy aktualizować wartości powiązań

---

## Niestandardowe operacje na zasobach

NocoBase umożliwia rejestrowanie dodatkowych operacji dla istniejących zasobów. Mogą Państwo użyć `registerActionHandlers` do dostosowania operacji dla wszystkich lub konkretnych zasobów.

### Rejestrowanie operacji globalnych

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Rejestrowanie operacji dla konkretnych zasobów

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Przykłady żądań:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Zasada nazewnictwa: `resourceName:actionName`. W przypadku powiązań używa się składni z kropką (`posts.comments`).

## Niestandardowe zasoby

Jeśli potrzebują Państwo udostępnić zasoby niezwiązane z kolekcjami, można je zdefiniować za pomocą metody `resourceManager.define`:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Metody żądań są zgodne z automatycznie generowanymi zasobami:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (domyślnie obsługuje zarówno GET, jak i POST)

## Niestandardowe oprogramowanie pośredniczące (middleware)

Do rejestrowania globalnego oprogramowania pośredniczącego (middleware) służy metoda `resourceManager.use()`. Na przykład:

Globalne oprogramowanie pośredniczące do logowania

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Specjalne właściwości kontekstu

Możliwość wejścia do oprogramowania pośredniczącego (middleware) lub akcji na poziomie `resourceManager` oznacza, że dany zasób musi istnieć.

### ctx.action

*   `ctx.action.actionName`: Nazwa operacji
*   `ctx.action.resourceName`: Może być kolekcją lub powiązaniem
*   `ctx.action.params`: Parametry operacji

### ctx.dataSource

Obiekt bieżącego źródła danych.

### ctx.getCurrentRepository()

Obiekt bieżącego repozytorium.

## Jak uzyskać obiekty resourceManager dla różnych źródeł danych

`resourceManager` należy do źródła danych, co pozwala na rejestrowanie operacji oddzielnie dla różnych źródeł danych.

### Główne źródło danych

Dla głównego źródła danych można bezpośrednio użyć `app.resourceManager` do wykonywania operacji:

```ts
app.resourceManager.registerActionHandlers();
```

### Inne źródła danych

Dla innych źródeł danych można uzyskać konkretną instancję źródła danych za pośrednictwem `dataSourceManager` i użyć `resourceManager` tej instancji do wykonywania operacji:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iteracja przez wszystkie źródła danych

Jeśli muszą Państwo wykonać te same operacje na wszystkich dodanych źródłach danych, można użyć metody `dataSourceManager.afterAddDataSource` do iteracji, zapewniając, że `resourceManager` każdego źródła danych może zarejestrować odpowiednie operacje:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```