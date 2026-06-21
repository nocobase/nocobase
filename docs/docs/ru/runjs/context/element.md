# ctx.element

Экземпляр ElementProxy для DOM-контейнера песочницы; это целевой контейнер по умолчанию для `ctx.render()`. Доступен в **JS-блоке**, **Поле JS**, **Элементе JS**, **JS-столбце таблицы** и других контекстах, где есть контейнер рендера.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок** | DOM-контейнер блока для пользовательского контента |
| **Поле JS / Элемент JS / FormJSFieldItem** | Контейнер рендера поля или элемента (часто `<span>`) |
| **JS-столбец таблицы** | DOM-контейнер ячейки таблицы для пользовательского содержимого колонки |

> **Примечание**: `ctx.element` доступен только в контекстах RunJS с контейнером рендера; в контекстах без UI (например, чисто серверная логика) может быть `undefined` — проверяйте перед использованием.

## Тип

```typescript
element: ElementProxy | undefined;

// ElementProxy — это прокси для исходного HTMLElement, предоставляющий безопасный API
class ElementProxy {
  __el: HTMLElement;  // Внутренний нативный DOM (только для специальных случаев)
  innerHTML: string;  // Чтение/запись с санитизацией через DOMPurify
  outerHTML: string;
  appendChild(child: HTMLElement | string): void;
  // Остальные методы HTMLElement проксируются (не рекомендуется)
}
```

## Безопасность

**Рекомендуется: выполнять рендер только через `ctx.render()`.** Не используйте напрямую DOM API у `ctx.element` (например, `innerHTML`, `appendChild`, `querySelector`).

### Зачем использовать ctx.render()

| Преимущество | Описание |
|--------------|----------|
| **Безопасность** | Централизованный контроль, меньше риска XSS и небезопасной работы с DOM |
| **React** | Полноценный JSX, компоненты и жизненный цикл |
| **Контекст** | Наследует ConfigProvider приложения, тему и т. д. |
| **Конфликты** | Управляет созданием и размонтированием React root, предотвращает конфликты нескольких экземпляров |

### ❌ Не рекомендуется: прямое использование ctx.element

```ts
// ❌ Не рекомендуется: прямое использование API ctx.element
ctx.element.innerHTML = '<div>Content</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` устарел; используйте `ctx.render()`.

### ✅ Рекомендуется: ctx.render()

```ts
// ✅ Рендеринг React-компонента
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Welcome')}>
    <Button type="primary">Click</Button>
  </Card>
);

// ✅ Рендеринг HTML-строки
ctx.render('<div style="padding:16px;">' + ctx.t('Content') + '</div>');

// ✅ Рендеринг DOM-узла
const div = document.createElement('div');
div.textContent = ctx.t('Hello');
ctx.render(div);
```

## Исключение: якорь всплывающего окна

Если нужно использовать текущий элемент как якорь всплывающего окна, можно передать `ctx.element?.__el` как нативный DOM-элемент `target`:

```ts
// ctx.viewer.popover требует необработанный DOM в качестве target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Popover content</div>,
});
```

> Используйте `__el` только в этом сценарии («текущий контейнер как якорь»); в остальных случаях не работайте с DOM напрямую.

## Связь с ctx.render

- `ctx.render(vnode)` без аргумента `container` рендерит в `ctx.element`.
- Если `ctx.element` и `container` отсутствуют, будет выброшена ошибка.
- Можно передать контейнер явно: `ctx.render(vnode, customContainer)`.

## Примечания

- Рассматривайте `ctx.element` как внутренний контейнер для `ctx.render()`; избегайте прямого чтения/изменения.
- В контекстах без контейнера рендера `ctx.element` будет `undefined`; убедитесь, что контейнер есть, или передайте `container` в `ctx.render()`.
- `innerHTML`/`outerHTML` в ElementProxy санитизируются DOMPurify, но для рендера всё равно предпочтителен `ctx.render()`.

## Связанные материалы

- [ctx.render](./render.md): рендер в контейнер
- [ctx.view](./view.md): контроллер текущего представления
- [ctx.modal](./modal.md): API модальных окон