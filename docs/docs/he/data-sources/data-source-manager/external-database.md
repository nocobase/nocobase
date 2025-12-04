:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מסד נתונים חיצוני

## מבוא

השתמשו במסד נתונים חיצוני קיים כ**מקור נתונים**. נכון לעכשיו, מסדי הנתונים החיצוניים הנתמכים כוללים את MySQL, MariaDB, PostgreSQL, MSSQL ו-Oracle.

## הוראות שימוש

### הוספת מסד נתונים חיצוני

לאחר הפעלת ה**תוסף**, תוכלו לבחור ולהוסיף אותו מתפריט ה'הוספה חדשה' (Add new) בניהול **מקורות הנתונים**.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

מלאו את פרטי מסד הנתונים שאליו תרצו להתחבר.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### סנכרון אוספים

לאחר יצירת חיבור למסד נתונים חיצוני, כל ה**אוספים** בתוך **מקור הנתונים** ייקראו באופן ישיר. מסדי נתונים חיצוניים אינם תומכים בהוספת **אוספים** או בשינוי מבנה הטבלה ישירות. אם יש צורך בשינויים, תוכלו לבצע אותם באמצעות לקוח מסד נתונים, ולאחר מכן ללחוץ על כפתור ה'רענן' (Refresh) בממשק כדי לסנכרן.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### הגדרת שדות

מסד הנתונים החיצוני יקרא ויציג באופן אוטומטי את השדות של ה**אוספים** הקיימים. תוכלו לצפות במהירות ולהגדיר את כותרת השדה, סוג הנתונים (Field type) וסוג ממשק המשתמש (Field interface). כמו כן, תוכלו ללחוץ על כפתור ה'עריכה' (Edit) כדי לשנות הגדרות נוספות.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

מכיוון שמסדי נתונים חיצוניים אינם תומכים בשינוי מבנה הטבלה, סוג השדה היחיד הזמין בעת הוספת שדה חדש הוא שדה יחס (association field). שדות יחס אינם שדות ממשיים, אלא משמשים ליצירת חיבורים בין **אוספים**.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

לפרטים נוספים, עיינו בפרק [שדות **אוסף**/סקירה כללית](/data-sources/data-modeling/collection-fields).

### מיפוי סוגי שדות

NocoBase ממפה באופן אוטומטי את סוגי השדות ממסד הנתונים החיצוני לסוג הנתונים (Field type) וסוג ממשק המשתמש (Field Interface) המתאימים.

- סוג נתונים (Field type): מגדיר את סוג, פורמט ומבנה הנתונים ששדה יכול לאחסן.
- סוג ממשק משתמש (Field interface): מתייחס לסוג הפקד המשמש בממשק המשתמש להצגה והזנה של ערכי שדות.

| PostgreSQL | MySQL/MariaDB | סוג נתונים ב-NocoBase | סוג ממשק ב-NocoBase |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### סוגי שדות שאינם נתמכים

סוגי שדות שאינם נתמכים מוצגים בנפרד. שדות אלו דורשים התאמה פיתוחית לפני שניתן יהיה להשתמש בהם.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### מפתח יעד לסינון

**אוספים** המוצגים כבלוקים חייבים להיות מוגדרים עם מפתח יעד לסינון (Filter target key). מפתח יעד לסינון משמש לסינון נתונים על בסיס שדה ספציפי, וערך השדה חייב להיות ייחודי. כברירת מחדל, מפתח יעד לסינון הוא שדה המפתח הראשי של ה**אוסף**. עבור תצוגות, **אוספים** ללא מפתח ראשי, או **אוספים** עם מפתח ראשי מורכב, עליכם להגדיר מפתח יעד לסינון מותאם אישית.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

רק **אוספים** שהוגדר עבורם מפתח יעד לסינון ניתנים להוספה לדף.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)