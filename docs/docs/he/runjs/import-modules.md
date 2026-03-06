:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/import-modules).
:::

# ייבוא מודולים

ב-RunJS ניתן להשתמש בשני סוגי מודולים: **מודולים מובנים** (שימוש ישיר דרך `ctx.libs`, ללא צורך ב-import) ו-**מודולים חיצוניים** (טעינה לפי דרישה דרך `ctx.importAsync()` או `ctx.requireAsync()`).

---

## מודולים מובנים - ctx.libs (אין צורך ב-import)

RunJS כולל ספריות נפוצות מובנות, אליהן ניתן לגשת ישירות דרך `ctx.libs`, **ללא** צורך ב-`import` או בטעינה אסינכרונית.

| מאפיין | תיאור |
|------|------|
| **ctx.libs.React** | ליבת React, משמשת עבור JSX ו-Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (ניתן להשתמש עבור `createRoot` וכדומה) |
| **ctx.libs.antd** | ספריית הרכיבים Ant Design |
| **ctx.libs.antdIcons** | אייקונים של Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): ביטויים מתמטיים, פעולות מטריצה וכו' |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): נוסחאות דמויות Excel (כגון SUM, AVERAGE וכו') |

### דוגמה: React ו-antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>לחץ כאן</Button>);
```

### דוגמה: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### דוגמה: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## מודולים חיצוניים

כאשר יש צורך בספריות צד שלישי, בחרו את שיטת הטעינה בהתאם לפורמט המודול:

- **מודולי ESM** ← השתמשו ב-`ctx.importAsync()`
- **מודולי UMD/AMD** ← השתמשו ב-`ctx.requireAsync()`

---

### ייבוא מודולי ESM

השתמשו ב-**`ctx.importAsync()`** כדי לטעון מודולי ESM באופן דינמי לפי URL. מתאים לתרחישים כמו בלוקי JS, שדות JS, פעולות JS וכו'.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: כתובת מודול ה-ESM. תומך בפורמטים מקוצרים כמו `<package>@<version>` או נתיבי משנה כמו `<package>@<version>/<file-path>` (למשל `vue@3.4.0`, `lodash@4/lodash.js`). אלו יקבלו קידומת של כתובת ה-CDN שהוגדרה. נתמכים גם כתובות URL מלאות.
- **החזרה**: אובייקט ה-namespace של המודול שפוענח.

#### ברירת מחדל: https://esm.sh

כאשר לא מוגדר אחרת, צורות מקוצרות ישתמשו ב-**https://esm.sh** כקידומת CDN. לדוגמה:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// שווה ערך לטעינה מ-https://esm.sh/vue@3.4.0
```

#### שירות esm.sh בניהול עצמי

אם יש צורך ברשת פנימית או ב-CDN בבנייה עצמית, ניתן לפרוס שירות התואם לפרוטוקול esm.sh ולציין אותו באמצעות משתני סביבה:

- **ESM_CDN_BASE_URL**: כתובת הבסיס של ה-ESM CDN (ברירת מחדל `https://esm.sh`)
- **ESM_CDN_SUFFIX**: סיומת אופציונלית (למשל `/+esm` עבור jsDelivr)

להקמת שירות בניהול עצמי, עיינו ב: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### ייבוא מודולי UMD/AMD

השתמשו ב-**`ctx.requireAsync()`** כדי לטעון באופן אסינכרוני מודולי UMD/AMD או סקריפטים המתווספים לאובייקט הגלובלי.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: תומך בשתי צורות:
  - **נתיב מקוצר**: `<package>@<version>/<file-path>`, בדומה ל-`ctx.importAsync()`, מפוענח לפי תצורת ה-ESM CDN הנוכחית. בעת הפענוח, מתווסף `?raw` כדי לבקש את הקובץ הגולמי ישירות (בדרך כלל build של UMD). לדוגמה, `echarts@5/dist/echarts.min.js` למעשה מבקש את `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (כאשר משתמשים בברירת המחדל esm.sh).
  - **URL מלא**: כתובת מלאה של כל CDN (למשל `https://cdn.jsdelivr.net/npm/xxx`).
- **החזרה**: אובייקט הספרייה שנטען (הצורה הספציפית תלויה באופן שבו הספרייה מייצאת את התוכן שלה).

לאחר הטעינה, ספריות UMD רבות מצמידות את עצמן לאובייקט הגלובלי (למשל `window.xxx`). ניתן להשתמש בהן כפי שמתואר בתיעוד של אותה ספרייה.

**דוגמה**

```ts
// נתיב מקוצר (מפוענח דרך esm.sh כ-...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL מלא
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**הערה**: אם ספרייה מספקת גם גרסת ESM, עדיף להשתמש ב-`ctx.importAsync()` לקבלת סמנטיקה טובה יותר של מודולים ו-Tree-shaking.