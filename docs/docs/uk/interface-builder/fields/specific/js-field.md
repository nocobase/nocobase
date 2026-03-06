:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/interface-builder/fields/specific/js-field).
:::

# JS Field

## Вступ

JS Field використовується для кастомного рендерингу вмісту в позиції поля за допомогою JavaScript, що часто зустрічається в блоках деталей, елементах форм лише для читання або як «інші кастомні елементи» в стовпцях таблиць. Підходить для персоналізованого відображення, комбінування похідної інформації, значків статусу, розширеного тексту або діаграм тощо.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Типи

- Тип лише для читання: використовується для нередагованого відображення, зчитує `ctx.value` для рендерингу виводу.
- Редагований тип: використовується для кастомної взаємодії з введенням, надає `ctx.getValue()`/`ctx.setValue(v)` та подію контейнера `js-field:value-change` для полегшення двосторонньої синхронізації зі значеннями форми.

## Сценарії використання

- Тип лише для читання
  - Блок деталей: відображення результатів обчислень, значків статусу, фрагментів розширеного тексту, діаграм та іншого вмісту лише для читання;
  - Блок таблиці: використовується як «Інші кастомні стовпці > JS Field» для відображення лише для читання (якщо потрібен стовпець, не прив'язаний до поля, використовуйте JS Column);

- Редагований тип
  - Блок форми (CreateForm/EditForm): використовується для кастомних елементів керування введенням або складеного введення, що перевіряється та надсилається разом із формою;
  - Відповідні сценарії: компоненти введення із зовнішніх бібліотек, редактори розширеного тексту/коду, складні динамічні компоненти тощо;

## API контексту під час виконання

Код JS Field під час виконання може безпосередньо використовувати наступні можливості контексту:

- `ctx.element`: DOM-контейнер поля (ElementProxy), підтримує `innerHTML`, `querySelector`, `addEventListener` тощо;
- `ctx.value`: поточне значення поля (лише для читання);
- `ctx.record`: поточний об'єкт запису (лише для читання);
- `ctx.collection`: метаінформація колекції, до якої належить поле (лише для читання);
- `ctx.requireAsync(url)`: асинхронне завантаження бібліотеки AMD/UMD за URL;
- `ctx.importAsync(url)`: динамічний імпорт модуля ESM за URL;
- `ctx.openView(options)`: відкриття налаштованого вигляду (спливаюче вікно/висувна панель/сторінка);
- `ctx.i18n.t()` / `ctx.t()`: інтернаціоналізація;
- `ctx.onRefReady(ctx.ref, cb)`: рендеринг після готовності контейнера;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: вбудовані бібліотеки React / ReactDOM / Ant Design / іконки Ant Design / dayjs / lodash / math.js / formula.js та інші універсальні бібліотеки для рендерингу JSX, обробки часу, маніпулювання даними та математичних обчислень. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` все ще зберігаються для сумісності.)
- `ctx.render(vnode)`: рендерить React-елемент, HTML-рядок або DOM-вузол у контейнер за замовчуванням `ctx.element`; повторний рендеринг повторно використовує Root і перезаписує наявний вміст контейнера.

Особливості редагованого типу (JSEditableField):

- `ctx.getValue()`: отримати поточне значення форми (пріоритет надається стану форми, потім повертається до props поля).
- `ctx.setValue(v)`: встановити значення форми та props поля, підтримуючи двосторонню синхронізацію.
- Подія контейнера `js-field:value-change`: спрацьовує при зміні зовнішнього значення, що полегшує оновлення відображення введення скриптом.

## Редактор та фрагменти коду

Редактор скриптів JS Field підтримує підсвічування синтаксису, підказки про помилки та вбудовані фрагменти коду (Snippets).

- `Snippets`: відкрити список вбудованих фрагментів коду, які можна шукати та вставляти в поточну позицію курсору одним кліком.
- `Run`: безпосередньо запустити поточний код, лог виконання виводиться на панель `Logs` внизу, підтримується `console.log/info/warn/error` та підсвічування помилок для позиціонування.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Можна поєднувати з AI-співробітником для генерації коду:

- [AI-співробітник · Nathan: Frontend-інженер](/ai-employees/features/built-in-employee)

## Поширені випадки використання

### 1) Базовий рендеринг (читання значення поля)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Використання JSX для рендерингу React-компонента

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Завантаження сторонніх бібліотек (AMD/UMD або ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Клік для відкриття спливаючого вікна/висувної панелі (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Переглянути деталі</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Редаговане введення (JSEditableFieldModel)

```js
// Рендеринг простого введення за допомогою JSX та синхронізація значення форми
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Синхронізація введення при зміні зовнішнього значення (необов'язково)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Примітки

- Для завантаження зовнішніх бібліотек рекомендується використовувати надійні CDN та передбачати обробку помилок (наприклад, `if (!lib) return;`).
- Для селекторів рекомендується надавати перевагу `class` або `[name=...]`, уникайте використання фіксованих `id`, щоб запобігти повторенню `id` у кількох блоках/спливаючих вікнах.
- Очищення подій: поле може бути повторно відрендерено кілька разів через зміну даних або перемикання вигляду, перед прив'язкою подій слід очистити їх або видалити дублікати, щоб уникнути повторного спрацьовування. Можна «спочатку remove, потім add».