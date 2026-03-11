:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/actions/types/js-action).
:::

# JS Action

## Wprowadzenie

JS Action służy do wykonywania kodu JavaScript po kliknięciu przycisku, aby dostosować dowolne zachowanie biznesowe. Może być używana w paskach narzędzi formularzy, paskach narzędzi tabel (poziom kolekcji), wierszach tabel (poziom rekordu) i innych miejscach, aby realizować operacje takie jak walidacja, komunikaty, wywołania interfejsów, otwieranie okien/szuflad, odświeżanie danych itp.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API kontekstu środowiska uruchomieniowego (często używane)

- `ctx.api.request(options)`: Inicjuje żądanie HTTP;
- `ctx.openView(viewUid, options)`: Otwiera skonfigurowany widok (szufladę/okno dialogowe/stronę);
- `ctx.message` / `ctx.notification`: Globalne komunikaty i powiadomienia;
- `ctx.t()` / `ctx.i18n.t()`: Internacjonalizacja;
- `ctx.resource`: Zasób danych kontekstu na poziomie kolekcji (np. pasek narzędzi tabeli, zawiera `getSelectedRows()`, `refresh()` itp.);
- `ctx.record`: Bieżący rekord wiersza w kontekście na poziomie rekordu (np. przycisk w wierszu tabeli);
- `ctx.form`: Instancja AntD Form w kontekście na poziomie formularza (np. przycisk na pasku narzędzi formularza);
- `ctx.collection`: Metadane bieżącej kolekcji;
- Edytor kodu obsługuje fragmenty `Snippets` oraz wstępne uruchamianie `Run` (patrz poniżej).


- `ctx.requireAsync(url)`: Asynchroniczne ładowanie bibliotek AMD/UMD poprzez URL;
- `ctx.importAsync(url)`: Dynamiczny import modułów ESM poprzez URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Wbudowane biblioteki React / ReactDOM / Ant Design / Ikony Ant Design / dayjs / lodash / math.js / formula.js itp., używane do renderowania JSX, przetwarzania czasu, operacji na danych i obliczeń matematycznych.

> Rzeczywiste dostępne zmienne będą się różnić w zależności od lokalizacji przycisku; powyższe stanowi przegląd typowych możliwości.

## Edytor i fragmenty kodu

- `Snippets`: Otwiera listę wbudowanych fragmentów kodu, które można wyszukiwać i wstawiać jednym kliknięciem w bieżącej pozycji kursora.
- `Run`: Bezpośrednio uruchamia bieżący kod i wyprowadza logi do dolnego panelu `Logs`; obsługuje `console.log/info/warn/error` oraz lokalizację błędów z podświetlaniem.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Można połączyć z pracownikiem AI w celu generowania/modyfikowania skryptów: [Pracownik AI · Nathan: Inżynier Frontend](/ai-employees/features/built-in-employee)

## Typowe zastosowania (uproszczone przykłady)

### 1) Żądanie interfejsu i komunikaty

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Przycisk kolekcji: Walidacja wyboru i przetwarzanie

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Wykonaj logikę biznesową…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Przycisk rekordu: Odczyt bieżącego rekordu wiersza

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Otwieranie widoku (szuflady/okna dialogowego)

```js
const popupUid = ctx.model.uid + '-open'; // Powiązanie z bieżącym przyciskiem dla stabilności
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Odświeżanie danych po przesłaniu

```js
// Ogólne odświeżanie: priorytet dla zasobów tabeli/listy, następnie dla zasobu bloku zawierającego formularz
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Uwagi

- Idempotentność działania: Unikanie wielokrotnego przesyłania spowodowanego powtarzającymi się kliknięciami; można dodać przełącznik stanu w logice lub wyłączyć przycisk.
- Obsługa błędów: Należy dodać bloki try/catch do wywołań interfejsów i wyświetlać komunikaty użytkownikowi.
- Powiązania widoków: Przy otwieraniu okien/szuflad przez `ctx.openView` zaleca się jawne przekazywanie parametrów i, jeśli to konieczne, aktywne odświeżanie zasobów nadrzędnych po pomyślnym przesłaniu.

## Powiązane dokumenty

- [Zmienne i kontekst](/interface-builder/variables)
- [Zasady powiązań](/interface-builder/linkage-rule)
- [Widoki i wyskakujące okna](/interface-builder/actions/types/view)