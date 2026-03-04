:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/exit-all).
:::

# ctx.exitAll()

Kończy bieżący przepływ zdarzeń oraz wszystkie kolejne przepływy zdarzeń wywołane w ramach tego samego harmonogramu zdarzeń. Jest powszechnie używana, gdy wszystkie przepływy w ramach bieżącego zdarzenia muszą zostać natychmiast przerwane z powodu błędu globalnego lub niepowodzenia weryfikacji uprawnień.

## Scenariusze użycia

`ctx.exitAll()` jest zazwyczaj używana w kontekstach wykonywalnego kodu JS, gdy konieczne jest **jednoczesne przerwanie bieżącego przepływu zdarzeń oraz kolejnych przepływów wywołanych przez to zdarzenie**:

| Scenariusz | Opis |
|------|------|
| **Przepływ zdarzeń** | Weryfikacja głównego przepływu zdarzeń nie powiodła się (np. niewystarczające uprawnienia), co wymaga zakończenia głównego przepływu i wszelkich kolejnych przepływów w ramach tego samego zdarzenia, które nie zostały jeszcze wykonane. |
| **Reguły powiązań** | Gdy weryfikacja powiązania nie powiedzie się, bieżące powiązanie i kolejne powiązania wywołane przez to samo zdarzenie muszą zostać przerwane. |
| **Zdarzenia akcji** | Weryfikacja przed wykonaniem akcji nie powiodła się (np. sprawdzenie uprawnień przed usunięciem), co wymaga zablokowania głównej akcji i kolejnych kroków. |

> Różnica względem `ctx.exit()`: `ctx.exit()` kończy tylko bieżący przepływ zdarzeń; `ctx.exitAll()` kończy bieżący przepływ zdarzeń oraz wszelkie **niewykonane** kolejne przepływy w ramach tego samego harmonogramu zdarzeń.

## Definicja typu

```ts
exitAll(): never;
```

Wywołanie `ctx.exitAll()` rzuca wewnętrzny wyjątek `FlowExitAllException`, który jest przechwytywany przez silnik przepływów (FlowEngine) w celu zatrzymania instancji bieżącego przepływu zdarzeń oraz kolejnych przepływów w ramach tego samego zdarzenia. Po wywołaniu, pozostałe instrukcje w bieżącym kodzie JS nie zostaną wykonane.

## Porównanie z ctx.exit()

| Metoda | Zakres działania |
|------|----------|
| `ctx.exit()` | Kończy tylko bieżący przepływ zdarzeń; kolejne przepływy pozostają nienaruszone. |
| `ctx.exitAll()` | Kończy bieżący przepływ zdarzeń i przerywa kolejne przepływy wykonywane **sekwencyjnie** w ramach tego samego zdarzenia. |

## Tryb wykonywania

- **Wykonywanie sekwencyjne (sequential)**: Przepływy zdarzeń w ramach tego samego zdarzenia są wykonywane w kolejności. Jeśli jakikolwiek przepływ wywoła `ctx.exitAll()`, kolejne przepływy nie zostaną wykonane.
- **Wykonywanie równoległe (parallel)**: Przepływy zdarzeń w ramach tego samego zdarzenia są wykonywane równolegle. Wywołanie `ctx.exitAll()` w jednym przepływie nie przerwie innych współbieżnych przepływów (ponieważ są one niezależne).

## Przykłady

### Przerwanie wszystkich przepływów zdarzeń w przypadku niepowodzenia weryfikacji uprawnień

```ts
// Przerwanie głównego przepływu zdarzeń i kolejnych przepływów w przypadku niewystarczających uprawnień
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Brak uprawnień do operacji' });
  ctx.exitAll();
}
```

### Przerwanie w przypadku niepowodzenia globalnej weryfikacji wstępnej

```ts
// Przykład: Jeśli przed usunięciem okaże się, że powiązane dane nie mogą zostać usunięte, należy zablokować główny przepływ i kolejne działania
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Nie można usunąć: istnieją powiązane dane');
  ctx.exitAll();
}
```

### Wybór między ctx.exit() a ctx.exitAll()

```ts
// Tylko bieżący przepływ zdarzeń musi zostać przerwany -> Użyj ctx.exit()
if (!params.valid) {
  ctx.message.error('Nieprawidłowe parametry');
  ctx.exit();  // Kolejne przepływy pozostają nienaruszone
}

// Konieczne jest przerwanie wszystkich kolejnych przepływów w ramach bieżącego zdarzenia -> Użyj ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Niewystarczające uprawnienia' });
  ctx.exitAll();  // Zarówno główny przepływ, jak i kolejne przepływy w ramach tego samego zdarzenia zostają przerwane
}
```

### Wyświetlenie komunikatu przed przerwaniem

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Proszę najpierw poprawić błędy w formularzu');
  ctx.exitAll();
}
```

## Uwagi

- Po wywołaniu `ctx.exitAll()`, dalszy kod w bieżącym JS nie zostanie wykonany. Zaleca się wyjaśnienie przyczyny użytkownikowi za pomocą `ctx.message`, `ctx.notification` lub okna modalnego przed wywołaniem tej metody.
- Kod biznesowy zazwyczaj nie musi przechwytywać `FlowExitAllException`; należy pozwolić silnikowi przepływów na jego obsługę.
- Jeśli chcą Państwo zatrzymać tylko bieżący przepływ zdarzeń bez wpływu na kolejne, należy użyć `ctx.exit()`.
- W trybie równoległym `ctx.exitAll()` kończy tylko bieżący przepływ zdarzeń i nie przerywa innych współbieżnych przepływów.

## Powiązane

- [ctx.exit()](./exit.md): Kończy tylko bieżący przepływ zdarzeń
- [ctx.message](./message.md): Komunikaty podpowiedzi
- [ctx.modal](./modal.md): Modalne okno potwierdzenia