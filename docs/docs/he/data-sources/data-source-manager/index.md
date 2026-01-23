---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# ניהול מקורות נתונים

## מבוא

NocoBase מספקת תוסף לניהול מקורות נתונים, המשמש לניהול מקורות נתונים ואוספיהם. תוסף ניהול מקורות הנתונים רק מספק ממשק ניהול לכל מקורות הנתונים, אך אינו מספק את היכולת לגשת למקורות נתונים בפועל. הוא דורש שימוש בשילוב עם תוספי מקורות נתונים שונים. מקורות הנתונים הנתמכים כרגע לגישה כוללים:

- [מסד נתונים ראשי](/data-sources/data-source-main): מסד הנתונים הראשי של NocoBase, התומך במסדי נתונים יחסיים כמו MySQL, PostgreSQL ו-MariaDB.
- [MySQL חיצוני](/data-sources/data-source-external-mysql): שימוש במסד נתונים MySQL חיצוני כמקור נתונים.
- [MariaDB חיצוני](/data-sources/data-source-external-mariadb): שימוש במסד נתונים MariaDB חיצוני כמקור נתונים.
- [PostgreSQL חיצוני](/data-sources/data-source-external-postgres): שימוש במסד נתונים PostgreSQL חיצוני כמקור נתונים.
- [MSSQL חיצוני](/data-sources/data-source-external-mssql): שימוש במסד נתונים MSSQL (SQL Server) חיצוני כמקור נתונים.
- [Oracle חיצוני](/data-sources/data-source-external-oracle): שימוש במסד נתונים Oracle חיצוני כמקור נתונים.

בנוסף לכך, ניתן להרחיב סוגים נוספים באמצעות תוספים. אלה יכולים להיות סוגים נפוצים של מסדי נתונים, או פלטפורמות המספקות ממשקי API (SDKs).

## התקנה

תוסף מובנה, אין צורך בהתקנה נפרדת.

## הוראות שימוש

כאשר היישום מאותחל ומותקן, מסופק כברירת מחדל מקור נתונים לאחסון נתוני NocoBase, המכונה מסד הנתונים הראשי. למידע נוסף, עיינו בתיעוד של [מסד נתונים ראשי](/data-sources/data-source-main/).

### מקורות נתונים חיצוניים

מסדי נתונים חיצוניים נתמכים כמקורות נתונים. למידע נוסף, עיינו בתיעוד של [מסד נתונים חיצוני / מבוא](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### תמיכה בסנכרון טבלאות מותאמות אישית במסד הנתונים

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

ניתן גם לגשת לנתונים ממקורות HTTP API. למידע נוסף, עיינו בתיעוד של [מקור נתונים REST API](/data-sources/data-source-rest-api/).