:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הרחבת סוגי אימות

## סקירה כללית

NocoBase תומכת בהרחבת סוגי אימות משתמשים לפי הצורך. אימות משתמשים מתחלק בדרך כלל לשני סוגים: האחד הוא קביעת זהות המשתמש בתוך יישום NocoBase עצמו, כמו התחברות באמצעות סיסמה, התחברות באמצעות SMS וכדומה; והשני הוא שירותי צד שלישי הקובעים את זהות המשתמש ומודיעים ליישום NocoBase על התוצאה באמצעות קריאות חוזרות (callbacks), כמו שיטות אימות OIDC, SAML וכדומה. תהליך האימות עבור שני סוגי האימות השונים ב-NocoBase הוא כדלקמן:

### ללא תלות בקריאות חוזרות מצד שלישי

1. הלקוח משתמש ב-NocoBase SDK כדי לקרוא לממשק ההתחברות `api.auth.signIn()`, מבקש את ממשק ההתחברות `auth:signIn`, ובמקביל מעביר את מזהה המאמת הנוכחי דרך כותרת הבקשה `X-Authenticator` ל-backend.
2. ממשק `auth:signIn`, בהתבסס על מזהה המאמת בכותרת הבקשה, מעביר את הבקשה לסוג האימות המתאים למאמת, ושיטת `validate` במחלקת האימות הרשומה של סוג אימות זה מבצעת את הטיפול הלוגי המתאים.
3. הלקוח מקבל את פרטי המשתמש ואת אסימון האימות מתגובת ממשק `auth:signIn`, שומר את ה-`token` ב-Local Storage, ומשלים את ההתחברות. שלב זה מטופל באופן אוטומטי בתוך ה-SDK.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### תלוי בקריאות חוזרות מצד שלישי

1. הלקוח מקבל את כתובת ה-URL של התחברות צד שלישי דרך ממשק רשום משלו (לדוגמה, `auth:getAuthUrl`), ונושא מידע כמו שם היישום ומזהה המאמת בהתאם לפרוטוקול.
2. הפניה לכתובת ה-URL של צד שלישי להשלמת ההתחברות. שירות צד שלישי קורא לממשק הקריאה החוזרת של יישום NocoBase (שצריך להירשם באופן עצמאי, לדוגמה, `auth:redirect`), מחזיר את תוצאת האימות, ובמקביל מחזיר מידע כמו שם היישום ומזהה המאמת.
3. בשיטת ממשק הקריאה החוזרת, מנתחים את הפרמטרים כדי לקבל את מזהה המאמת, מקבלים את מחלקת האימות המתאימה דרך `AuthManager`, וקוראים באופן יזום לשיטת `auth.signIn()`. שיטת `auth.signIn()` תקרא לשיטת `validate()` כדי לטפל בלוגיקת האימות.
4. לאחר ששיטת הקריאה החוזרת מקבלת את אסימון האימות, היא מבצעת הפניית 302 בחזרה לדף ה-frontend, ונושאת את ה-`token` ומזהה המאמת בפרמטרי ה-URL, `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

בהמשך נסביר כיצד לרשום ממשקי צד שרת וממשקי משתמש בצד לקוח.

## צד שרת

### ממשק אימות

ליבת NocoBase מספקת רישום וניהול של סוגי אימות מורחבים. טיפול הליבה הלוגי של הרחבת תוסף ההתחברות דורש ירושה מהמחלקה המופשטת `Auth` של הליבה ויישום הממשקים הסטנדרטיים המתאימים.
לתיעוד ה-API המלא, עיינו ב-[Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

הליבה רושמת גם פעולות משאבים בסיסיות הקשורות לאימות משתמשים.

| API            | תיאור                  |
| -------------- | ---------------------- |
| `auth:check`   | בדיקה אם המשתמש מחובר |
| `auth:signIn`  | התחברות                |
| `auth:signUp`  | הרשמה                  |
| `auth:signOut` | התנתקות                |

ברוב המקרים, סוגי אימות המשתמשים המורחבים יכולים להשתמש גם בלוגיקת אימות ה-JWT הקיימת כדי ליצור את האישורים לגישת המשתמש ל-API. מחלקת `BaseAuth` בליבה ביצעה יישום בסיסי של המחלקה המופשטת `Auth`, עיינו ב-[BaseAuth](../../../api/auth/base-auth.md). תוספים יכולים לרשת ישירות ממחלקת `BaseAuth` כדי לעשות שימוש חוזר בחלק מקוד הלוגיקה ולהפחית את עלויות הפיתוח.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // הגדרת אוסף המשתמשים
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // יישום לוגיקת אימות המשתמש
  async validate() {}
}
```

### נתוני משתמש

בעת יישום לוגיקת אימות משתמשים, הדבר כרוך בדרך כלל בטיפול בנתוני משתמשים. ביישום NocoBase, ה**אוספים** הקשורים מוגדרים כברירת מחדל כדלקמן:

| אוסף                  | תיאור                                                                                             | תוסף                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `users`               | מאחסן פרטי משתמש, כגון אימייל, כינוי וסיסמה                                                       | [תוסף משתמשים (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | מאחסן מידע על מאמתים (ישויות סוג אימות), המתאים לסוג האימות והתצורה                               | תוסף אימות משתמשים (`@nocobase/plugin-auth`)                   |
| `usersAuthenticators` | משייך משתמשים ומאמתים, שומר מידע על משתמשים תחת המאמת המתאים                                     | תוסף אימות משתמשים (`@nocobase/plugin-auth`)                   |

באופן כללי, שיטות התחברות מורחבות משתמשות ב-`users` וב-`usersAuthenticators` כדי לאחסן את נתוני המשתמשים המתאימים. רק במקרים מיוחדים תצטרכו להוסיף **אוסף** חדש בעצמכם.

השדות העיקריים של `usersAuthenticators` הם:

| שדה             | תיאור                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| `uuid`          | מזהה ייחודי למשתמש עבור סוג אימות זה, כגון מספר טלפון או מזהה משתמש של שירות צד שלישי |
| `meta`          | שדה JSON, מידע נוסף שיש לשמור                                                             |
| `userId`        | מזהה משתמש                                                                                |
| `authenticator` | שם המאמת (מזהה ייחודי)                                                                    |

עבור פעולות שאילתה ויצירת משתמשים, מודל הנתונים `AuthModel` של `authenticators` עוטף גם כמה שיטות, שניתן להשתמש בהן במחלקת `CustomAuth` באמצעות `this.authenticator[methodName]`. לתיעוד ה-API המלא, עיינו ב-[AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // שאילתת משתמש
    this.authenticator.newUser(); // יצירת משתמש חדש
    this.authenticator.findOrCreateUser(); // שאילתה או יצירת משתמש חדש
    // ...
  }
}
```

### רישום סוגי אימות

שיטת האימות המורחבת צריכה להירשם במודול ניהול האימות.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## צד לקוח

ממשק המשתמש בצד הלקוח נרשם באמצעות הממשק `registerType` המסופק על ידי לקוח **תוסף** אימות המשתמשים:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // טופס התחברות
        SignInButton, // כפתור התחברות (צד שלישי), יכול להיות חלופה לטופס ההתחברות
        SignUpForm, // טופס הרשמה
        AdminSettingsForm, // טופס הגדרות ניהול
      },
    });
  }
}
```

### טופס התחברות

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

אם מספר מאמתים המתאימים לסוג האימות רשמו טופסי התחברות, הם יוצגו בצורת לשוניות (Tabs). כותרת הלשונית תהיה כותרת המאמת שהוגדרה ב-backend.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### כפתור התחברות

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

בדרך כלל מדובר בכפתורי התחברות של צד שלישי, אך למעשה יכול להיות כל רכיב.

### טופס הרשמה

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

אם אתם צריכים לקפוץ מדף ההתחברות לדף ההרשמה, עליכם לטפל בכך בעצמכם ברכיב ההתחברות.

### טופס הגדרות ניהול

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

החלק העליון הוא תצורת המאמת הגנרית, והחלק התחתון הוא החלק של טופס התצורה המותאמת אישית שניתן לרשום.

### בקשת ממשקי API

כדי ליזום בקשות לממשקים הקשורים לאימות משתמשים בצד הלקוח, אתם יכולים להשתמש ב-SDK המסופק על ידי NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// לשימוש ברכיב
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

לתיעוד API מפורט, עיינו ב-[@nocobase/sdk - Auth](/api/sdk/auth).