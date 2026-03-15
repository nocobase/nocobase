:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/init-resource).
:::

# ctx.initResource()

**Inicjalizuje** zasób (resource) dla bieżącego kontekstu. Jeśli `ctx.resource` jeszcze nie istnieje, tworzy go zgodnie z określonym typem i wiąże z kontekstem; jeśli już istnieje, jest on używany bezpośrednio. Następnie można uzyskać do niego dostęp poprzez `ctx.resource`.

## Scenariusze użycia

Zazwyczaj stosowane w scenariuszach **JSBlock** (niezależny blok). Większość bloków, okien wyskakujących (popups) i innych komponentów ma wstępnie powiązany `ctx.resource` i nie wymaga ręcznego wywoływania tej metody. JSBlock domyślnie nie posiada zasobu, dlatego należy wywołać `ctx.initResource(type)` przed załadowaniem danych za pomocą `ctx.resource`.

## Definicja typu

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parametr | Typ | Opis |
|-----------|------|-------------|
| `type` | `string` | Typ zasobu: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Zwraca**: Instancję zasobu w bieżącym kontekście (tj. `ctx.resource`).

## Różnica względem ctx.makeResource()

| Metoda | Zachowanie |
|--------|----------|
| `ctx.initResource(type)` | Tworzy i wiąże, jeśli `ctx.resource` nie istnieje; zwraca istniejący, jeśli już jest. Gwarantuje dostępność `ctx.resource`. |
| `ctx.makeResource(type)` | Jedynie tworzy i zwraca nową instancję, **nie** zapisuje jej w `ctx.resource`. Odpowiednie dla scenariuszy wymagających wielu niezależnych zasobów lub użycia tymczasowego. |

## Przykłady

### Dane listy (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Pojedynczy rekord (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Określenie klucza głównego
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Określenie źródła danych

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Uwagi

- W większości scenariuszy bloków (formularze, tabele, szczegóły itp.) oraz okien wyskakujących, `ctx.resource` jest już wstępnie powiązany przez środowisko wykonawcze, więc wywoływanie `ctx.initResource` nie jest konieczne.
- Ręczna inicjalizacja jest wymagana tylko w kontekstach takich jak JSBlock, gdzie domyślnie brakuje zasobu.
- Po inicjalizacji należy wywołać `setResourceName(name)`, aby określić kolekcję, a następnie wywołać `refresh()`, aby załadować dane.

## Powiązane

- [ctx.resource](./resource.md) — Instancja zasobu w bieżącym kontekście
- [ctx.makeResource()](./make-resource.md) — Tworzy nową instancję zasobu bez wiązania jej z `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Wiele rekordów / Lista
- [SingleRecordResource](../resource/single-record-resource.md) — Pojedynczy rekord
- [APIResource](../resource/api-resource.md) — Ogólny zasób API
- [SQLResource](../resource/sql-resource.md) — Zasób zapytania SQL