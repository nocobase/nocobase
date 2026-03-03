:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/location).
:::

# ctx.location

Informacje o bieżącej lokalizacji trasy, odpowiednik obiektu `location` z React Router. Zazwyczaj używany w połączeniu z `ctx.router` i `ctx.route` do odczytu bieżącej ścieżki, ciągu zapytania (query string), hasha oraz stanu przekazywanego przez trasę.

## Scenariusze zastosowania

| Scenariusz | Opis |
|------|------|
| **JSBlock / JSField** | Wykonywanie renderowania warunkowego lub rozgałęziania logiki na podstawie bieżącej ścieżki, parametrów zapytania lub hasha. |
| **Reguły powiązań / Przepływ zdarzeń** | Odczytywanie parametrów zapytania URL do filtrowania powiązań lub określanie źródła na podstawie `location.state`. |
| **Przetwarzanie po nawigacji** | Odbieranie danych przekazanych z poprzedniej strony za pomocą `ctx.router.navigate` przy użyciu `ctx.location.state` na stronie docelowej. |

> Uwaga: `ctx.location` jest dostępny tylko w środowiskach RunJS z kontekstem routingu (np. JSBlock na stronie, przepływy zdarzeń itp.); może być pusty w kontekstach czysto backendowych lub bez routingu (np. przepływy pracy).

## Definicja typu

```ts
location: Location;
```

`Location` pochodzi z `react-router-dom` i jest zgodny z wartością zwracaną przez `useLocation()` w React Router.

## Często używane pola

| Pole | Typ | Opis |
|------|------|------|
| `pathname` | `string` | Bieżąca ścieżka, zaczynająca się od `/` (np. `/admin/users`). |
| `search` | `string` | Ciąg zapytania, zaczynający się od `?` (np. `?page=1&status=active`). |
| `hash` | `string` | Fragment hash, zaczynający się od `#` (np. `#section-1`). |
| `state` | `any` | Dowolne dane przekazane przez `ctx.router.navigate(path, { state })`, niewidoczne w adresie URL. |
| `key` | `string` | Unikalny identyfikator tej lokalizacji; dla strony początkowej wynosi `"default"`. |

## Relacja z ctx.router i ctx.urlSearchParams

| Zastosowanie | Zalecane użycie |
|------|----------|
| **Odczyt ścieżki, hasha, stanu** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Odczyt parametrów zapytania (jako obiekt)** | `ctx.urlSearchParams`, który zapewnia bezpośrednio sparsowany obiekt. |
| **Parsowanie ciągu search** | `new URLSearchParams(ctx.location.search)` lub bezpośrednie użycie `ctx.urlSearchParams`. |

`ctx.urlSearchParams` jest parsowany z `ctx.location.search`. Jeśli potrzebują Państwo tylko parametrów zapytania, użycie `ctx.urlSearchParams` jest wygodniejsze.

## Przykłady

### Rozgałęzianie na podstawie ścieżki

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Obecnie na stronie zarządzania użytkownikami');
}
```

### Parsowanie parametrów zapytania

```ts
// Metoda 1: Użycie ctx.urlSearchParams (zalecane)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Metoda 2: Użycie URLSearchParams do parsowania search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Odbieranie stanu przekazanego przez nawigację trasy

```ts
// Podczas nawigacji z poprzedniej strony: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Przekierowano z panelu sterowania');
}
```

### Lokalizowanie kotwic za pomocą hasha

```ts
const hash = ctx.location.hash; // np. "#edit"
if (hash === '#edit') {
  // Przewiń do obszaru edycji lub wykonaj odpowiednią logikę
}
```

## Powiązane

- [ctx.router](./router.md): Nawigacja tras; `state` z `ctx.router.navigate` można pobrać za pomocą `ctx.location.state` na stronie docelowej.
- [ctx.route](./route.md): Informacje o dopasowaniu bieżącej trasy (parametry, konfiguracja itp.), często używane w połączeniu z `ctx.location`.