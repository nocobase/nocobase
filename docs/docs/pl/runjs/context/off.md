:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/off).
:::

# ctx.off()

Usuwa słuchacze zdarzeń zarejestrowane za pomocą `ctx.on(eventName, handler)`. Jest często używana w połączeniu z [ctx.on](./on.md) w celu anulowania subskrypcji w odpowiednim momencie, co pozwala uniknąć wycieków pamięci lub powtarzających się wywołań.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **Czyszczenie w React useEffect** | Wywoływana wewnątrz funkcji czyszczącej `useEffect`, aby usunąć słuchacze w momencie odmontowywania komponentu. |
| **JSField / JSEditableField** | Anulowanie subskrypcji `js-field:value-change` podczas dwukierunkowego wiązania danych dla pól. |
| **Powiązane z zasobami (resource)** | Anulowanie subskrypcji zdarzeń takich jak `refresh` lub `saved`, zarejestrowanych przez `ctx.resource.on`. |

## Definicja typu

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Przykłady

### Użycie w parze w React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Anulowanie subskrypcji zdarzeń zasobów

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// W odpowiednim momencie
ctx.resource?.off('refresh', handler);
```

## Uwagi

1. **Spójność referencji handlera**: Handler przekazywany do `ctx.off` musi być tą samą referencją, która została użyta w `ctx.on`. W przeciwnym razie usunięcie słuchacza nie będzie możliwe.
2. **Terminowe czyszczenie**: Należy wywołać `ctx.off` przed odmontowaniem komponentu lub zniszczeniem kontekstu, aby zapobiec wyciekom pamięci.

## Powiązane dokumenty

- [ctx.on](./on.md) – Subskrybowanie zdarzeń
- [ctx.resource](./resource.md) – Instancja zasobu i jej metody `on`/`off`