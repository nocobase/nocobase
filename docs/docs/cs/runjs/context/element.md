:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/element).
:::

# ctx.element

Instance `ElementProxy` odkazující na DOM kontejner sandboxu, která slouží jako výchozí cíl vykreslování pro `ctx.render()`. Je k dispozici v případech, kdy existuje kontejner pro vykreslování, jako jsou `JSBlock`, `JSField`, `JSItem` a `JSColumn`.

## Vhodné scénáře

| Scénář | Popis |
|------|------|
| **JSBlock** | DOM kontejner bloku, slouží k vykreslování vlastního obsahu bloku. |
| **JSField / JSItem / FormJSFieldItem** | Kontejner pro vykreslování pole nebo položky formuláře (obvykle `<span>`). |
| **JSColumn** | DOM kontejner buňky tabulky, slouží k vykreslování vlastního obsahu sloupce. |

> Poznámka: `ctx.element` je k dispozici pouze v kontextech RunJS, které mají kontejner pro vykreslování. V kontextech bez UI (např. čistě backendová logika) může být `undefined`. Před použitím doporučujeme provést kontrolu na prázdnou hodnotu.

## Definice typu

```typescript
element: ElementProxy | undefined;

// ElementProxy je proxy pro surový HTMLElement, která vystavuje bezpečné API
class ElementProxy {
  __el: HTMLElement;  // Interní surový DOM prvek (přístupný pouze ve specifických scénářích)
  innerHTML: string;  // Při čtení/zápisu sanitováno pomocí DOMPurify
  outerHTML: string; // Stejné jako výše
  appendChild(child: HTMLElement | string): void;
  // Ostatní metody HTMLElement jsou předávány přímo (přímé použití se nedoporučuje)
}
```

## Bezpečnostní požadavky

**Doporučení: Veškeré vykreslování by mělo být prováděno prostřednictvím `ctx.render()`.** Vyhněte se přímému používání DOM API u `ctx.element` (např. `innerHTML`, `appendChild`, `querySelector` atd.).

### Proč je doporučeno ctx.render()

| Výhoda | Popis |
|------|------|
| **Bezpečnost** | Centralizovaná kontrola bezpečnosti, zabránění XSS a nesprávným operacím s DOM. |
| **Podpora Reactu** | Plná podpora pro JSX, React komponenty a životní cykly. |
| **Dědičnost kontextu** | Automaticky dědí aplikaci `ConfigProvider`, témata atd. |
| **Řešení konfliktů** | Automaticky spravuje vytváření/odstraňování kořenů Reactu, aby se předešlo konfliktům mezi více instancemi. |

### ❌ Nedoporučeno: Přímá manipulace s ctx.element

```ts
// ❌ Nedoporučeno: Přímé použití API ctx.element
ctx.element.innerHTML = '<div>Obsah</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` je zastaralé. Místo něj prosím použijte `ctx.render()`.

### ✅ Doporučeno: Použití ctx.render()

```ts
// ✅ Vykreslení React komponenty
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Vítejte')}>
    <Button type="primary">Kliknout</Button>
  </Card>
);

// ✅ Vykreslení HTML řetězce
ctx.render('<div style="padding:16px;">' + ctx.t('Obsah') + '</div>');

// ✅ Vykreslení DOM uzlu
const div = document.createElement('div');
div.textContent = ctx.t('Ahoj');
ctx.render(div);
```

## Speciální případ: Jako kotva pro Popover

V případě, že potřebujete otevřít Popover s aktuálním prvkem jako kotvou, můžete přistoupit k `ctx.element?.__el` a získat surový DOM jako `target`:

```ts
// ctx.viewer.popover vyžaduje surový DOM jako target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Obsah vyskakovacího okna</div>,
});
```

> `__el` používejte pouze v těchto scénářích „použití aktuálního kontejneru jako kotvy“; v ostatních případech s DOM přímo nemanipulujte.

## Vztah k ctx.render

- Pokud je `ctx.render(vnode)` voláno bez argumentu `container`, vykresluje se ve výchozím nastavení do kontejneru `ctx.element`.
- Pokud chybí `ctx.element` a zároveň není zadán žádný `container`, dojde k chybě.
- Kontejner můžete specifikovat explicitně: `ctx.render(vnode, customContainer)`.

## Poznámky

- `ctx.element` je určen pro interní použití funkcí `ctx.render()`. Přímý přístup k jeho vlastnostem nebo metodám nebo jejich úprava se nedoporučuje.
- V kontextech bez kontejneru pro vykreslování bude `ctx.element` mít hodnotu `undefined`. Před voláním `ctx.render()` se ujistěte, že je kontejner k dispozici, nebo jej předejte ručně.
- Přestože jsou `innerHTML`/`outerHTML` v `ElementProxy` sanitovány pomocí DOMPurify, stále se doporučuje používat `ctx.render()` pro jednotnou správu vykreslování.

## Související

- [ctx.render](./render.md): Vykreslování obsahu do kontejneru
- [ctx.view](./view.md): Aktuální ovladač zobrazení
- [ctx.modal](./modal.md): Rychlé API pro modální okna