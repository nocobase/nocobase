:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/logger) bakın.
:::

# ctx.logger

[pino](https://github.com/pinojs/pino) tabanlı bir günlükleme (logging) sarmalayıcısıdır ve yüksek performanslı yapılandırılmış JSON günlükleri sağlar. Günlük toplama ve analizi kolaylaştırmak için `console` yerine `ctx.logger` kullanmanız önerilir.

## Uygulama Senaryoları

`ctx.logger`, hata ayıklama, hata takibi, performans analizi vb. için tüm RunJS senaryolarında kullanılabilir.

## Tür Tanımı

```ts
logger: pino.Logger;
```

`ctx.logger`, `engine.logger.child({ module: 'flow-engine' })` örneğidir; yani `module` bağlamına sahip bir pino alt günlükleyicisidir (child logger).

## Günlük Seviyeleri (Log Levels)

pino aşağıdaki seviyeleri destekler (en yüksekten en düşüğe):

| Seviye | Yöntem | Açıklama |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Kritik hata, genellikle işlemin sonlanmasına neden olur |
| `error` | `ctx.logger.error()` | Hata, başarısız bir isteği veya işlemi belirtir |
| `warn` | `ctx.logger.warn()` | Uyarı, potansiyel riskleri veya anormal durumları belirtir |
| `info` | `ctx.logger.info()` | Genel çalışma zamanı bilgileri |
| `debug` | `ctx.logger.debug()` | Geliştirme sırasında kullanılan hata ayıklama bilgileri |
| `trace` | `ctx.logger.trace()` | Derinlemesine teşhis için kullanılan ayrıntılı izleme |

## Önerilen Kullanım

`level(msg, meta)` biçimi önerilir: önce mesaj, ardından isteğe bağlı meta veri nesnesi gelir.

```ts
ctx.logger.info('Blok yükleme tamamlandı');
ctx.logger.info('İşlem başarılı', { recordId: 456 });
ctx.logger.warn('Performans uyarısı', { duration: 5000 });
ctx.logger.error('İşlem başarısız', { userId: 123, action: 'create' });
ctx.logger.error('İstek başarısız', { err });
```

pino ayrıca ihtiyaca göre `level(meta, msg)` (önce nesne) veya `level({ msg, ...meta })` (tek nesne) kullanımlarını da destekler.

## Örnekler

### Temel Kullanım

```ts
ctx.logger.info('Blok yükleme tamamlandı');
ctx.logger.warn('İstek başarısız, önbellek kullanılıyor', { err });
ctx.logger.debug('Kaydediliyor', { recordId: ctx.record?.id });
```

### child() ile Alt Günlükleyici Oluşturma

```ts
// Mevcut mantık için bağlam içeren bir alt günlükleyici oluşturun
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Adım 1 yürütülüyor');
log.debug('Adım 2 yürütülüyor', { step: 2 });
```

### console ile İlişkisi

Yapılandırılmış JSON günlükleri elde etmek için doğrudan `ctx.logger` kullanmanız önerilir. Eğer `console` kullanmaya alışıksanız, karşılıkları şöyledir: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Günlük Formatı

pino, her günlük girişinin şunları içerdiği yapılandırılmış JSON çıktısı verir:

- `level`: Günlük seviyesi (sayısal)
- `time`: Zaman damgası (milisaniye)
- `msg`: Günlük mesajı
- `module`: `flow-engine` olarak sabittir
- Diğer özel alanlar (nesneler aracılığıyla iletilen)

## Notlar

- Günlükler yapılandırılmış JSON'dur; bu da toplanmalarını, aranmalarını ve analiz edilmelerini kolaylaştırır.
- `child()` aracılığıyla oluşturulan alt günlükleyiciler için de `level(msg, meta)` yazımı önerilir.
- Bazı çalışma ortamları (iş akışları gibi) farklı günlük çıktı yöntemleri kullanabilir.

## İlgili

- [pino](https://github.com/pinojs/pino) — Temel günlükleme kütüphanesi