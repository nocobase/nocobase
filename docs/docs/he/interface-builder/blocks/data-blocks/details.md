:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# בלוק פרטים

## מבוא
בלוק הפרטים משמש להצגת ערכי השדות של כל רשומת נתונים. הוא תומך בפריסות שדות גמישות וכולל פונקציות מובנות לפעולות נתונים, מה שהופך אותו לנוח עבור משתמשים לצפייה וניהול מידע.

## הגדרות בלוק
![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### כללי קישוריות בלוק
באמצעות כללי קישוריות תוכלו לשלוט בהתנהגות הבלוק (לדוגמה, האם להציג אותו או להריץ JavaScript).
![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
לפרטים נוספים, עיינו ב[כללי קישוריות](/interface-builder/linkage-rule)

### הגדרת טווח נתונים
דוגמה: הצגת הזמנות ששולמו בלבד.
![20251023195051](https://static-docs.nocobase.com/20251023195051.png)
לפרטים נוספים, עיינו ב[הגדרת טווח נתונים](/interface-builder/blocks/block-settings/data-scope)

### כללי קישוריות שדות
כללי קישוריות בבלוק הפרטים תומכים בהגדרה דינמית של שדות להצגה/הסתרה.
דוגמה: אל תציגו את הסכום כאשר סטטוס ההזמנה הוא "בוטלה".
![20251023200739](https://static-docs.nocobase.com/20251023200739.png)
לפרטים נוספים, עיינו ב[כללי קישוריות](/interface-builder/linkage-rule)

## הגדרת שדות

### שדות מתוך אוסף זה
> **שימו לב**: שדות מאוספים בירושה (כלומר, שדות אוסף אב) מתמזגים אוטומטית ומוצגים ברשימת השדות הנוכחית.
![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### שדות מאוספים מקושרים
> **שימו לב**: נתמכת הצגת שדות מאוספים מקושרים (נכון לעכשיו, רק עבור קשרי גומלין מסוג "אחד לאחד").
![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### שדות נוספים
- שדה JS
- פריט JS
- קו מפריד
- Markdown
![20251023201514](https://static-docs.nocobase.com/20251023201514.png)
> **טיפ**: תוכלו לכתוב JavaScript כדי ליישם תוכן תצוגה מותאם אישית, מה שיאפשר לכם להציג מידע מורכב יותר.
> לדוגמה, תוכלו לרנדר אפקטים שונים של תצוגה בהתבסס על סוגי נתונים, תנאים או לוגיקה שונים.
![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## הגדרת פעולות
![20251023200529](https://static-docs.nocobase.com/20251023200529.png)
- [עריכה](/interface-builder/actions/types/edit)
- [מחיקה](/interface-builder/actions/types/delete)
- [קישור](/interface-builder/actions/types/link)
- [חלון קופץ](/interface-builder/actions/types/pop-up)
- [עדכון רשומה](/interface-builder/actions/types/update-record)
- [הפעלת תהליך עבודה](/interface-builder/actions/types/trigger-workflow)
- [פעולת JS](/interface-builder/actions/types/js-action)
- [עובד AI](/interface-builder/actions/types/ai-employee)