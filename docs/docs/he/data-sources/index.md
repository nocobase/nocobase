:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# סקירה כללית

מידול נתונים הוא שלב מפתח בתכנון מסדי נתונים, הכולל תהליך של ניתוח והפשטה מעמיקים של סוגי נתונים שונים והקשרים ההדדיים ביניהם בעולם האמיתי. בתהליך זה, אנו שואפים לחשוף את הקשרים הפנימיים בין הנתונים ולמסד אותם למודלי נתונים, ובכך להניח את היסודות למבנה מסד הנתונים של מערכת המידע. NocoBase היא פלטפורמה מונחית-מודלי נתונים, וכוללת את התכונות הבאות:

## תמיכה בגישה לנתונים ממקורות שונים

מקורות הנתונים של NocoBase יכולים להיות מסדי נתונים נפוצים, פלטפורמות API (SDK) וקבצים.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase מספקת [תוסף לניהול מקורות נתונים](/data-sources/data-source-manager), המשמש לניהול מקורות נתונים שונים ואוספיהם. תוסף ניהול מקורות הנתונים מספק רק ממשק ניהול לכל מקורות הנתונים, ואינו מספק את היכולת לגשת ישירות למקורות נתונים. הוא דורש שימוש בשילוב עם תוספי מקורות נתונים שונים. מקורות הנתונים הנתמכים כיום כוללים:

- [מסד נתונים ראשי](/data-sources/data-source-main): מסד הנתונים הראשי של NocoBase, התומך במסדי נתונים יחסיים כגון MySQL, PostgreSQL ו-MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): שימוש במסד נתונים KingbaseES כ[מקור נתונים](/data-sources/data-source-kingbase), שיכול לשמש הן כמסד נתונים ראשי והן כמסד נתונים חיצוני.
- [MySQL חיצוני](/data-sources/data-source-external-mysql): שימוש במסד נתונים MySQL חיצוני כ[מקור נתונים](/data-sources/data-source-external-mysql).
- [MariaDB חיצוני](/data-sources/data-source-external-mariadb): שימוש במסד נתונים MariaDB חיצוני כ[מקור נתונים](/data-sources/data-source-external-mariadb).
- [PostgreSQL חיצוני](/data-sources/data-source-external-postgres): שימוש במסד נתונים PostgreSQL חיצוני כ[מקור נתונים](/data-sources/data-source-external-postgres).
- [MSSQL חיצוני](/data-sources/data-source-external-mssql): שימוש במסד נתונים MSSQL (SQL Server) חיצוני כ[מקור נתונים](/data-sources/data-source-external-mssql).
- [Oracle חיצוני](/data-sources/data-source-external-oracle): שימוש במסד נתונים Oracle חיצוני כ[מקור נתונים](/data-sources/data-source-external-oracle).

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## מגוון כלי מידול נתונים

**ממשק ניהול אוספים פשוט**: משמש ליצירת אוספים שונים או לחיבור לאוספים קיימים.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**ממשק ויזואלי בסגנון ER (Entity-Relationship)**: משמש לחילוץ ישויות והקשרים ביניהן מתוך דרישות משתמשים ועסקים. הוא מספק דרך אינטואיטיבית וקלה להבנה לתיאור מודלי נתונים. באמצעות דיאגרמות ER, ניתן להבין בצורה ברורה יותר את ישויות הנתונים העיקריות במערכת ואת הקשרים ביניהן.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## תמיכה בסוגי אוספים שונים

| אוסף | תיאור |
| - | - |
| [אוסף כללי](/data-sources/data-source-main/general-collection) | כולל שדות מערכת נפוצים מובנים |
| [אוסף לוח שנה](/data-sources/calendar/calendar-collection) | משמש ליצירת אוספי אירועים הקשורים ללוח שנה |
| אוסף תגובות | משמש לאחסון תגובות או משוב על נתונים |
| [אוסף עץ](/data-sources/collection-tree) | אוסף בעל מבנה עץ, תומך כרגע רק במודל רשימת סמיכויות |
| [אוסף קבצים](/data-sources/file-manager/file-collection) | משמש לניהול אחסון קבצים |
| [אוסף SQL](/data-sources/collection-sql) | אינו אוסף מסד נתונים ממשי, אלא מציג שאילתות SQL בצורה מובנית |
| [חיבור לתצוגת מסד נתונים](/data-sources/collection-view) | מתחבר לתצוגות מסד נתונים קיימות |
| אוסף ביטויים | משמש לתרחישי ביטויים דינמיים ב[תהליכי עבודה](/data-sources/collection-fdw) |
| [חיבור לנתונים חיצוניים](/data-sources/collection-fdw) | מאפשר למערכת מסד הנתונים לגשת ולשאול נתונים ישירות ממקורות נתונים חיצוניים, בהתבסס על טכנולוגיית FDW. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

לתוכן נוסף, עיינו בסעיף "[אוספים / סקירה כללית](/data-sources/data-modeling/collection)".

## מגוון עשיר של סוגי שדות

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

לתוכן נוסף, עיינו בסעיף "[שדות אוספים / סקירה כללית](/data-sources/data-modeling/collection-fields)".