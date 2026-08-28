# ctx.off()

Удаляет обработчик событий, зарегистрированный через `ctx.on(eventName, handler)`. Используется вместе с [ctx.on](./on.md); отписывайтесь вовремя, чтобы избежать утечек памяти и повторных срабатываний.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Очистка в React useEffect** | Вызов в функции очистки `useEffect`; удаление при размонтировании |
| **Поле JS / JSEditableFieldModel** | Отписка от `js-field:value-change` при двусторонней привязке |
| **Ресурс** | Отписка от `ctx.resource.on` (refresh, saved и т. д.) |

## Тип

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Примеры

### Пара с on в useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Отписка от события ресурса

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Позже
ctx.resource?.off('refresh', handler);
```

## Примечания

1. **Та же ссылка на обработчик**: в `ctx.off` нужно передавать ту же ссылку `handler`, что и в `ctx.on`, иначе слушатель не удалится.
2. **Своевременная очистка**: вызывайте `ctx.off` перед размонтированием или уничтожением контекста, чтобы избежать утечек.

## Связанные материалы

- [ctx.on](./on.md): подписка на события
- [ctx.resource](./resource.md): ресурс и его `on`/`off`
