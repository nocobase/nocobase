:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/index).
:::

# RunJS Übersicht

RunJS ist die JavaScript-Ausführungsumgebung in NocoBase für Szenarien wie **JS-Blöcke**, **JS-Felder** und **JS-Aktionen**. Der Code wird in einer eingeschränkten Sandbox ausgeführt, bietet sicheren Zugriff auf die `ctx` (Kontext-API) und verfügt über die folgenden Funktionen:

- Top-Level `await`
- Importieren externer Module
- Rendern innerhalb von Containern
- Globale Variablen

## Top-Level await

RunJS unterstützt Top-Level `await`, sodass der Code nicht in eine IIFE (Immediately Invoked Function Expression) eingeschlossen werden muss.

**Nicht empfohlen**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Empfohlen**

```js
async function test() {}
await test();
```

## Importieren externer Module

- Verwenden Sie `ctx.importAsync()` für ESM-Module (empfohlen)
- Verwenden Sie `ctx.requireAsync()` für UMD/AMD-Module

## Rendern innerhalb von Containern

Verwenden Sie `ctx.render()`, um Inhalte in den aktuellen Container (`ctx.element`) zu rendern. Es werden die folgenden drei Formate unterstützt:

### JSX rendern

```jsx
ctx.render(<button>Button</button>);
```

### DOM-Knoten rendern

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### HTML-Strings rendern

```js
ctx.render('<h1>Hello World</h1>');
```

## Globale Variablen

- `window`
- `document`
- `navigator`
- `ctx`