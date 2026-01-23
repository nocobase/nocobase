:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# AuditManager

## ภาพรวม

`AuditManager` เป็นโมดูลจัดการการตรวจสอบทรัพยากรใน NocoBase ครับ/ค่ะ ใช้สำหรับลงทะเบียนอินเทอร์เฟซทรัพยากรที่ต้องการให้มีการตรวจสอบ

### การใช้งานเบื้องต้น

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## เมธอดของคลาส

### `setLogger()`

กำหนดวิธีการส่งออก (output) สำหรับบันทึกการตรวจสอบ (audit logs) ครับ/ค่ะ

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### รูปแบบการใช้งาน

- `setLogger(logger: AuditLogger)`

#### ประเภท

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

ลงทะเบียนการดำเนินการของทรัพยากรที่ต้องการให้มีการตรวจสอบครับ/ค่ะ

#### รูปแบบการใช้งาน

- `registerAction(action: Action)`

#### ประเภท

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

#### รายละเอียด

รองรับรูปแบบการเขียนหลายแบบ ดังนี้ครับ/ค่ะ

1.  ใช้ได้กับทรัพยากรทั้งหมด

    ```ts
    registerActions(['create']);
    ```

2.  ใช้ได้กับการดำเนินการทั้งหมดของทรัพยากรที่ระบุ `resource:*`

    ```ts
    registerActions(['app:*']);
    ```

3.  ใช้ได้กับการดำเนินการที่เฉพาะเจาะจงของทรัพยากรที่ระบุ `resource:action`

    ```ts
    registerAction(['pm:update']);
    ```

4.  รองรับการส่งเมธอด `getMetaData`, `getUserInfo` และ `getSourceAndTarget` ที่กำหนดเองสำหรับการดำเนินการนั้นๆ ครับ/ค่ะ

    ```ts
    registerActions([
      'create',
      { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
    ]);
    ```

ในกรณีที่อินเทอร์เฟซที่ลงทะเบียนมีการทับซ้อนกัน วิธีการลงทะเบียนที่มีความละเอียดเฉพาะเจาะจงมากกว่าจะมีลำดับความสำคัญสูงกว่าครับ/ค่ะ ตัวอย่างเช่น:

1.  `registerActions('create')`

2.  `registerAction({ name: 'user:*', getMetaData })`

3.  `registerAction({ name: 'user:create', getMetaData })`

สำหรับอินเทอร์เฟซ `user:create` การลงทะเบียนในข้อ `3` จะมีผลครับ/ค่ะ

### `registerActions()`

ลงทะเบียนการดำเนินการของทรัพยากรหลายรายการที่ต้องการให้มีการตรวจสอบครับ/ค่ะ

#### รูปแบบการใช้งาน

- `registerActions(actions: Action[])`