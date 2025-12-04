---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# מפתחות API

## מבוא

## הוראות שימוש

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### הוספת מפתח API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**הערות חשובות**

- מפתח ה-API שנוצר משויך למשתמש הנוכחי ויורש את התפקיד שלו.
- אנא ודאו שמשתנה הסביבה `APP_KEY` הוגדר ושנשמר בסודיות. אם ה-`APP_KEY` ישתנה, כל מפתחות ה-API הקיימים יהפכו ללא חוקיים.

### כיצד להגדיר את APP_KEY

עבור גרסת Docker, עליכם לערוך את קובץ `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

בהתקנה מקוד המקור או באמצעות `create-nocobase-app`, תוכלו לעדכן ישירות את ה-`APP_KEY` בקובץ `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```