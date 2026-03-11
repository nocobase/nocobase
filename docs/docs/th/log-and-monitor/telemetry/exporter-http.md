---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/log-and-monitor/telemetry/exporter-http)
:::

# ตัวส่งออกข้อมูล Telemetry: HTTP

## การกำหนดค่าตัวแปรสภาพแวดล้อม (Environment Variables)

### TELEMETRY_METRIC_READER

ประเภทของตัวส่งออกข้อมูลเมทริกซ์ Telemetry

```bash
TELEMETRY_METRIC_READER=http
```

### TELEMETRY_HTTP_URL

HTTP URL สำหรับการส่งออกข้อมูล Telemetry

```bash
TELEMETRY_HTTP_URL=
```