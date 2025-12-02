:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# JS Елемент

## Вступ

JS Елемент використовується для «кастомних елементів» (не прив'язаних до поля) у формі. Ви можете використовувати JavaScript/JSX для рендерингу будь-якого вмісту (наприклад, підказок, статистики, попереднього перегляду, кнопок тощо) та взаємодіяти з формою та контекстом запису. Це ідеально підходить для сценаріїв, таких як попередній перегляд у реальному часі, інструктивні підказки та невеликі інтерактивні компоненти.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API контексту виконання (поширені)

- `ctx.element`: Контейнер DOM (ElementProxy) поточного елемента, що підтримує `innerHTML`, `querySelector`, `addEventListener` тощо.
- `ctx.form`: Екземпляр форми AntD, що дозволяє виконувати такі операції, як `getFieldValue / getFieldsValue / setFieldsValue / validateFields` тощо.
- `ctx.blockModel`: Модель блоку форми, до якого він належить, що може прослуховувати `formValuesChange` для реалізації зв'язування.
- `ctx.record` / `ctx.collection`: Поточний запис та метаінформація колекції (доступно в деяких сценаріях).
- `ctx.requireAsync(url)`: Асинхронно завантажує бібліотеку AMD/UMD за URL-адресою.
- `ctx.importAsync(url)`: Динамічно імпортує модуль ESM за URL-адресою.
- `ctx.openView(viewUid, options)`: Відкриває налаштований вигляд (висувна панель/діалогове вікно/сторінка).
- `ctx.message` / `ctx.notification`: Глобальні повідомлення та сповіщення.
- `ctx.t()` / `ctx.i18n.t()`: Інтернаціоналізація.
- `ctx.onRefReady(ctx.ref, cb)`: Рендеринг після готовності контейнера.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Вбудовані бібліотеки React, ReactDOM, Ant Design, Ant Design Icons та dayjs для рендерингу JSX та роботи з датами й часом. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` зберігаються для сумісності.)
- `ctx.render(vnode)`: Рендерить елемент React/HTML/DOM у контейнер за замовчуванням `ctx.element`. Багаторазовий рендеринг повторно використовуватиме Root та перезаписуватиме наявний вміст контейнера.

## Редактор та фрагменти коду

- `Snippets`: Відкриває список вбудованих фрагментів коду, дозволяючи шукати та вставляти їх у поточну позицію курсору одним кліком.
- `Run`: Безпосередньо виконує поточний код та виводить логи виконання на панель `Logs` внизу. Підтримує `console.log/info/warn/error` та підсвічування помилок.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Можна використовувати з [AI-співробітником · Nathan: Frontend-інженер](/ai-employees/built-in/ai-coding) для генерації/модифікації скриптів.

## Поширені випадки використання (спрощені приклади)

### 1) Попередній перегляд у реальному часі (читання значень форми)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('До сплати:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Відкриття вигляду (висувної панелі)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Попередній перегляд'), size: 'large' });
  }}>
    {ctx.t('Відкрити попередній перегляд')}
  </a>
);
```

### 3) Завантаження та рендеринг зовнішніх бібліотек

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Примітки

- Рекомендується використовувати надійний CDN для завантаження зовнішніх бібліотек та передбачати резервні варіанти для сценаріїв збою (наприклад, `if (!lib) return;`).
- Для селекторів рекомендується надавати перевагу використанню `class` або `[name=...]` та уникати використання фіксованих `id`, щоб запобігти дублюванню `id` у кількох блоках/спливаючих вікнах.
- Очищення подій: Часті зміни значень форми запускатимуть багаторазовий рендеринг. Перед прив'язкою події її слід очистити або дедуплікувати (наприклад, `remove` перед `add`, використовувати `{ once: true }` або атрибут `dataset` для запобігання дублюванню).

## Пов'язана документація

- [Змінні та контекст](/interface-builder/variables)
- [Правила зв'язування](/interface-builder/linkage-rule)
- [Вигляди та спливаючі вікна](/interface-builder/actions/types/view)