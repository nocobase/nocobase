:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Kontekst

W NocoBase, każde żądanie tworzy obiekt `ctx`, będący instancją Kontekstu. Kontekst zawiera w sobie informacje o żądaniu i odpowiedzi, jednocześnie oferując funkcjonalności specyficzne dla NocoBase, takie jak dostęp do bazy danych, operacje na pamięci podręcznej, zarządzanie uprawnieniami, internacjonalizacja oraz logowanie.

`Application` NocoBase opiera się na Koa, dlatego `ctx` jest zasadniczo Koa Contextem. NocoBase rozszerza go jednak o rozbudowane API, umożliwiając deweloperom wygodną obsługę logiki biznesowej w komponentach Middleware i Action. Każde żądanie posiada niezależny `ctx`, co gwarantuje izolację danych i bezpieczeństwo między żądaniami.

## ctx.action

`ctx.action` zapewnia dostęp do Action wykonywanego dla bieżącego żądania. Obejmuje:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Wyświetla nazwę bieżącego Action
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Obsługa internacjonalizacji (i18n).

- `ctx.i18n` dostarcza informacje o ustawieniach regionalnych.
- `ctx.t()` służy do tłumaczenia ciągów znaków na podstawie języka.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Zwraca tłumaczenie na podstawie języka żądania
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` zapewnia interfejs dostępu do bazy danych, umożliwiając bezpośrednie operowanie na modelach i wykonywanie zapytań.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` zapewnia operacje na pamięci podręcznej, obsługując odczyt i zapis do cache'u. Jest to często wykorzystywane do przyspieszenia dostępu do danych lub zapisywania tymczasowego stanu.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Buforuje na 60 sekund
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` to instancja aplikacji NocoBase, umożliwiająca dostęp do globalnej konfiguracji, wtyczek i usług.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Sprawdź konsolę pod kątem aplikacji';
});
```

## ctx.auth.user

`ctx.auth.user` pobiera informacje o aktualnie uwierzytelnionym użytkowniku, co jest przydatne przy weryfikacji uprawnień lub w logice biznesowej.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Brak autoryzacji');
  }
  ctx.body = `Witaj ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` służy do współdzielenia danych w łańcuchu middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Bieżący użytkownik: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` zapewnia możliwości logowania, obsługując wielopoziomowe wyjście logów.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Przetwarzanie żądania dla:', ctx.path);
  ctx.body = 'Zalogowano pomyślnie';
});
```

## ctx.permission & ctx.can()

`ctx.permission` służy do zarządzania uprawnieniami, natomiast `ctx.can()` pozwala sprawdzić, czy bieżący użytkownik ma uprawnienia do wykonania określonej operacji.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Dostęp zabroniony');
  }
  ctx.body = 'Posiada Pan/Pani uprawnienia do edycji postów';
});
```

## Podsumowanie

- Każde żądanie ma swój niezależny obiekt `ctx`.
- `ctx` jest rozszerzeniem Koa Context, integrującym funkcjonalności NocoBase.
- Często używane właściwości to: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` itd.
- Użycie `ctx` w komponentach Middleware i Action pozwala na wygodną obsługę żądań, odpowiedzi, uprawnień, logów i bazy danych.