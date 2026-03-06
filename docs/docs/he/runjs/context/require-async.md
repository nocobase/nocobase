:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/require-async).
:::

# ctx.requireAsync()

טוען באופן אסינכרוני סקריפטים מסוג **UMD/AMD** או כאלו המותקנים גלובלית באמצעות URL, וכן קובצי **CSS**. מתאים לתרחישי RunJS הדורשים ספריות UMD/AMD כמו ECharts, Chart.js, FullCalendar (גרסת UMD), תוספי jQuery וכדומה; העברת כתובת `.css` תטען ותזריק את העיצוב. אם הספרייה מספקת גם גרסת ESM, מומלץ להשתמש ב-[ctx.importAsync()](./import-async.md) בעדיפות ראשונה.

## תרחישי שימוש

ניתן להשתמש בכל תרחיש RunJS שבו נדרשת טעינה לפי דרישה של סקריפטים מסוג UMD/AMD/global או CSS, כגון JSBlock, JSField, JSItem, JSColumn, תהליך עבודה (Workflow), JSAction ועוד. שימושים נפוצים: תרשימי ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), תוספי jQuery וכו'.

## הגדרת טיפוסים

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## פרמטרים

| פרמטר | טיפוס | תיאור |
|-----------|------|-------------|
| `url` | `string` | כתובת הסקריפט או ה-CSS. תומך ב**קיצור** `<package>@<version>/<file-path>` (בעת פענוח דרך ESM CDN מתווסף `?raw` לקבלת קובץ ה-UMD המקורי) או ב-**URL מלא**. העברת קובץ `.css` תטען ותזריק את העיצוב. |

## ערך חזרה

- אובייקט הספרייה שנטען (ערך המודול הראשון של ה-callback ב-UMD/AMD). ספריות UMD רבות מצמידות את עצמן ל-`window` (למשל `window.echarts`), לכן ערך החזרה עשוי להיות `undefined`; במקרה כזה, יש לגשת למשתנה הגלובלי לפי תיעוד הספרייה.
- בעת העברת `.css`, מוחזרת התוצאה של `loadCSS`.

## הסבר על פורמט ה-URL

- **נתיב מקוצר**: למשל `echarts@5/dist/echarts.min.js`, תחת ה-ESM CDN ברירת המחדל (esm.sh) תתבצע בקשה ל-`https://esm.sh/echarts@5/dist/echarts.min.js?raw`. הפרמטר `?raw` משמש לקבלת קובץ ה-UMD המקורי במקום מעטפת ESM.
- **URL מלא**: ניתן להשתמש ישירות בכל כתובת CDN, כגון `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: כתובת URL המסתיימת ב-`.css` תיטען ותוזרק לדף.

## ההבדל מ-ctx.importAsync()

- **ctx.requireAsync()**: טוען סקריפטים מסוג **UMD/AMD/global**, מתאים ל-ECharts, Chart.js, FullCalendar (UMD), תוספי jQuery וכו'; לאחר הטעינה הספרייה לרוב מוצמדת ל-`window`, וערך החזרה עשוי להיות אובייקט הספרייה או `undefined`.
- **ctx.importAsync()**: טוען **מודולי ESM** ומחזיר את ה-namespace של המודול. אם הספרייה מספקת גרסת ESM, עדיף להשתמש ב-`ctx.importAsync()` לקבלת סמנטיקה טובה יותר של מודולים ו-Tree-shaking.

## דוגמאות

### שימוש בסיסי

```javascript
// נתיב מקוצר (מפוענח דרך ESM CDN כ-...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL מלא
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// טעינת CSS והזרקה לדף
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### תרשים ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('סקירת מכירות') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### תרשים עמודות Chart.js

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
      datasets: [{ label: ctx.t('כמות'), data: [12, 19, 3] }],
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

## הערות

- **פורמט ערך החזרה**: שיטות הייצוא של UMD משתנות; ערך החזרה עשוי להיות אובייקט הספרייה או `undefined`. אם הוא `undefined`, ניתן לגשת אליו דרך `window` לפי תיעוד הספרייה.
- **תלות ברשת**: נדרשת גישה ל-CDN; בסביבות רשת פנימית ניתן להשתמש ב-**ESM_CDN_BASE_URL** כדי להצביע על שירות בניהול עצמי.
- **בחירה בין importAsync**: כאשר ספרייה מספקת גם ESM וגם UMD, יש לתת עדיפות ל-`ctx.importAsync()`.

## נושאים קשורים

- [ctx.importAsync()](./import-async.md) - טעינת מודולי ESM, מתאים ל-Vue, dayjs (ESM) וכו'.
- [ctx.render()](./render.md) - רינדור תרשימים ורכיבים אחרים לתוך מכולה (container).
- [ctx.libs](./libs.md) - ספריות מובנות כמו React, antd, dayjs וכו', ללא צורך בטעינה אסינכרונית.