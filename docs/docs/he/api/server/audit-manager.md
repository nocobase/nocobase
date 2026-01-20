:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# AuditManager

## סקירה כללית

`AuditManager` הוא מודול ניהול ביקורת המשאבים ב-NocoBase, המשמש לרישום ממשקי משאבים הדורשים ביקורת.

### שימוש בסיסי

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## מתודות מחלקה

### `setLogger()`

מגדיר את שיטת הפלט עבור יומני הביקורת.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### חתימה

- `setLogger(logger: AuditLogger)`

#### טיפוס

```ts
export interface AuditLog {
  uuid: string;
  dataSource: string;
  resource: string;
  action: string;
  sourceCollection?: string;
  sourceRecordUK?: string;
  targetCollection?: string;
  targetRecordUK?: string;
  userId: string;
  roleName: string;
  ip: string;
  ua: string;
  status: number;
  metadata?: Record<string, any>;
}

export interface AuditLogger {
  log(auditLog: AuditLog): Promise<void>;
}
```

### `registerAction()`

רושם פעולת משאב שתבוקר.

#### חתימה

- `registerAction(action: Action)`

#### טיפוס

```ts
export interface UserInfo {
  userId?: string;
  roleName?: string;
}

export interface SourceAndTarget {
  sourceCollection?: string;
  sourceRecordUK?: string;
  targetCollection?: string;
  targetRecordUK?: string;
}

type Action =
  | string
  | {
      name: string;
      getMetaData?: (ctx: Context) => Promise<Record<string, any>>;
      getUserInfo?: (ctx: Context) => Promise<UserInfo>;
      getSourceAndTarget?: (ctx: Context) => Promise<SourceAndTarget>;
    };
```

#### פרטים

נתמכות מספר דרכי כתיבה:

1. חל על כל המשאבים

```ts
registerActions(['create']);
```

2. חל על כל הפעולות של משאב ספציפי `resource:*`

```ts
registerActions(['app:*']);
```

3. חל על פעולה ספציפית של משאב ספציפי `resource:action`

```ts
registerAction(['pm:update']);
```

4. תומך בהעברת מתודות מותאמות אישית `getMetaData`, `getUserInfo` ו-`getSourceAndTarget` עבור הפעולה

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

כאשר ממשקים רשומים חופפים, לשיטת הרישום הספציפית יותר יש עדיפות גבוהה יותר. לדוגמה:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

עבור ממשק `user:create`, רישום `3` ייכנס לתוקף.

### `registerActions()`

רושם מספר פעולות משאב שתבוקרנה.

#### חתימה

- `registerActions(actions: Action[])`