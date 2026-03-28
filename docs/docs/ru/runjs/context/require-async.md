:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/require-async).
:::

# ctx.requireAsync()

Асинхронно загружает скрипты **UMD/AMD** или скрипты, монтируемые в глобальную область видимости, по URL, а также **CSS**. Подходит для сценариев RunJS, где требуются библиотеки UMD/AMD, такие как ECharts, Chart.js, FullCalendar (версия UMD) или плагины jQuery. Если библиотека также предоставляет версию ESM, отдавайте приоритет [ctx.importAsync()](./import-async.md).

## Область применения

Может использоваться в любом сценарии RunJS, где требуется загрузка скриптов UMD/AMD/global или CSS по требованию, например: JSBlock, JSField, JSItem, JSColumn, рабочий процесс, JSAction и др. Типичные примеры: ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), плагины jQuery и т. д.

## Определение типа

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Параметры

| Параметр | Тип | Описание |
|-----------|------|-------------|
| `url` | `string` | Адрес скрипта или CSS. Поддерживает **сокращенный путь** `<имя_пакета>@<версия>/<путь_к_файлу>` (при разрешении через ESM CDN добавляется `?raw` для получения исходного UMD-файла) или **полный URL**. При передаче `.css` загружает и внедряет стили. |

## Возвращаемое значение

- Загруженный объект библиотеки (первое значение модуля из обратного вызова UMD/AMD). Многие UMD-библиотеки прикрепляются к `window` (например, `window.echarts`), поэтому возвращаемое значение может быть `undefined`. В таких случаях обращайтесь к глобальной переменной в соответствии с документацией библиотеки.
- Возвращает результат `loadCSS` при передаче файла `.css`.

## Описание формата URL

- **Сокращенный путь**: например, `echarts@5/dist/echarts.min.js`. В ESM CDN по умолчанию (esm.sh) будет выполнен запрос к `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. Параметр `?raw` используется для получения оригинального UMD-файла вместо ESM-обертки.
- **Полный URL**: можно напрямую указать любой адрес CDN, например `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: URL, заканчивающийся на `.css`, будет загружен, а стили внедрены на страницу.

## Отличие от ctx.importAsync()

- **ctx.requireAsync()**: загружает скрипты **UMD/AMD/global**. Подходит для ECharts, Chart.js, FullCalendar (UMD), плагинов jQuery и т. д. Библиотеки часто прикрепляются к `window` после загрузки; возвращаемое значение может быть объектом библиотеки или `undefined`.
- **ctx.importAsync()**: загружает **ESM-модули** и возвращает пространство имен модуля. Если библиотека предоставляет ESM, используйте `ctx.importAsync()` для лучшей семантики модулей и Tree-shaking.

## Примеры

### Базовое использование

```javascript
// Сокращенный путь (разрешается через ESM CDN как ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Полный URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Загрузка CSS и внедрение на страницу
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### График ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('Библиотека ECharts не загружена');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Обзор продаж') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Гистограмма Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js не загружен');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Количество'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Примечания

- **Формат возвращаемого значения**: способы экспорта UMD различаются; возвращаемое значение может быть объектом библиотеки или `undefined`. Если оно `undefined`, обратитесь к нему через `window` согласно документации библиотеки.
- **Зависимость от сети**: требуется доступ к CDN. В средах внутренней сети можно использовать переменную **ESM_CDN_BASE_URL**, указывающую на собственный сервис.
- **Выбор между importAsync**: если библиотека предоставляет и ESM, и UMD, отдавайте приоритет `ctx.importAsync()`.

## Связанные разделы

- [ctx.importAsync()](./import-async.md) — загрузка ESM-модулей, подходит для Vue, dayjs (ESM) и т. д.
- [ctx.render()](./render.md) — рендеринг графиков и других компонентов в контейнер.
- [ctx.libs](./libs.md) — встроенные React, antd, dayjs и др., не требующие асинхронной загрузки.