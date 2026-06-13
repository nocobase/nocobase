# Обзор RunJS

RunJS — это среда выполнения JavaScript в NocoBase, которая используется для **JS-блока**, **Поля JS**, **Действия JS** и похожих сценариев. Код выполняется в ограниченной песочнице с безопасным доступом к `ctx` (API контекста) и поддерживает:

- `await` на верхнем уровне
- импорт внешних модулей
- рендер в контейнере
- глобальные переменные

## `await` на верхнем уровне

RunJS поддерживает `await` на верхнем уровне; оборачивать код в IIFE не требуется.

**Не рекомендуется**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Рекомендуется**

```js
async function test() {}
await test();
```

## Импорт внешних модулей

- ESM-модули: используйте `ctx.importAsync()` (рекомендуется)
- модули UMD/AMD: используйте `ctx.requireAsync()`

## Рендер в контейнере

Используйте `ctx.render()` для рендера содержимого в текущий контейнер (`ctx.element`) тремя способами:

### Рендер JSX

```jsx
ctx.render(<button>Кнопка</button>);
```

### Рендер DOM-узла

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Рендер HTML-строки

```js
ctx.render('<h1>Hello World</h1>');
```

## Глобальные переменные

- `window`
- `document`
- `navigator`
- `ctx`