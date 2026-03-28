:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/index).
:::

# Visão Geral do RunJS

O RunJS é o ambiente de execução JavaScript usado no NocoBase para cenários como **Blocos JS**, **Campos JS** e **Ações JS**. O código é executado em um sandbox restrito, fornecendo acesso seguro à `ctx` (Context API) e inclui os seguintes recursos:

- `await` de nível superior (Top-level `await`)
- Importação de módulos externos
- Renderização dentro de contêineres
- Variáveis globais

## await de nível superior (Top-level await)

O RunJS suporta `await` de nível superior, eliminando a necessidade de envolver o código em uma IIFE (Immediately Invoked Function Expression).

**Não recomendado**

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

## Importação de módulos externos

- Use `ctx.importAsync()` para módulos ESM (Recomendado)
- Use `ctx.requireAsync()` para módulos UMD/AMD

## Renderização dentro de contêineres

Use `ctx.render()` para renderizar conteúdo no contêiner atual (`ctx.element`). Ele suporta os três formatos a seguir:

### Renderizando JSX

```jsx
ctx.render(<button>Button</button>);
```

### Renderizando nós DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Renderizando strings HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Variáveis globais

- `window`
- `document`
- `navigator`
- `ctx`