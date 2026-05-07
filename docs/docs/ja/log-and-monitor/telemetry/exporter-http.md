---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/log-and-monitor/telemetry/exporter-http)をご参照ください。
:::

# テレメトリエクスポーター: HTTP

## 環境変数の設定

### TELEMETRY_METRIC_READER

テレメトリメトリクスエクスポーターのタイプ。

```bash
TELEMETRY_METRIC_READER=http
```

### TELEMETRY_HTTP_URL

テレメトリデータをエクスポートするための HTTP URL。

```bash
TELEMETRY_HTTP_URL=
```