:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/form).
:::

# ctx.form

Instancja Ant Design Form w bieżącym bloku, używana do odczytu i zapisu pól formularza, wyzwalania walidacji oraz przesyłania danych. Jest ona równoważna `ctx.blockModel?.form` i może być używana bezpośrednio w blokach związanych z formularzami (Formularz, Edytuj formularz, Podformularz itp.).

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSField** | Odczyt/zapis innych pól formularza w celu implementacji powiązań (linkage) lub wykonywanie obliczeń i walidacji na podstawie wartości innych pól. |
| **JSItem** | Odczyt/zapis pól w tym samym wierszu lub innych pól w elementach podtabeli w celu uzyskania powiązań wewnątrz tabeli. |
| **JSColumn** | Odczyt wartości bieżącego wiersza lub pól powiązanych w kolumnie tabeli na potrzeby renderowania. |
| **Operacje na formularzu / Przepływ zdarzeń** | Walidacja przed przesłaniem, masowa aktualizacja pól, resetowanie formularzy itp. |

> Uwaga: `ctx.form` jest dostępny tylko w kontekstach RunJS związanych z blokami formularzy (Formularz, Edytuj formularz, Podformularz itp.). Może on nie istnieć w scenariuszach pozaformularzowych (takich jak niezależne bloki JSBlock lub bloki tabeli). Przed użyciem zaleca się sprawdzenie, czy wartość nie jest pusta: `ctx.form?.getFieldsValue()`.

## Definicja typu

```ts
form: FormInstance<any>;
```

`FormInstance` to typ instancji Ant Design Form. Typowe metody są następujące:

## Typowe metody

### Odczytywanie wartości formularza

```ts
// Odczytaj wartości aktualnie zarejestrowanych pól (domyślnie tylko wyrenderowane pola)
const values = ctx.form.getFieldsValue();

// Odczytaj wartości wszystkich pól (w tym zarejestrowanych, ale niewyrenderowanych, np. ukrytych lub wewnątrz zwiniętych sekcji)
const allValues = ctx.form.getFieldsValue(true);

// Odczytaj pojedyncze pole
const email = ctx.form.getFieldValue('email');

// Odczytaj pola zagnieżdżone (np. w podtabeli)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Zapisywanie wartości formularza

```ts
// Masowa aktualizacja (często używana do powiązań)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Aktualizacja pojedynczego pola
ctx.form.setFieldValue('remark', 'Dodano uwagę');
```

### Walidacja i przesyłanie

```ts
// Wyzwalanie walidacji formularza
await ctx.form.validateFields();

// Wyzwalanie przesłania formularza
ctx.form.submit();
```

### Resetowanie

```ts
// Resetowanie wszystkich pól
ctx.form.resetFields();

// Resetowanie tylko określonych pól
ctx.form.resetFields(['status', 'remark']);
```

## Relacje z powiązanymi kontekstami

### ctx.getValue / ctx.setValue

| Scenariusz | Zalecane użycie |
|------|----------|
| **Odczyt/zapis bieżącego pola** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Odczyt/zapis innych pól** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

W ramach bieżącego pola JS należy priorytetowo traktować użycie `getValue`/`setValue` do odczytu i zapisu tego pola; należy używać `ctx.form`, gdy wymagany jest dostęp do innych pól.

### ctx.blockModel

| Potrzeba | Zalecane użycie |
|------|----------|
| **Odczyt/zapis pól formularza** | `ctx.form` (równoważne `ctx.blockModel?.form`, wygodniejsze) |
| **Dostęp do bloku nadrzędnego** | `ctx.blockModel` (zawiera `kolekcję`, `zasób` itp.) |

### ctx.getVar('ctx.formValues')

Wartości formularza muszą być pobierane za pomocą `await ctx.getVar('ctx.formValues')` i nie są bezpośrednio udostępniane jako `ctx.formValues`. W kontekście formularza preferowane jest użycie `ctx.form.getFieldsValue()` do odczytu najnowszych wartości w czasie rzeczywistym.

## Uwagi

- `getFieldsValue()` domyślnie zwraca tylko wyrenderowane pola. Aby uwzględnić pola niewyrenderowane (np. w zwiniętych sekcjach lub ukryte przez reguły warunkowe), należy przekazać `true`: `getFieldsValue(true)`.
- Ścieżki dla pól zagnieżdżonych, takich jak podtabele, są tablicami, np. `['orders', 0, 'amount']`. Można użyć `ctx.namePath`, aby pobrać ścieżkę bieżącego pola i skonstruować ścieżki dla innych kolumn w tym samym wierszu.
- `validateFields()` zgłasza obiekt błędu zawierający `errorFields` i inne informacje. Jeśli walidacja nie powiedzie się przed przesłaniem, można użyć `ctx.exit()`, aby przerwać kolejne kroki.
- W scenariuszach asynchronicznych, takich jak przepływy pracy lub reguły powiązań, `ctx.form` może nie być jeszcze gotowy. Zaleca się stosowanie opcjonalnego łańcuchowania (optional chaining) lub sprawdzania, czy wartość nie jest pusta.

## Przykłady

### Powiązanie pól: Wyświetlanie różnych treści w zależności od typu

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Obliczanie bieżącego pola na podstawie innych pól

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Odczyt/zapis innych kolumn w tym samym wierszu wewnątrz podtabeli

```ts
// ctx.namePath to ścieżka bieżącego pola w formularzu, np. ['orders', 0, 'amount']
// Odczytaj 'status' w tym samym wierszu: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Walidacja przed przesłaniem

```ts
try {
  await ctx.form.validateFields();
  // Walidacja zakończona sukcesem, kontynuuj logikę przesyłania
} catch (e) {
  ctx.message.error('Proszę sprawdzić pola formularza');
  ctx.exit();
}
```

### Przesłanie po potwierdzeniu

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Potwierdź przesłanie',
  content: 'Po przesłaniu nie będzie można wprowadzać zmian. Kontynuować?',
  okText: 'Potwierdź',
  cancelText: 'Anuluj',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Przerwij, jeśli użytkownik anuluje
}
```

## Powiązane

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Odczyt i zapis wartości bieżącego pola.
- [ctx.blockModel](./block-model.md): Model bloku nadrzędnego; `ctx.form` jest odpowiednikiem `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Okna dialogowe potwierdzenia, często używane z `ctx.form.validateFields()` i `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Przerwanie procesu w przypadku niepowodzenia walidacji lub anulowania przez użytkownika.
- `ctx.namePath`: Ścieżka (tablica) bieżącego pola w formularzu, używana do konstruowania nazw dla `getFieldValue` / `setFieldValue` w polach zagnieżdżonych.