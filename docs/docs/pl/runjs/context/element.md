:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/element).
:::

# ctx.element

Instancja `ElementProxy` wskazująca na kontener DOM piaskownicy (sandbox), służąca jako domyślny cel renderowania dla `ctx.render()`. Jest dostępna w scenariuszach, w których istnieje kontener renderowania, takich jak `JSBlock`, `JSField`, `JSItem` oraz `JSColumn`.

## Mające zastosowanie scenariusze

| Scenariusz | Opis |
|------|------|
| **JSBlock** | Kontener DOM bloku, używany do renderowania niestandardowej zawartości bloku. |
| **JSField / JSItem / FormJSFieldItem** | Kontener renderowania dla pola lub elementu formularza (zazwyczaj `<span>`). |
| **JSColumn** | Kontener DOM komórki tabeli, używany do renderowania niestandardowej zawartości kolumny. |

> Uwaga: `ctx.element` jest dostępny tylko w kontekstach RunJS posiadających kontener renderowania. W scenariuszach bez interfejsu użytkownika (np. czysta logika backendowa) może mieć wartość `undefined`. Przed użyciem zaleca się sprawdzenie, czy wartość nie jest pusta.

## Definicja typu

```typescript
element: ElementProxy | undefined;

// ElementProxy to pośrednik (proxy) dla surowego HTMLElement, udostępniający bezpieczne API
class ElementProxy {
  __el: HTMLElement;  // Wewnętrzny natywny element DOM (dostępny tylko w szczególnych przypadkach)
  innerHTML: string;  // Oczyszczane przez DOMPurify podczas odczytu/zapisu
  outerHTML: string; // Jak wyżej
  appendChild(child: HTMLElement | string): void;
  // Inne metody HTMLElement są przekazywane dalej (bezpośrednie użycie nie jest zalecane)
}
```

## Wymogi bezpieczeństwa

**Rekomendacja: Wszystkie operacje renderowania powinny być wykonywane za pomocą `ctx.render()`.** Należy unikać bezpośredniego korzystania z API DOM obiektu `ctx.element` (np. `innerHTML`, `appendChild`, `querySelector` itp.).

### Dlaczego `ctx.render()` jest zalecane

| Zaleta | Opis |
|------|------|
| **Bezpieczeństwo** | Scentralizowana kontrola bezpieczeństwa, pozwalająca uniknąć ataków XSS i niewłaściwych operacji na DOM. |
| **Wsparcie dla React** | Pełne wsparcie dla JSX, komponentów React i cyklu życia. |
| **Dziedziczenie kontekstu** | Automatyczne dziedziczenie `ConfigProvider` aplikacji, motywów itp. |
| **Obsługa konfliktów** | Automatyczne zarządzanie tworzeniem i odmontowywaniem korzenia (root) React, co pozwala uniknąć konfliktów między instancjami. |

### ❌ Niezalecane: Bezpośrednia manipulacja ctx.element

```ts
// ❌ Niezalecane: Bezpośrednie użycie API ctx.element
ctx.element.innerHTML = '<div>Zawartość</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` jest przestarzałe (deprecated). Prosimy o korzystanie z `ctx.render()` w zamian.

### ✅ Zalecane: Korzystanie z ctx.render()

```ts
// ✅ Renderowanie komponentu React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Witamy')}>
    <Button type="primary">Kliknij</Button>
  </Card>
);

// ✅ Renderowanie ciągu znaków HTML
ctx.render('<div style="padding:16px;">' + ctx.t('Zawartość') + '</div>');

// ✅ Renderowanie węzła DOM
const div = document.createElement('div');
div.textContent = ctx.t('Witaj');
ctx.render(div);
```

## Przypadek szczególny: Jako punkt zakotwiczenia dla Popover

W przypadkach, gdy konieczne jest otwarcie Popovera z bieżącym elementem jako punktem zakotwiczenia, można uzyskać dostęp do `ctx.element?.__el`, aby pobrać natywny DOM jako `target`:

```ts
// ctx.viewer.popover wymaga natywnego DOM jako target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Zawartość wyskakująca</div>,
});
```

> Używaj `__el` wyłącznie w scenariuszach typu „użycie bieżącego kontenera jako punktu zakotwiczenia”; w innych przypadkach nie należy bezpośrednio manipulować DOM.

## Relacja z ctx.render

- Jeśli `ctx.render(vnode)` zostanie wywołane bez argumentu `container`, domyślnie renderuje do kontenera `ctx.element`.
- Jeśli brakuje zarówno `ctx.element`, jak i nie podano `container`, zostanie zgłoszony błąd.
- Można jawnie określić kontener: `ctx.render(vnode, customContainer)`.

## Uwagi

- `ctx.element` jest przeznaczony do użytku wewnętrznego przez `ctx.render()`. Bezpośredni dostęp lub modyfikacja jego właściwości/metod nie są zalecane.
- W kontekstach bez kontenera renderowania `ctx.element` będzie miał wartość `undefined`. Przed wywołaniem `ctx.render()` należy upewnić się, że kontener jest dostępny lub przekazać go ręcznie.
- Chociaż `innerHTML`/`outerHTML` w `ElementProxy` są oczyszczane przez DOMPurify, nadal zaleca się korzystanie z `ctx.render()` w celu ujednoliconego zarządzania renderowaniem.

## Powiązane

- [ctx.render](./render.md): Renderowanie zawartości do kontenera
- [ctx.view](./view.md): Kontroler bieżącego widoku
- [ctx.modal](./modal.md): Skrócone API dla okien modalnych