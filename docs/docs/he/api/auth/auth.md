:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# Auth

## סקירה כללית

`Auth` היא מחלקה מופשטת (abstract class) עבור סוגי אימות משתמשים. היא מגדירה את הממשקים הנדרשים להשלמת אימות משתמש. כדי להרחיב סוג חדש של אימות משתמש, עליכם לרשת את מחלקת `Auth` וליישם את השיטות שלה. ליישום בסיסי, עיינו ב: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: authentication
  async check() {
    // ...
  }
}
```

## מאפייני מופע

### `user`

מידע על המשתמש המאומת.

#### חתימה

- `abstract user: Model`

## שיטות מחלקה

### `constructor()`

פונקציית בנאי, יוצרת מופע `Auth`.

#### חתימה

- `constructor(config: AuthConfig)`

#### טיפוס

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### פרטים

##### AuthConfig

| מאפיין         | טיפוס                                           | תיאור                                                                                                      |
| --------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | מודל נתונים של מאמת (authenticator). הטיפוס בפועל באפליקציית NocoBase הוא [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | הגדרות הקשורות למאמת.                                                                                      |
| `ctx`           | `Context`                                       | הקשר הבקשה.                                                                                               |

### `check()`

אימות משתמש. מחזירה את פרטי המשתמש. זוהי שיטה מופשטת שכל סוגי האימות חייבים ליישם.

#### חתימה

- `abstract check(): Promise<Model>`

### `signIn()`

כניסת משתמש.

#### חתימה

- `signIn(): Promise<any>`

### `signUp()`

הרשמת משתמש.

#### חתימה

- `signUp(): Promise<any>`

### `signOut()`

יציאת משתמש.

#### חתימה

- `signOut(): Promise<any>`