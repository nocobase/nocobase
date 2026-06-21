# ctx.location

Текущее положение маршрута, эквивалентное `location` из React Router. Используется вместе с `ctx.router` и `ctx.route` для чтения `pathname`, `search`, `hash` и `state`, переданного при навигации.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок / Поле JS** | Условный рендер или логика на основе пути, запроса или хэша |
| **Связывание / поток событий** | Чтение параметров URL для фильтрации или использование `location.state` как источника |
| **После навигации** | На целевой странице чтение `ctx.location.state`, переданного через `ctx.router.navigate` |

> `ctx.location` доступен только в контекстах RunJS с маршрутизатором (например, JS-блок на странице, поток событий). В чисто серверных или контекстах без маршрутизации (например, рабочий процесс) может отсутствовать.

## Тип

```ts
location: Location;
```

`Location` берётся из `react-router-dom`, как в `useLocation()`.

## Основные поля

| Поле | Тип | Описание |
|------|-----|----------|
| `pathname` | `string` | Текущий путь, начинается с `/` (например, `/admin/users`) |
| `search` | `string` | Строка параметров запроса, начинается с `?` (например, `?page=1&status=active`) |
| `hash` | `string` | Хэш-фрагмент, начинается с `#` (например, `#section-1`) |
| `state` | `any` | Данные, переданные через `ctx.router.navigate(path, { state })`; в URL не отображаются |
| `key` | `string` | Уникальный ключ положения; для начальной страницы обычно `"default"` |

## Связь с ctx.router и ctx.urlSearchParams

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Путь, хэш, состояние** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Параметры запроса как объект** | `ctx.urlSearchParams` |
| **Разбор поиска** | `new URLSearchParams(ctx.location.search)` или `ctx.urlSearchParams` |

`ctx.urlSearchParams` вычисляется из `ctx.location.search`; используйте его, когда нужны только query-параметры.

## Примеры

### Ветвление по пути

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('On user management page');
}
```

### Разбор параметров запроса

```ts
// Способ 1: Использование ctx.urlSearchParams (рекомендуется)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Способ 2: Использование URLSearchParams для парсинга search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Чтение state после навигации

```ts
// При переходе с предыдущей страницы: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navigated from dashboard');
}
```

### Якорь по хэшу

```ts
const hash = ctx.location.hash;
if (hash === '#edit') {
  // Прокрутить к редактированию или выполнить логику
}
```

## Связанные материалы

- [ctx.router](./router.md): навигация; `state` из `ctx.router.navigate` доступен как `ctx.location.state`
- [ctx.route](./route.md): совпадение маршрута (параметры, конфигурация); обычно используется вместе с `ctx.location`