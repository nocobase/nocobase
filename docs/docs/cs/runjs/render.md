:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/render).
:::

# Vykreslování v kontejneru

Použijte `ctx.render()` k vykreslení obsahu do aktuálního kontejneru (`ctx.element`). Podporovány jsou následující tři formy:

## `ctx.render()`

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

## Popis JSX

RunJS dokáže vykreslovat JSX přímo. Můžete použít vestavěný React / knihovny komponent nebo načíst externí závislosti podle potřeby.

### Použití vestavěného Reactu a knihoven komponent

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Použití externího Reactu a knihoven komponent

Načtěte konkrétní verze podle potřeby pomocí `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Vhodné pro scénáře vyžadující konkrétní verze nebo komponenty třetích stran.

## ctx.element

Nedoporučené použití (zastaralé):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Doporučený způsob:

```js
ctx.render(<h1>Hello World</h1>);
```