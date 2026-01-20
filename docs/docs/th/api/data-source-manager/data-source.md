:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# แหล่งข้อมูล (abstract)

`DataSource` คือคลาส abstract ที่ใช้สำหรับแสดงถึงประเภทของแหล่งข้อมูล ซึ่งอาจเป็นฐานข้อมูล, API หรืออื่น ๆ ครับ/ค่ะ

## สมาชิก

### collectionManager

อินสแตนซ์ CollectionManager ของแหล่งข้อมูล ซึ่งต้อง implement อินเทอร์เฟซ [`ICollectionManager`](/api/data-source-manager/i-collection-manager) ครับ/ค่ะ

### resourceManager

อินสแตนซ์ resourceManager ของแหล่งข้อมูลครับ/ค่ะ

### acl

อินสแตนซ์ ACL ของแหล่งข้อมูลครับ/ค่ะ

## API

### constructor()

Constructor (ฟังก์ชันสร้าง), ใช้สำหรับสร้างอินสแตนซ์ `DataSource` ครับ/ค่ะ

#### ซิกเนเจอร์

- `constructor(options: DataSourceOptions)`

### init()

ฟังก์ชันสำหรับเริ่มต้น (Initialization function) ซึ่งจะถูกเรียกใช้งานทันทีหลังจาก `constructor` ครับ/ค่ะ

#### ซิกเนเจอร์

- `init(options: DataSourceOptions)`

### name

#### ซิกเนเจอร์

- `get name()`

ส่งคืนชื่ออินสแตนซ์ของแหล่งข้อมูลครับ/ค่ะ

### middleware()

ใช้สำหรับเรียกดู middleware ของ DataSource เพื่อนำไป mount กับ Server สำหรับรับ request ครับ/ค่ะ

### testConnection()

เป็น static method ที่ถูกเรียกใช้เมื่อมีการทดสอบการเชื่อมต่อ สามารถใช้สำหรับการตรวจสอบพารามิเตอร์ได้ โดยส่วนของ logic การทำงานจะถูก implement โดยคลาสลูกครับ/ค่ะ

#### ซิกเนเจอร์

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### ซิกเนเจอร์

- `async load(options: any = {})`

เป็นการดำเนินการโหลดสำหรับแหล่งข้อมูล โดย logic การทำงานจะถูก implement โดยคลาสลูกครับ/ค่ะ

### createCollectionManager()

#### ซิกเนเจอร์
- `abstract createCollectionManager(options?: any): ICollectionManager`

สร้างอินสแตนซ์ CollectionManager สำหรับแหล่งข้อมูล โดย logic การทำงานจะถูก implement โดยคลาสลูกครับ/ค่ะ

### createResourceManager()

สร้างอินสแตนซ์ ResourceManager สำหรับแหล่งข้อมูล คลาสลูกสามารถ override การ implement ได้ โดยค่าเริ่มต้นจะสร้าง `ResourceManager` จาก `@nocobase/resourcer` ครับ/ค่ะ

### createACL()

- สร้างอินสแตนซ์ ACL สำหรับ DataSource คลาสลูกสามารถ override การ implement ได้ โดยค่าเริ่มต้นจะสร้าง `ACL` จาก `@nocobase/acl` ครับ/ค่ะ