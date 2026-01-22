:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# DataSourceManager การจัดการแหล่งข้อมูล

NocoBase มี `DataSourceManager` ให้ใช้งานสำหรับการจัดการแหล่งข้อมูลหลายแหล่งครับ/ค่ะ แต่ละ `DataSource` จะมีอินสแตนซ์ของ `Database`, `ResourceManager` และ `ACL` เป็นของตัวเอง ซึ่งช่วยให้นักพัฒนาสามารถจัดการและขยายแหล่งข้อมูลหลายแหล่งได้อย่างยืดหยุ่นครับ/ค่ะ

## แนวคิดพื้นฐาน

แต่ละอินสแตนซ์ของ `DataSource` จะประกอบด้วยสิ่งต่อไปนี้ครับ/ค่ะ:

- **`dataSource.collectionManager`**: ใช้สำหรับจัดการคอลเลกชันและฟิลด์ครับ/ค่ะ
- **`dataSource.resourceManager`**: จัดการการดำเนินการที่เกี่ยวข้องกับทรัพยากร (เช่น การสร้าง อ่าน อัปเดต และลบ หรือ CRUD) ครับ/ค่ะ
- **`dataSource.acl`**: การควบคุมการเข้าถึง (ACL) สำหรับการดำเนินการกับทรัพยากรครับ/ค่ะ

เพื่อความสะดวกในการเข้าถึง จึงมีชื่อเรียกย่อ (alias) สำหรับสมาชิกที่เกี่ยวข้องกับแหล่งข้อมูลหลักดังนี้ครับ/ค่ะ:

- `app.db` เทียบเท่ากับ `dataSourceManager.get('main').collectionManager.db`
- `app.acl` เทียบเท่ากับ `dataSourceManager.get('main').acl`
- `app.resourceManager` เทียบเท่ากับ `dataSourceManager.get('main').resourceManager`

## เมธอดที่ใช้งานบ่อย

### dataSourceManager.get(dataSourceKey)

เมธอดนี้จะคืนค่าอินสแตนซ์ของ `DataSource` ที่ระบุครับ/ค่ะ

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

เมธอดนี้ใช้สำหรับลงทะเบียนมิดเดิลแวร์สำหรับแหล่งข้อมูลทั้งหมดครับ/ค่ะ ซึ่งจะส่งผลต่อการดำเนินการบนแหล่งข้อมูลทั้งหมดครับ/ค่ะ

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

เมธอดนี้จะทำงานก่อนที่แหล่งข้อมูลจะถูกโหลดครับ/ค่ะ มักใช้สำหรับการลงทะเบียนคลาสแบบ static เช่น คลาสโมเดลและการลงทะเบียนประเภทฟิลด์ครับ/ค่ะ

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // ประเภทฟิลด์ที่กำหนดเอง
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

เมธอดนี้จะทำงานหลังจากที่แหล่งข้อมูลถูกโหลดครับ/ค่ะ มักใช้สำหรับการลงทะเบียนการดำเนินการ, การตั้งค่าการควบคุมการเข้าถึง (ACL) เป็นต้นครับ/ค่ะ

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // ตั้งค่าสิทธิ์การเข้าถึง
});
```

## การขยายแหล่งข้อมูล

สำหรับการขยายแหล่งข้อมูลแบบสมบูรณ์ โปรดดูที่ [บทการขยายแหล่งข้อมูล](#) ครับ/ค่ะ