:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/index).
:::

# Přehled RunJS

RunJS je prostředí pro spouštění JavaScriptu v NocoBase, které se používá pro scénáře jako **JS bloky**, **JS pole** a **JS akce**. Kód běží v omezeném sandboxu, který poskytuje bezpečný přístup k `ctx` (Context API) a nabízí následující možnosti:

- Top-level `await`
- Importování externích modulů
- Vykreslování v rámci kontejnerů
- Globální proměnné

## Top-level `await`

RunJS podporuje top-level `await`, takže není nutné kód obalovat do IIFE.

**Nedoporučuje se**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Doporučuje se**

```js
async function test() {}
await test();
```

## Importování externích modulů

- Pro ESM moduly použijte `ctx.importAsync()` (doporučeno)
- Pro UMD/AMD moduly použijte `ctx.requireAsync()`

## Vykreslování v rámci kontejnerů

Použijte `ctx.render()` pro vykreslení obsahu do aktuálního kontejneru (`ctx.element`). Podporuje následující tři formáty:

### Vykreslování JSX

```jsx
ctx.render(<button>Button</button>);
```

### Vykreslování DOM uzlů

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Vykreslování HTML řetězců

```js
ctx.render('<h1>Hello World</h1>');
```

## Globální proměnné

- `window`
- `document`
- `navigator`
- `ctx`