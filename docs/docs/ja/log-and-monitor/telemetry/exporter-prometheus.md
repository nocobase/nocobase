---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/log-and-monitor/telemetry/exporter-prometheus)をご参照ください。
:::

# テレメトリエクスポーター: Prometheus

## 環境変数の設定

### TELEMETRY_METRIC_READER

テレメトリメトリックエクスポーターのタイプを指定します。

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

スタンドアロンサーバーを起動するかどうかを設定します。

- `off`: スクレイプエンドポイントは `/api/prometheus:metrics` になります。
- `on`: スクレイプエンドポイントは `host:port:metrics` になります。

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

スタンドアロンサーバーを起動する際のポート番号です。デフォルトは `9464` です。

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Prometheus の設定

NocoBase の内部 API を使用する場合：

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

スタンドアロンサーバーを起動する場合：

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```