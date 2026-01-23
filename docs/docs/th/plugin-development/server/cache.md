:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# แคช

โมดูลแคชของ NocoBase พัฒนาขึ้นโดยอิงจาก <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> เพื่อให้ฟังก์ชันการแคชสำหรับการพัฒนาปลั๊กอินครับ/ค่ะ ระบบมีประเภทแคชในตัวสองแบบดังนี้:

- **memory** - แคชในหน่วยความจำที่ใช้ lru-cache ซึ่งเป็นค่าเริ่มต้นที่ node-cache-manager มีให้ครับ/ค่ะ
- **redis** - แคช Redis ที่ใช้ node-cache-manager-redis-yet ครับ/ค่ะ

คุณสามารถขยายและลงทะเบียนประเภทแคชเพิ่มเติมได้ผ่าน API ครับ/ค่ะ

## การใช้งานพื้นฐาน

### app.cache

`app.cache` คืออินสแตนซ์แคชเริ่มต้นระดับแอปพลิเคชันที่สามารถใช้งานได้โดยตรงเลยครับ/ค่ะ

```ts
// ตั้งค่าแคช
await app.cache.set('key', 'value', { ttl: 3600 }); // หน่วยของ TTL: วินาที

// ดึงข้อมูลจากแคช
const value = await app.cache.get('key');

// ลบแคช
await this.app.cache.del('key');
```

### ctx.cache

ใน Middleware หรือการดำเนินการกับทรัพยากร คุณสามารถเข้าถึงแคชได้ผ่าน `ctx.cache` ครับ/ค่ะ

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // แคชไม่พบข้อมูล ดึงจากฐานข้อมูล
    data = await this.getDataFromDatabase();
    // เก็บเข้าแคช มีอายุ 1 ชั่วโมง
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## การสร้างแคชแบบกำหนดเอง

หากคุณต้องการสร้างอินสแตนซ์แคชแยกต่างหาก (เช่น สำหรับเนมสเปซหรือการกำหนดค่าที่แตกต่างกัน) คุณสามารถใช้เมธอด `app.cacheManager.createCache()` ได้เลยครับ/ค่ะ

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // สร้างอินสแตนซ์แคชที่มี Prefix
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Key ทั้งหมดจะถูกเพิ่ม Prefix นี้โดยอัตโนมัติ
      store: 'memory', // ใช้แคชหน่วยความจำ (memory cache) ซึ่งเป็นทางเลือก หากไม่ระบุจะใช้ defaultStore
      max: 1000, // จำนวนรายการแคชสูงสุด
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### คำอธิบายพารามิเตอร์ `createCache`

| พารามิเตอร์ | ประเภท | คำอธิบาย |
| ---- | ---- | ---- |
| `name` | `string` | ตัวระบุเฉพาะของแคช, จำเป็นต้องระบุ |
| `prefix` | `string` | ไม่บังคับ, Prefix สำหรับ Key ของแคช, ใช้เพื่อหลีกเลี่ยง Key ซ้ำซ้อน |
| `store` | `string` | ไม่บังคับ, ตัวระบุประเภท Store (เช่น `'memory'`, `'redis'`), ค่าเริ่มต้นคือ `defaultStore` |
| `[key: string]` | `any` | การกำหนดค่าอื่น ๆ ที่เกี่ยวข้องกับ Store |

### การดึงแคชที่สร้างไว้แล้ว

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## เมธอดพื้นฐานของแคช

อินสแตนซ์แคชมีเมธอดสำหรับการดำเนินการกับแคชที่หลากหลาย ซึ่งส่วนใหญ่สืบทอดมาจาก node-cache-manager ครับ/ค่ะ

### get / set

```ts
// ตั้งค่าแคชพร้อมกำหนดเวลาหมดอายุ (หน่วย: วินาที)
await cache.set('key', 'value', { ttl: 3600 });

// ดึงข้อมูลจากแคช
const value = await cache.get('key');
```

### del / reset

```ts
// ลบ Key เดียว
await cache.del('key');

// ล้างแคชทั้งหมด
await cache.reset();
```

### wrap

เมธอด `wrap()` เป็นเครื่องมือที่มีประโยชน์มากครับ/ค่ะ โดยจะพยายามดึงข้อมูลจากแคชก่อน หากไม่พบข้อมูลในแคช (cache miss) ก็จะดำเนินการฟังก์ชันที่ระบุและเก็บผลลัพธ์นั้นไว้ในแคชครับ/ค่ะ

```ts
const data = await cache.wrap('user:1', async () => {
  // ฟังก์ชันนี้จะทำงานเมื่อแคชไม่พบข้อมูลเท่านั้น
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### การดำเนินการแบบกลุ่ม (Batch Operations)

```ts
// ตั้งค่าแบบกลุ่ม
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// ดึงข้อมูลแบบกลุ่ม
const values = await cache.mget(['key1', 'key2', 'key3']);

// ลบแบบกลุ่ม
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// ดึง Key ทั้งหมด (หมายเหตุ: Store บางประเภทอาจไม่รองรับ)
const allKeys = await cache.keys();

// ดึงเวลาหมดอายุที่เหลืออยู่ของ Key (หน่วย: วินาที)
const remainingTTL = await cache.ttl('key');
```

## การใช้งานขั้นสูง

### wrapWithCondition

`wrapWithCondition()` คล้ายกับ `wrap()` ครับ/ค่ะ แต่สามารถกำหนดเงื่อนไขเพื่อตัดสินใจว่าจะใช้แคชหรือไม่

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // พารามิเตอร์ภายนอกควบคุมว่าจะใช้ผลลัพธ์จากแคชหรือไม่
    useCache: true, // หากตั้งค่าเป็น false ฟังก์ชันจะทำงานซ้ำอีกครั้งแม้ว่าจะมีแคชอยู่แล้วก็ตาม

    // ตัดสินใจว่าจะแคชหรือไม่จากผลลัพธ์ของข้อมูล
    isCacheable: (value) => {
      // ตัวอย่าง: แคชเฉพาะผลลัพธ์ที่สำเร็จเท่านั้น
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### การดำเนินการแคชออบเจกต์

เมื่อเนื้อหาที่แคชเป็นออบเจกต์ คุณสามารถใช้วิธีการเหล่านี้เพื่อดำเนินการกับคุณสมบัติของออบเจกต์ได้โดยตรง โดยไม่จำเป็นต้องดึงออบเจกต์ทั้งหมดออกมาครับ/ค่ะ

```ts
// ตั้งค่าคุณสมบัติบางอย่างของออบเจกต์
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// ดึงคุณสมบัติบางอย่างของออบเจกต์
const name = await cache.getValueInObject('user:1', 'name');

// ลบคุณสมบัติบางอย่างของออบเจกต์
await cache.delValueInObject('user:1', 'age');
```

## การลงทะเบียน Store แบบกำหนดเอง

หากคุณต้องการใช้ประเภทแคชอื่น ๆ (เช่น Memcached, MongoDB ฯลฯ) คุณสามารถลงทะเบียนได้ผ่าน `app.cacheManager.registerStore()` ครับ/ค่ะ

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // ลงทะเบียน Redis Store (หากระบบยังไม่ได้ลงทะเบียน)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // การกำหนดค่าการเชื่อมต่อ Redis
      url: 'redis://localhost:6379',
    });

    // สร้างแคชโดยใช้ Store ที่ลงทะเบียนใหม่
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## ข้อควรระวัง

1.  **ข้อจำกัดของแคชหน่วยความจำ**: เมื่อใช้ memory store ควรตั้งค่าพารามิเตอร์ `max` ให้เหมาะสม เพื่อหลีกเลี่ยงปัญหาหน่วยความจำล้นครับ/ค่ะ
2.  **กลยุทธ์การทำให้แคชไม่ถูกต้อง**: เมื่อมีการอัปเดตข้อมูล อย่าลืมล้างแคชที่เกี่ยวข้อง เพื่อป้องกันข้อมูลที่ไม่ถูกต้อง (dirty data) ครับ/ค่ะ
3.  **หลักการตั้งชื่อ Key**: แนะนำให้ใช้เนมสเปซ (namespace) และ Prefix ที่มีความหมาย เช่น `module:resource:id` ครับ/ค่ะ
4.  **การตั้งค่า TTL**: กำหนดค่า TTL ให้เหมาะสมตามความถี่ในการอัปเดตข้อมูล เพื่อรักษาสมดุลระหว่างประสิทธิภาพและความสอดคล้องกันของข้อมูลครับ/ค่ะ
5.  **การเชื่อมต่อ Redis**: เมื่อใช้ Redis โปรดตรวจสอบให้แน่ใจว่าได้กำหนดค่าพารามิเตอร์การเชื่อมต่อและรหัสผ่านอย่างถูกต้องในสภาพแวดล้อมการใช้งานจริง (production environment) ครับ/ค่ะ