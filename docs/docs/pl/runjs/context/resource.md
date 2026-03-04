:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/resource).
:::

# ctx.resource

Instancja **FlowResource** w bieżącym kontekście, używana do uzyskiwania dostępu do danych i operowania na nich. W większości bloków (formularze, tabele, szczegóły itp.) oraz w scenariuszach z wyskakującymi oknami (pop-up), środowisko wykonawcze wstępnie wiąże `ctx.resource`. W przypadkach takich jak JSBlock, gdzie domyślnie nie ma zasobu, należy najpierw wywołać [ctx.initResource()](./init-resource.md) w celu inicjalizacji, a następnie korzystać z niego poprzez `ctx.resource`.

## Stosowanie

`ctx.resource` może być używany w dowolnym scenariuszu RunJS wymagającym dostępu do danych strukturalnych (listy, pojedyncze rekordy, niestandardowe API, SQL). Bloki formularzy, tabel, szczegółów oraz okna pop-up są zazwyczaj wstępnie powiązane. W przypadku JSBlock, JSField, JSItem, JSColumn itp., jeśli wymagane jest ładowanie danych, można najpierw wywołać `ctx.initResource(type)`, a następnie uzyskać dostęp do `ctx.resource`.

## Definicja typu

```ts
resource: FlowResource | undefined;
```

- W kontekstach ze wstępnym powiązaniem, `ctx.resource` jest instancją odpowiedniego zasobu.
- W scenariuszach takich jak JSBlock, gdzie domyślnie nie ma zasobu, ma on wartość `undefined`, dopóki nie zostanie wywołane `ctx.initResource(type)`.

## Często używane metody

Metody udostępniane przez różne typy zasobów (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) nieznacznie się różnią. Poniżej znajdują się metody uniwersalne lub powszechnie stosowane:

| Metoda | Opis |
|------|------|
| `getData()` | Pobiera bieżące dane (listę lub pojedynczy rekord) |
| `setData(value)` | Ustawia dane lokalne |
| `refresh()` | Inicjuje żądanie z bieżącymi parametrami w celu odświeżenia danych |
| `setResourceName(name)` | Ustawia nazwę zasobu (np. `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Ustawia filtr klucza głównego (dla pobierania pojedynczego rekordu itp.) |
| `runAction(actionName, options)` | Wywołuje dowolną akcję zasobu (np. `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Subskrybuje/anuluje subskrypcję zdarzeń (np. `refresh`, `saved`) |

**Specyficzne dla MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` itp.

## Przykłady

### Dane listy (wymaga wcześniejszego initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Scenariusz tabeli (wstępnie powiązany)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Usunięto'));
```

### Pojedynczy rekord

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Wywoływanie niestandardowej akcji

```js
await ctx.resource.runAction('create', { data: { name: 'Jan Kowalski' } });
```

## Relacja z ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Jeśli `ctx.resource` nie istnieje, tworzy go i wiąże; jeśli już istnieje, zwraca istniejącą instancję. Zapewnia to dostępność `ctx.resource`.
- **ctx.makeResource(type)**: Tworzy nową instancję zasobu i zwraca ją, ale **nie** zapisuje jej w `ctx.resource`. Jest to odpowiednie dla scenariuszy wymagających wielu niezależnych zasobów lub tymczasowego użycia.
- **ctx.resource**: Daje dostęp do zasobu już powiązanego z bieżącym kontekstem. Większość bloków/okien pop-up jest wstępnie powiązana; w przeciwnym razie ma wartość `undefined` i wymaga `ctx.initResource`.

## Uwagi

- Przed użyciem zaleca się sprawdzenie, czy wartość nie jest pusta: `ctx.resource?.refresh()`, szczególnie w scenariuszach takich jak JSBlock, gdzie wstępne powiązanie może nie istnieć.
- Po inicjalizacji należy wywołać `setResourceName(name)`, aby określić kolekcję przed załadowaniem danych za pomocą `refresh()`.
- Pełne API dla każdego typu zasobu znajduje się w poniższych linkach.

## Powiązane

- [ctx.initResource()](./init-resource.md) - Inicjalizuje i wiąże zasób z bieżącym kontekstem
- [ctx.makeResource()](./make-resource.md) - Tworzy nową instancję zasobu bez wiązania jej z `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Wiele rekordów/Listy
- [SingleRecordResource](../resource/single-record-resource.md) - Pojedynczy rekord
- [APIResource](../resource/api-resource.md) - Ogólny zasób API
- [SQLResource](../resource/sql-resource.md) - Zasób zapytania SQL