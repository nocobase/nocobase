:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# JS Колонка

## Вступ

JS Колонка використовується для **користувацьких колонок** у таблицях, відображаючи вміст комірок кожного рядка за допомогою JavaScript. Вона не прив'язана до конкретного поля і підходить для таких сценаріїв, як похідні колонки, комбіноване відображення даних з різних полів, значки стану, кнопки дій та агрегація віддалених даних.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API контексту виконання

Під час відображення кожної комірки JS Колонка надає такі можливості контексту:

-   `ctx.element`: DOM-контейнер поточної комірки (ElementProxy), що підтримує `innerHTML`, `querySelector`, `addEventListener` тощо.
-   `ctx.record`: Об'єкт запису поточного рядка (тільки для читання).
-   `ctx.recordIndex`: Індекс рядка на поточній сторінці (починається з 0, може залежати від пагінації).
-   `ctx.collection`: Метаінформація **колекції**, прив'язаної до таблиці (тільки для читання).
-   `ctx.requireAsync(url)`: Асинхронно завантажує бібліотеку AMD/UMD за URL-адресою.
-   `ctx.importAsync(url)`: Динамічно імпортує модуль ESM за URL-адресою.
-   `ctx.openView(options)`: Відкриває налаштований вигляд (модальне вікно/бічна панель/сторінка).
-   `ctx.i18n.t()` / `ctx.t()`: Інтернаціоналізація.
-   `ctx.onRefReady(ctx.ref, cb)`: Відображає після готовності контейнера.
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Вбудовані бібліотеки загального призначення, такі як React, ReactDOM, Ant Design, Ant Design Icons та dayjs, для рендерингу JSX та обробки часу. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` зберігаються для сумісності.)
-   `ctx.render(vnode)`: Відображає елемент React/HTML/DOM у контейнері за замовчуванням `ctx.element` (поточна комірка). Багаторазове відображення повторно використовуватиме Root і перезаписуватиме наявний вміст контейнера.

## Редактор та фрагменти коду

Редактор скриптів JS Колонки підтримує підсвічування синтаксису, підказки про помилки та вбудовані фрагменти коду (Snippets).

-   `Snippets`: Відкриває список вбудованих фрагментів коду, дозволяючи шукати та вставляти їх одним кліком у поточну позицію курсору.
-   `Run`: Безпосередньо запускає поточний код. Журнал виконання виводиться на панель `Logs` внизу, підтримуючи `console.log/info/warn/error` та підсвічування помилок.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Ви також можете використовувати AI-співробітника для генерації коду:

-   [AI-співробітник · Натан: Frontend-інженер](/ai-employees/built-in/ai-coding)

## Поширені випадки використання

### 1) Базове відображення (читання запису поточного рядка)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Використання JSX для відображення компонентів React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Відкриття модального вікна/бічної панелі з комірки (перегляд/редагування)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Переглянути</a>
);
```

### 4) Завантаження сторонніх бібліотек (AMD/UMD або ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Примітки

-   Для завантаження зовнішніх бібліотек рекомендується використовувати надійні CDN, а також передбачити запасний варіант для сценаріїв збою (наприклад, `if (!lib) return;`).
-   Рекомендується надавати перевагу селекторам `class` або `[name=...]` замість фіксованих `id`, щоб уникнути дублювання `id` у кількох блоках або модальних вікнах.
-   Очищення подій: Рядки таблиці можуть динамічно змінюватися при пагінації/оновленні, і комірки будуть відображатися кілька разів. Перед прив'язкою подій слід їх очистити або дедуплікувати, щоб уникнути повторних спрацьовувань.
-   Поради щодо продуктивності: Уникайте повторного завантаження великих бібліотек у кожній комірці. Натомість, кешуйте бібліотеки на вищому рівні (наприклад, через глобальні або табличні змінні) і повторно використовуйте їх.