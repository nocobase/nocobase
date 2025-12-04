:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# लॉगर

## लॉगर बनाएँ

### `createLogger()`

यह एक कस्टम लॉगर बनाता है।

#### सिग्नेचर

- `createLogger(options: LoggerOptions)`

#### टाइप

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### विवरण

| प्रॉपर्टी     | विवरण                  |
| :----------- | :---------------------- |
| `dirname`    | लॉग आउटपुट डायरेक्टरी   |
| `filename`   | लॉग फ़ाइल का नाम       |
| `format`     | लॉग फ़ॉर्मेट            |
| `transports` | लॉग आउटपुट विधि        |

### `createSystemLogger()`

यह एक निर्दिष्ट विधि से प्रिंट किए गए सिस्टम रनटाइम लॉग बनाता है। [लॉगर - सिस्टम लॉग](/log-and-monitor/logger/index.md#system-log) देखें।

#### सिग्नेचर

- `createSystemLogger(options: SystemLoggerOptions)`

#### टाइप

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### विवरण

| प्रॉपर्टी        | विवरण                                   |
| :-------------- | :-------------------------------------- |
| `seperateError` | क्या `error` स्तर के लॉग को अलग से आउटपुट करना है |

### `requestLogger()`

API अनुरोध और प्रतिक्रिया लॉगिंग के लिए मिडलवेयर।

```ts
app.use(requestLogger(app.name));
```

#### सिग्नेचर

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### टाइप

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### विवरण

| प्रॉपर्टी            | टाइप                              | विवरण                                                           | डिफ़ॉल्ट                                                                                                                                                 |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | अनुरोध संदर्भ के आधार पर कुछ अनुरोधों के लिए लॉगिंग को छोड़ देता है। | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | लॉग में प्रिंट की जाने वाली अनुरोध जानकारी की श्वेतसूची (whitelist)। | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | लॉग में प्रिंट की जाने वाली प्रतिक्रिया जानकारी की श्वेतसूची (whitelist)। | `['status']`                                                                                                                                            |

### app.createLogger()

#### परिभाषा

```ts
class Application {
  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }
}
```

जब `dirname` एक रिलेटिव पाथ होता है, तो लॉग फ़ाइलें वर्तमान एप्लिकेशन के नाम वाली डायरेक्टरी में आउटपुट होंगी।

### plugin.createLogger()

इसका उपयोग `app.createLogger()` के समान ही है।

#### परिभाषा

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## लॉग कॉन्फ़िगरेशन

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

यह सिस्टम में वर्तमान में कॉन्फ़िगर किए गए लॉग स्तर को प्राप्त करता है।

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

यह सिस्टम में वर्तमान में कॉन्फ़िगर की गई लॉग डायरेक्टरी के आधार पर डायरेक्टरी पाथ्स को जोड़ता है।

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

यह सिस्टम में वर्तमान में कॉन्फ़िगर की गई लॉग आउटपुट विधियों को प्राप्त करता है।

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

यह सिस्टम में वर्तमान में कॉन्फ़िगर किए गए लॉग फ़ॉर्मेट को प्राप्त करता है।

## लॉग आउटपुट

### Transports

पूर्वनिर्धारित आउटपुट विधियाँ।

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## संबंधित दस्तावेज़

- [डेवलपमेंट गाइड - लॉगर](/plugin-development/server/logger)
- [लॉगर](/log-and-monitor/logger/index.md)