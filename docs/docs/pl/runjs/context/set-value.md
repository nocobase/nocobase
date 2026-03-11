:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/set-value).
:::

# ctx.setValue()

Ustawia wartość bieżącego pola w scenariuszach pól edytowalnych, takich jak JSField i JSItem. W połączeniu z `ctx.getValue()` umożliwia dwukierunkowe wiązanie (binding) z formularzem.

## Scenariusze zastosowania

| Scenariusz | Opis |
|------|------|
| **JSField** | Zapisywanie wartości wybranych przez użytkownika lub obliczonych w edytowalnych polach niestandardowych. |
| **JSItem** | Aktualizacja wartości bieżącej komórki w edytowalnych elementach tabel lub podtabel. |
| **JSColumn** | Aktualizacja wartości pola w odpowiednim wierszu na podstawie logiki podczas renderowania kolumny tabeli. |

> **Uwaga**: `ctx.setValue(v)` jest dostępne tylko w kontekstach RunJS z powiązaniem formularza. Nie jest dostępne w scenariuszach bez powiązania z polem, takich jak przepływ pracy (Workflow), reguły powiązań czy JSBlock. Przed użyciem zaleca się stosowanie opcjonalnego łańcuchowania (optional chaining): `ctx.setValue?.(value)`.

## Definicja typu

```ts
setValue<T = any>(value: T): void;
```

- **Parametry**: `value` to wartość pola do zapisania, której typ jest określony przez typ elementu formularza danego pola.

## Zachowanie

- `ctx.setValue(v)` aktualizuje wartość bieżącego pola w formularzu Ant Design oraz wyzwala powiązaną logikę powiązań formularza i walidacji.
- Jeśli renderowanie formularza nie zostało zakończone lub pole nie zostało zarejestrowane, wywołanie może być nieskuteczne. Zaleca się użycie `ctx.getValue()` w celu potwierdzenia wyniku zapisu.

## Przykłady

### Dwukierunkowe wiązanie z getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Ustawianie wartości domyślnych na podstawie warunków

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Zapisywanie zwrotne do bieżącego pola przy powiązaniu z innymi polami

```ts
// Gdy określone pole ulegnie zmianie, zsynchronizuj i zaktualizuj bieżące pole
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Niestandardowy', value: 'custom' });
}
```

## Uwagi

- W polach nieedytowalnych (np. JSField w trybie szczegółów, JSBlock), `ctx.setValue` może mieć wartość `undefined`. Zaleca się używanie `ctx.setValue?.(value)`, aby uniknąć błędów.
- Podczas ustawiania wartości dla pól powiązań (m2o, o2m itp.), należy przekazać strukturę pasującą do typu pola (np. `{ id, [titleField]: label }`), zależnie od konkretnej konfiguracji pola.

## Powiązane tematy

- [ctx.getValue()](./get-value.md) - Pobieranie bieżącej wartości pola, używane z setValue do dwukierunkowego wiązania.
- [ctx.form](./form.md) - Instancja formularza Ant Design, używana do odczytu lub zapisu innych pól.
- `js-field:value-change` - Zdarzenie kontenera wyzwalane przy zmianie wartości zewnętrznej, używane do aktualizacji wyświetlania.