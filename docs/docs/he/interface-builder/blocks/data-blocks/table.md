:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# בלוק טבלה

## מבוא

בלוק הטבלה הוא אחד מבלוקי הנתונים המובנים והמרכזיים ב-**NocoBase**. הוא משמש בעיקר להצגה וניהול של נתונים מובנים בפורמט טבלאי. הבלוק מציע אפשרויות תצורה גמישות, המאפשרות למשתמשים להתאים אישית את עמודות הטבלה, רוחב העמודות, כללי המיון וטווח הנתונים, כדי להבטיח שהנתונים המוצגים בטבלה עונים על הצרכים העסקיים הספציפיים שלהם.

#### תכונות עיקריות:
- **תצורת עמודות גמישה**: ניתן להתאים אישית את עמודות הטבלה ורוחבן כדי להתאים לדרישות הצגת נתונים שונות.
- **כללי מיון**: תומך במיון נתוני טבלה. משתמשים יכולים למיין נתונים בסדר עולה או יורד בהתבסס על שדות שונים.
- **הגדרת טווח נתונים**: על ידי הגדרת טווח הנתונים, משתמשים יכולים לשלוט בטווח הנתונים המוצגים, ובכך למנוע הפרעה מנתונים לא רלוונטיים.
- **תצורת פעולות**: בלוק הטבלה כולל מגוון אפשרויות פעולה מובנות. משתמשים יכולים להגדיר בקלות פעולות כמו סינון, הוספה חדשה, עריכה ומחיקה, לניהול מהיר של נתונים.
- **עריכה מהירה**: תומך בעריכת נתונים ישירות בתוך הטבלה, מה שמפשט את תהליך העבודה ומשפר את היעילות.

## הגדרות בלוק

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### כללי קישוריות בלוק

שלטו בהתנהגות הבלוק (לדוגמה, אם להציג או להריץ JavaScript) באמצעות כללי קישוריות.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

לפרטים נוספים, עיינו ב[כללי קישוריות](/interface-builder/linkage-rule)

### הגדרת טווח נתונים

דוגמה: כברירת מחדל, סננו הזמנות שבהן "סטטוס" הוא "שולם".

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

לפרטים נוספים, עיינו ב[הגדרת טווח נתונים](/interface-builder/blocks/block-settings/data-scope)

### הגדרת כללי מיון

דוגמה: הציגו הזמנות בסדר יורד לפי תאריך.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

לפרטים נוספים, עיינו ב[הגדרת כללי מיון](/interface-builder/blocks/block-settings/sorting-rule)

### הפעלת עריכה מהירה

הפעילו את "הפעלת עריכה מהירה" בהגדרות הבלוק ובהגדרות עמודות הטבלה כדי להתאים אישית אילו עמודות ניתנות לעריכה מהירה.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### הפעלת תצוגת עץ

כאשר טבלת הנתונים היא טבלת היררכית (עץ), בלוק הטבלה יכול לבחור להפעיל את התכונה **"הפעלת תצוגת עץ"**. כברירת מחדל, אפשרות זו כבויה. לאחר ההפעלה, הבלוק יציג נתונים במבנה עץ ויתמוך באפשרויות התצורה והפעולות המתאימות.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### הרחבת כל השורות כברירת מחדל

כאשר תצוגת העץ מופעלת, הבלוק תומך בהרחבת כל שורות המשנה כברירת מחדל בעת טעינתו.

## הגדרת שדות

### שדות של אוסף זה

> **שימו לב**: שדות מאוספים בירושה (כלומר, שדות אוסף אב) מתמזגים ומוצגים אוטומטית ברשימת השדות הנוכחית.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### שדות של אוספים מקושרים

> **שימו לב**: תומך בהצגת שדות מאוספים מקושרים (נכון לעכשיו, תומך רק בקשרי "אחד לאחד").

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### עמודות מותאמות אישית אחרות

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [שדה JS](/interface-builder/fields/specific/js-field)
- [עמודת JS](/interface-builder/fields/specific/js-column)

## הגדרת פעולות

### פעולות גלובליות

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [סינון](/interface-builder/actions/types/filter)
- [הוספה חדשה](/interface-builder/actions/types/add-new)
- [מחיקה](/interface-builder/actions/types/delete)
- [רענון](/interface-builder/actions/types/refresh)
- [ייבוא](/interface-builder/actions/types/import)
- [ייצוא](/interface-builder/actions/types/export)
- [הדפסת תבנית](/template-print/index)
- [עדכון בכמות גדולה](/interface-builder/actions/types/bulk-update)
- [ייצוא קבצים מצורפים](/interface-builder/actions/types/export-attachments)
- [הפעלת תהליך עבודה](/interface-builder/actions/types/trigger-workflow)
- [פעולת JS](/interface-builder/actions/types/js-action)
- [עובד AI](/interface-builder/actions/types/ai-employee)

### פעולות שורה

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [הצגה](/interface-builder/actions/types/view)
- [עריכה](/interface-builder/actions/types/edit)
- [מחיקה](/interface-builder/actions/types/delete)
- [חלון קופץ](/interface-builder/actions/types/pop-up)
- [קישור](/interface-builder/actions/types/link)
- [עדכון רשומה](/interface-builder/actions/types/update-record)
- [הדפסת תבנית](/template-print/index)
- [הפעלת תהליך עבודה](/interface-builder/actions/types/trigger-workflow)
- [פעולת JS](/interface-builder/actions/types/js-action)
- [עובד AI](/interface-builder/actions/types/ai-employee)