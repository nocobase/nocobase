:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/render).
:::

# ctx.render()

Renderuje elementy React, ciągi znaków HTML lub węzły DOM w określonym kontenerze. Jeśli `container` nie zostanie podany, domyślnie renderuje do `ctx.element` i automatycznie dziedziczy kontekst aplikacji, taki jak ConfigProvider i motywy.

## Scenariusze zastosowania

| Scenariusz | Opis |
|------|------|
| **JSBlock** | Renderowanie niestandardowej zawartości bloków (wykresy, listy, karty itp.) |
| **JSField / JSItem / JSColumn** | Renderowanie niestandardowych widoków dla pól edytowalnych lub kolumn tabeli |
| **Blok szczegółów** | Dostosowywanie formatu wyświetlania pól na stronach szczegółów |

> Uwaga: `ctx.render()` wymaga kontenera renderowania. Jeśli `container` nie zostanie przekazany, a `ctx.element` nie istnieje (np. w scenariuszach czysto logicznych bez interfejsu użytkownika), zostanie zgłoszony błąd.

## Definicja typu

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parametr | Typ | Opis |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Zawartość do wyrenderowania |
| `container` | `Element` \| `DocumentFragment` (opcjonalnie) | Docelowy kontener renderowania, domyślnie `ctx.element` |

**Wartość zwracana**:

- Przy renderowaniu **elementu React**: Zwraca `ReactDOMClient.Root`, co ułatwia wywołanie `root.render()` w celu późniejszych aktualizacji.
- Przy renderowaniu **ciągu znaków HTML** lub **węzła DOM**: Zwraca `null`.

## Opis typów vnode

| Typ | Zachowanie |
|------|------|
| `React.ReactElement` (JSX) | Renderowane przy użyciu `createRoot` Reacta, zapewniając pełne możliwości Reacta i automatycznie dziedzicząc kontekst aplikacji. |
| `string` | Ustawia `innerHTML` kontenera po oczyszczeniu za pomocą DOMPurify; wszelkie istniejące korzenie (roots) Reacta zostaną najpierw odmontowane. |
| `Node` (Element, Text itp.) | Dodaje za pomocą `appendChild` po wyczyszczeniu kontenera; wszelkie istniejące korzenie Reacta zostaną najpierw odmontowane. |
| `DocumentFragment` | Dodaje węzły podrzędne fragmentu do kontenera; wszelkie istniejące korzenie Reacta zostaną najpierw odmontowane. |

## Przykłady

### Renderowanie elementów React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Tytuł')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Kliknięto'))}>
      {ctx.t('Przycisk')}
    </Button>
  </Card>
);
```

### Renderowanie ciągów znaków HTML

```ts
ctx.render('<h1>Witaj świecie</h1>');

// Łączenie z ctx.t w celu internacjonalizacji
ctx.render('<div style="padding:16px">' + ctx.t('Zawartość') + '</div>');

// Renderowanie warunkowe
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Brak danych') + '</span>');
```

### Renderowanie węzłów DOM

```ts
const div = document.createElement('div');
div.textContent = 'Witaj świecie';
ctx.render(div);

// Najpierw wyrenderuj pusty kontener, a następnie przekaż go do zewnętrznej biblioteki (np. ECharts) w celu inicjalizacji
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Określanie niestandardowego kontenera

```ts
// Renderowanie do konkretnego elementu DOM
const customEl = document.getElementById('my-container');
ctx.render(<div>Zawartość</div>, customEl);
```

### Wielokrotne wywołania zastępują zawartość

```ts
// Drugie wywołanie zastąpi istniejącą zawartość w kontenerze
ctx.render(<div>Pierwszy</div>);
ctx.render(<div>Drugi</div>);  // Wyświetlone zostanie tylko „Drugi”
```

## Uwagi

- **Wielokrotne wywołania zastępują zawartość**: Każde wywołanie `ctx.render()` zastępuje istniejącą zawartość w kontenerze, zamiast ją dopisywać.
- **Bezpieczeństwo ciągów HTML**: Przekazany HTML jest oczyszczany za pomocą DOMPurify w celu zmniejszenia ryzyka XSS, jednak nadal zaleca się unikanie łączenia niezaufanych danych wejściowych użytkownika.
- **Nie należy bezpośrednio manipulować ctx.element**: `ctx.element.innerHTML` jest przestarzałe; zamiast tego należy konsekwentnie używać `ctx.render()`.
- **Przekaż kontener, gdy domyślny nie istnieje**: W scenariuszach, w których `ctx.element` ma wartość `undefined` (np. wewnątrz modułów ładowanych przez `ctx.importAsync`), należy jawnie podać `container`.

## Powiązane

- [ctx.element](./element.md) – Domyślny kontener renderowania, używany gdy nie przekazano kontenera do `ctx.render()`.
- [ctx.libs](./libs.md) – Wbudowane biblioteki, takie jak React i Ant Design, używane do renderowania JSX.
- [ctx.importAsync()](./import-async.md) – Używane w połączeniu z `ctx.render()` po załadowaniu zewnętrznych bibliotek React/komponentów na żądanie.