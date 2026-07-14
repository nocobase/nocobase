# RunJS TypeScript 性能基准

- 时间：2026-07-14T14:00:45.882Z
- 样本：每个场景冷缓存 20 次，热输入 20 次
- 浏览器：127.0.6533.17
- 机器：Apple M4，10 核，16 GiB，darwin 24.6.0 arm64
- Node.js：v22.22.0
- 缓存定义：冷样本使用全新浏览器 context、registry、Language Service；热样本复用同一 context、pack Promise、Language Service 和不可变 snapshot。

| 场景 | 冷 diagnostics P50 / P95 | 热 diagnostics P50 / P95 | pack loader P50 / P95 | script transfer P50 / P95 | 请求 packs | 实际加载 packs | 热缓存命中 | 最大 Long Task |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | ---: |
| 普通 RunJS | 682.30 ms / 874.90 ms | 8.60 ms / 15.90 ms | 0.00 ms / 0.00 ms | 1873623 B / 1873623 B | 无 | 无 | 无 | 0.00 ms |
| React | 726.40 ms / 1119.40 ms | 9.00 ms / 10.20 ms | 16.40 ms / 43.50 ms | 3008194 B / 3008194 B | react | react | react | 0.00 ms |
| ReactDOM | 748.50 ms / 979.00 ms | 14.80 ms / 18.90 ms | 3.50 ms / 17.70 ms | 3015803 B / 3015803 B | react, react-dom/client | react, react-dom/client | react, react-dom/client | 0.00 ms |
| dayjs | 473.00 ms / 598.90 ms | 4.50 ms / 5.60 ms | 2.30 ms / 3.10 ms | 1892487 B / 1892487 B | dayjs | dayjs | dayjs | 0.00 ms |
| lodash | 492.90 ms / 613.30 ms | 8.50 ms / 10.70 ms | 5.70 ms / 6.90 ms | 2344078 B / 2344078 B | lodash | lodash | lodash | 0.00 ms |
| antd/Button（React 热） | 252.30 ms / 323.90 ms | 20.80 ms / 30.50 ms | 2.20 ms / 3.30 ms | 3026795 B / 3026795 B | antd/Button, react | antd/Button | antd/Button, react | 0.00 ms |
| Ant Design 多组件（React 热） | 737.50 ms / 1443.70 ms | 51.40 ms / 77.80 ms | 13.50 ms / 23.30 ms | 5091675 B / 5091675 B | antd/Button, antd/Input, antd/Table, react | antd/Button, antd/Input, antd/Table | antd/Button, antd/Input, antd/Table, react | 0.00 ms |
| 单图标分组（React 热） | 267.50 ms / 467.10 ms | 13.40 ms / 17.50 ms | 2.10 ms / 4.40 ms | 3022235 B / 3022235 B | antd-icons/base, antd-icons/P, react | antd-icons/base, antd-icons/P | antd-icons/base, antd-icons/P, react | 0.00 ms |
| 跨组图标（React 热） | 224.20 ms / 283.20 ms | 20.30 ms / 24.80 ms | 1.60 ms / 2.70 ms | 3025594 B / 3025594 B | antd-icons/base, antd-icons/M, antd-icons/P, react | antd-icons/base, antd-icons/M, antd-icons/P | antd-icons/base, antd-icons/M, antd-icons/P, react | 0.00 ms |
| antd + icons full fallback（React 热） | 1168.20 ms / 2030.60 ms | 33.30 ms / 36.80 ms | 15.90 ms / 28.90 ms | 5376139 B / 5376139 B | antd-icons/full, antd/full, dayjs | antd-icons/full, antd/full, dayjs | antd-icons/full, antd/full, dayjs, react | 0.00 ms |

## 预算

| Budget | Policy | Actual | Limit | Result |
| --- | --- | ---: | ---: | --- |
| initial-code-editor-gzip-increment | ci-gate | 25207 bytes | 51200 bytes | PASS |
| initial-chunk-third-party-declarations | ci-gate | false boolean | false boolean | PASS |
| hot-diagnostics-p95 | trend | 15.900000002235174 ms | 1.14 ms | FAIL |
| react-cold-diagnostics-p95 | trend | 1119.3999999985099 ms | 400 ms | FAIL |
| antd-button-warm-react-p95 | trend | 323.8999999985099 ms | 300 ms | FAIL |
| single-icon-cold-p95 | trend | 467.0999999977648 ms | 250 ms | FAIL |
| hot-input-language-service-rebuilds | ci-gate | 0 count | 0 count | PASS |
| concurrent-same-pack-loader-count | ci-gate | 1 count | 1 count | PASS |
| maximum-type-system-long-task | trend | 0 ms | 100 ms | PASS |

## 任务 17 迁移结果

主线程 Long Task 预算通过：最大 0.00 ms，不超过 100 ms 门禁。

## 已知限制

- full fallback completion 会完整序列化 completion details 与 text changes，P95 为 37033.60 ms；该耗时发生在 Worker，不阻塞主线程，但仍需后续优化。
- 跳过无 source/action 的普通 completion details 后，full fallback 3 样本复测 P95 为 17212.70 ms，仍是后续优化项。
