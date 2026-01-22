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
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
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
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
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