:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Tworzy** i zwraca nową instancję zasobu (resource) **bez** zapisywania lub modyfikowania `ctx.resource`. Jest to odpowiednie dla scenariuszy wymagających wielu niezależnych zasobów lub tymczasowego użycia.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **Wiele zasobów** | Jednoczesne ładowanie wielu źródeł danych (np. lista użytkowników + lista zamówień), z których każde korzysta z niezależnego zasobu. |
| **Zapytania tymczasowe** | Jednorazowe zapytania, które są usuwane po użyciu, bez konieczności powiązania z `ctx.resource`. |
| **Dane pomocnicze** | Użycie `ctx.resource` dla danych głównych i `makeResource` do tworzenia instancji dla danych dodatkowych. |

Jeśli potrzebują Państwo tylko jednego zasobu i chcą go powiązać z `ctx.resource`, bardziej odpowiednie będzie użycie [ctx.initResource()](./init-resource.md).

## Definicja typu

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parametr | Typ | Opis |
|------|------|------|
| `resourceType` | `string` | Typ zasobu: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Zwracana wartość**: Nowo utworzona instancja zasobu.

## Różnica względem ctx.initResource()

| Metoda | Zachowanie |
|------|------|
| `ctx.makeResource(type)` | Tylko tworzy i zwraca nową instancję, **nie** zapisując jej w `ctx.resource`. Może być wywoływana wielokrotnie w celu uzyskania wielu niezależnych zasobów. |
| `ctx.initResource(type)` | Tworzy i powiązuje, jeśli `ctx.resource` nie istnieje; zwraca go bezpośrednio, jeśli już istnieje. Zapewnia dostępność `ctx.resource`. |

## Przykłady

### Pojedynczy zasób

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource zachowuje swoją pierwotną wartość (jeśli istnieje)
```

### Wiele zasobów

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Liczba użytkowników: {usersRes.getData().length}</p>
    <p>Liczba zamówień: {ordersRes.getData().length}</p>
  </div>
);
```

### Zapytanie tymczasowe

```ts
// Zapytanie jednorazowe, nie zanieczyszcza ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Uwagi

- Nowo utworzony zasób wymaga wywołania `setResourceName(name)` w celu określenia kolekcji, a następnie załadowania danych za pomocą `refresh()`.
- Każda instancja zasobu jest niezależna i nie wpływa na inne; rozwiązanie to jest odpowiednie do równoległego ładowania wielu źródeł danych.

## Powiązane tematy

- [ctx.initResource()](./init-resource.md): Inicjalizacja i powiązanie z `ctx.resource`
- [ctx.resource](./resource.md): Instancja zasobu w bieżącym kontekście
- [MultiRecordResource](../resource/multi-record-resource) — Wiele rekordów/Lista
- [SingleRecordResource](../resource/single-record-resource) — Pojedynczy rekord
- [APIResource](../resource/api-resource) — Ogólny zasób API
- [SQLResource](../resource/sql-resource) — Zasób zapytania SQL