:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/interface-builder/blocks/other-blocks/js-block).
:::

# JS Block

## Вступ

JS Block — це високоеластичний «блок кастомного рендерингу», який підтримує пряме написання JavaScript-скриптів для створення інтерфейсів, прив'язки подій, виклику інтерфейсів даних або інтеграції сторонніх бібліотек. Підходить для сценаріїв персоналізованої візуалізації, тимчасових експериментів та легких розширень, які важко охопити вбудованими блоками.

## API середовища виконання

У контекст виконання JS Block уже вбудовано загальні можливості, які можна використовувати безпосередньо:

- `ctx.element`: DOM-контейнер блоку (безпечно обгорнутий як ElementProxy), підтримує `innerHTML`, `querySelector`, `addEventListener` тощо;
- `ctx.requireAsync(url)`: асинхронно завантажує бібліотеку AMD/UMD за URL-адресою;
- `ctx.importAsync(url)`: динамічно імпортує ESM-модуль за URL-адресою;
- `ctx.openView`: відкриває налаштований вигляд (спливаюче вікно / бічна панель / сторінка);
- `ctx.useResource(...)` + `ctx.resource`: доступ до даних як до ресурсу;
- `ctx.i18n.t()` / `ctx.t()`: вбудовані можливості інтернаціоналізації;
- `ctx.onRefReady(ctx.ref, cb)`: рендеринг після готовності контейнера для уникнення проблем із послідовністю виконання;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: вбудовані загальні бібліотеки React / ReactDOM / Ant Design / іконки Ant Design / dayjs / lodash / math.js / formula.js для рендерингу JSX, обробки часу, маніпуляцій із даними та математичних обчислень. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` все ще зберігаються для сумісності.)
- `ctx.render(vnode)`: рендерить React-елемент, HTML-рядок або DOM-вузол у контейнер за замовчуванням `ctx.element`; багаторазові виклики повторно використовуватимуть той самий React Root і перезаписуватимуть наявний вміст контейнера.

## Додавання блоку

- JS Block можна додати на сторінку або у спливаюче вікно.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Редактор та фрагменти коду

Редактор скриптів JS Block підтримує підсвічування синтаксису, підказки про помилки та вбудовані фрагменти коду (Snippets), що дозволяє швидко вставляти типові приклади, такі як: рендеринг діаграм, прив'язка подій до кнопок, завантаження зовнішніх бібліотек, рендеринг компонентів React/Vue, часові шкали, інформаційні картки тощо.

- `Snippets`: відкриває список вбудованих фрагментів коду, де можна шукати та одним кліком вставляти вибраний фрагмент у поточну позицію курсору в редакторі.
- `Run`: безпосередньо запускає код у поточному редакторі та виводить журнали виконання на нижню панель `Logs`. Підтримує відображення `console.log/info/warn/error`, помилки підсвічуються з можливістю переходу до конкретного рядка та стовпця.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Крім того, у верхньому правому куті редактора можна викликати AI-співробітника «Фронтенд-інженер · Nathan», щоб він допоміг вам написати або змінити скрипт на основі поточного контексту. Після цього можна одним кліком натиснути «Apply to editor», щоб застосувати зміни до редактора, і запустити код для перевірки результату. Детальніше див.:

- [AI-співробітник · Nathan: Фронтенд-інженер](/ai-employees/features/built-in-employee)

## Середовище виконання та безпека

- Контейнер: система надає скрипту безпечний DOM-контейнер `ctx.element` (ElementProxy), який впливає лише на поточний блок і не заважає іншим областям сторінки.
- Пісочниця: скрипт виконується в контрольованому середовищі, де `window`/`document`/`navigator` використовують безпечні проксі-об'єкти. Загальні API доступні, але ризиковані дії обмежені.
- Повторний рендеринг: блок автоматично повторно рендериться після того, як він був прихований і знову показаний (щоб уникнути повторного виконання під час першого монтування).

## Типові способи використання (спрощені приклади)

### 1) Рендеринг React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) Шаблон API-запиту

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Завантаження ECharts та рендеринг

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Відкриття вигляду (бічної панелі)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Зчитування ресурсу та рендеринг JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Зауваження

- Для завантаження зовнішніх бібліотек рекомендується використовувати надійні CDN.
- Поради щодо використання селекторів: надавайте перевагу використанню селекторів за атрибутами `class` або `[name=...]`; уникайте використання фіксованих `id`, щоб запобігти конфліктам стилів або подій через дублювання `id` у кількох блоках чи спливаючих вікнах.
- Очищення подій: блок може рендеритися кілька разів, тому перед прив'язкою подій слід очищати їх або уникати дублювання, щоб запобігти повторному спрацьовуванню. Можна використовувати підхід «спочатку remove, потім add», одноразові слухачі або додавати мітки для запобігання повторам.

## Пов'язані документи

- [Змінні та контекст](/interface-builder/variables)
- [Правила взаємодії](/interface-builder/linkage-rule)
- [Вигляди та спливаючі вікна](/interface-builder/actions/types/view)