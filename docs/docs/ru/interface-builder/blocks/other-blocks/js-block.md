:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/interface-builder/blocks/other-blocks/js-block).
:::

# JS Block

## Введение

JS Block — это высокогибкий «блок пользовательского рендеринга», который поддерживает написание JavaScript-скриптов напрямую для генерации интерфейсов, привязки событий, вызова интерфейсов данных или интеграции сторонних библиотек. Он подходит для сценариев индивидуальной визуализации, временных экспериментов и легковесных расширений, которые трудно реализовать с помощью встроенных блоков.

## API контекста выполнения

В контекст выполнения JS Block внедрены часто используемые возможности, которые можно использовать напрямую:

- `ctx.element`: DOM-контейнер блока (безопасная обертка, ElementProxy), поддерживающий `innerHTML`, `querySelector`, `addEventListener` и т. д.;
- `ctx.requireAsync(url)`: Асинхронная загрузка библиотек AMD/UMD по URL;
- `ctx.importAsync(url)`: Динамический импорт ESM-модулей по URL;
- `ctx.openView`: Открытие настроенного представления (всплывающее окно / выдвижная панель / страница);
- `ctx.useResource(...)` + `ctx.resource`: Доступ к данным через ресурсы;
- `ctx.i18n.t()` / `ctx.t()`: Встроенные возможности интернационализации;
- `ctx.onRefReady(ctx.ref, cb)`: Рендеринг после готовности контейнера во избежание проблем с таймингом;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Встроенные библиотеки React / ReactDOM / Ant Design / иконки Ant Design / dayjs / lodash / math.js / formula.js и др. для JSX-рендеринга, обработки времени, манипуляций с данными и математических вычислений. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` по-прежнему сохранены для совместимости.)
- `ctx.render(vnode)`: Рендерит React-элемент, HTML-строку или DOM-узел в контейнер по умолчанию `ctx.element`; повторные вызовы используют тот же React Root и перезаписывают текущее содержимое контейнера.

## Добавление блока

- Вы можете добавить JS Block на страницу или во всплывающее окно.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Редактор и сниппеты

Редактор скриптов JS Block поддерживает подсветку синтаксиса, подсказки об ошибках и встроенные фрагменты кода (Snippets), позволяя быстро вставлять распространенные примеры, такие как: рендеринг графиков, привязка событий к кнопкам, загрузка внешних библиотек, рендеринг компонентов React/Vue, временные шкалы, карточки информации и т. д.

- `Snippets`: Открывает список встроенных фрагментов кода, позволяет искать и вставлять выбранный фрагмент в текущую позицию курсора одним кликом.
- `Run`: Запускает код в редакторе и выводит логи выполнения в панель `Logs` внизу. Поддерживает отображение `console.log/info/warn/error`, ошибки подсвечиваются с возможностью перехода к конкретной строке и столбцу.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Кроме того, в правом верхнем углу редактора можно вызвать AI-сотрудника «Фронтенд-инженер · Nathan», чтобы он помог вам написать или изменить скрипт на основе текущего контекста, применить его в редакторе кнопкой «Apply to editor» и запустить для проверки результата. Подробнее:

- [AI-сотрудник · Nathan: Фронтенд-инженер](/ai-employees/features/built-in-employee)

## Среда выполнения и безопасность

- Контейнер: Система предоставляет безопасный DOM-контейнер `ctx.element` (ElementProxy) для скрипта, который влияет только на текущий блок и не затрагивает другие области страницы.
- Песочница: Скрипт выполняется в контролируемой среде, `window`/`document`/`navigator` используют безопасные прокси-объекты; общие API доступны, рискованные действия ограничены.
- Повторный рендеринг: Блок автоматически перерендеривается при повторном отображении после скрытия (во избежание повторного выполнения при первом монтировании).

## Примеры использования (упрощенные)

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

### 2) Шаблон API-запроса

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Загрузка и рендеринг ECharts

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

### 4) Открытие представления (выдвижной панели)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Чтение ресурса и рендеринг JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Примечания

- Для загрузки внешних библиотек рекомендуется использовать доверенные CDN.
- Рекомендации по использованию селекторов: отдавайте приоритет селекторам `class` или атрибутам `[name=...]`; избегайте использования фиксированных `id`, чтобы предотвратить конфликты стилей или событий из-за дублирования `id` в нескольких блоках или всплывающих окнах.
- Очистка событий: блок может перерендериваться несколько раз, поэтому перед привязкой событий следует выполнять очистку или дедупликацию во избежание повторных срабатываний. Можно использовать метод «сначала remove, затем add», однократные слушатели или флаги для предотвращения повторов.

## Связанные документы

- [Переменные и контекст](/interface-builder/variables)
- [Правила связывания](/interface-builder/linkage-rule)
- [Представления и всплывающие окна](/interface-builder/actions/types/view)