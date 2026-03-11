:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/on).
:::

# ctx.on()

Subskrybuj zdarzenia kontekstu (takie jak zmiany wartości pól, zmiany właściwości, odświeżanie zasobów itp.) w RunJS. Zdarzenia są mapowane na niestandardowe zdarzenia DOM w `ctx.element` lub wewnętrzną szynę zdarzeń `ctx.resource` w zależności od ich typu.

## Scenariusze zastosowań

| Scenariusz | Opis |
|------|------|
| **JSField / JSEditableField** | Nasłuchiwanie zmian wartości pola ze źródeł zewnętrznych (formularze, powiązania itp.) w celu synchronicznej aktualizacji interfejsu użytkownika, realizując dwukierunkowe wiązanie danych. |
| **JSBlock / JSItem / JSColumn** | Nasłuchiwanie niestandardowych zdarzeń w kontenerze w celu reagowania na zmiany danych lub stanu. |
| **Związane z zasobami (resource)** | Nasłuchiwanie zdarzeń cyklu życia zasobów, takich jak odświeżenie lub zapisanie, w celu wykonania logiki po aktualizacji danych. |

## Definicja typu

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Typowe zdarzenia

| Nazwa zdarzenia | Opis | Źródło zdarzenia |
|--------|------|----------|
| `js-field:value-change` | Wartość pola została zmodyfikowana zewnętrznie (np. powiązanie formularza, aktualizacja wartości domyślnej) | CustomEvent w `ctx.element`, gdzie `ev.detail` to nowa wartość |
| `resource:refresh` | Dane zasobu zostały odświeżone | Szyna zdarzeń `ctx.resource` |
| `resource:saved` | Zapisywanie zasobu zakończone | Szyna zdarzeń `ctx.resource` |

> Reguły mapowania zdarzeń: Zdarzenia z prefiksem `resource:` są przekazywane do `ctx.resource.on`, pozostałe zazwyczaj trafiają do zdarzeń DOM w `ctx.element` (jeśli istnieje).

## Przykłady

### Dwukierunkowe wiązanie pola (React useEffect + czyszczenie)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Natywne nasłuchiwanie DOM (alternatywa, gdy ctx.on jest niedostępne)

```ts
// Gdy ctx.on nie jest dostępne, można użyć bezpośrednio ctx.element
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Podczas czyszczenia: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Aktualizacja interfejsu użytkownika po odświeżeniu zasobu

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Aktualizacja renderowania na podstawie danych
});
```

## Współpraca z ctx.off

- Subskrypcje zarejestrowane za pomocą `ctx.on` powinny być usuwane w odpowiednim momencie poprzez [ctx.off](./off.md), aby uniknąć wycieków pamięci lub powtarzającego się wyzwalania zdarzeń.
- W React, `ctx.off` jest zazwyczaj wywoływane wewnątrz funkcji czyszczącej (cleanup) `useEffect`.
- `ctx.off` może nie istnieć; zaleca się używanie opcjonalnego łańcucha: `ctx.off?.('eventName', handler)`.

## Uwagi

1. **Parowanie i anulowanie**: Każdemu wywołaniu `ctx.on(eventName, handler)` powinno odpowiadać `ctx.off(eventName, handler)`, a przekazana referencja do funkcji `handler` musi być identyczna.
2. **Cykl życia**: Należy usuwać nasłuchiwanie przed odmontowaniem komponentu lub zniszczeniem kontekstu, aby zapobiec wyciekom pamięci.
3. **Dostępność zdarzeń**: Różne typy kontekstów obsługują różne zdarzenia. Szczegółowe informacje można znaleźć w dokumentacji poszczególnych komponentów.

## Powiązana dokumentacja

- [ctx.off](./off.md) - Usuwanie nasłuchiwania zdarzeń
- [ctx.element](./element.md) - Kontener renderowania i zdarzenia DOM
- [ctx.resource](./resource.md) - Instancja zasobu oraz jego metody `on`/`off`
- [ctx.setValue](./set-value.md) - Ustawianie wartości pola (wyzwala `js-field:value-change`)