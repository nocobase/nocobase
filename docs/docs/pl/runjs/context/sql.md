:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` zapewnia możliwości wykonywania i zarządzania zapytaniami SQL, powszechnie używane w RunJS (takich jak JSBlock i przepływy pracy) do bezpośredniego dostępu do bazy danych. Obsługuje tymczasowe wykonywanie SQL, wykonywanie zapisanych szablonów SQL według ID, wiązanie parametrów, zmienne szablonów (`{{ctx.xxx}}`) oraz kontrolę typu wyników.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock** | Niestandardowe raporty statystyczne, złożone listy filtrowane i zapytania agregujące między tabelami. |
| **Blok wykresu** | Zapisywanie szablonów SQL do zasilania źródeł danych wykresów. |
| **Przepływ pracy / Powiązania** | Wykonywanie wstępnie ustawionych zapytań SQL w celu pobrania danych dla dalszej logiki. |
| **SQLResource** | Używane w połączeniu z `ctx.initResource('SQLResource')` dla scenariuszy takich jak listy z paginacją. |

> Uwaga: `ctx.sql` uzyskuje dostęp do bazy danych poprzez API `flowSql`. Należy upewnić się, że bieżący użytkownik posiada uprawnienia do wykonywania zapytań w odpowiednim źródle danych.

## Uprawnienia

| Uprawnienie | Metoda | Opis |
|------|------|------|
| **Zalogowany użytkownik** | `runById` | Wykonywanie na podstawie skonfigurowanego ID szablonu SQL. |
| **Uprawnienia do konfiguracji SQL** | `run`, `save`, `destroy` | Wykonywanie tymczasowych zapytań SQL lub zapisywanie/aktualizowanie/usuwanie szablonów SQL. |

Logika front-endowa przeznaczona dla zwykłych użytkowników powinna korzystać z `ctx.sql.runById(uid, options)`. Gdy wymagany jest dynamiczny SQL lub zarządzanie szablonami, należy upewnić się, że bieżąca rola posiada uprawnienia do konfiguracji SQL.

## Definicja typów

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Często używane metody

| Metoda | Opis | Wymagane uprawnienia |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Wykonuje tymczasowe zapytanie SQL; obsługuje wiązanie parametrów i zmienne szablonów. | Uprawnienia do konfiguracji SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Zapisuje lub aktualizuje szablon SQL według ID w celu ponownego użycia. | Uprawnienia do konfiguracji SQL |
| `ctx.sql.runById(uid, options?)` | Wykonuje wcześniej zapisany szablon SQL na podstawie jego ID. | Każdy zalogowany użytkownik |
| `ctx.sql.destroy(uid)` | Usuwa określony szablon SQL według ID. | Uprawnienia do konfiguracji SQL |

Uwaga:

- `run` służy do debugowania SQL i wymaga uprawnień konfiguracyjnych.
- `save` i `destroy` służą do zarządzania szablonami SQL i wymagają uprawnień konfiguracyjnych.
- `runById` jest otwarte dla zwykłych użytkowników; może jedynie wykonywać zapisane szablony i nie pozwala na debugowanie ani modyfikowanie SQL.
- Po zmodyfikowaniu szablonu SQL należy wywołać `save`, aby utrwalić zmiany.

## Parametry

### options dla run / runById

| Parametr | Typ | Opis |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Zmienne wiążące. Użyj obiektu dla symboli zastępczych `:name` lub tablicy dla symboli `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Typ wyniku: wiele wierszy, pojedynczy wiersz lub pojedyncza wartość. Domyślnie `selectRows`. |
| `dataSourceKey` | `string` | Identyfikator źródła danych. Domyślnie używane jest główne źródło danych. |
| `filter` | `Record<string, any>` | Dodatkowe warunki filtrowania (zależnie od obsługi interfejsu). |

### options dla save

| Parametr | Typ | Opis |
|------|------|------|
| `uid` | `string` | Unikalny identyfikator szablonu. Po zapisaniu można go wykonać przez `runById(uid, ...)`. |
| `sql` | `string` | Treść SQL. Obsługuje zmienne szablonu `{{ctx.xxx}}` oraz symbole zastępcze `:name` / `?`. |
| `dataSourceKey` | `string` | Opcjonalnie. Identyfikator źródła danych. |

## Zmienne szablonu SQL i wiązanie parametrów

### Zmienne szablonu `{{ctx.xxx}}`

W SQL można używać `{{ctx.xxx}}` do odwoływania się do zmiennych kontekstowych. Są one parsowane na rzeczywiste wartości przed wykonaniem:

```js
// Odwołanie do ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Źródła zmiennych, do których można się odwołać, są takie same jak w `ctx.getVar()` (np. `ctx.user.*`, `ctx.record.*`, niestandardowe `ctx.defineProperty` itp.).

### Wiązanie parametrów

- **Parametry nazwane**: Użyj `:name` w SQL i przekaż obiekt `{ name: value }` w `bind`.
- **Parametry pozycyjne**: Użyj `?` w SQL i przekaż tablicę `[value1, value2]` w `bind`.

```js
// Parametry nazwane
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Parametry pozycyjne
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['London', 'active'], type: 'selectVar' }
);
```

## Przykłady

### Wykonywanie tymczasowego SQL (Wymaga uprawnień do konfiguracji SQL)

```js
// Wiele wierszy (domyślnie)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Pojedynczy wiersz
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Pojedyncza wartość (np. COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Używanie zmiennych szablonu

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Zapisywanie i ponowne używanie szablonów

```js
// Zapisz (Wymaga uprawnień do konfiguracji SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Każdy zalogowany użytkownik może to wykonać
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Usuń szablon (Wymaga uprawnień do konfiguracji SQL)
await ctx.sql.destroy('active-users-report');
```

### Lista z paginacją (SQLResource)

```js
// Użyj SQLResource, gdy potrzebna jest paginacja lub filtrowanie
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID zapisanego szablonu SQL
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Zawiera page, pageSize itp.
```

## Relacja z ctx.resource i ctx.request

| Cel | Zalecane użycie |
|------|----------|
| **Wykonywanie zapytań SQL** | `ctx.sql.run()` lub `ctx.sql.runById()` |
| **Lista SQL z paginacją (blok)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Ogólne żądanie HTTP** | `ctx.request()` |

`ctx.sql` opakowuje API `flowSql` i jest wyspecjalizowane dla scenariuszy SQL; `ctx.request` może być używane do wywoływania dowolnego API.

## Uwagi

- Używaj wiązania parametrów (`:name` / `?`) zamiast łączenia ciągów znaków, aby uniknąć ataków SQL injection.
- `type: 'selectVar'` zwraca wartość skalarną, zazwyczaj używaną dla `COUNT`, `SUM` itp.
- Zmienne szablonu `{{ctx.xxx}}` są rozwiązywane przed wykonaniem; upewnij się, że odpowiednie zmienne są zdefiniowane w kontekście.

## Powiązane

- [ctx.resource](./resource.md): Zasoby danych; SQLResource wewnętrznie wywołuje API `flowSql`.
- [ctx.initResource()](./init-resource.md): Inicjalizacja SQLResource dla list z paginacją itp.
- [ctx.request()](./request.md): Ogólne żądania HTTP.