:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# ट्रेस

## क्लास मेथड्स

### `constructor()`

`Trace` इंस्टेंस बनाने के लिए कंस्ट्रक्टर।

#### सिग्नेचर

- `constructor(options?: TraceOptions)`

#### टाइप

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### विवरण

| प्रॉपर्टी        | टाइप                   | विवरण                                    | डिफ़ॉल्ट मान               |
| --------------- | ---------------------- | --------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | ट्रेस आइडेंटिफ़ायर                        | `nocobase-trace`            |
| `version`       | `string`               |                                         | NocoBase का वर्तमान वर्ज़न |
| `processorName` | `string` \| `string[]` | उपयोग किए जाने वाले रजिस्टर्ड `SpanProcessor` के आइडेंटिफ़ायर |                     |

### `init()`

`NodeTracerProvider` को इनिशियलाइज़ करता है।

#### सिग्नेचर

- `init(): void`

### `registerProcessor()`

एक `SpanProcessor` को रजिस्टर करता है।

#### सिग्नेचर

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### टाइप

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### विवरण

| पैरामीटर    | टाइप                  | विवरण                                  |
| ----------- | --------------------- | -------------------------------------- |
| `name`      | `string`              | `SpanProcessor` के लिए यूनीक आइडेंटिफ़ायर |
| `processor` | `() => SpanProcessor` | `SpanProcessor` प्राप्त करने के लिए फ़ंक्शन |

### `getTracer()`

`Tracer` प्राप्त करता है।

#### सिग्नेचर

- `getTracer(name?: string, version?: string)`

#### विवरण

| पैरामीटर  | टाइप     | विवरण             | डिफ़ॉल्ट मान               |
| --------- | -------- | ---------------- | --------------------------- |
| `name`    | `string` | ट्रेस आइडेंटिफ़ायर | `nocobase-trace`            |
| `version` | `string` |                  | NocoBase का वर्तमान वर्ज़न |

### `start()`

`SpanProcessor` को स्टार्ट करता है।

#### सिग्नेचर

- `start(): void`

### `shutdown()`

`SpanProcessor` को स्टॉप करता है।

#### सिग्नेचर

- `shutdown(): Promise<void>`