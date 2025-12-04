---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# אימות: DingTalk

## מבוא

תוסף האימות: DingTalk מאפשר למשתמשים להתחבר ל-NocoBase באמצעות חשבונות ה-DingTalk שלהם.

## הפעלת התוסף

![](https://static-docs.nocobase.com/202406120929356.png)

## הגשת בקשה להרשאות API בקונסולת המפתחים של DingTalk

עיינו ב-<a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">פלטפורמת DingTalk הפתוחה - יישום כניסה לאתרי צד שלישי</a> כדי ליצור יישום.

עברו לקונסולת ניהול היישומים והפעילו את "מידע אישי על מספר טלפון" ו"הרשאת קריאת מידע אישי מפנקס הכתובות".

![](https://static-docs.nocobase.com/202406120006620.png)

## קבלת פרטי אימות (Credentials) מקונסולת המפתחים של DingTalk

העתיקו את `Client ID` ואת `Client Secret`.

![](https://static-docs.nocobase.com/202406120000595.png)

## הוספת אימות DingTalk ב-NocoBase

עברו לדף ניהול תוספי אימות המשתמשים.

![](https://static-docs.nocobase.com/202406112348051.png)

הוספה - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### הגדרות

![](https://static-docs.nocobase.com/202406120016896.png)

- Sign up automatically when the user does not exist - כאשר לא נמצא משתמש קיים התואם למספר הטלפון, האם ליצור משתמש חדש באופן אוטומטי.
- `Client ID` ו-`Client Secret` - מלאו את המידע שהעתקתם בשלב הקודם.
- `Redirect URL` - כתובת URL לחזרה (Callback URL), העתיקו אותה והמשיכו לשלב הבא.

## הגדרת כתובת ה-URL לחזרה בקונסולת המפתחים של DingTalk

הדביקו את כתובת ה-URL לחזרה שהעתקתם בקונסולת המפתחים של DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## התחברות

עברו לדף ההתחברות ולחצו על הכפתור שמתחת לטופס ההתחברות כדי להתחיל התחברות באמצעות צד שלישי.

![](https://static-docs.nocobase.com/202406120014539.png)