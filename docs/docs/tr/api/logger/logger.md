:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Logger

## Logger Oluşturma

### `createLogger()`

Özel bir logger oluşturur.

#### İmza

- `createLogger(options: LoggerOptions)`

#### Tip

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Detaylar

| Özellik      | Açıklama             |
| :----------- | :------------------- |
| `dirname`    | Log çıktı dizini     |
| `filename`   | Log dosya adı        |
| `format`     | Log formatı          |
| `transports` | Log çıktı yöntemi    |

### `createSystemLogger()`

Belirtilen bir yöntemle yazdırılan sistem çalışma zamanı loglarını oluşturur. Daha fazla bilgi için [Logger - Sistem Logu](#) bölümüne bakabilirsiniz.

#### İmza

- `createSystemLogger(options: SystemLoggerOptions)`

#### Tip

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Detaylar

| Özellik         | Açıklama                                  |
| :-------------- | :---------------------------------------- |
| `seperateError` | `error` seviyesindeki logların ayrı olarak çıktı verilip verilmeyeceği |

### `requestLogger()`

API istek ve yanıt loglaması için kullanılan bir ara yazılımdır.

```ts
app.use(requestLogger(app.name));
```

#### İmza

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Tip

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Detaylar

| Özellik             | Tip                               | Açıklama                                                         | Varsayılan Değer                                                                                                                                        |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | İstek bağlamına göre belirli isteklerin loglanmasını atlar.       | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Logda yazdırılacak istek bilgilerinin beyaz listesi.             | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Logda yazdırılacak yanıt bilgilerinin beyaz listesi.             | `['status']`                                                                                                                                            |

### app.createLogger()

#### Tanım

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

`dirname` göreceli bir yol olduğunda, log dosyaları mevcut uygulamanın adını taşıyan dizine çıktı olarak verilir.

### plugin.createLogger()

Kullanımı `app.createLogger()` ile aynıdır.

#### Tanım

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Log Yapılandırması

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Sistemde şu anda yapılandırılmış olan log seviyesini alır.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Sistemde şu anda yapılandırılmış olan log dizinini temel alarak dizin yollarını birleştirir.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Sistemde şu anda yapılandırılmış olan log çıktı yöntemlerini alır.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Sistemde şu anda yapılandırılmış olan log formatını alır.

## Log Çıktısı

### Transports

Önceden tanımlanmış çıktı yöntemleri.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## İlgili Belgeler

- [Geliştirme Rehberi - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)