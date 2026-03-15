:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/location).
:::

# ctx.location

Информация о текущем местоположении маршрута, эквивалентная объекту `location` в React Router. Обычно используется вместе с `ctx.router` и `ctx.route` для чтения текущего пути, строки запроса, хеша и состояния (`state`), переданного через маршрут.

## Применимые сценарии

| Сценарий | Описание |
|------|------|
| **JSBlock / JSField** | Выполнение условного рендеринга или логического ветвления на основе текущего пути, параметров запроса или хеша. |
| **Правила связей / Потоки событий** | Чтение параметров запроса URL для фильтрации связей или определение источника перехода на основе `location.state`. |
| **Обработка после перехода** | Получение данных на целевой странице, переданных с предыдущей страницы через `ctx.router.navigate`, с помощью `ctx.location.state`. |

> Примечание: `ctx.location` доступен только в среде RunJS с контекстом маршрутизации (например, JSBlock внутри страницы, потоки событий и т. д.); в чисто серверном контексте или контексте без маршрутизации (например, в рабочих процессах) он может быть пуст.

## Определение типа

```ts
location: Location;
```

Тип `Location` взят из `react-router-dom` и соответствует значению, возвращаемому хуком `useLocation()` в React Router.

## Основные поля

| Поле | Тип | Описание |
|------|------|------|
| `pathname` | `string` | Текущий путь, начинается с `/` (например, `/admin/users`). |
| `search` | `string` | Строка запроса, начинается с `?` (например, `?page=1&status=active`). |
| `hash` | `string` | Хеш-фрагмент, начинается с `#` (например, `#section-1`). |
| `state` | `any` | Произвольные данные, переданные через `ctx.router.navigate(path, { state })`, не отображаются в URL. |
| `key` | `string` | Уникальный идентификатор этого местоположения; для начальной страницы — `"default"`. |

## Связь с ctx.router и ctx.urlSearchParams

| Назначение | Рекомендуемое использование |
|------|----------|
| **Чтение пути, хеша, состояния** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Чтение параметров запроса (как объект)** | `ctx.urlSearchParams`, который предоставляет сразу разобранный объект. |
| **Парсинг строки search** | `new URLSearchParams(ctx.location.search)` или использование `ctx.urlSearchParams` напрямую. |

`ctx.urlSearchParams` формируется путем парсинга `ctx.location.search`. Если вам нужны только параметры запроса, использовать `ctx.urlSearchParams` удобнее.

## Примеры

### Ветвление на основе пути

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Вы находитесь на странице управления пользователями');
}
```

### Парсинг параметров запроса

```ts
// Способ 1: Использование ctx.urlSearchParams (рекомендуется)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Способ 2: Использование URLSearchParams для парсинга search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Получение состояния, переданного при переходе

```ts
// При переходе с предыдущей страницы: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Переход выполнен с панели управления');
}
```

### Определение якоря через hash

```ts
const hash = ctx.location.hash; // например, "#edit"
if (hash === '#edit') {
  // Прокрутка к области редактирования или выполнение соответствующей логики
}
```

## Связанные разделы

- [ctx.router](./router.md): Навигация по маршрутам; `state` из `ctx.router.navigate` можно получить через `ctx.location.state` на целевой странице.
- [ctx.route](./route.md): Информация о соответствии текущего маршрута (параметры, конфигурация и т. д.), часто используется вместе с `ctx.location`.