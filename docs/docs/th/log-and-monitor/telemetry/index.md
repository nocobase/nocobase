---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/log-and-monitor/telemetry/index)
:::

# เทเลเมทรี (Telemetry)

## ภาพรวม

โมดูลเทเลเมทรี (Telemetry) ของ NocoBase ถูกสร้างขึ้นบน [OpenTelemetry](https://opentelemetry.io/) เพื่อมอบคุณสมบัติการสังเกตการณ์ (Observability) ที่เป็นหนึ่งเดียวและขยายต่อได้สำหรับแอปพลิเคชัน NocoBase โมดูลนี้รองรับการรวบรวมและส่งออกตัวชี้วัด (Metrics) ของแอปพลิเคชันที่หลากหลาย รวมถึงคำขอ HTTP และการใช้งานทรัพยากรระบบครับ

## การกำหนดค่าตัวแปรสภาพแวดล้อม

ในการเปิดใช้งานโมดูลเทเลเมทรี คุณจำเป็นต้องกำหนดค่า [ตัวแปรสภาพแวดล้อม](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) ที่เกี่ยวข้องครับ

### TELEMETRY_ENABLED

กำหนดค่าเป็น `on`

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

ชื่อบริการ (Service name)

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

ตัวส่งออกตัวชี้วัด (Metric exporters) รองรับการใช้งานหลายตัวโดยคั่นด้วยเครื่องหมายจุลภาค (comma) สำหรับค่าที่เลือกใช้ได้ โปรดอ้างอิงจากเอกสารของตัวส่งออกที่มีอยู่ครับ

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

ตัวชี้วัดที่ต้องการส่งออก โดยคั่นด้วยเครื่องหมายจุลภาค สามารถดูค่าที่เลือกได้จากส่วน [ตัวชี้วัด](#指标) ครับ

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

เกณฑ์การบันทึกระยะเวลาของคำขอ HTTP (`http_request_cost`) มีหน่วยเป็นมิลลิวินาที (ms) ค่าเริ่มต้นคือ `0` ซึ่งหมายถึงการบันทึกทุกคำขอ หากกำหนดค่ามากกว่า `0` จะบันทึกเฉพาะคำขอที่มีระยะเวลาเกินเกณฑ์ที่กำหนดเท่านั้นครับ

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## ตัวชี้วัด

รายการตัวชี้วัดที่บันทึกในแอปพลิเคชันปัจจุบันมีดังนี้ หากคุณต้องการเพิ่มเติม สามารถอ้างอิงได้จาก [เอกสารการพัฒนา](/plugin-development/server/telemetry) เพื่อทำการขยายส่วนขยาย หรือติดต่อเราได้ครับ

| ชื่อตัวชี้วัด | ประเภทตัวชี้วัด | คำอธิบาย |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | เปอร์เซ็นต์การใช้งาน CPU ของโปรเซส |
| `process_memory_mb`   | `ObservableGauge` | ปริมาณการใช้งานหน่วยความจำของโปรเซส หน่วยเป็น MB |
| `process_heap_mb`     | `ObservableGauge` | ปริมาณการใช้งานหน่วยความจำ Heap ของโปรเซส หน่วยเป็น MB |
| `http_request_cost`   | `Histogram`       | ระยะเวลาที่ใช้ในคำขอ HTTP หน่วยเป็น ms |
| `http_request_count`  | `Counter`         | จำนวนคำขอ HTTP |
| `http_request_active` | `UpDownCounter`   | จำนวนคำขอ HTTP ที่กำลังทำงานอยู่ในปัจจุบัน |
| `sub_app_status`      | `ObservableGauge` | สถิติจำนวนแอปพลิเคชันย่อยตามสถานะต่างๆ รายงานโดยปลั๊กอิน `plugin-multi-app-manager` |