# Блок JS

## Введение

Блок JS — это гибкий «блок пользовательского рендеринга», который позволяет напрямую писать JavaScript для генерации интерфейсов, привязки событий, вызова API данных или интеграции сторонних библиотек. Он подходит для персонализированных визуализаций, временных экспериментов и легковесных сценариев расширения, которые сложно покрыть встроенными блоками.

## API контекста выполнения

В контекст выполнения блока JS внедрены общие возможности, которые можно использовать напрямую:

- `ctx.element`: DOM-контейнер блока (безопасно обернутый как ElementProxy), поддерживает `innerHTML`, `querySelector`, `addEventListener` и т.д.
- `ctx.requireAsync(url)`: асинхронно загружает библиотеку AMD/UMD по URL.
- `ctx.importAsync(url)`: динамически импортирует ESM-модуль по URL.
- `ctx.openView`: открывает настроенное представление (всплывающее окно/выдвижной блок/страница).
- `ctx.useResource(...)` + `ctx.resource`: доступ к данным как к ресурсу.
- `ctx.i18n.t()` / `ctx.t()`: встроенная интернационализация.
- `ctx.onRefReady(ctx.ref, cb)`: рендер после готовности контейнера для избежания проблем с синхронизацией.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: встроенные библиотеки React, ReactDOM, Ant Design, иконки Ant Design, dayjs, lodash, math.js и formula.js для JSX-рендеринга, утилиты для работы с датой-временем, манипуляций с данными и математических операций. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` оставлены для совместимости.)
- `ctx.render(vnode)`: рендерит React-элемент, HTML-строку или DOM-узел в контейнер по умолчанию `ctx.element`. Многократные вызовы будут переиспользовать один и тот же корневой React-узел и перезаписывать текущее содержимое контейнера.

## Добавление блока

Вы можете добавить блок JS на страницу или во всплывающее окно.

![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Редактор и сниппеты

Редактор скриптов блока JS поддерживает подсветку синтаксиса, подсказки ошибок и встроенные сниппеты, позволяя быстро вставлять распространенные примеры, например рендер графиков, привязку событий кнопок, загрузку внешних библиотек, рендер React/Vue-компонентов, таймлайнов, информационных карточек и т.д.

- `Сниппеты`: открывает список встроенных сниппетов. Можно найти и вставить выбранный сниппет в редактор кода в текущую позицию курсора в один клик.
- `Запуск`: напрямую запускает код из текущего редактора и выводит журналы выполнения в панель `Логи` внизу. Поддерживает отображение `console.log/info/warn/error`; ошибки подсвечиваются со ссылкой на конкретные строку и столбец.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Кроме того, можно прямо из правого верхнего угла редактора вызвать ИИ-сотрудника «Инженер фронтенда · Nathan». Nathan поможет написать или изменить скрипты на основе текущего контекста. После этого можно в один клик нажать «Применить в редакторе» и запустить код, чтобы увидеть результат. Подробнее:

- [ИИ-сотрудник · Nathan: инженер фронтенда](/ai-employees/features/built-in-employee)

## Среда выполнения и безопасность

- **Контейнер**: система предоставляет безопасный DOM-контейнер `ctx.element` (ElementProxy) для скрипта; он влияет только на текущий блок и не затрагивает другие области страницы.
- **Песочница**: скрипт выполняется в контролируемой среде. `window`/`document`/`navigator` используют безопасные прокси-объекты, позволяя использовать обычные API при ограничении рискованных действий.
- **Повторный рендер**: блок автоматически перерендеривается, когда он скрыт и затем снова показан (чтобы избежать повторного выполнения исходного скрипта монтирования).

## Типовое использование (упрощенные примеры)

### 1. Рендер React (JSX)

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

### 2. Шаблон API-запроса

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3. Загрузка ECharts и рендер

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

### 4. Открыть представление (выдвижной блок)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Пример выдвижного блока'), size: 'large' });
```

### 5. Прочитать ресурс и отрендерить JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Примечания

- Рекомендуется использовать доверенные CDN для загрузки внешних библиотек.
- **Рекомендация по использованию селекторов**: в приоритете селекторы `class` или `[name=...]`. Избегайте фиксированных `id`, чтобы не было конфликтов из-за дублирующихся `id` при использовании нескольких блоков или всплывающих окон.
- **Очистка событий**: поскольку блок может перерендериваться много раз, обработчики событий следует очищать или дедуплицировать перед привязкой, чтобы избежать повторных срабатываний. Можно использовать подход «удалить, затем добавить», одноразовый обработчик или флаг для предотвращения дублей.

## Связанные документы

- [Переменные и контекст](/interface-builder/variables)
- [Правила связывания](/interface-builder/linkage-rule)
- [Виды и всплывающие окна](/interface-builder/actions/types/view)