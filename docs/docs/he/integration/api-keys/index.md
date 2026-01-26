:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מפתח API

## מבוא

## התקנה

## הוראות שימוש

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### הוספת מפתח API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**הערות**

- מפתח ה-API שאתם מוסיפים שייך למשתמש הנוכחי ויורש את התפקיד של המשתמש הנוכחי.
- ודאו שמשתנה הסביבה `APP_KEY` מוגדר ושנשמר בסודיות. אם `APP_KEY` ישתנה, כל מפתחות ה-API שנוספו בעבר יהפכו ללא חוקיים.

### כיצד להגדיר את `APP_KEY`

עבור גרסת Docker, עליכם לשנות את קובץ `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

עבור התקנה מקוד המקור או באמצעות `create-nocobase-app`, תוכלו לשנות ישירות את `APP_KEY` בקובץ `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```