:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# मेट्रिक

## क्लास विधियाँ

### `constructor()`

यह एक `Metric` इंस्टेंस बनाने के लिए कंस्ट्रक्टर है।

#### सिग्नेचर

- `constructor(options?: MetricOptions)`

#### टाइप

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### विवरण

| प्रॉपर्टी     | टाइप                   | विवरण                                         | डिफ़ॉल्ट मान              |
| ------------ | ---------------------- | --------------------------------------------- | ------------------------- |
| `meterName`  | `string`               | मीटर आइडेंटिफ़ायर                             | `nocobase-meter`          |
| `version`    | `string`               |                                               | NocoBase का वर्तमान वर्ज़न |
| `readerName` | `string` \| `string[]` | सक्रिय किए जाने वाले रजिस्टर्ड `MetricReader` का आइडेंटिफ़ायर |                           |

### `init()`

यह `MetricProvider` को इनिशियलाइज़ करता है।

#### सिग्नेचर

- `init(): void`

### `registerReader()`

यह एक `MetricReader` को रजिस्टर करता है।

#### सिग्नेचर

- `registerReader(name: string, reader: GetMetricReader)`

#### टाइप

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### विवरण

| पैरामीटर | टाइप                 | विवरण                                 |
| -------- | -------------------- | ------------------------------------- |
| `name`   | `string`             | `MetricReader` के लिए यूनीक आइडेंटिफ़ायर |
| `reader` | `() => MetricReader` | `MetricReader` प्राप्त करने का फ़ंक्शन |

### `addView()`

यह एक `View` जोड़ता है। [Configure Metric Views](https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views) देखें।

#### सिग्नेचर

- `addView(...view: View[])`

#### टाइप

```ts
import { View } from '@optelemetry/sdk-metrics';
```

### `getMeter()`

यह `Meter` प्राप्त करता है।

#### सिग्नेचर

- `getMeter(name?: string, version?: string)`

#### विवरण

| पैरामीटर | टाइप     | विवरण           | डिफ़ॉल्ट मान              |
| -------- | -------- | ---------------- | ------------------------- |
| `name`   | `string` | मीटर आइडेंटिफ़ायर | `nocobase-meter`          |
| `version`| `string` |                  | NocoBase का वर्तमान वर्ज़न |

### `start()`

यह `MetricReader` को शुरू करता है।

#### सिग्नेचर

- `start(): void`

### `shutdown()`

यह `MetricReader` को रोकता है।

#### सिग्नेचर

- `shutdown(): Promise<void>`