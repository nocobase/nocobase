:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Logger (Günlük Kaydı)

NocoBase günlük kaydı, <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a> üzerine kurulmuştur. Varsayılan olarak, NocoBase günlükleri API istek günlükleri, sistem çalışma günlükleri ve SQL yürütme günlükleri olarak üçe ayırır. API istek günlükleri ve SQL yürütme günlükleri uygulamanın kendisi tarafından oluşturulurken, **eklenti** geliştiricilerinin genellikle yalnızca **eklenti** ile ilgili sistem çalışma günlüklerini kaydetmeleri yeterlidir.

Bu belge, **eklenti** geliştirirken günlükleri nasıl oluşturacağınızı ve kaydedeceğinizi açıklamaktadır.

## Varsayılan Günlük Kaydetme Yöntemleri

NocoBase, sistem çalışma günlüklerini kaydetmek için yöntemler sunar. Günlükler, belirtilen alanlara göre kaydedilir ve aynı zamanda belirlenen dosyalara yazılır.

```ts
// Varsayılan günlük kaydetme yöntemi
app.log.info("message");

// Middleware'de kullanım
async function (ctx, next) {
  ctx.log.info("message");
}

// Eklentilerde kullanım
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Yukarıdaki tüm yöntemler aşağıdaki kullanıma uyar:

İlk parametre günlük mesajıdır, ikinci parametre ise isteğe bağlı bir metadata nesnesidir. Bu nesne herhangi bir anahtar-değer çifti içerebilir. Burada `module`, `submodule` ve `method` ayrı alanlar olarak çıkarılırken, kalan diğer tüm alanlar `meta` alanına yerleştirilir.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## Başka Dosyalara Çıktı Verme

Sistem varsayılan günlük kaydetme yöntemini kullanmak ancak günlükleri varsayılan dosyaya yazdırmak istemiyorsanız, `createSystemLogger` kullanarak özel bir sistem logger (günlükleyici) örneği oluşturabilirsiniz.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Hata seviyesindeki günlükleri 'xxx_error.log' dosyasına ayrı olarak yazıp yazmayacağını belirtir.
});
```

## Özel Logger (Günlükleyici)

Sistem tarafından sağlanan günlük kaydetme yöntemlerini kullanmak yerine Winston'ın kendi (native) yöntemlerini tercih ediyorsanız, aşağıdaki metotları kullanarak günlükler oluşturabilirsiniz.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options`, orijinal `winston.LoggerOptions`'ın üzerine ek özellikler sunarak genişletilmiştir.

- `transports` - Önceden tanımlanmış çıktı yöntemlerini uygulamak için `'console' | 'file' | 'dailyRotateFile'` kullanabilirsiniz.
- `format` - Önceden tanımlanmış günlük kaydetme formatlarını uygulamak için `'logfmt' | 'json' | 'delimiter'` kullanabilirsiniz.

### `app.createLogger`

Çoklu uygulama senaryolarında, bazen özel çıktı dizinleri ve dosyaları kullanmak isteyebiliriz. Bu durumda, günlükleri mevcut uygulamanın adını taşıyan bir dizine yazdırabilirsiniz.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Çıktı: /storage/logs/main/custom.log dosyasına yazılır.
});
```

### `plugin.createLogger`

Kullanım senaryosu ve yöntemi `app.createLogger` ile aynıdır.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Çıktı: /storage/logs/main/custom-plugin/YYYY-MM-DD.log dosyasına yazılır.
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```