:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# Context

ใน NocoBase ทุกๆ คำขอจะสร้างอ็อบเจกต์ `ctx` ขึ้นมาครับ ซึ่งเป็นอินสแตนซ์ของ Context โดย Context จะรวบรวมข้อมูลคำขอและการตอบกลับไว้ พร้อมทั้งมีฟังก์ชันการทำงานเฉพาะของ NocoBase ให้ใช้งานด้วยครับ เช่น การเข้าถึงฐานข้อมูล, การจัดการแคช, การจัดการสิทธิ์, การรองรับหลายภาษา (Internationalization) และการบันทึก Log เป็นต้น

NocoBase `Application` ถูกสร้างขึ้นบน Koa ดังนั้น `ctx` จึงเป็น Koa Context โดยพื้นฐาน แต่ NocoBase ได้ขยาย API ที่หลากหลายเพิ่มเติมเข้าไป เพื่อให้ผู้พัฒนาสามารถจัดการ Business Logic ได้อย่างสะดวกสบายใน Middleware และ Action ครับ แต่ละคำขอจะมี `ctx` ที่เป็นอิสระต่อกัน ซึ่งช่วยให้มั่นใจได้ถึงการแยกข้อมูลและความปลอดภัยระหว่างคำขอต่างๆ ครับ

## ctx.action

`ctx.action` ใช้สำหรับเข้าถึง Action ที่กำลังถูกเรียกใช้งานสำหรับคำขอปัจจุบันครับ ซึ่งประกอบด้วย:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // แสดงชื่อ Action ปัจจุบัน
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

รองรับการใช้งานหลายภาษา (Internationalization หรือ i18n) ครับ

- `ctx.i18n` ใช้สำหรับให้ข้อมูลเกี่ยวกับภาษาและภูมิภาค (locale)
- `ctx.t()` ใช้สำหรับแปลสตริงตามภาษาของคำขอ

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // คืนค่าคำแปลตามภาษาของคำขอ
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` มีอินเทอร์เฟซสำหรับเข้าถึงฐานข้อมูล ช่วยให้คุณสามารถจัดการโมเดลและรันคิวรีได้โดยตรงครับ

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` มีฟังก์ชันการจัดการแคช รองรับการอ่านและเขียนข้อมูลลงในแคช ซึ่งมักใช้เพื่อเพิ่มความเร็วในการเข้าถึงข้อมูล หรือเก็บสถานะชั่วคราวครับ

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // แคชเป็นเวลา 60 วินาที
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` คืออินสแตนซ์ของ NocoBase Application ที่สามารถเข้าถึงการตั้งค่าส่วนกลาง, ปลั๊กอิน และบริการต่างๆ ได้ครับ

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` ใช้สำหรับดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่ในปัจจุบัน เหมาะสำหรับใช้ในการตรวจสอบสิทธิ์หรือใน Business Logic ครับ

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` ใช้สำหรับแชร์ข้อมูลระหว่าง Middleware ต่างๆ ในเชนครับ

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` มีฟังก์ชันการบันทึก Log รองรับการแสดงผล Log ได้หลายระดับครับ

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` ใช้สำหรับจัดการสิทธิ์ ส่วน `ctx.can()` ใช้สำหรับตรวจสอบว่าผู้ใช้ปัจจุบันมีสิทธิ์ในการดำเนินการบางอย่างหรือไม่ครับ

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## สรุป

- แต่ละคำขอจะเชื่อมโยงกับอ็อบเจกต์ `ctx` ที่เป็นอิสระต่อกันครับ
- `ctx` เป็นส่วนขยายของ Koa Context ที่รวมฟังก์ชันการทำงานของ NocoBase เข้าไว้ด้วยกัน
- คุณสมบัติที่ใช้งานบ่อย ได้แก่ `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` เป็นต้น
- การใช้ `ctx` ใน Middleware และ Action ช่วยให้เราสามารถจัดการคำขอ, การตอบกลับ, สิทธิ์, Log และฐานข้อมูลได้อย่างสะดวกสบายครับ