---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/log-and-monitor/telemetry/index)をご参照ください。
:::

# テレメトリ

## 概要

NocoBase のテレメトリ (Telemetry) モジュールは [OpenTelemetry](https://opentelemetry.io/) に基づいて構築されており、NocoBase アプリケーションに統一された拡張可能なオブザーバビリティ（可観測性）を提供します。このモジュールは、HTTP リクエストやシステムリソースの使用状況など、さまざまなアプリケーションメトリクスの収集とエクスポートをサポートしています。

## 環境変数の設定

テレメトリモジュールを有効にするには、関連する [環境変数](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) を設定する必要があります。

### TELEMETRY_ENABLED

`on` に設定します。

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

サービス名。

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

メトリクスエクスポーター。カンマ区切りで複数のエクスポーターをサポートします。利用可能な値については、既存のエクスポーターのドキュメントを参照してください。

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

エクスポートするメトリクス。カンマ区切りで指定します。利用可能な値については、[メトリクス](#メトリクス) を参照してください。

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

HTTP リクエスト所要時間 (`http_request_cost`) の記録しきい値（ミリ秒単位）。デフォルト値は `0` で、すべてのリクエストを記録します。`0` より大きい値を設定すると、所要時間がそのしきい値を超えたリクエストのみが記録されます。

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## メトリクス

現在アプリケーションで記録されているメトリクスは以下の通りです。さらに必要な場合は、[開発ドキュメント](/plugin-development/server/telemetry) を参照して拡張するか、お問い合わせください。

| メトリクス名 | メトリクスタイプ | 説明 |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | プロセスの CPU 使用率（パーセント） |
| `process_memory_mb`   | `ObservableGauge` | プロセスのメモリ使用量（MB 単位） |
| `process_heap_mb`     | `ObservableGauge` | プロセスのヒープメモリ使用量（MB 単位） |
| `http_request_cost`   | `Histogram`       | HTTP リクエストの所要時間（ms 単位） |
| `http_request_count`  | `Counter`         | HTTP リクエスト数 |
| `http_request_active` | `UpDownCounter`   | 現在のアクティブな HTTP リクエスト数 |
| `sub_app_status`      | `ObservableGauge` | ステータスごとのサブアプリケーション数の統計。`plugin-multi-app-manager` プラグインによって報告されます。 |