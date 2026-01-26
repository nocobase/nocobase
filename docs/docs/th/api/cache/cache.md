:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# แคช

## เมธอดพื้นฐาน

สามารถอ้างอิงเอกสารของ <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> ได้เลยครับ/ค่ะ

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## เมธอดอื่น ๆ

### `wrapWithCondition()`

เมธอดนี้ทำงานคล้ายกับ `wrap()` ครับ/ค่ะ แต่ช่วยให้คุณสามารถกำหนดเงื่อนไขเพื่อตัดสินใจว่าจะใช้แคชหรือไม่

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // พารามิเตอร์ภายนอกสำหรับควบคุมว่าจะใช้ผลลัพธ์จากแคชหรือไม่
    useCache?: boolean;
    // กำหนดว่าจะแคชหรือไม่ โดยพิจารณาจากผลลัพธ์ของข้อมูล
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

เมื่อเนื้อหาในแคชเป็นออบเจกต์ เมธอดนี้จะเปลี่ยนค่า (value) ของคีย์ (key) ที่ระบุครับ/ค่ะ

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

เมื่อเนื้อหาในแคชเป็นออบเจกต์ เมธอดนี้จะดึงค่า (value) ของคีย์ (key) ที่ระบุครับ/ค่ะ

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

เมื่อเนื้อหาในแคชเป็นออบเจกต์ เมธอดนี้จะลบคีย์ (key) ที่ระบุครับ/ค่ะ

```ts
async delValueInObject(key: string, objectKey: string)
```