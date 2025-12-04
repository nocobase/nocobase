---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# אימות: CAS

## מבוא

התוסף אימות: CAS פועל לפי תקן פרוטוקול CAS (Central Authentication Service), ומאפשר למשתמשים להיכנס ל-NocoBase באמצעות חשבונות המסופקים על ידי ספקי שירותי אימות זהות (IdP) חיצוניים.

## התקנה

## מדריך למשתמש

### הפעלת תוסף

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### הוספת אימות CAS

בקר בדף ניהול אימות המשתמשים

http://localhost:13000/admin/settings/auth/authenticators

הוסף שיטת אימות CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

הגדר את CAS והפעל

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### בקר בדף הכניסה

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)