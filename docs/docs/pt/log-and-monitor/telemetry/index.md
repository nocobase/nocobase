---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/log-and-monitor/telemetry/index).
:::

# Telemetria

## Visão Geral

O módulo de Telemetria (Telemetry) do NocoBase é baseado no [OpenTelemetry](https://opentelemetry.io/), fornecendo recursos de observabilidade unificados e extensíveis para aplicações NocoBase. Este módulo suporta a coleta e exportação de várias métricas da aplicação, incluindo requisições HTTP e uso de recursos do sistema.

## Configuração de Variáveis de Ambiente

Para habilitar o módulo de telemetria, você precisa configurar as [variáveis de ambiente](/get-started/installation/env#como-configurar-vari%C3%A1veis-de-ambiente) relacionadas.

### TELEMETRY_ENABLED

Configure como `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Nome do serviço.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Exportadores de métricas. Suporta múltiplos exportadores separados por vírgulas. Os valores disponíveis podem ser consultados na documentação dos exportadores existentes.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Métricas a serem exportadas, separadas por vírgulas. Os valores disponíveis podem ser encontrados em [Métricas](#Métricas).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Limite para registro do tempo de resposta de requisições HTTP (`http_request_cost`), em milissegundos. O valor padrão é `0`, o que significa que todas as requisições são registradas. Quando definido para um valor maior que `0`, apenas as requisições cujo tempo de resposta exceder esse limite serão registradas.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Métricas

As métricas registradas atualmente pela aplicação estão listadas abaixo. Se você precisar de mais métricas, pode consultar a [documentação de desenvolvimento](/plugin-development/server/telemetry) para extensões ou entrar em contato conosco.

| Nome da Métrica       | Tipo da Métrica   | Descrição                                                                                        |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `process_cpu_percent` | `ObservableGauge` | Porcentagem de uso de CPU do processo                                                            |
| `process_memory_mb`   | `ObservableGauge` | Uso de memória do processo em MB                                                                 |
| `process_heap_mb`     | `ObservableGauge` | Uso de memória heap do processo em MB                                                            |
| `http_request_cost`   | `Histogram`       | Tempo de resposta da requisição HTTP em ms                                                       |
| `http_request_count`  | `Counter`         | Número de requisições HTTP                                                                       |
| `http_request_active` | `UpDownCounter`   | Número atual de requisições HTTP ativas                                                          |
| `sub_app_status`      | `ObservableGauge` | Estatísticas da contagem de sub-aplicações por status, reportadas pelo plugin `plugin-multi-app-manager` |