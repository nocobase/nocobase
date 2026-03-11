:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/get-value).
:::

# ctx.getValue()

W scenariuszach pól edytowalnych, takich jak JSField i JSItem, służy do pobierania najnowszej wartości bieżącego pola. W połączeniu z `ctx.setValue(v)` umożliwia dwukierunkowe wiązanie danych (two-way binding) z formularzem.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSField** | Odczyt danych wprowadzonych przez użytkownika lub bieżącej wartości formularza w edytowalnych polach niestandardowych. |
| **JSItem** | Odczyt bieżącej wartości komórki w edytowalnych elementach tabel lub podtabel. |
| **JSColumn** | Odczyt wartości pola odpowiedniego wiersza podczas renderowania kolumny tabeli. |

> **Uwaga**: Metoda `ctx.getValue()` jest dostępna wyłącznie w kontekstach RunJS z powiązaniem formularza; nie istnieje ona w scenariuszach bez powiązania z polem, takich jak przepływy pracy czy reguły powiązań.

## Definicja typu

```ts
getValue<T = any>(): T | undefined;
```

- **Wartość zwracana**: Bieżąca wartość pola, której typ zależy od typu elementu formularza; może zwrócić `undefined`, jeśli pole nie jest zarejestrowane lub nie zostało wypełnione.

## Kolejność pobierania wartości

`ctx.getValue()` pobiera wartości w następującej kolejności:

1. **Stan formularza**: Priorytetowo odczytuje dane z bieżącego stanu Ant Design Form.
2. **Wartość rezerwowa (fallback)**: Jeśli pola nie ma w formularzu, powraca do wartości początkowej pola lub właściwości (props).

> Jeśli formularz nie zakończył jeszcze renderowania lub pole nie zostało zarejestrowane, metoda może zwrócić `undefined`.

## Przykłady

### Renderowanie na podstawie bieżącej wartości

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Proszę najpierw wprowadzić treść</span>);
} else {
  ctx.render(<span>Bieżąca wartość: {current}</span>);
}
```

### Dwukierunkowe wiązanie z setValue

```tsx
const { Input } = ctx.libs.antd;

// Odczytaj bieżącą wartość jako wartość domyślną
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Powiązane tematy

- [ctx.setValue()](./set-value.md) - Ustawianie bieżącej wartości pola, używane wraz z `getValue` do dwukierunkowego wiązania.
- [ctx.form](./form.md) - Instancja Ant Design Form, umożliwiająca odczyt i zapis innych pól.
- `js-field:value-change` - Zdarzenie kontenera wyzwalane przy zmianie wartości zewnętrznych, używane do aktualizacji wyświetlania.