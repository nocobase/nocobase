:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# AuthManager

## סקירה כללית

`AuthManager` הוא מודול ניהול אימות המשתמשים ב-NocoBase, המשמש לרישום סוגי אימות משתמשים שונים.

### שימוש בסיסי

```ts
const authManager = new AuthManager({
  // משמש לקבלת מזהה המאמת הנוכחי מכותרת הבקשה
  authKey: 'X-Authenticator',
});

// מגדיר את השיטות של AuthManager לאחסון ושליפת מאמתים
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// רושם סוג אימות
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// משתמש ב-middleware של האימות
app.resourceManager.use(authManager.middleware());
```

### מושגים

-   **סוג אימות (`AuthType`)**: שיטות אימות משתמשים שונות, כגון: סיסמה, SMS, OIDC, SAML ועוד.
-   **מאמת (`Authenticator`)**: ישות המייצגת שיטת אימות, הנשמרת בפועל ב[אוסף](#) ומתאימה לרשומת תצורה של סוג אימות מסוים (`AuthType`). שיטת אימות אחת יכולה לכלול מספר מאמתים, המתאימים למספר תצורות, ומספקים שיטות אימות משתמשים שונות.
-   **מזהה מאמת (`Authenticator name`)**: המזהה הייחודי של המאמת, המשמש לקביעת שיטת האימות המשמשת בבקשה הנוכחית.

## מתודות מחלקה

### `constructor()`

בנאי, יוצר מופע (instance) של `AuthManager`.

#### חתימה

-   `constructor(options: AuthManagerOptions)`

#### טיפוסים

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### פרטים

##### AuthManagerOptions

| מאפיין    | טיפוס                       | תיאור                                         | ברירת מחדל       |
| --------- | --------------------------- | --------------------------------------------- | ----------------- |
| `authKey` | `string`                    | אופציונלי, המפתח בכותרת הבקשה שמכיל את מזהה המאמת הנוכחי. | `X-Authenticator` |
| `default` | `string`                    | אופציונלי, מזהה המאמת ברירת המחדל.            | `basic`           |
| `jwt`     | [`JwtOptions`](#jwtoptions) | אופציונלי, ניתן להגדרה אם משתמשים ב-JWT לאימות. | -                 |

##### JwtOptions

| מאפיין     | טיפוס    | תיאור            | ברירת מחדל       |
| ----------- | -------- | ---------------- | ----------------- |
| `secret`    | `string` | סוד ה-token      | `X-Authenticator` |
| `expiresIn` | `string` | אופציונלי, זמן תפוגת ה-token. | `7d`              |

### `setStorer()`

מגדיר את השיטות לאחסון ושליפת נתוני מאמתים.

#### חתימה

-   `setStorer(storer: Storer)`

#### טיפוסים

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### פרטים

##### Authenticator

| מאפיין    | טיפוס                 | תיאור                |
| ---------- | --------------------- | -------------------- |
| `authType` | `string`              | סוג אימות            |
| `options`  | `Record<string, any>` | הגדרות הקשורות למאמת |

##### Storer

`Storer` הוא הממשק לאחסון מאמתים, והוא מכיל מתודה אחת.

-   `get(name: string): Promise<Authenticator>` - מקבל מאמת לפי המזהה שלו. ב-NocoBase, הטיפוס המוחזר בפועל הוא [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

רושם סוג אימות.

#### חתימה

-   `registerTypes(authType: string, authConfig: AuthConfig)`

#### טיפוסים

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // מחלקת האימות.
  title?: string; // שם התצוגה של סוג האימות.
};
```

#### פרטים

| מאפיין | טיפוס              | תיאור                                         |
| ------- | ------------------ | --------------------------------------------- |
| `auth`  | `AuthExtend<Auth>` | מימוש סוג האימות, ראו [Auth](./auth)         |
| `title` | `string`           | אופציונלי. הכותרת של סוג אימות זה המוצגת בממשק המשתמש. |

### `listTypes()`

מקבל את רשימת סוגי האימות הרשומים.

#### חתימה

-   `listTypes(): { name: string; title: string }[]`

#### פרטים

| מאפיין | טיפוס    | תיאור          |
| ------- | -------- | -------------- |
| `name`  | `string` | מזהה סוג האימות |
| `title` | `string` | כותרת סוג האימות |

### `get()`

מקבל מאמת.

#### חתימה

-   `get(name: string, ctx: Context)`

#### פרטים

| מאפיין | טיפוס     | תיאור        |
| ------ | --------- | ------------ |
| `name` | `string`  | מזהה המאמת   |
| `ctx`  | `Context` | הקשר הבקשה   |

### `middleware()`

middleware של אימות. מקבל את המאמת הנוכחי ומבצע אימות משתמשים.