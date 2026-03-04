:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/location).
:::

# ctx.location

Інформація про поточне розташування маршруту, еквівалентна об'єкту `location` у React Router. Зазвичай використовується разом із `ctx.router` та `ctx.route` для зчитування поточного шляху, рядка запиту (query string), хешу (hash) та стану (state), переданого через маршрут.

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **JSBlock / JSField** | Умовний рендеринг або логічне розгалуження на основі поточного шляху, параметрів запиту або хешу. |
| **Правила зв'язку / Потоки подій** | Зчитування параметрів запиту URL для фільтрації зв'язків або визначення джерела на основі `location.state`. |
| **Обробка після навігації** | Отримання даних на цільовій сторінці через `ctx.location.state`, переданих з попередньої сторінки за допомогою `ctx.router.navigate`. |

> Примітка: `ctx.location` доступний лише в середовищах RunJS із контекстом маршрутизації (наприклад, JSBlock на сторінці, потоки подій тощо); у суто бекенд-контекстах або контекстах без маршрутизації (наприклад, робочі процеси) він може бути порожнім.

## Визначення типу

```ts
location: Location;
```

`Location` походить із `react-router-dom` і відповідає значенню, що повертається функцією `useLocation()` у React Router.

## Основні поля

| Поле | Тип | Опис |
|------|------|------|
| `pathname` | `string` | Поточний шлях, що починається з `/` (наприклад, `/admin/users`). |
| `search` | `string` | Рядок запиту, що починається з `?` (наприклад, `?page=1&status=active`). |
| `hash` | `string` | Хеш-фрагмент, що починається з `#` (наприклад, `#section-1`). |
| `state` | `any` | Довільні дані, передані через `ctx.router.navigate(path, { state })`, які не відображаються в URL. |
| `key` | `string` | Унікальний ідентифікатор цього розташування; для початкової сторінки це `"default"`. |

## Зв'язок із ctx.router та ctx.urlSearchParams

| Призначення | Рекомендоване використання |
|------|----------|
| **Зчитування шляху, хешу, стану** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Зчитування параметрів запиту (у вигляді об'єкта)** | `ctx.urlSearchParams`, дозволяє безпосередньо отримати розпарсений об'єкт. |
| **Парсинг рядка search** | `new URLSearchParams(ctx.location.search)` або безпосередньо `ctx.urlSearchParams`. |

`ctx.urlSearchParams` формується шляхом парсингу `ctx.location.search`. Якщо вам потрібні лише параметри запиту, зручніше використовувати `ctx.urlSearchParams`.

## Приклади

### Розгалуження на основі шляху

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Ви зараз на сторінці керування користувачами');
}
```

### Парсинг параметрів запиту

```ts
// Спосіб 1: Використання ctx.urlSearchParams (рекомендовано)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Спосіб 2: Використання URLSearchParams для парсингу search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Отримання стану (state), переданого під час переходу за маршрутом

```ts
// При переході з попередньої сторінки: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Перехід здійснено з панелі керування');
}
```

### Позиціювання за якорем за допомогою хешу

```ts
const hash = ctx.location.hash; // наприклад, "#edit"
if (hash === '#edit') {
  // Прокрутити до області редагування або виконати відповідну логіку
}
```

## Пов'язане

- [ctx.router](./router.md): Навігація маршрутами; `state` з `ctx.router.navigate` можна отримати через `ctx.location.state` на цільовій сторінці.
- [ctx.route](./route.md): Інформація про відповідність поточного маршруту (параметри, конфігурація тощо), зазвичай використовується разом із `ctx.location`.