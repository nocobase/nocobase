:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# AuditManager

## نظرة عامة

`AuditManager` هي وحدة إدارة تدقيق الموارد في NocoBase، وتُستخدم لتسجيل واجهات الموارد التي تتطلب التدقيق.

### الاستخدام الأساسي

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## أساليب الفئة

### `setLogger()`

تضبط طريقة إخراج سجلات التدقيق.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### التوقيع

- `setLogger(logger: AuditLogger)`

#### النوع

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

تسجل إجراء مورد ليتم تدقيقه.

#### التوقيع

- `registerAction(action: Action)`

#### النوع

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

#### التفاصيل

تدعم عدة أنماط كتابة:

1.  تُطبق على جميع الموارد

```ts
registerActions(['create']);
```

2.  تُطبق على جميع إجراءات مورد معين `resource:*`

```ts
registerActions(['app:*']);
```

3.  تُطبق على إجراء معين لمورد معين `resource:action`

```ts
registerAction(['pm:update']);
```

4.  تدعم تمرير دوال مخصصة مثل `getMetaData` و `getUserInfo` و `getSourceAndTarget` للإجراء

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

عندما تتداخل الواجهات المسجلة، تكون الأولوية لطريقة التسجيل الأكثر تحديدًا. على سبيل المثال:

1.  `registerActions('create')`

2.  `registerAction({ name: 'user:*', getMetaData })`

3.  `registerAction({ name: 'user:create', getMetaData })`

بالنسبة لواجهة `user:create`، سيتم تطبيق الطريقة رقم `3`.

### `registerActions()`

تسجل عدة إجراءات للموارد ليتم تدقيقها.

#### التوقيع

- `registerActions(actions: Action[])`