:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/index).
:::

# Introducción a RunJS

RunJS es el entorno de ejecución de JavaScript utilizado en NocoBase para escenarios como **bloques JS**, **campos JS** y **acciones JS**. El código se ejecuta en un entorno aislado (sandbox) restringido, proporcionando acceso seguro a `ctx` (API de contexto) e incluye las siguientes capacidades:

- `await` de nivel superior (Top-level `await`)
- Importación de módulos externos
- Renderizado dentro de contenedores
- Variables globales

## `await` de nivel superior (Top-level `await`)

RunJS admite `await` de nivel superior, eliminando la necesidad de envolver el código en una IIFE.

**No recomendado**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Recomendado**

```js
async function test() {}
await test();
```

## Importación de módulos externos

- Utilice `ctx.importAsync()` para módulos ESM (Recomendado)
- Utilice `ctx.requireAsync()` para módulos UMD/AMD

## Renderizado dentro de contenedores

Utilice `ctx.render()` para renderizar contenido en el contenedor actual (`ctx.element`). Admite los siguientes tres formatos:

### Renderizar JSX

```jsx
ctx.render(<button>Button</button>);
```

### Renderizar nodos DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Renderizar cadenas HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Variables globales

- `window`
- `document`
- `navigator`
- `ctx`