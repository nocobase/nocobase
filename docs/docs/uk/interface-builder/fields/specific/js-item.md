:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/interface-builder/fields/specific/js-item).
:::

# JS Item

## Вступ

JS Item використовується для «кастомних елементів» (не прив'язаних до поля) у формах. Ви можете використовувати JavaScript/JSX для рендерингу будь-якого вмісту (підказок, статистики, попереднього перегляду, кнопок тощо) та взаємодіяти з формою та контекстом запису; підходить для сценаріїв попереднього перегляду в реальному часі, інструктивних підказок, невеликих інтерактивних компонентів тощо.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API контексту виконання (поширені)

- `ctx.element`: DOM-контейнер поточного елемента (ElementProxy), підтримує `innerHTML`, `querySelector`, `addEventListener` тощо;
- `ctx.form`: екземпляр форми AntD, дозволяє `getFieldValue / getFieldsValue / setFieldsValue / validateFields` тощо;
- `ctx.blockModel`: модель блоку форми, в якому він знаходиться, можна прослуховувати `formValuesChange` для реалізації взаємодії;
- `ctx.record` / `ctx.collection`: поточний запис та метаінформація колекції (доступно в деяких сценаріях);
- `ctx.requireAsync(url)`: асинхронне завантаження бібліотек AMD/UMD за URL;
- `ctx.importAsync(url)`: динамічний імпорт модулів ESM за URL;
- `ctx.openView(viewUid, options)`: відкриття налаштованого вигляду (висувна панель/діалогове вікно/сторінка);
- `ctx.message` / `ctx.notification`: глобальні повідомлення та сповіщення;
- `ctx.t()` / `ctx.i18n.t()`: інтернаціоналізація;
- `ctx.onRefReady(ctx.ref, cb)`: рендеринг після готовності контейнера;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: вбудовані бібліотеки React / ReactDOM / Ant Design / іконки Ant Design / dayjs / lodash / math.js / formula.js тощо для рендерингу JSX, обробки часу, маніпуляцій з даними та математичних обчислень. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` все ще зберігаються для сумісності.)
- `ctx.render(vnode)`: рендерить React-елемент/HTML/DOM у контейнер за замовчуванням `ctx.element`; багаторазовий рендеринг буде повторно використовувати Root та перезаписувати наявний вміст контейнера.

## Редактор та фрагменти коду

- `Snippets`: відкриває список вбудованих фрагментів коду, дозволяє шукати та вставляти їх у поточну позицію курсору одним кліком.
- `Run`: безпосередньо виконує поточний код та виводить логи виконання на панель `Logs` внизу; підтримує `console.log/info/warn/error` та підсвічування помилок.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Можна поєднувати з AI-співробітником для генерації/модифікації скриптів: [AI-співробітник · Nathan: Frontend-інженер](/ai-employees/features/built-in-employee)

## Поширені випадки використання (спрощені приклади)

### 1) Попередній перегляд у реальному часі (читання значень форми)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
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
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
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

- Рекомендується використовувати надійні CDN для завантаження зовнішніх бібліотек, а для сценаріїв збою слід передбачити обробку (наприклад, `if (!lib) return;`).
- Рекомендується надавати перевагу використанню `class` або `[name=...]` для селекторів та уникати використання фіксованих `id`, щоб запобігти дублюванню `id` у кількох блоках/спливаючих вікнах.
- Очищення подій: часті зміни значень форми викликатимуть багаторазовий рендеринг, тому перед прив'язкою подій слід очистити їх або усунути дублювання (наприклад, спочатку `remove`, потім `add`, або `{ once: true }`, або використовувати `dataset` для запобігання повторам).

## Пов'язана документація

- [Змінні та контекст](/interface-builder/variables)
- [Правила зв'язування](/interface-builder/linkage-rule)
- [Вигляди та спливаючі вікна](/interface-builder/actions/types/view)