---
pkg: "@nocobase/plugin-wecom"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# סנכרון נתוני משתמשים מ-WeChat Work

## מבוא

ה**תוסף** של WeChat Work מאפשר לסנכרן נתוני משתמשים ומחלקות מ-WeChat Work.

## יצירה והגדרה של יישום WeChat Work מותאם אישית

ראשית, עליכם ליצור בלוח הניהול של WeChat Work יישום מותאם אישית של WeChat Work, ולקבל את ה-**Corp ID**, ה-**AgentId** וה-**Secret**.

ראו [אימות משתמשים - WeChat Work](/auth-verification/auth-wecom/).

## הוספת מקור נתונים לסנכרון ב-NocoBase

עברו אל משתמשים והרשאות (Users & Permissions) - סנכרון (Sync) - הוספה (Add), ומלאו את הפרטים שקיבלתם.

![](https://static-docs.nocobase.com/202412041251867.png)

## הגדרת סנכרון אנשי קשר

עברו ללוח הניהול של WeChat Work - אבטחה וניהול (Security and Management) - כלי ניהול (Management Tools), ולחצו על סנכרון אנשי קשר (Contacts Sync).

![](https://static-docs.nocobase.com/202412041249958.png)

הגדירו כפי שמוצג בתמונה, והגדירו את כתובת ה-IP המהימנה של הארגון.

![](https://static-docs.nocobase.com/202412041250776.png)

כעת תוכלו להמשיך בסנכרון נתוני המשתמשים.

## הגדרת שרת קבלת אירועים

אם ברצונכם ששינויים בנתוני משתמשים ומחלקות בצד של WeChat Work יסונכרנו בזמן אמת ליישום NocoBase, תוכלו להמשיך בהגדרות נוספות.

לאחר שמילאתם את פרטי ההגדרה הקודמים, תוכלו להעתיק את כתובת ה-URL של הודעת הקריאה החוזרת (callback) של אנשי הקשר.

![](https://static-docs.nocobase.com/202412041256547.png)

הזינו אותה בהגדרות WeChat Work, וקבלו את ה-Token וה-EncodingAESKey, כדי להשלים את הגדרת מקור הנתונים לסנכרון משתמשים ב-NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)