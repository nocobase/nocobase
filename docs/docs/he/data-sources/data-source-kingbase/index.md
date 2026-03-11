---
pkg: "@nocobase/plugin-data-source-kingbase"
---

:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/data-sources/data-source-kingbase/index).
:::

# מקור נתונים - KingbaseES (人大金仓)

## מבוא

שימוש במסד הנתונים KingbaseES (人大金仓) כמקור נתונים; ניתן להשתמש בו כמסד נתונים ראשי או כמסד נתונים חיצוני.

:::warning
כרגע נתמכים רק מסדי נתונים של KingbaseES (人大金仓) הפועלים במצב pg.
:::

## התקנה

### שימוש כמסד נתונים ראשי

תהליך ההתקנה מתבסס על תיעוד ההתקנה, ההבדל העיקרי הוא במשתני הסביבה.

#### משתני סביבה

שנו את קובץ ה-.env כדי להוסיף או לעדכן את הגדרות משתני הסביבה הרלוונטיות הבאות:

```bash
# התאימו את פרמטרי ה-DB בהתאם לצורך
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

הריצו את פקודת ההתקנה או השדרוג:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

הפעלת התוסף:

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## מדריך למשתמש

- מסד נתונים ראשי: עיינו במקור נתונים ראשי
- מסד נתונים חיצוני: עיינו ב-[מקור נתונים / מסד נתונים חיצוני](/data-sources/data-source-manager/external-database)