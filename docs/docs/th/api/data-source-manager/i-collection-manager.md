:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ICollectionManager

`ICollectionManager` เป็นอินเทอร์เฟซที่ใช้สำหรับจัดการอินสแตนซ์ของ `คอลเลกชัน` ใน `แหล่งข้อมูล` ครับ/ค่ะ

## API

### registerFieldTypes()

ใช้สำหรับลงทะเบียนประเภทฟิลด์ใน `คอลเลกชัน` ครับ/ค่ะ

#### Signature

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

ใช้สำหรับลงทะเบียน `Interface` ของ `คอลเลกชัน` ครับ/ค่ะ

#### Signature

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

ใช้สำหรับลงทะเบียน `Collection Template` ครับ/ค่ะ

#### Signature

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

ใช้สำหรับลงทะเบียน `Model` ครับ/ค่ะ

#### Signature

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

ใช้สำหรับลงทะเบียน `Repository` ครับ/ค่ะ

#### Signature

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

ใช้สำหรับดึงอินสแตนซ์ของ `Repository` ที่ลงทะเบียนไว้ครับ/ค่ะ

#### Signature

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

ใช้สำหรับกำหนด `คอลเลกชัน` ครับ/ค่ะ

#### Signature

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

ใช้สำหรับแก้ไขคุณสมบัติของ `คอลเลกชัน` ที่มีอยู่ครับ/ค่ะ

#### Signature

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

ใช้สำหรับตรวจสอบว่ามี `คอลเลกชัน` อยู่หรือไม่ครับ/ค่ะ

#### Signature

- `hasCollection(name: string): boolean`

### getCollection()

ใช้สำหรับดึงอินสแตนซ์ของ `คอลเลกชัน` ครับ/ค่ะ

#### Signature

- `getCollection(name: string): ICollection`

### getCollections()

ใช้สำหรับดึงอินสแตนซ์ของ `คอลเลกชัน` ทั้งหมดครับ/ค่ะ

#### Signature

- `getCollections(): Array<ICollection>`

### getRepository()

ใช้สำหรับดึงอินสแตนซ์ของ `Repository` ครับ/ค่ะ

#### Signature

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

ใช้สำหรับซิงโครไนซ์ `แหล่งข้อมูล` ครับ/ค่ะ โดยตรรกะการทำงานจะถูกนำไปใช้โดยคลาสย่อย

#### Signature

- `sync(): Promise<void>`