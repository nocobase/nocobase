:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/exit).
:::

# ctx.exit()

Przerywa wykonywanie bieżącego przepływu zdarzeń; kolejne kroki nie zostaną uruchomione. Jest powszechnie stosowany, gdy warunki biznesowe nie są spełnione, użytkownik anuluje akcję lub wystąpi nieodwracalny błąd.

## Scenariusze użycia

`ctx.exit()` jest zazwyczaj używany w następujących kontekstach, w których można wykonywać kod JS:

| Scenariusz | Opis |
|------|------|
| **Przepływ zdarzeń** | W przepływach zdarzeń wyzwalanych przez przesyłanie formularzy, kliknięcia przycisków itp., przerywa kolejne kroki, gdy warunki nie są spełnione. |
| **Reguły powiązań** | W powiązaniach pól, powiązaniach filtrów itp., przerywa bieżący przepływ zdarzeń, gdy walidacja zakończy się niepowodzeniem lub gdy należy pominąć wykonanie. |
| **Zdarzenia operacji** | W niestandardowych operacjach (np. potwierdzenie usunięcia, walidacja przed zapisem), kończy działanie, gdy użytkownik anuluje lub walidacja nie przejdzie pomyślnie. |

> Różnica względem `ctx.exitAll()`: `ctx.exit()` przerywa tylko bieżący przepływ zdarzeń; inne przepływy zdarzeń w ramach tego samego zdarzenia pozostają nienaruszone. `ctx.exitAll()` przerywa bieżący przepływ zdarzeń, a także wszelkie kolejne przepływy zdarzeń w ramach tego samego zdarzenia, które nie zostały jeszcze wykonane.

## Definicja typu

```ts
exit(): never;
```

Wywołanie `ctx.exit()` rzuca wewnętrzny wyjątek `FlowExitException`, który jest przechwytywany przez silnik przepływu zdarzeń w celu zatrzymania wykonywania bieżącego przepływu. Po wywołaniu, pozostałe instrukcje w bieżącym kodzie JS nie zostaną wykonane.

## Porównanie z ctx.exitAll()

| Metoda | Zakres działania |
|------|----------|
| `ctx.exit()` | Przerywa tylko bieżący przepływ zdarzeń; kolejne przepływy zdarzeń pozostają nienaruszone. |
| `ctx.exitAll()` | Przerywa bieżący przepływ zdarzeń i przerywa kolejne przepływy zdarzeń w ramach tego samego zdarzenia, które są ustawione na **wykonywanie sekwencyjne**. |

## Przykłady

### Wyjście po anulowaniu przez użytkownika

```ts
// W oknie potwierdzenia, jeśli użytkownik kliknie "Anuluj", przerwij przepływ zdarzeń
if (!confirmed) {
  ctx.message.info('Operacja została anulowana');
  ctx.exit();
}
```

### Wyjście w przypadku niepowodzenia walidacji parametrów

```ts
// Wyświetl komunikat i przerwij, gdy walidacja się nie powiedzie
if (!params.value || params.value.length < 3) {
  ctx.message.error('Nieprawidłowe parametry, długość musi wynosić co najmniej 3');
  ctx.exit();
}
```

### Wyjście, gdy warunki biznesowe nie są spełnione

```ts
// Przerwij, jeśli warunki nie są spełnione; kolejne kroki nie zostaną wykonane
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Można przesyłać tylko wersje robocze' });
  ctx.exit();
}
```

### Wybór między ctx.exit() a ctx.exitAll()

```ts
// Tylko bieżący przepływ zdarzeń musi zostać przerwany → Użyj ctx.exit()
if (!params.valid) {
  ctx.message.error('Nieprawidłowe parametry');
  ctx.exit();  // Inne przepływy zdarzeń pozostają nienaruszone
}

// Należy przerwać wszystkie kolejne przepływy zdarzeń w ramach bieżącego zdarzenia → Użyj ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Brak wystarczających uprawnień' });
  ctx.exitAll();  // Zarówno bieżący przepływ, jak i kolejne przepływy w ramach tego samego zdarzenia zostaną przerwane
}
```

### Wyjście na podstawie wyboru użytkownika po potwierdzeniu w oknie modalnym

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Potwierdź usunięcie',
  content: 'Tej operacji nie można cofnąć. Czy chcesz kontynuować?',
});
if (!ok) {
  ctx.message.info('Anulowano');
  ctx.exit();
}
```

## Uwagi

- Po wywołaniu `ctx.exit()`, dalszy kod w bieżącym skrypcie JS nie zostanie wykonany; zaleca się wyjaśnienie przyczyny użytkownikowi za pomocą `ctx.message`, `ctx.notification` lub okna modalnego przed wywołaniem tej metody.
- Zazwyczaj nie ma potrzeby przechwytywania `FlowExitException` w kodzie biznesowym; należy pozwolić silnikowi przepływu zdarzeń na jego obsługę.
- Jeśli zachodzi potrzeba przerwania wszystkich kolejnych przepływów zdarzeń w ramach bieżącego zdarzenia, należy użyć `ctx.exitAll()`.

## Powiązane

- [ctx.exitAll()](./exit-all.md): Przerywa bieżący przepływ zdarzeń oraz kolejne przepływy zdarzeń w ramach tego samego zdarzenia.
- [ctx.message](./message.md): Komunikaty informacyjne.
- [ctx.modal](./modal.md): Okna modalne potwierdzenia.