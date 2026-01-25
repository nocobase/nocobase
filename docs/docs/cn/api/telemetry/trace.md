# Trace

## 类方法

### `constructor()`

构造函数，创建一个 `Trace` 实例。

#### 签名

- `constructor(options?: TraceOptions)`

#### 类型

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### 详细信息

| 属性            | 类型                   | 描述                                    | 默认值              |
| --------------- | ---------------------- | --------------------------------------- | ------------------- |
| `traceName`     | `string`               | trace 标识                              | `nocobase-trace`    |
| `version`       | `string`               |                                         | NocoBase 当前版本号 |
| `processorName` | `string` \| `string[]` | 想启用的已注册的 `SpanProcessor` 的标识 |                     |

### `init()`

初始化 `NodeTracerProvider`.

#### 签名

- `init(): void`

### `registerProcessor()`

注册 `SpanProcessor`

#### 签名

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### 类型

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### 详细信息

| 参数        | 类型                  | 描述                        |
| ----------- | --------------------- | --------------------------- |
| `name`      | `string`              | `SpanProcessor` 唯一标识    |
| `processor` | `() => SpanProcessor` | 获取 `SpanProcessor` 的方法 |

### `getTracer()`

获取 `Tracer`.

#### 签名

- `getTracer(name?: string, version?: string)`

#### 详细信息

| 参数      | 类型     | 描述       | 默认值              |
| --------- | -------- | ---------- | ------------------- |
| `name`    | `string` | trace 标识 | `nocobase-trace`    |
| `version` | `string` |            | NocoBase 当前版本号 |

### `start()`

启动 `SpanProcessor`.

#### 签名

- `start(): void`

### `shutdown()`

停止 `SpanProcessor`.

#### 签名

- `shutdown(): Promise<void>`
