:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# אימות משתמשים

מודול אימות המשתמשים של NocoBase מורכב בעיקר משני חלקים:

- ה-`@nocobase/auth` שבליבת המערכת מגדיר ממשקים ניתנים להרחבה ותוכנות ביניים (middleware) הקשורים לאימות משתמשים, כמו התחברות, הרשמה ואימות. הוא משמש גם לרישום וניהול מגוון שיטות אימות מורחבות.
- ה-`@nocobase/plugin-auth` בתוסף משמש לאתחול מודול ניהול האימות בליבת המערכת, ומספק גם שיטת אימות בסיסית באמצעות שם משתמש (או אימייל) וסיסמה.

> יש להשתמש במודול זה בשילוב עם פונקציונליות ניהול המשתמשים המסופקת על ידי [התוסף `@nocobase/plugin-users`](/users-permissions/user).

בנוסף לכך, NocoBase מציעה מגוון תוספים נוספים לשיטות אימות משתמשים:

- [`@nocobase/plugin-auth-sms`](/auth-verification/auth-sms/) - מספק פונקציונליות התחברות באמצעות אימות ב-SMS
- [`@nocobase/plugin-auth-saml`](/auth-verification/auth-saml/) - מספק פונקציונליות התחברות SAML SSO
- [`@nocobase/plugin-auth-oidc`](/auth-verification/auth-oidc/) - מספק פונקציונליות התחברות OIDC SSO
- [`@nocobase/plugin-auth-cas`](/auth-verification/auth-cas/) - מספק פונקציונליות התחברות CAS SSO
- [`@nocobase/plugin-auth-ldap`](/auth-verification/auth-ldap/) - מספק פונקציונליות התחברות LDAP SSO
- [`@nocobase/plugin-auth-wecom`](/auth-verification/auth-wecom/) - מספק פונקציונליות התחברות WeCom
- [`@nocobase/plugin-auth-dingtalk`](/auth-verification/auth-dingtalk/) - מספק פונקציונליות התחברות DingTalk

באמצעות התוספים הנ"ל, לאחר שהמנהל מגדיר את שיטת האימות המתאימה, משתמשים יכולים להתחבר למערכת ישירות באמצעות זהות המשתמש המסופקת על ידי פלטפורמות כמו Google Workspace, Microsoft Azure, וכן להתחבר לכלי פלטפורמה כמו Auth0, Logto, Keycloak. בנוסף, מפתחים יכולים להרחיב בקלות שיטות אימות נוספות שהם זקוקים להן, באמצעות הממשקים הבסיסיים שאנו מספקים.