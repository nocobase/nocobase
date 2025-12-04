:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# Telemetry

## अवलोकन

`Telemetry` NocoBase का टेलीमेट्री मॉड्यूल है, जो OpenTelemetry पर आधारित है और OpenTelemetry इकोसिस्टम के भीतर मेट्रिक्स (Metric) और ट्रेसेज़ (Trace) को रजिस्टर करने के लिए समर्थन प्रदान करता है।

## क्लास मेथड्स

### `constructor()`

यह कंस्ट्रक्टर एक `Telemetry` इंस्टेंस बनाता है।

#### सिग्नेचर

- `constructor(options?: TelemetryOptions)`

#### टाइप

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### विवरण

| प्रॉपर्टी      | प्रकार            | विवरण                                                                                                                               | डिफ़ॉल्ट मान                     |
| ------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | वैकल्पिक। [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/resource/#service) का संदर्भ लें। | `nocobase`                 |
| `version`     | `string`        | वैकल्पिक। [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/resource/#service) का संदर्भ लें। | वैकल्पिक, वर्तमान NocoBase संस्करण |
| `trace`       | `TraceOptions`  | वैकल्पिक। [Trace](./trace.md) का संदर्भ लें।                                                                                       |                            |
| `metric`      | `MetricOptions` | वैकल्पिक। [Metric](./metric.md) का संदर्भ लें।                                                                                     |                            |

### `init()`

यह इंस्ट्रूमेंटेशन (Instrumentation) को रजिस्टर करता है और `Trace` तथा `Metric` को इनिशियलाइज़ करता है।

#### सिग्नेचर

- `init(): void`

### `start()`

यह `Trace` और `Metric` संबंधित डेटा की प्रोसेसिंग को शुरू करता है, जैसे कि Prometheus पर एक्सपोर्ट करना।

#### सिग्नेचर

- `start(): void`

### `shutdown()`

यह `Trace` और `Metric` संबंधित डेटा की प्रोसेसिंग को रोकता है।

#### सिग्नेचर

- `shutdown(): Promise<void>`

### `addInstrumentation()`

यह इंस्ट्रूमेंटेशन लाइब्रेरीज़ जोड़ता है।

#### सिग्नेचर

- `addInstrumentation(...instrumentation: InstrumentationOption[])`