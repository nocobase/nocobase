:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/interface-builder/fields/specific/js-column).
:::

# JS Column

## Вступ

JS Column використовується для «користувацьких колонок» у таблицях, рендерингу вмісту комірок кожного рядка за допомогою JavaScript. Він не прив'язаний до конкретних полів і підходить для таких сценаріїв, як похідні колонки, комбіноване відображення різних полів, значки стану, операції з кнопками, агрегація віддалених даних тощо.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API контексту виконання

Під час рендерингу кожної комірки JS Column можна використовувати наступні можливості контексту:

- `ctx.element`: DOM-контейнер поточної комірки (ElementProxy), підтримує `innerHTML`, `querySelector`, `addEventListener` тощо;
- `ctx.record`: об'єкт запису поточного рядка (тільки для читання);
- `ctx.recordIndex`: індекс рядка в межах поточної сторінки (починається з 0, може залежати від пагінації);
- `ctx.collection`: метаінформація **колекції**, прив'язаної до таблиці (тільки для читання);
- `ctx.requireAsync(url)`: асинхронне завантаження бібліотеки AMD/UMD за URL;
- `ctx.importAsync(url)`: динамічний імпорт модуля ESM за URL;
- `ctx.openView(options)`: відкриття налаштованого вигляду (модальне вікно/бічна панель/сторінка);
- `ctx.i18n.t()` / `ctx.t()`: інтернаціоналізація;
- `ctx.onRefReady(ctx.ref, cb)`: рендеринг після готовності контейнера;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: вбудовані React / ReactDOM / Ant Design / іконки Ant Design / dayjs / lodash / math.js / formula.js та інші загальні бібліотеки для рендерингу JSX, обробки часу, маніпуляцій з даними та математичних обчислень. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` все ще зберігаються для сумісності.)
- `ctx.render(vnode)`: рендеринг React-елемента/HTML/DOM у контейнер за замовчуванням `ctx.element` (поточна комірка), багаторазовий рендеринг повторно використовуватиме Root і перезаписуватиме наявний вміст контейнера.

## Редактор та фрагменти

Редактор скриптів JS Column підтримує підсвічування синтаксису, підказки про помилки та вбудовані фрагменти коду (Snippets).

- `Snippets`: відкриває список вбудованих фрагментів коду, дозволяє шукати та вставляти їх одним кліком у поточну позицію курсору.
- `Run`: безпосередньо запускає поточний код, журнал виконання виводиться на панель `Logs` внизу, підтримує `console.log/info/warn/error` та підсвічування помилок.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Можна використовувати в поєднанні з AI-співробітником для генерації коду:

- [AI-співробітник · Nathan: Frontend-інженер](/ai-employees/features/built-in-employee)

## Поширені способи використання

### 1) Базовий рендеринг (читання запису поточного рядка)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Використання JSX для рендерингу компонентів React

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

- Для завантаження зовнішніх бібліотек рекомендується використовувати надійні CDN та передбачити обробку помилок (наприклад, `if (!lib) return;`).
- Рекомендується надавати перевагу селекторам `class` або `[name=...]`, уникаючи використання фіксованих `id`, щоб запобігти дублюванню `id` у кількох блоках або модальних вікнах.
- Очищення подій: рядки таблиці можуть динамічно змінюватися під час пагінації або оновлення, комірки будуть рендеритися кілька разів. Перед прив'язкою подій слід очистити їх або видалити дублікати, щоб уникнути повторного спрацьовування.
- Поради щодо продуктивності: уникайте повторного завантаження великих бібліотек у кожній комірці; слід кешувати бібліотеки на вищому рівні (наприклад, через глобальні або табличні змінні) для подальшого використання.