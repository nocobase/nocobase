:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/router).
:::

# ctx.router

Instancja routera oparta na React Router, używana do nawigacji programistycznej w RunJS. Zazwyczaj stosowana w połączeniu z `ctx.route` i `ctx.location`.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock / JSField** | Przejście do stron szczegółów, list lub linków zewnętrznych po kliknięciu przycisku. |
| **Reguły powiązań / Przepływ zdarzeń** | Wykonanie `navigate` do listy lub szczegółów po pomyślnym przesłaniu danych lub przekazanie `state` do strony docelowej. |
| **JSAction / Obsługa zdarzeń** | Wykonywanie nawigacji w ramach logiki, takiej jak przesyłanie formularzy lub kliknięcia w linki. |
| **Nawigacja widoku** | Aktualizacja adresu URL za pomocą `navigate` podczas przełączania wewnętrznego stosu widoków. |

> Uwaga: `ctx.router` jest dostępny tylko w środowiskach RunJS posiadających kontekst routingu (np. JSBlock na stronie, strony Flow, przepływy zdarzeń itp.); może mieć wartość null w czystym backendzie lub kontekstach bez routingu (np. przepływy pracy — Workflows).

## Definicja typu

```typescript
router: Router
```

`Router` pochodzi z pakietu `@remix-run/router`. W RunJS operacje nawigacyjne, takie jak przejście, powrót i odświeżanie, są realizowane za pomocą `ctx.router.navigate()`.

## Metody

### ctx.router.navigate()

Przechodzi do ścieżki docelowej lub wykonuje akcję powrotu/odświeżenia.

**Sygnatura:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parametry:**

- `to`: Ścieżka docelowa (string), relatywna pozycja w historii (number, np. `-1`, aby się cofnąć) lub `null` (aby odświeżyć bieżącą stronę).
- `options`: Opcjonalna konfiguracja.
  - `replace?: boolean`: Czy zastąpić bieżący wpis w historii (domyślnie `false`, co dodaje nowy wpis — push).
  - `state?: any`: Stan przekazywany do trasy docelowej. Dane te nie pojawiają się w adresie URL i można uzyskać do nich dostęp poprzez `ctx.location.state` na stronie docelowej. Jest to przydatne w przypadku poufnych informacji, danych tymczasowych lub informacji, które nie powinny znajdować się w adresie URL.

## Przykłady

### Podstawowa nawigacja

```ts
// Przejście do listy użytkowników (dodaje nowy wpis do historii, pozwala na powrót)
ctx.router.navigate('/admin/users');

// Przejście do strony szczegółów
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Zastępowanie historii (brak nowego wpisu)

```ts
// Przekierowanie do strony głównej po zalogowaniu; użytkownik nie wróci do strony logowania po kliknięciu "wstecz"
ctx.router.navigate('/admin', { replace: true });

// Zastąpienie bieżącej strony stroną szczegółów po pomyślnym przesłaniu formularza
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Przekazywanie stanu (state)

```ts
// Przekazywanie danych podczas nawigacji; strona docelowa pobiera je przez ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Powrót i odświeżanie

```ts
// Powrót o jedną stronę
ctx.router.navigate(-1);

// Powrót o dwie strony
ctx.router.navigate(-2);

// Odświeżenie bieżącej strony
ctx.router.navigate(null);
```

## Relacja z ctx.route i ctx.location

| Cel | Zalecane użycie |
|------|----------|
| **Nawigacja / Przejście** | `ctx.router.navigate(path)` |
| **Odczyt bieżącej ścieżki** | `ctx.route.pathname` lub `ctx.location.pathname` |
| **Odczyt stanu przekazanego podczas nawigacji** | `ctx.location.state` |
| **Odczyt parametrów trasy** | `ctx.route.params` |

`ctx.router` odpowiada za „akcje nawigacyjne”, podczas gdy `ctx.route` i `ctx.location` odpowiadają za „bieżący stan trasy”.

## Uwagi

- `navigate(path)` domyślnie dodaje nowy wpis do historii (push), umożliwiając użytkownikom powrót za pomocą przycisku wstecz w przeglądarce.
- `replace: true` zastępuje bieżący wpis w historii bez dodawania nowego, co jest odpowiednie dla scenariuszy takich jak przekierowanie po zalogowaniu lub nawigacja po pomyślnym przesłaniu danych.
- **Odnośnie parametru `state`**:
  - Dane przekazywane przez `state` nie pojawiają się w adresie URL, co czyni je odpowiednimi dla danych poufnych lub tymczasowych.
  - Dostęp do nich można uzyskać poprzez `ctx.location.state` na stronie docelowej.
  - `state` jest zapisywany w historii przeglądarki i pozostaje dostępny podczas nawigacji do przodu/do tyłu.
  - `state` zostanie utracony po twardym odświeżeniu strony.

## Powiązane

- [ctx.route](./route.md): Informacje o dopasowaniu bieżącej trasy (pathname, params itp.).
- [ctx.location](./location.md): Bieżąca lokalizacja URL (pathname, search, hash, state); `state` jest odczytywany tutaj po nawigacji.