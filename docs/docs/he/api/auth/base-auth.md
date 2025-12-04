:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# BaseAuth

## סקירה כללית

`BaseAuth` יורש מהמחלקה האבסטרקטית [Auth](./auth) ומהווה את המימוש הבסיסי לסוגי אימות משתמשים, המשתמש ב-JWT כשיטת האימות. ברוב המקרים, ניתן להרחיב סוגי אימות משתמשים על ידי ירושה מ-`BaseAuth`, ואין צורך לרשת ישירות מהמחלקה האבסטרקטית `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // הגדרת אוסף המשתמשים
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // לוגיקת אימות המשתמש, נקראת על ידי `auth.signIn`
  // מחזיר את נתוני המשתמש
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## מתודות מחלקה

### `constructor()`

בנאי, יוצר מופע של `BaseAuth`.

#### חתימה

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### פרטים

| פרמטר | סוג | תיאור |
| :--- | :--- | :--- |
| `config` | `AuthConfig` | ראה [Auth - AuthConfig](./auth#authconfig) |
| `userCollection` | `Collection` | אוסף משתמשים, לדוגמה: `db.getCollection('users')`. ראה [DataBase - Collection](../database/collection) |

### `user()`

מאחזר, מגדיר ומקבל מידע על המשתמש. כברירת מחדל, הוא משתמש באובייקט `ctx.state.currentUser` לגישה.

#### חתימה

- `set user()`
- `get user()`

### `check()`

מאמת באמצעות טוקן הבקשה ומחזיר מידע על המשתמש.

### `signIn()`

כניסת משתמש, מייצר טוקן.

### `signUp()`

הרשמת משתמש.

### `signOut()`

יציאת משתמש, מבטל את תוקף הטוקן.

### `validate()` *

לוגיקת האימות המרכזית, נקראת על ידי ממשק ה-`signIn`, כדי לקבוע אם המשתמש יכול להיכנס בהצלחה.