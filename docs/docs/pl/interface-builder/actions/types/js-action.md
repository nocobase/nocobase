:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Akcja JS

## Wprowadzenie

Akcja JS służy do wykonywania kodu JavaScript po kliknięciu przycisku, umożliwiając dostosowanie dowolnego zachowania biznesowego. Może być używana w paskach narzędzi formularzy, paskach narzędzi tabel (na poziomie kolekcji), wierszach tabel (na poziomie rekordu) i innych miejscach, aby wykonywać operacje takie jak walidacja, wyświetlanie powiadomień, wywoływanie API, otwieranie wyskakujących okien/szuflad oraz odświeżanie danych.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API kontekstu środowiska uruchomieniowego (najczęściej używane)

- `ctx.api.request(options)`: Wykonuje żądanie HTTP;
- `ctx.openView(viewUid, options)`: Otwiera skonfigurowany widok (szufladę/okno dialogowe/stronę);
- `ctx.message` / `ctx.notification`: Globalne komunikaty i powiadomienia;
- `ctx.t()` / `ctx.i18n.t()`: Internacjonalizacja;
- `ctx.resource`: Zasób danych dla kontekstu na poziomie kolekcji (np. pasek narzędzi tabeli), zawierający metody takie jak `getSelectedRows()` i `refresh()`;
- `ctx.record`: Bieżący rekord wiersza dla kontekstu na poziomie rekordu (np. przycisk w wierszu tabeli);
- `ctx.form`: Instancja formularza AntD dla kontekstu na poziomie formularza (np. przycisk na pasku narzędzi formularza);
- `ctx.collection`: Metadane bieżącej kolekcji;
- Edytor kodu obsługuje fragmenty `Snippets` i wstępne uruchamianie `Run` (patrz niżej).

- `ctx.requireAsync(url)`: Asynchronicznie ładuje bibliotekę AMD/UMD z adresu URL;
- `ctx.importAsync(url)`: Dynamicznie importuje moduł ESM z adresu URL;

> Rzeczywiste dostępne zmienne mogą się różnić w zależności od położenia przycisku. Powyższa lista przedstawia przegląd typowych możliwości.

## Edytor i fragmenty kodu

- `Snippets`: Otwiera listę wbudowanych fragmentów kodu, które można wyszukać i wstawić w bieżącej pozycji kursora jednym kliknięciem.
- `Run`: Bezpośrednio wykonuje bieżący kod i wyprowadza dzienniki wykonania do panelu `Logs` na dole; obsługuje `console.log/info/warn/error` oraz podświetlanie błędów w celu łatwej lokalizacji.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Mogą Państwo użyć pracowników AI do generowania/modyfikowania skryptów: [Pracownik AI · Nathan: Inżynier Frontend](/ai-employees/built-in/ai-coding)

## Typowe zastosowania (uproszczone przykłady)

### 1) Żądanie API i powiadomienie

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
// TODO: Wdrożyć logikę biznesową...
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

- **Idempotentność działania**: Aby zapobiec wielokrotnemu przesyłaniu danych spowodowanemu powtarzającymi się kliknięciami, mogą Państwo dodać przełącznik stanu w logice lub wyłączyć przycisk.
- **Obsługa błędów**: Proszę dodać bloki `try/catch` dla wywołań API i zapewnić użytkownikowi odpowiednie komunikaty.
- **Interakcja z widokami**: Podczas otwierania wyskakującego okna/szuflady za pomocą `ctx.openView`, zaleca się jawne przekazywanie parametrów, a w razie potrzeby aktywne odświeżanie zasobu nadrzędnego po pomyślnym przesłaniu.

## Powiązane dokumenty

- [Zmienne i kontekst](/interface-builder/variables)
- [Zasady powiązań](/interface-builder/linkage-rule)
- [Widoki i wyskakujące okna](/interface-builder/actions/types/view)