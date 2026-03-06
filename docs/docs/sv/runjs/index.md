:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/index).
:::

# Översikt av RunJS

RunJS är exekveringsmiljön för JavaScript som används i NocoBase för scenarier som **JS-block**, **JS-fält** och **JS-åtgärder**. Koden körs i en begränsad sandlåda, vilket ger säker åtkomst till `ctx` (Context API) och omfattar följande funktioner:

- Asynkron väntan på toppnivå (Top-level `await`)
- Importera externa moduler
- Rendering i behållare
- Globala variabler

## Asynkron väntan på toppnivå (Top-level `await`)

RunJS stöder `await` på toppnivå, vilket eliminerar behovet av att omsluta koden i en IIFE.

**Rekommenderas inte**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Rekommenderas**

```js
async function test() {}
await test();
```

## Importera externa moduler

- Använd `ctx.importAsync()` för ESM-moduler (Rekommenderas)
- Använd `ctx.requireAsync()` för UMD/AMD-moduler

## Rendering i behållare

Använd `ctx.render()` för att rendera innehåll i den aktuella behållaren (`ctx.element`). Den stöder följande tre format:

### Rendera JSX

```jsx
ctx.render(<button>Button</button>);
```

### Rendera DOM-noder

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Rendera HTML-strängar

```js
ctx.render('<h1>Hello World</h1>');
```

## Globala variabler

- `window`
- `document`
- `navigator`
- `ctx`