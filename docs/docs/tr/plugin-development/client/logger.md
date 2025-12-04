:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Logger

NocoBase, [pino](https://github.com/pinojs/pino) tabanlı yüksek performanslı bir günlükleme sistemi sunar. `context` erişiminizin olduğu her yerde, `ctx.logger` aracılığıyla bir `logger` örneği alabilir ve eklenti veya sistem çalışma zamanındaki kritik günlükleri kayıt altına alabilirsiniz.

## Temel Kullanım

```ts
// Kritik hataları kaydeder (örn: başlatma hatası)
ctx.logger.fatal('Uygulama başlatılamadı', { error });

// Genel hataları kaydeder (örn: API isteği hataları)
ctx.logger.error('Veri yükleme başarısız oldu', { status, message });

// Uyarı mesajlarını kaydeder (örn: performans riskleri veya kullanıcı işlemi istisnaları)
ctx.logger.warn('Mevcut form kaydedilmemiş değişiklikler içeriyor');

// Genel çalışma zamanı bilgilerini kaydeder (örn: bileşen yüklendi)
ctx.logger.info('Kullanıcı profili bileşeni yüklendi');

// Hata ayıklama bilgilerini kaydeder (örn: durum değişiklikleri)
ctx.logger.debug('Mevcut kullanıcı durumu', { user });

// Detaylı izleme bilgilerini kaydeder (örn: render akışı)
ctx.logger.trace('Bileşen render edildi', { component: 'UserProfile' });
```

Bu yöntemler, farklı günlük seviyelerine (yüksekten düşüğe) karşılık gelir:

| Seviye | Yöntem | Açıklama |
|---|---|---|
| `fatal` | `ctx.logger.fatal()` | Kritik hatalar, genellikle programın kapanmasına neden olur |
| `error` | `ctx.logger.error()` | Hata günlükleri, istek veya işlemin başarısız olduğunu gösterir |
| `warn` | `ctx.logger.warn()` | Uyarı bilgileri, potansiyel riskleri veya beklenmedik durumları bildirir |
| `info` | `ctx.logger.info()` | Normal çalışma zamanı bilgileri |
| `debug` | `ctx.logger.debug()` | Geliştirme ortamı için hata ayıklama bilgileri |
| `trace` | `ctx.logger.trace()` | Detaylı izleme bilgileri, genellikle derinlemesine teşhis için kullanılır |

## Günlük Formatı

Her günlük çıktısı, varsayılan olarak aşağıdaki alanları içeren yapılandırılmış JSON formatındadır:

| Alan | Tip | Açıklama |
|---|---|---|
| `level` | number | Günlük seviyesi |
| `time` | number | Zaman damgası (milisaniye) |
| `pid` | number | İşlem ID'si |
| `hostname` | string | Ana bilgisayar adı |
| `msg` | string | Günlük mesajı |
| Diğer | object | Özel bağlam bilgileri |

Örnek çıktı:

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## Bağlam Entegrasyonu

`ctx.logger`, mevcut eklenti, modül veya istek kaynağı gibi bağlam bilgilerini otomatik olarak enjekte eder ve günlüklerin kaynaklarına daha doğru bir şekilde izlenmesini sağlar.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Örnek çıktı (bağlam ile):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Özel Logger

Eklentilerinizde, varsayılan yapılandırmaları devralan veya genişleten özel `logger` örnekleri oluşturabilirsiniz:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Alt `logger`'lar, ana `logger`'ın yapılandırmasını devralır ve bağlamı otomatik olarak ekler.

## Günlük Seviyesi Hiyerarşisi

Pino'nun günlük seviyeleri, yüksekten düşüğe doğru sayısal bir tanımlamayı takip eder; sayı ne kadar küçükse, öncelik o kadar düşüktür.  
Aşağıda, günlük seviyelerinin tam hiyerarşi tablosu bulunmaktadır:

| Seviye Adı | Değer | Yöntem Adı | Açıklama |
|---|---|---|---|
| `fatal` | 60 | `logger.fatal()` | Kritik hatalar, genellikle programın çalışmaya devam edememesine neden olur |
| `error` | 50 | `logger.error()` | Genel hatalar, istek başarısızlığını veya işlem istisnalarını gösterir |
| `warn` | 40 | `logger.warn()` | Uyarı bilgileri, potansiyel riskleri veya beklenmedik durumları bildirir |
| `info` | 30 | `logger.info()` | Normal bilgiler, sistem durumunu veya olağan işlemleri kaydeder |
| `debug` | 20 | `logger.debug()` | Hata ayıklama bilgileri, geliştirme aşamasındaki sorun analizleri için kullanılır |
| `trace` | 10 | `logger.trace()` | Detaylı izleme bilgileri, derinlemesine teşhis için kullanılır |
| `silent` | -Infinity | (Karşılık gelen bir yöntem yok) | Tüm günlük çıktılarını kapatır |

Pino, yalnızca mevcut `level` yapılandırmasına eşit veya daha yüksek seviyedeki günlükleri çıkarır. Örneğin, günlük seviyesi `info` olarak ayarlandığında, `debug` ve `trace` günlükleri göz ardı edilecektir.

## Eklenti Geliştirmede En İyi Uygulamalar

1.  **Bağlam Logger'ını Kullanın**  
    `eklenti`, model veya uygulama bağlamlarında `ctx.logger` kullanarak, kaynak bilgilerini otomatik olarak taşıyabilirsiniz.

2.  **Günlük Seviyelerini Ayırt Edin**  
    - İş istisnalarını kaydetmek için `error` kullanın  
    - Durum değişikliklerini kaydetmek için `info` kullanın  
    - Geliştirme hata ayıklama bilgilerini kaydetmek için `debug` kullanın  

3.  **Aşırı Günlüklemeden Kaçının**  
    Özellikle `debug` ve `trace` seviyelerinde, bunların yalnızca geliştirme ortamlarında etkinleştirilmesi önerilir.

4.  **Yapılandırılmış Veri Kullanın**  
    Dizeleri birleştirmek yerine nesne parametreleri geçirmek, günlük analizi ve filtrelemesine yardımcı olur.

Bu uygulamaları takip ederek, geliştiriciler eklenti yürütmesini daha verimli bir şekilde izleyebilir, sorunları giderebilir ve günlükleme sisteminin yapılandırılmış ve genişletilebilir olmasını sağlayabilirler.