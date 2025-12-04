---
pkg: '@nocobase/plugin-telemetry-prometheus'
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# टेलीमेट्री एक्सपोर्टर: Prometheus

## पर्यावरण चर

### TELEMETRY_METRIC_READER

टेलीमेट्री मेट्रिक एक्सपोर्टर का प्रकार।

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

क्या एक स्वतंत्र सर्वर शुरू करना है।

- `off`: स्क्रैप एंडपॉइंट `/api/prometheus:metrics` है।
- `on`: स्क्रैप एंडपॉइंट `host:port:metrics` है।

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

स्वतंत्र सर्वर के लिए पोर्ट, डिफ़ॉल्ट रूप से `9464` है।

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Prometheus कॉन्फ़िगरेशन

NocoBase के आंतरिक API का उपयोग करते हुए:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

स्वतंत्र सर्वर का उपयोग करते हुए:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```