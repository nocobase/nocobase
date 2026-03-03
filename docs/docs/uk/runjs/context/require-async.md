:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/require-async).
:::

# ctx.requireAsync()

Асинхронно завантажує скрипти **UMD/AMD** або глобально змонтовані скрипти за URL-адресою, а також **CSS**. Підходить для сценаріїв RunJS, які потребують бібліотек UMD/AMD, таких як ECharts, Chart.js, FullCalendar (версія UMD) або плагіни jQuery. Якщо бібліотека також надає версію ESM, надавайте пріоритет використанню [ctx.importAsync()](./import-async.md).

## Сценарії використання

Можна використовувати в будь-якому сценарії RunJS, де потрібно завантажувати скрипти UMD/AMD/global або CSS за запитом, наприклад: JSBlock, JSField, JSItem, JSColumn, робочий процес, JSAction тощо. Типове використання: ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), плагіни jQuery тощо.

## Визначення типу

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Параметри

| Параметр | Тип | Опис |
|-----------|------|-------------|
| `url` | `string` | Адреса скрипта або CSS. Підтримує **скорочений запис** `<назва_пакета>@<версія>/<шлях_до_файлу>` (додає `?raw` для отримання оригінального UMD-файлу при розв'язанні через ESM CDN) або **повний URL**. Завантажує та впроваджує стилі, якщо передано файл `.css`. |

## Значення, що повертається

- Завантажений об'єкт бібліотеки (перше значення модуля зворотного виклику UMD/AMD). Багато бібліотек UMD прикріплюють себе до `window` (наприклад, `window.echarts`), тому значення, що повертається, може бути `undefined`. У таких випадках звертайтеся до глобальної змінної відповідно до документації бібліотеки.
- Повертає результат `loadCSS`, якщо передано файл `.css`.

## Опис формату URL

- **Скорочений шлях**: наприклад, `echarts@5/dist/echarts.min.js`. Через стандартний ESM CDN (esm.sh) буде надіслано запит `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. Параметр `?raw` використовується для отримання оригінального UMD-файлу замість обгортки ESM.
- **Повний URL**: можна безпосередньо використовувати будь-яку адресу CDN, наприклад `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: URL, що закінчується на `.css`, буде завантажено та впроваджено на сторінку.

## Відмінність від ctx.importAsync()

- **ctx.requireAsync()**: завантажує скрипти **UMD/AMD/global**. Підходить для ECharts, Chart.js, FullCalendar (UMD), плагінів jQuery тощо. Бібліотеки часто прикріплюються до `window` після завантаження; значенням, що повертається, може бути об'єкт бібліотеки або `undefined`.
- **ctx.importAsync()**: завантажує **модулі ESM** і повертає простір імен модуля. Якщо бібліотека надає ESM, використовуйте `ctx.importAsync()` для кращої семантики модулів та Tree-shaking.

## Приклади

### Базове використання

```javascript
// Скорочений шлях (розв'язується через ESM CDN як ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Повний URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Завантаження CSS та впровадження на сторінку
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Діаграма ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('Бібліотеку ECharts не завантажено');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Огляд продажів') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Стовпчаста діаграма Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js не завантажено');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Кількість'), data: [12, 19, 3] }],
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

## Примітки

- **Формат значення, що повертається**: методи експорту UMD різняться; значенням, що повертається, може бути об'єкт бібліотеки або `undefined`. Якщо `undefined`, звертайтеся до нього через `window` згідно з документацією бібліотеки.
- **Залежність від мережі**: потрібен доступ до CDN. У середовищах внутрішньої мережі ви можете вказати на власний сервіс через **ESM_CDN_BASE_URL**.
- **Вибір між importAsync**: якщо бібліотека надає і ESM, і UMD, надавайте пріоритет `ctx.importAsync()`.

## Пов'язане

- [ctx.importAsync()](./import-async.md) — завантажує модулі ESM, підходить для Vue, dayjs (ESM) тощо.
- [ctx.render()](./render.md) — рендерить діаграми та інші компоненти в контейнер.
- [ctx.libs](./libs.md) — вбудовані React, antd, dayjs тощо, асинхронне завантаження не потрібне.