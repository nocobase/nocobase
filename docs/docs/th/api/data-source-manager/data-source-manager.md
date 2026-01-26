:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# DataSourceManager

`DataSourceManager` เป็นคลาสที่ใช้จัดการอินสแตนซ์ของ `dataSource` หลาย ๆ ตัวครับ/ค่ะ

## API

### add()
ใช้สำหรับเพิ่มอินสแตนซ์ของ `dataSource` ครับ/ค่ะ

#### รูปแบบการใช้งาน

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

ใช้สำหรับเพิ่ม Middleware แบบ Global ให้กับอินสแตนซ์ของ `dataSource` ครับ/ค่ะ

### middleware()

ใช้สำหรับดึง Middleware ของอินสแตนซ์ `dataSourceManager` ปัจจุบัน ซึ่งสามารถนำไปใช้ตอบสนองคำขอ HTTP ได้ครับ/ค่ะ

### afterAddDataSource()

เป็นฟังก์ชัน Hook ที่จะถูกเรียกหลังจากมีการเพิ่ม `dataSource` ใหม่ครับ/ค่ะ

#### รูปแบบการใช้งาน

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

ใช้สำหรับลงทะเบียนประเภทของแหล่งข้อมูล (Data Source Type) และคลาสที่เกี่ยวข้องครับ/ค่ะ

#### รูปแบบการใช้งาน

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

ใช้สำหรับดึงคลาสของแหล่งข้อมูลครับ/ค่ะ

#### รูปแบบการใช้งาน

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

ใช้สำหรับสร้างอินสแตนซ์ของแหล่งข้อมูล โดยอิงตามประเภทของแหล่งข้อมูลที่ลงทะเบียนไว้และตัวเลือก (options) ของอินสแตนซ์ครับ/ค่ะ

#### รูปแบบการใช้งาน

- `buildDataSourceByType(type: string, options: any): DataSource`