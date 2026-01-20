:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การพัฒนาปลั๊กอิน

## ปัญหาที่พบ

ในสภาพแวดล้อมแบบโหนดเดี่ยว ปลั๊กอินมักจะสามารถตอบสนองความต้องการได้ผ่านสถานะภายในโปรเซส, เหตุการณ์ หรืองานต่าง ๆ ครับ/ค่ะ แต่ในโหมดคลัสเตอร์ ปลั๊กอินเดียวกันอาจทำงานพร้อมกันบนหลายอินสแตนซ์ ซึ่งนำไปสู่ปัญหาทั่วไปดังต่อไปนี้:

-   **ความสอดคล้องของสถานะ**: หากข้อมูลการกำหนดค่าหรือข้อมูลรันไทม์ถูกจัดเก็บไว้ในหน่วยความจำเท่านั้น การซิงค์ข้อมูลระหว่างอินสแตนซ์จะทำได้ยาก และอาจทำให้เกิดปัญหาข้อมูลค้าง (dirty reads) หรือการทำงานซ้ำซ้อนได้ครับ/ค่ะ
-   **การจัดกำหนดการงาน**: หากงานที่ใช้เวลานานไม่มีกลไกการจัดคิวและการยืนยันที่ชัดเจน อาจทำให้หลายอินสแตนซ์ทำงานเดียวกันพร้อมกันได้ครับ/ค่ะ
-   **เงื่อนไขการแข่งขัน**: เมื่อมีการเปลี่ยนแปลง Schema หรือการจัดสรรทรัพยากร จำเป็นต้องมีการดำเนินการแบบอนุกรม (serialized operations) เพื่อหลีกเลี่ยงข้อขัดแย้งที่เกิดจากการเขียนพร้อมกันครับ/ค่ะ

NocoBase core ได้เตรียมอินเทอร์เฟซมิดเดิลแวร์หลายประเภทไว้ล่วงหน้าในเลเยอร์แอปพลิเคชัน เพื่อช่วยให้ปลั๊กอินสามารถนำความสามารถที่รวมเป็นหนึ่งเดียวกลับมาใช้ซ้ำได้ในสภาพแวดล้อมแบบคลัสเตอร์ ส่วนต่อไปนี้จะแนะนำวิธีการใช้งานและแนวทางปฏิบัติที่ดีที่สุดสำหรับแคช, การส่งข้อความแบบซิงโครนัส, คิวข้อความ และ Distributed Lock พร้อมอ้างอิงโค้ดต้นฉบับประกอบครับ/ค่ะ

## แนวทางแก้ไขปัญหา

### คอมโพเนนต์แคช (Cache)

สำหรับข้อมูลที่ต้องการจัดเก็บในหน่วยความจำ ขอแนะนำให้ใช้คอมโพเนนต์แคชที่มาพร้อมกับระบบในการจัดการครับ/ค่ะ

-   สามารถเรียกใช้งานอินสแตนซ์แคชเริ่มต้นได้ผ่าน `app.cache`
-   `Cache` มีการดำเนินการพื้นฐาน เช่น `set/get/del/reset` และยังรองรับ `wrap` กับ `wrapWithCondition` เพื่อห่อหุ้มตรรกะการแคช รวมถึงเมธอดแบบกลุ่ม (batch methods) เช่น `mset/mget/mdel` ด้วยครับ/ค่ะ
-   เมื่อทำการ Deploy ในโหมดคลัสเตอร์ ขอแนะนำให้จัดเก็บข้อมูลที่ใช้ร่วมกันไว้ในพื้นที่จัดเก็บที่มีความสามารถในการคงอยู่ของข้อมูล (persistent storage) เช่น Redis และกำหนดค่า `ttl` (time-to-live) ให้เหมาะสม เพื่อป้องกันการสูญหายของแคชเมื่ออินสแตนซ์รีสตาร์ทครับ/ค่ะ

ตัวอย่าง: [การเริ่มต้นและการใช้งานแคชใน `ปลั๊กอิน-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="การสร้างและใช้งานแคชในปลั๊กอิน"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### ตัวจัดการสัญญาณซิงค์ (SyncMessageManager)

หากสถานะในหน่วยความจำไม่สามารถจัดการด้วย Distributed Cache ได้ (เช่น ไม่สามารถ Serialize ได้) เมื่อสถานะมีการเปลี่ยนแปลงจากการดำเนินการของผู้ใช้ จำเป็นต้องแจ้งการเปลี่ยนแปลงนั้นไปยังอินสแตนซ์อื่น ๆ ผ่านสัญญาณซิงค์ เพื่อรักษาความสอดคล้องของสถานะครับ/ค่ะ

-   คลาสพื้นฐานของปลั๊กอินได้มีการใช้งาน `sendSyncMessage` ไว้แล้ว ซึ่งภายในจะเรียกใช้ `app.syncMessageManager.publish` และเพิ่ม Prefix ระดับแอปพลิเคชันให้กับ Channel โดยอัตโนมัติ เพื่อหลีกเลี่ยงข้อขัดแย้งของ Channel ครับ/ค่ะ
-   `publish` สามารถระบุ `transaction` ได้ ข้อความจะถูกส่งหลังจากที่ Database Transaction ได้รับการ Commit แล้ว เพื่อให้มั่นใจว่าสถานะและข้อความมีความสอดคล้องกันครับ/ค่ะ
-   การจัดการข้อความที่มาจากอินสแตนซ์อื่น ๆ สามารถทำได้ผ่าน `handleSyncMessage` โดยสามารถ Subscribe ได้ในช่วง `beforeLoad` ซึ่งเหมาะอย่างยิ่งสำหรับสถานการณ์เช่น การเปลี่ยนแปลงการกำหนดค่า หรือการซิงค์ Schema ครับ/ค่ะ

ตัวอย่าง: [`ปลั๊กอิน-data-source-main` ใช้ข้อความซิงค์เพื่อรักษาความสอดคล้องของ Schema ในหลายโหนด](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="การซิงค์การอัปเดต Schema ภายในปลั๊กอิน"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Automatically calls app.syncMessageManager.publish
  }
}
```

### ตัวจัดการการกระจายข้อความ (PubSubManager)

การกระจายข้อความเป็นคอมโพเนนต์พื้นฐานของสัญญาณซิงค์ และยังรองรับการใช้งานโดยตรงด้วยครับ/ค่ะ เมื่อต้องการกระจายข้อความระหว่างอินสแตนซ์ สามารถทำได้ผ่านคอมโพเนนต์นี้ครับ/ค่ะ

-   `app.pubSubManager.subscribe(channel, handler, { debounce })` สามารถใช้เพื่อ Subscribe Channel ระหว่างอินสแตนซ์ได้ ตัวเลือก `debounce` ใช้สำหรับการลดการสั่นไหว (debouncing) เพื่อป้องกันการเรียก Callback ซ้ำบ่อยครั้งที่เกิดจากการกระจายข้อความซ้ำซ้อนครับ/ค่ะ
-   `publish` รองรับ `skipSelf` (ค่าเริ่มต้นคือ true) และ `onlySelf` เพื่อควบคุมว่าข้อความจะถูกส่งกลับไปยังอินสแตนซ์ปัจจุบันหรือไม่ครับ/ค่ะ
-   จำเป็นต้องกำหนดค่า Adapter (เช่น Redis, RabbitMQ เป็นต้น) ก่อนที่แอปพลิเคชันจะเริ่มทำงาน มิฉะนั้น ระบบจะไม่เชื่อมต่อกับระบบข้อความภายนอกโดยค่าเริ่มต้นครับ/ค่ะ

ตัวอย่าง: [`ปลั๊กอิน-async-task-manager` ใช้ PubSub เพื่อกระจายเหตุการณ์ยกเลิกงาน](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="การกระจายสัญญาณยกเลิกงาน"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### คอมโพเนนต์คิวเหตุการณ์ (EventQueue)

คิวข้อความใช้สำหรับจัดกำหนดการงานแบบอะซิงโครนัส เหมาะสำหรับการจัดการการดำเนินการที่ใช้เวลานานหรือสามารถลองใหม่ได้ครับ/ค่ะ

-   สามารถประกาศ Consumer ได้ผ่าน `app.eventQueue.subscribe(channel, { idle, process, concurrency })` โดย `process` จะคืนค่าเป็น `Promise` และสามารถใช้ `AbortSignal.timeout` เพื่อควบคุมการหมดเวลาได้ครับ/ค่ะ
-   `publish` จะเพิ่ม Prefix ชื่อแอปพลิเคชันโดยอัตโนมัติ และรองรับตัวเลือกต่าง ๆ เช่น `timeout`, `maxRetries` โดยค่าเริ่มต้นจะใช้ Adapter ของคิวในหน่วยความจำ แต่สามารถเปลี่ยนไปใช้ Adapter แบบขยาย เช่น RabbitMQ ได้ตามความต้องการครับ/ค่ะ
-   ในคลัสเตอร์ โปรดตรวจสอบให้แน่ใจว่าทุกโหนดใช้ Adapter เดียวกัน เพื่อหลีกเลี่ยงการแยกส่วนของงานระหว่างโหนดครับ/ค่ะ

ตัวอย่าง: [`ปลั๊กอิน-async-task-manager` ใช้ EventQueue เพื่อจัดกำหนดการงาน](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="การกระจายงานแบบอะซิงโครนัสในคิว"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### ตัวจัดการ Distributed Lock (LockManager)

เมื่อต้องการหลีกเลี่ยง Race Condition สามารถใช้ Distributed Lock เพื่อทำการดำเนินการแบบอนุกรม (serialize) ในการเข้าถึงทรัพยากรได้ครับ/ค่ะ

-   โดยค่าเริ่มต้นจะมี Adapter แบบ `local` ที่อิงตาม Process ให้ใช้งาน และสามารถลงทะเบียนการใช้งานแบบ Distributed เช่น Redis ได้ สามารถควบคุม Concurrency ได้ผ่าน `app.lockManager.runExclusive(key, fn, ttl)` หรือ `acquire`/`tryAcquire` ครับ/ค่ะ
-   `ttl` ใช้สำหรับเป็นกลไกสำรองในการปลดล็อก เพื่อป้องกันไม่ให้ Lock ถูกถือครองตลอดไปในกรณีที่เกิดข้อผิดพลาดครับ/ค่ะ
-   สถานการณ์ทั่วไปที่ใช้งานได้แก่: การเปลี่ยนแปลง Schema, การป้องกันงานซ้ำซ้อน, การจำกัดอัตรา (Rate Limiting) เป็นต้น

ตัวอย่าง: [`ปลั๊กอิน-data-source-main` ใช้ Distributed Lock เพื่อป้องกันกระบวนการลบฟิลด์](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="การดำเนินการลบฟิลด์แบบอนุกรม"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## คำแนะนำในการพัฒนา

-   **ความสอดคล้องของสถานะในหน่วยความจำ**: พยายามหลีกเลี่ยงการใช้สถานะในหน่วยความจำระหว่างการพัฒนา และหันมาใช้แคชหรือข้อความซิงค์เพื่อรักษาความสอดคล้องของสถานะแทนครับ/ค่ะ
-   **ให้ความสำคัญกับการนำอินเทอร์เฟซในตัวกลับมาใช้ซ้ำ**: ใช้ความสามารถที่รวมเป็นหนึ่งเดียว เช่น `app.cache`, `app.syncMessageManager` เพื่อหลีกเลี่ยงการนำตรรกะการสื่อสารข้ามโหนดมาใช้งานซ้ำในปลั๊กอินครับ/ค่ะ
-   **ให้ความสำคัญกับขอบเขตของ Transaction**: การดำเนินการที่มี Transaction ควรใช้ `transaction.afterCommit` (ซึ่ง `syncMessageManager.publish` มีมาให้ในตัวแล้ว) เพื่อรับประกันความสอดคล้องของข้อมูลและข้อความครับ/ค่ะ
-   **กำหนดกลยุทธ์การถอยกลับ (Backoff Strategy)**: สำหรับงานในคิวและงานกระจายข้อความ ควรกำหนดค่า `timeout`, `maxRetries`, และ `debounce` ให้เหมาะสม เพื่อป้องกันไม่ให้เกิด Traffic Peak ใหม่ในสถานการณ์ที่ผิดปกติครับ/ค่ะ
-   **การตรวจสอบและบันทึกข้อมูลประกอบ**: ใช้ประโยชน์จาก Application Log ในการบันทึกข้อมูลต่าง ๆ เช่น ชื่อ Channel, Payload ของข้อความ, Lock Key เพื่อช่วยให้การแก้ไขปัญหาที่เกิดขึ้นเป็นครั้งคราวในคลัสเตอร์ทำได้ง่ายขึ้นครับ/ค่ะ

ด้วยความสามารถข้างต้น ปลั๊กอินจะสามารถแชร์สถานะ, ซิงค์การกำหนดค่า, และจัดกำหนดการงานระหว่างอินสแตนซ์ต่าง ๆ ได้อย่างปลอดภัย ตอบสนองความต้องการด้านความเสถียรและความสอดคล้องในสถานการณ์การ Deploy แบบคลัสเตอร์ครับ/ค่ะ