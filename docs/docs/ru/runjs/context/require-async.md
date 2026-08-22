# ctx.requireAsync()

Асинхронно загружает **UMD/AMD** или глобальные скрипты по URL; также поддерживает загрузку **CSS**. Используется в RunJS для ECharts, Chart.js, FullCalendar (UMD), jQuery-плагинов и т. д. URL с `.css` загружает и внедряет стили. Если библиотека предоставляет ESM, предпочтительнее [ctx.importAsync()](./import-async.md).

## Сценарии использования

Используйте, когда RunJS нужно загрузить UMD/AMD-скрипты, глобальные скрипты или CSS: JS-блок, поле JS, элемент JS, JS-столбец таблицы, поток событий, действие JS и т. д. Типичные примеры: ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), jQuery-плагины.

## Тип

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `url` | `string` | URL скрипта или CSS. Поддерживается **сокращённая запись** `<package>@<version>/<path>` (ESM CDN добавляет `?raw` для сырого UMD) или **полный URL**. URL с `.css` загружает и внедряет стили. |

## Возвращаемое значение

- Загруженный объект библиотеки (первое значение модуля из UMD/AMD callback). Многие UMD-библиотеки вешаются в `window` (например, `window.echarts`), поэтому возвращаемое значение может быть `undefined` — ориентируйтесь на документацию библиотеки.
- Для URL с `.css` возвращается результат `loadCSS`.

## Формат URL

- **Сокращённая запись**: например, `echarts@5/dist/echarts.min.js`; при стандартном ESM CDN (esm.sh) преобразуется в `https://esm.sh/echarts@5/dist/echarts.min.js?raw`; `?raw` запрашивает сырой UMD-файл.
- **Полный URL**: любой URL CDN, например `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: URL, оканчивающиеся на `.css`, загружаются и внедряются как стили.

## Сравнение с ctx.importAsync()

- **ctx.requireAsync()**: загрузка **UMD/AMD/глобальных** скриптов; подходит для ECharts, Chart.js, FullCalendar (UMD), jQuery-плагинов; библиотека часто оказывается в `window`; результат может быть как объект библиотеки, так и `undefined`.
- **ctx.importAsync()**: загрузка **ESM**; возвращает пространство имён модуля. Если библиотека поддерживает ESM, используйте `ctx.importAsync()` ради лучшей модульности и удаления мёртвого кода.

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

### ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Sales overview') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js bar- столбчатая диаграмма

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js not loaded');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Count'), data: [12, 19, 3] }],
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

- **Форма возвращаемого значения**: у UMD-библиотек поведение отличается; результат может быть объектом библиотеки или `undefined`. Если `undefined`, проверяйте документацию (часто доступ через `window`).
- **Сеть**: требуется доступ к CDN; для интрасети можно настроить свой сервис через **ESM_CDN_BASE_URL**.
- **Выбор API**: если библиотека поддерживает и ESM, и UMD, предпочтительнее `ctx.importAsync()`.

## Связанные материалы

- [ctx.importAsync()](./import-async.md): загрузка ESM; удобно для Vue, dayjs (ESM) и т. д.
- [ctx.render()](./render.md): рендер графиков и другого контента в контейнер
- [ctx.libs](./libs.md): встроенные React, antd, dayjs; без асинхронной загрузки