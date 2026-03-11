:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/modal).
:::

# ctx.modal

Skrótowe API oparte na Ant Design Modal, używane do aktywnego otwierania okien modalnych (komunikatów informacyjnych, okien potwierdzenia itp.) w RunJS. Jest implementowane przez `ctx.viewer` / system widoków.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock / JSField** | Wyświetlanie wyników operacji, komunikatów o błędach lub dodatkowych potwierdzeń po interakcji użytkownika. |
| **Przepływ pracy / Zdarzenia akcji** | Okno potwierdzenia przed przesłaniem; zakończenie kolejnych kroków za pomocą `ctx.exit()`, jeśli użytkownik anuluje. |
| **Reguły powiązań** | Wyświetlanie komunikatów dla użytkownika w przypadku niepowodzenia walidacji. |

> Uwaga: `ctx.modal` jest dostępny w środowiskach RunJS z kontekstem widoku (takich jak JSBlock na stronie, przepływy pracy itp.); może nie istnieć w środowisku backendowym lub kontekstach bez interfejsu użytkownika (UI). Przy wywoływaniu zaleca się stosowanie opcjonalnego łańcuchowania (`ctx.modal?.confirm?.()`).

## Definicja typu

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Zwraca true, jeśli użytkownik kliknie OK, false, jeśli anuluje
};
```

`ModalConfig` jest zgodny z konfiguracją metod statycznych `Modal` w Ant Design.

## Typowe metody

| Metoda | Wartość zwracana | Opis |
|------|--------|------|
| `info(config)` | `Promise<void>` | Okno modalne z informacją |
| `success(config)` | `Promise<void>` | Okno modalne z sukcesem |
| `error(config)` | `Promise<void>` | Okno modalne z błędem |
| `warning(config)` | `Promise<void>` | Okno modalne z ostrzeżeniem |
| `confirm(config)` | `Promise<boolean>` | Okno potwierdzenia; zwraca `true`, jeśli użytkownik kliknie OK, a `false`, jeśli anuluje |

## Parametry konfiguracji

Zgodnie z Ant Design `Modal`, typowe pola obejmują:

| Parametr | Typ | Opis |
|------|------|------|
| `title` | `ReactNode` | Tytuł |
| `content` | `ReactNode` | Treść |
| `okText` | `string` | Tekst przycisku OK |
| `cancelText` | `string` | Tekst przycisku Anuluj (tylko dla `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Wykonywane po kliknięciu OK |
| `onCancel` | `() => void` | Wykonywane po kliknięciu Anuluj |

## Relacja z ctx.message i ctx.openView

| Zastosowanie | Zalecane użycie |
|------|----------|
| **Lekki tymczasowy komunikat** | `ctx.message`, znika automatycznie |
| **Okno modalne Info/Sukces/Błąd/Ostrzeżenie** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Dodatkowe potwierdzenie (wymaga wyboru użytkownika)** | `ctx.modal.confirm`, używane z `ctx.exit()` do sterowania przepływem |
| **Złożone interakcje, takie jak formularze lub listy** | `ctx.openView` do otwierania niestandardowego widoku (strona/szuflada/okno modalne) |

## Przykłady

### Proste okno informacyjne

```ts
ctx.modal.info({
  title: 'Wskazówka',
  content: 'Operacja została zakończona',
});
```

### Okno potwierdzenia i sterowanie przepływem

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Potwierdź usunięcie',
  content: 'Czy na pewno chcesz usunąć ten rekord?',
  okText: 'Potwierdź',
  cancelText: 'Anuluj',
});
if (!confirmed) {
  ctx.exit();  // Zakończ kolejne kroki, jeśli użytkownik anuluje
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Okno potwierdzenia z onOk

```ts
await ctx.modal.confirm({
  title: 'Potwierdź przesłanie',
  content: 'Po przesłaniu zmian nie będzie można modyfikować. Czy chcesz kontynuować?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Komunikat o błędzie

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Sukces', content: 'Operacja zakończona pomyślnie' });
} catch (e) {
  ctx.modal.error({ title: 'Błąd', content: e.message });
}
```

## Powiązane

- [ctx.message](./message.md): Lekki tymczasowy komunikat, znika automatycznie.
- [ctx.exit()](./exit.md): Często używane jako `if (!confirmed) ctx.exit()`, aby zakończyć przepływ, gdy użytkownik anuluje potwierdzenie.
- [ctx.openView()](./open-view.md): Otwiera niestandardowy widok, odpowiedni dla złożonych interakcji.