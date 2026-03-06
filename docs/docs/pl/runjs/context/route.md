:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/route).
:::

# ctx.route

Informacje o dopasowaniu bieżącej trasy, odpowiadające koncepcji `route` w React Router. Służy do pobierania konfiguracji aktualnie dopasowanej trasy, parametrów itp. Zazwyczaj używane w połączeniu z `ctx.router` i `ctx.location`.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock / JSField** | Wykonywanie renderowania warunkowego lub wyświetlanie identyfikatora bieżącej strony na podstawie `route.pathname` lub `route.params`. |
| **Reguły powiązań / Przepływ zdarzeń** | Odczytywanie parametrów trasy (np. `params.name`) w celu tworzenia rozgałęzień logicznych lub przekazywania ich do komponentów podrzędnych. |
| **Nawigacja widoku** | Wewnętrzne porównywanie `ctx.route.pathname` ze ścieżką docelową, aby zdecydować, czy wywołać `ctx.router.navigate`. |

> Uwaga: `ctx.route` jest dostępny tylko w środowiskach RunJS posiadających kontekst routingu (takich jak JSBlock wewnątrz strony, strony Flow itp.); w czystym backendzie lub kontekstach bez routingu (takich jak przepływy pracy) może być pusty.

## Definicja typu

```ts
type RouteOptions = {
  name?: string;   // Unikalny identyfikator trasy
  path?: string;   // Szablon trasy (np. /admin/:name)
  params?: Record<string, any>;  // Parametry trasy (np. { name: 'users' })
  pathname?: string;  // Pełna ścieżka bieżącej trasy (np. /admin/users)
};
```

## Często używane pola

| Pole | Typ | Opis |
|------|------|------|
| `pathname` | `string` | Pełna ścieżka bieżącej trasy, zgodna z `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Dynamiczne parametry wyodrębnione z szablonu trasy, np. `{ name: 'users' }`. |
| `path` | `string` | Szablon trasy, np. `/admin/:name`. |
| `name` | `string` | Unikalny identyfikator trasy, często używany w scenariuszach z wieloma zakładkami lub widokami. |

## Relacja z ctx.router i ctx.location

| Zastosowanie | Zalecane użycie |
|------|----------|
| **Odczyt bieżącej ścieżki** | `ctx.route.pathname` lub `ctx.location.pathname`; oba są spójne podczas dopasowania. |
| **Odczyt parametrów trasy** | `ctx.route.params`, np. `params.name` reprezentujący UID bieżącej strony. |
| **Nawigacja** | `ctx.router.navigate(path)` |
| **Odczyt parametrów zapytania, stanu** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` koncentruje się na „dopasowanej konfiguracji trasy”, podczas gdy `ctx.location` skupia się na „bieżącej lokalizacji URL”. Razem pozwalają one w pełni opisać stan routingu.

## Przykłady

### Odczytywanie pathname

```ts
// Wyświetlenie bieżącej ścieżki
ctx.message.info('Bieżąca strona: ' + ctx.route.pathname);
```

### Tworzenie rozgałęzień na podstawie params

```ts
// params.name to zazwyczaj UID bieżącej strony (np. identyfikator strony flow)
if (ctx.route.params?.name === 'users') {
  // Wykonaj określoną logikę na stronie zarządzania użytkownikami
}
```

### Wyświetlanie na stronie Flow

```tsx
<div>
  <h1>Bieżąca strona - {ctx.route.pathname}</h1>
  <p>Identyfikator trasy: {ctx.route.params?.name}</p>
</div>
```

## Powiązane tematy

- [ctx.router](./router.md): Nawigacja trasami. Gdy `ctx.router.navigate()` zmienia ścieżkę, `ctx.route` zostanie odpowiednio zaktualizowany.
- [ctx.location](./location.md): Bieżąca lokalizacja URL (pathname, search, hash, state), używana w połączeniu z `ctx.route`.