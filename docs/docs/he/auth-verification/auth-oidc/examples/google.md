:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# התחברות עם Google

> https://developers.google.com/identity/openid-connect/openid-connect

## קבלת פרטי כניסה (Credentials) ל-Google OAuth 2.0

[קונסולת Google Cloud](https://console.cloud.google.com/apis/credentials) - יצירת פרטי כניסה - מזהה לקוח OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

עברו לממשק התצורה ומלאו את כתובת ה-URL המורשית להפניה מחדש (redirect URL). את כתובת ה-URL להפניה מחדש ניתן לקבל בעת הוספת מאמת (authenticator) חדש ב-NocoBase. בדרך כלל, היא תהיה `http(s)://host:port/api/oidc:redirect`. ראו את סעיף [מדריך למשתמש - תצורה](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf52ec966a1633489cb3d9d126.png)

## הוספת מאמת (Authenticator) חדש ב-NocoBase

הגדרות תוספים - אימות משתמשים - הוספה - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

התייחסו לפרמטרים המוצגים בסעיף [מדריך למשתמש - תצורה](../index.md#configuration) כדי להשלים את הגדרת המאמת.