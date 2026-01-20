:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# שדרוג התקנת Docker

:::warning הכנות לפני השדרוג

- הקפידו לגבות את מסד הנתונים שלכם.

:::

## 1. עברו לתיקייה שבה נמצא הקובץ docker-compose.yml

לדוגמה

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. עדכנו את מספר גרסת האימג'

:::tip אודות מספרי גרסה

- גרסאות כינוי, כמו `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, בדרך כלל אינן דורשות שינוי.
- מספרי גרסה מספריים, כמו `1.7.14`, `1.7.14-full`, צריכים להשתנות למספר הגרסה הרצוי.
- נתמכים רק שדרוגים; שדרוגי גרסה לאחור אינם נתמכים!!!
- בסביבת ייצור, מומלץ לקבע לגרסה מספרית ספציפית כדי למנוע שדרוגים אוטומטיים בלתי מכוונים. [צפו בכל הגרסאות](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # מומלץ להשתמש באימג' של Alibaba Cloud (רשת יציבה יותר בסין)
    image: nocobase/nocobase:1.7.14-full
    # ניתן גם להשתמש בגרסת כינוי (עלול לשדרג אוטומטית, השתמשו בזהירות בסביבת ייצור)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (עלול להיות איטי/להיכשל בסין)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. הפעילו מחדש את הקונטיינר

```bash
# משכו את האימג' העדכני ביותר
docker compose pull app

# בנו מחדש את הקונטיינר
docker compose up -d app

# בדקו את מצב תהליך ה-app
docker compose logs -f app
```

## 4. שדרוג תוספים של צד שלישי

עיינו ב-[התקנה ושדרוג תוספים](../install-upgrade-plugins.mdx)

## 5. הוראות שחזור גרסה

NocoBase אינה תומכת בשדרוג גרסה לאחור. אם אתם צריכים לשחזר גרסה, אנא שחזרו את גיבוי מסד הנתונים מלפני השדרוג ושנו את גרסת האימג' בחזרה לגרסה המקורית.

## 6. שאלות נפוצות (FAQ)

**ש: משיכת אימג' איטית או נכשלה**

השתמשו בהאצת אימג'ים, או השתמשו באימג' של Alibaba Cloud: `nocobase/nocobase:<tag>`

**ש: הגרסה לא השתנתה**

ודאו ששיניתם את `image` למספר הגרסה החדש וביצעתם בהצלחה את הפקודות `docker compose pull app` ו-`up -d app`.

**ש: הורדה או עדכון של תוסף מסחרי נכשלו**

עבור תוספים מסחריים, אנא אמת/י את קוד הרישיון במערכת, ולאחר האימות הפעילו מחדש את קונטיינר ה-Docker. לפרטים נוספים, ראו [מדריך הפעלת רישיון מסחרי של NocoBase](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).