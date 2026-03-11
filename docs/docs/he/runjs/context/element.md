:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/element).
:::

# ctx.element

מופע של `ElementProxy` המצביע על מכולת (container) ה-DOM של ארגז החול (sandbox), ומשמש כיעד הרינדור כברירת מחדל עבור `ctx.render()`. הוא זמין בתרחישים שבהם קיימת מכולת רינדור, כגון `JSBlock`, `JSField`, `JSItem`, ו-`JSColumn`.

## תרחישים רלוונטיים

| תרחיש | הסבר |
|------|------|
| **JSBlock** | מכולת ה-DOM של הבלוק, משמשת לרינדור תוכן מותאם אישית של הבלוק |
| **JSField / JSItem / FormJSFieldItem** | מכולת הרינדור עבור שדה או פריט טופס (בדרך כלל `<span>`) |
| **JSColumn** | מכולת ה-DOM עבור תא בטבלה, משמשת לרינדור תוכן עמודה מותאם אישית |

> הערה: `ctx.element` זמין רק בהקשרי RunJS הכוללים מכולת רינדור. בהקשרים ללא ממשק משתמש (כגון לוגיקת צד-שרת טהורה), הוא עשוי להיות `undefined`. מומלץ לבצע בדיקת ערך ריק (null check) לפני השימוש.

## הגדרת סוג (Type Definition)

```typescript
element: ElementProxy | undefined;

// ElementProxy הוא פרוקסי עבור ה-HTMLElement הגולמי, החושף API מאובטח
class ElementProxy {
  __el: HTMLElement;  // אלמנט ה-DOM הגולמי הפנימי (נגיש רק בתרחישים מסוימים)
  innerHTML: string;  // עובר ניקוי באמצעות DOMPurify בזמן קריאה/כתיבה
  outerHTML: string; // כנ"ל
  appendChild(child: HTMLElement | string): void;
  // מתודות HTMLElement אחרות מועברות הלאה (שימוש ישיר אינו מומלץ)
}
```

## דרישות אבטחה

**מומלץ: כל הרינדור צריך להתבצע באמצעות `ctx.render()`.** הימנעו משימוש ישיר ב-APIs של ה-DOM של `ctx.element` (כגון `innerHTML`, `appendChild`, `querySelector` וכו').

### מדוע מומלץ להשתמש ב-ctx.render()

| יתרון | הסבר |
|------|------|
| **אבטחה** | בקרת אבטחה ריכוזית למניעת XSS ופעולות DOM לא תקינות |
| **תמיכה ב-React** | תמיכה מלאה ב-JSX, רכיבי React ומחזורי חיים (lifecycles) |
| **ירושת הקשר (Context)** | ירושה אוטומטית של ה-`ConfigProvider` של האפליקציה, ערכות נושא וכו' |
| **טיפול בקונפליקטים** | ניהול אוטומטי של יצירת/הסרת שורש (root) של React למניעת קונפליקטים בין מופעים מרובים |

### ❌ לא מומלץ: מניפולציה ישירה של ctx.element

```ts
// ❌ לא מומלץ: שימוש ישיר ב-APIs של ctx.element
ctx.element.innerHTML = '<div>תוכן</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> המאפיין `ctx.element.innerHTML` הופסק (deprecated). אנא השתמשו ב-`ctx.render()` במקום זאת.

### ✅ מומלץ: שימוש ב-ctx.render()

```ts
// ✅ רינדור רכיב React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('ברוכים הבאים')}>
    <Button type="primary">לחץ כאן</Button>
  </Card>
);

// ✅ רינדור מחרוזת HTML
ctx.render('<div style="padding:16px;">' + ctx.t('תוכן') + '</div>');

// ✅ רינדור צומת DOM
const div = document.createElement('div');
div.textContent = ctx.t('שלום');
ctx.render(div);
```

## מקרה מיוחד: כעוגן עבור Popover

כאשר יש צורך לפתוח Popover המשתמש באלמנט הנוכחי כעוגן (anchor), ניתן לגשת ל-`ctx.element?.__el` כדי לקבל את ה-DOM הגולמי כ-`target`:

```ts
// ctx.viewer.popover דורש DOM גולמי כ-target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>תוכן קופץ</div>,
});
```

> השתמשו ב-`__el` רק בתרחישים כגון "שימוש במכולה הנוכחית כעוגן"; אל תבצעו מניפולציות ב-DOM ישירות במקרים אחרים.

## הקשר ל-ctx.render

- אם `ctx.render(vnode)` נקרא ללא ארגומנט `container`, הוא ירונדר לתוך מכולת `ctx.element` כברירת מחדל.
- אם גם `ctx.element` חסר וגם לא סופקה מכולה (`container`), תיזרק שגיאה.
- ניתן לציין מכולה באופן מפורש: `ctx.render(vnode, customContainer)`.

## נקודות לתשומת לב

- `ctx.element` נועד לשימוש פנימי על ידי `ctx.render()`. לא מומלץ לגשת ישירות או לשנות את המאפיינים/מתודות שלו.
- בהקשרים ללא מכולת רינדור, `ctx.element` יהיה `undefined`. ודאו שהמכולה זמינה או העבירו `container` ידנית לפני הקריאה ל-`ctx.render()`.
- למרות ש-`innerHTML`/`outerHTML` ב-`ElementProxy` עוברים ניקוי באמצעות DOMPurify, עדיין מומלץ להשתמש ב-`ctx.render()` לניהול רינדור אחיד.

## קשור

- [ctx.render](./render.md): רינדור תוכן למכולה
- [ctx.view](./view.md): בקר התצוגה הנוכחי
- [ctx.modal](./modal.md): API מהיר למודאלים (חלונות קופצים)