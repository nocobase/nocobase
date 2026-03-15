:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/index).
:::

# Przegląd RunJS

RunJS to środowisko wykonawcze JavaScript używane w NocoBase w scenariuszach takich jak **bloki JS**, **pola JS** oraz **akcje JS**. Kod jest uruchamiany w ograniczonej piaskownicy (sandbox), zapewniając bezpieczny dostęp do `ctx` (Context API) i oferuje następujące możliwości:

- Top-level `await` (asynchroniczność na najwyższym poziomie)
- Importowanie modułów zewnętrznych
- Renderowanie wewnątrz kontenerów
- Zmienne globalne

## Top-level await

RunJS obsługuje top-level `await`, co eliminuje konieczność owijania kodu w natychmiastowo wywoływane wyrażenia funkcyjne (IIFE).

**Niezalecane**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Zalecane**

```js
async function test() {}
await test();
```

## Importowanie modułów zewnętrznych

- Używaj `ctx.importAsync()` dla modułów ESM (zalecane)
- Używaj `ctx.requireAsync()` dla modułów UMD/AMD

## Renderowanie wewnątrz kontenerów

Użyj `ctx.render()`, aby wyrenderować zawartość w bieżącym kontenerze (`ctx.element`). Obsługiwane są następujące trzy formaty:

### Renderowanie JSX

```jsx
ctx.render(<button>Button</button>);
```

### Renderowanie węzłów DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Renderowanie ciągów HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Zmienne globalne

- `window`
- `document`
- `navigator`
- `ctx`