:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/integration/fdw/index).
:::

# חיבור טבלאות נתונים חיצוניות (FDW)

## היכרות

תכונה זו מאפשרת חיבור לטבלאות נתונים מרוחקות המבוססות על Foreign Data Wrapper של מסד הנתונים. נכון לעכשיו, קיימת תמיכה במסדי נתונים מסוג MySQL ו-PostgreSQL.

:::info{title="חיבור מקורות נתונים לעומת חיבור טבלאות נתונים חיצוניות"}
- **חיבור מקורות נתונים** מתייחס ליצירת חיבור עם מסד נתונים ספציפי או שירות API, המאפשר שימוש מלא בתכונות מסד הנתונים או בשירותים הניתנים על ידי ה-API;
- **חיבור טבלאות נתונים חיצוניות** מתייחס לקבלת נתונים מבחוץ ומיפוים לשימוש מקומי. במסד הנתונים זה נקרא FDW (Foreign Data Wrapper), טכנולוגיית מסדי נתונים המתמקדת בשימוש בטבלאות מרוחקות כטבלאות מקומיות, וניתן לחבר רק טבלה אחת בכל פעם. מכיוון שמדובר בגישה מרחוק, קיימות מגבלות ואילוצים שונים בעת השימוש.

ניתן להשתמש בשניים גם בשילוב. הראשון משמש ליצירת חיבור עם מקור הנתונים, והשני משמש לגישה בין מקורות נתונים שונים. לדוגמה, אם מחובר מקור נתונים מסוים של PostgreSQL, וטבלה מסוימת במקור נתונים זה היא טבלה חיצונית שנוצרה על בסיס FDW.
:::

### MySQL

MySQL משתמש במנוע `federated`, אותו יש להפעיל. הוא תומך בחיבור ל-MySQL מרוחק ולמסדי נתונים תואמי פרוטוקול, כגון MariaDB. לפרטים נוספים, עיינו בתיעוד של [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

ב-PostgreSQL, ניתן להשתמש בסוגים שונים של הרחבות `fdw` כדי לתמוך בסוגי נתונים מרוחקים שונים. ההרחבות הנתמכות כרגע כוללות:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): חיבור למסד נתונים PostgreSQL מרוחק בתוך PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): חיבור למסד נתונים MySQL מרוחק בתוך PostgreSQL.
- עבור סוגים אחרים של הרחבות fdw, עיינו ב-[PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). עליכם לממש את ממשק ההתאמה המתאים בקוד.

## דרישות קדם

- אם מסד הנתונים הראשי של NocoBase הוא MySQL, עליכם להפעיל את `federated`. עיינו ב-[כיצד להפעיל את מנוע ה-federated ב-MySQL](./enable-federated)

לאחר מכן, התקינו והפעילו את התוסף דרך מנהל התוספים.

![התקנה והפעלת התוסף](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## מדריך למשתמש

תחת "ניהול אוספים > יצירת אוסף", בחרו ב-"חיבור לנתונים חיצוניים" (Connect to foreign data).

![חיבור נתונים חיצוניים](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

בתפריט הנפתח "שרת מסד נתונים" (Database Server), בחרו בשירות מסד נתונים קיים, או "יצירת שרת מסד נתונים" (Create Database Server).

![שירות מסד נתונים](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

יצירת שרת מסד נתונים.

![יצירת שרת מסד נתונים](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

לאחר בחירת שרת מסד הנתונים, בתפריט הנפתח "טבלה מרוחקת" (Remote table), בחרו את טבלת הנתונים שברצונכם לחבר.

![בחירת טבלת הנתונים לחיבור](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

הגדרת פרטי שדות.

![הגדרת פרטי שדות](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

אם חלו שינויים במבנה הטבלה המרוחקת, ניתן גם לבצע "סנכרון מטבלה מרוחקת" (Sync from remote table).

![סנכרון מטבלה מרוחקת](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

סנכרון טבלה מרוחקת.

![סנכרון טבלה מרוחקת](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

לבסוף, הצגת הנתונים בממשק.

![הצגה בממשק](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)