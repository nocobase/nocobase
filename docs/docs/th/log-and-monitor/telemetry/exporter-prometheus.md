---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/log-and-monitor/telemetry/exporter-prometheus)
:::

# ตัวส่งออกข้อมูลการวัดระยะไกล (Telemetry Exporter): Prometheus

## การกำหนดค่าตัวแปรสภาพแวดล้อม (Environment Variables)

### TELEMETRY_METRIC_READER

ประเภทของตัวส่งออกตัวชี้วัดการวัดระยะไกล (Telemetry metric exporter type) ครับ

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

กำหนดว่าจะเริ่มการทำงานของเซิร์ฟเวอร์แยกต่างหาก (Standalone server) หรือไม่ครับ

- `off`: อินเทอร์เฟซสำหรับการดึงข้อมูล (Scrape endpoint) คือ `/api/prometheus:metrics`
- `on`: อินเทอร์เฟซสำหรับการดึงข้อมูล (Scrape endpoint) คือ `host:port:metrics`

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

พอร์ตสำหรับเซิร์ฟเวอร์แยกต่างหากเมื่อเปิดใช้งาน ค่าเริ่มต้นคือ `9464` ครับ

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### การกำหนดค่า Prometheus

การใช้ API ภายในของ NocoBase ครับ:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

การใช้เซิร์ฟเวอร์แยกต่างหากครับ:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```