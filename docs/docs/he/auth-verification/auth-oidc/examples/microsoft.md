:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## הוספת מאמת (Authenticator) ב-NocoBase

ראשית, הוסיפו מאמת חדש ב-NocoBase: הגדרות תוסף - אימות משתמשים - הוספה - OIDC.

העתיקו את כתובת ה-URL של הקריאה החוזרת (callback URL).

![](https://static-docs.nocobase.com/202412021504114.png)

## רישום היישום

פתחו את מרכז הניהול של Microsoft Entra ורשמו יישום חדש.

![](https://static-docs.nocobase.com/202412021506837.png)

הדביקו כאן את כתובת ה-URL של הקריאה החוזרת שהעתקתם זה עתה.

![](https://static-docs.nocobase.com/202412021520696.png)

## קבלת ומילוי המידע הנדרש

לחצו על היישום שרשמתם זה עתה, והעתיקו מדף הסקירה הכללית את **Application (client) ID** ואת **Directory (tenant) ID**.

![](https://static-docs.nocobase.com/202412021522063.png)

לחצו על `Certificates & secrets`, צרו סוד לקוח (Client secret) חדש, והעתיקו את ה**ערך** (Value).

![](https://static-docs.nocobase.com/202412021522846.png)

להלן המיפוי בין המידע של Microsoft Entra לבין הגדרות המאמת ב-NocoBase:

| מידע מ-Microsoft Entra    | שדה המאמת ב-NocoBase                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID | Client ID                                                                                                                                        |
| Client secrets - ערך  | Client secret                                                                                                                                    |
| Directory (tenant) ID   | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, החליפו את `{tenant}` ב-Directory (tenant) ID המתאים. |