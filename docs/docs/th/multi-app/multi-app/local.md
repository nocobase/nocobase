---
pkg: '@nocobase/plugin-app-supervisor'
---

# โหมดหน่วยความจำร่วม

## บทนำ

เหมาะเมื่ออยากแยกระดับแอปแต่ไม่เพิ่มความซับซ้อนด้านปฏิบัติการมากเกินไป.

## คู่มือการใช้งาน

### ตัวแปรสภาพแวดล้อม

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### การสร้างแอปพลิเคชัน

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### การเริ่มแอปพลิเคชัน

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### การเข้าถึงแอปพลิเคชัน

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### การหยุดแอปพลิเคชัน

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### สถานะแอปพลิเคชัน

![](https://static-docs.nocobase.com/202512291122339.png)

### การลบแอปพลิเคชัน

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
