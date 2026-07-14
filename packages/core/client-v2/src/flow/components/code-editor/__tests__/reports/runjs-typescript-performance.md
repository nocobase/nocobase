# RunJS TypeScript 性能基准

- 时间：2026-07-14T13:00:47.722Z
- 样本：每个场景冷缓存 20 次，热输入 20 次
- 浏览器：127.0.6533.17
- 机器：Apple M4，10 核，16 GiB，darwin 24.6.0 arm64
- Node.js：v22.22.0
- 缓存定义：冷样本使用全新浏览器 context、registry、Language Service；热样本复用同一 context、pack Promise、Language Service 和不可变 snapshot。

| 场景 | 冷 diagnostics P50 / P95 | 热 diagnostics P50 / P95 | pack loader P50 / P95 | script transfer P50 / P95 | 请求 packs | 实际加载 packs | 热缓存命中 | 最大 Long Task |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | ---: |
| 普通 RunJS | 715.70 ms / 1085.70 ms | 7.70 ms / 10.00 ms | 0.00 ms / 0.00 ms | 3149761 B / 3149761 B | 无 | 无 | 无 | 529.10 ms |
| React | 1115.20 ms / 1518.40 ms | 11.70 ms / 15.90 ms | 75.00 ms / 210.20 ms | 4284332 B / 4284332 B | react | react | react | 957.30 ms |
| ReactDOM | 888.70 ms / 1110.50 ms | 17.20 ms / 24.70 ms | 19.30 ms / 94.30 ms | 4291941 B / 4291941 B | react, react-dom/client | react, react-dom/client | react, react-dom/client | 659.20 ms |
| dayjs | 655.20 ms / 878.10 ms | 7.80 ms / 9.90 ms | 4.90 ms / 13.00 ms | 3168625 B / 3168625 B | dayjs | dayjs | dayjs | 472.90 ms |
| lodash | 954.80 ms / 1245.90 ms | 15.50 ms / 20.40 ms | 17.70 ms / 107.60 ms | 3620216 B / 3620216 B | lodash | lodash | lodash | 746.90 ms |
| antd/Button（React 热） | 410.60 ms / 1051.20 ms | 27.90 ms / 40.00 ms | 11.30 ms / 66.10 ms | 4302933 B / 4302933 B | antd/Button, react | antd/Button | antd/Button, react | 1093.00 ms |
| Ant Design 多组件（React 热） | 1536.20 ms / 1894.60 ms | 55.40 ms / 66.00 ms | 47.30 ms / 113.70 ms | 6367813 B / 6367813 B | antd/Button, antd/Input, antd/Table, react | antd/Button, antd/Input, antd/Table | antd/Button, antd/Input, antd/Table, react | 1701.50 ms |
| 单图标分组（React 热） | 450.70 ms / 914.30 ms | 18.60 ms / 26.90 ms | 13.20 ms / 87.60 ms | 4298373 B / 4298373 B | antd-icons/P, react | antd-icons/base, antd-icons/P | antd-icons/base, antd-icons/P, react | 714.90 ms |
| 跨组图标（React 热） | 415.00 ms / 520.40 ms | 23.30 ms / 33.40 ms | 8.90 ms / 34.00 ms | 4301732 B / 4301732 B | antd-icons/M, antd-icons/P, react | antd-icons/base, antd-icons/M, antd-icons/P | antd-icons/base, antd-icons/M, antd-icons/P, react | 757.00 ms |
| antd + icons full fallback（React 热） | 1665.00 ms / 2153.10 ms | 33.10 ms / 42.80 ms | 27.00 ms / 74.00 ms | 6652277 B / 6652277 B | antd-icons/full, antd/full | antd-icons/full, antd/full, dayjs | antd-icons/full, antd/full, dayjs, react | 2221.90 ms |

## 预算

| 预算 | 策略 | 实际值 | 阈值 | 来源 | 结果 |
| --- | --- | ---: | ---: | --- | --- |
| initial-code-editor-gzip-increment | ci-gate | 24567 bytes | 51200 bytes | chunk-scan | PASS |
| initial-chunk-third-party-declarations | ci-gate | false boolean | false boolean | chunk-scan | PASS |
| hot-diagnostics-p95 | trend | 10 ms | 1.14 ms | browser-benchmark | FAIL |
| react-cold-diagnostics-p95 | trend | 1518.3999999985099 ms | 400 ms | browser-benchmark | FAIL |
| antd-button-warm-react-p95 | trend | 1051.199999999255 ms | 300 ms | browser-benchmark | FAIL |
| single-icon-cold-p95 | trend | 914.2999999970198 ms | 250 ms | browser-benchmark | FAIL |
| hot-input-language-service-rebuilds | ci-gate | 0 count | 0 count | browser-benchmark | PASS |
| concurrent-same-pack-loader-count | ci-gate | 1 count | 1 count | typescriptMetrics.test.ts | PASS |
| maximum-type-system-long-task | trend | 2221.900000002235 ms | 100 ms | browser-benchmark | FAIL |

## 任务 17 结论

执行 17。观测到类型系统 Long Task 最大 2221.90 ms，超过 100 ms 门禁。
