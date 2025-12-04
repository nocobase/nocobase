---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# מקור נתונים - KingbaseES

## מבוא

ניתן להשתמש ב-KingbaseES כמקור נתונים, בין אם כמסד נתונים ראשי ובין אם כמסד נתונים חיצוני.

:::warning
נכון לעכשיו, רק מסדי נתונים של KingbaseES הפועלים במצב pg נתמכים.
:::

## התקנה

### שימוש כמסד נתונים ראשי

עיינו בתיעוד ההתקנה עבור הליכי ההגדרה. ההבדל העיקרי הוא במשתני הסביבה.

#### משתני סביבה

ערכו את קובץ ה-.env כדי להוסיף או לשנות את הגדרות משתני הסביבה הבאות:

```bash
# התאימו את פרמטרי מסד הנתונים לפי הצורך
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### התקנת Docker

```yml
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # מפתח היישום ליצירת אסימוני משתמשים וכו'.
      # שינוי APP_KEY יבטל אסימונים ישנים.
      # השתמשו במחרוזת אקראית ושמרו עליה בסודיות.
      - APP_KEY=your-secret-key
      # סוג מסד הנתונים
      - DB_DIALECT=kingbase
      # מארח מסד הנתונים, ניתן להחליף בכתובת IP של שרת מסד נתונים קיים.
      - DB_HOST=kingbase
      # שם מסד הנתונים
      - DB_DATABASE=kingbase
      # משתמש מסד הנתונים
      - DB_USER=nocobase
      # סיסמת מסד הנתונים
      - DB_PASSWORD=nocobase
      # אזור זמן
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # שירות Kingbase למטרות בדיקה בלבד
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # חייב להיות מוגדר ל-no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg בלבד
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### התקנה באמצעות create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### שימוש כמסד נתונים חיצוני

הריצו את פקודת ההתקנה או השדרוג

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

הפעילו את ה-תוסף

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## מדריך למשתמש

- מסד נתונים ראשי: עיינו ב-[מקור נתונים ראשי](/data-sources/data-source-main/)
- מסד נתונים חיצוני: ראו [מקור נתונים / מסד נתונים חיצוני](/data-sources/data-source-manager/external-database)