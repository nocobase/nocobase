---
pkg: '@nocobase/plugin-telemetry'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# טלמטריה

## סקירה כללית

מודול הטלמטריה של NocoBase מבוסס על [OpenTelemetry](https://opentelemetry.io/) ומספק יכולות תצפיתיות (observability) אחידות וניתנות להרחבה עבור יישומי NocoBase. מודול זה תומך באיסוף וייצוא של מדדי יישום שונים, כולל בקשות HTTP, שימוש במשאבי מערכת ועוד.

## משתני סביבה

כדי להפעיל את מודול הטלמטריה, יש להגדיר את [משתני הסביבה](/get-started/installation/env#how-to-set-environment-variables) הרלוונטיים.

### TELEMETRY_ENABLED

יש להגדיר ל-`on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

שם השירות.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

מייצאי מדדים. תומך במספר מייצאים, המופרדים בפסיקים. לערכים אפשריים, עיין בתיעוד של המייצאים הקיימים.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

המדדים לייצוא, מופרדים בפסיקים. ערכים אפשריים ניתן למצוא ב[מדדים](#מדדים).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

סף תיעוד משך בקשת HTTP (`http_request_cost`), ביחידות אלפיות השנייה (מילישניות). ערך ברירת המחדל הוא `0`, מה שאומר שכל הבקשות מתועדות. כאשר מוגדר לערך גדול מ-`0`, יתועדו רק בקשות שמשכן עולה על סף זה.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## מדדים

המדדים הנוכחיים המתועדים על ידי היישום מפורטים להלן. אם יש לכם צרכים נוספים, תוכלו לעיין ב[תיעוד הפיתוח](/plugin-development/server/telemetry) להרחבה, או ליצור איתנו קשר.

| שם המדד               | סוג המדד          | תיאור                                                                 |
| --------------------- | ----------------- | --------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | אחוז שימוש במעבד (CPU) של התהליך                                     |
| `process_memory_mb`   | `ObservableGauge` | שימוש בזיכרון התהליך, ביחידות MB                                     |
| `process_heap_mb`     | `ObservableGauge` | שימוש בזיכרון ה-heap של התהליך, ביחידות MB                            |
| `http_request_cost`   | `Histogram`       | משך בקשת HTTP, ביחידות ms                                            |
| `http_request_count`  | `Counter`         | מספר בקשות HTTP                                                      |
| `http_request_active` | `UpDownCounter`   | מספר בקשות HTTP פעילות נוכחי                                         |
| `sub_app_status`      | `ObservableGauge` | סטטיסטיקת ספירת יישומי משנה לפי סטטוס, מדווח על ידי תוסף `plugin-multi-app-manager` |