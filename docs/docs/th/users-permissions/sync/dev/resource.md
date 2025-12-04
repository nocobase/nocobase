:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การขยายทรัพยากรเป้าหมายสำหรับการซิงค์

## ภาพรวม

NocoBase รองรับการซิงค์ข้อมูลผู้ใช้ไปยังตาราง**ผู้ใช้**และ**แผนก**โดยค่าเริ่มต้น นอกจากนี้ยังสามารถขยายทรัพยากรเป้าหมายสำหรับการซิงค์ข้อมูลได้ตามความต้องการ เพื่อให้สามารถเขียนข้อมูลไปยังตารางอื่น ๆ หรือทำการประมวลผลแบบกำหนดเองได้ครับ/ค่ะ

:::warning{title=ทดลอง}
เอกสารฉบับเต็มกำลังอยู่ระหว่างการจัดทำครับ/ค่ะ
:::

## อินเทอร์เฟซสำหรับจัดการทรัพยากรเป้าหมาย

```ts
export abstract class UserDataResource {
  name: string;
  accepts: SyncAccept[];
  db: Database;
  logger: SystemLogger;

  constructor(db: Database, logger: SystemLogger) {
    this.db = db;
    this.logger = logger;
  }

  abstract update(
    record: OriginRecord,
    resourcePks: PrimaryKey[],
    matchKey?: string,
  ): Promise<RecordResourceChanged[]>;
  abstract create(
    record: OriginRecord,
    matchKey: string,
  ): Promise<RecordResourceChanged[]>;

  get syncRecordRepo() {
    return this.db.getRepository('userDataSyncRecords');
  }

  get syncRecordResourceRepo() {
    return this.db.getRepository('userDataSyncRecordsResources');
  }
}
```

## การลงทะเบียนทรัพยากรเป้าหมาย

`registerResource(resource: UserDataResource, options?: ToposortOptions)`

```ts
import { Plugin } from '@nocobase/server';
import PluginUserDataSyncServer from '@nocobase/plugin-user-data-sync';

class CustomUserResourcePluginServer extends Plugin {
  async load() {
    const userDataSyncPlugin = this.app.pm.get(PluginUserDataSyncServer);
    if (userDataSyncPlugin && userDataSyncPlugin.enabled) {
      userDataSyncPlugin.resourceManager.registerResource(new CustomDataSyncResource(this.db, this.app.logger)
    }
  }
}
```