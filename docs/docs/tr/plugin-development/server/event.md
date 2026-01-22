:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Olaylar

NocoBase'in sunucusu, uygulama yaşam döngüsü, eklenti yaşam döngüsü ve veritabanı işlemleri gibi çeşitli aşamalarda ilgili olayları tetikler. Eklenti geliştiricileri, bu olayları dinleyerek genişletme mantığı, otomatik işlemler veya özel davranışlar uygulayabilirler.

NocoBase'in olay sistemi temel olarak iki seviyeye ayrılır:

- **`app.on()` - Uygulama Seviyesi Olayları**: Uygulamanın başlatma, kurulum, eklentileri etkinleştirme gibi yaşam döngüsü olaylarını dinler.
- **`db.on()` - Veritabanı Seviyesi Olayları**: Veri modeli seviyesindeki kayıt oluşturma, güncelleme, silme gibi işlem olaylarını dinler.

Her ikisi de Node.js'in `EventEmitter` sınıfından miras alır ve standart `.on()`, `.off()`, `.emit()` arayüzlerini destekler. NocoBase ayrıca, olayları eşzamansız olarak tetiklemek ve tüm dinleyicilerin yürütmeyi tamamlamasını beklemek için `emitAsync` desteğini de genişletmiştir.

## Olay Dinleyicilerini Kaydetme Konumu

Olay dinleyicileri genellikle eklentinin `beforeLoad()` metodunda kaydedilmelidir. Bu, olayların eklenti yükleme aşamasında hazır olmasını ve sonraki mantığın doğru şekilde yanıt verebilmesini sağlar.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Uygulama olaylarını dinleyin
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase başlatıldı');
    });

    // Veritabanı olaylarını dinleyin
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Yeni gönderi: ${model.get('title')}`);
      }
    });
  }
}
```

## Uygulama Olaylarını Dinleme `app.on()`

Uygulama olayları, NocoBase uygulamasının ve eklentilerinin yaşam döngüsü değişikliklerini yakalamak için kullanılır. Başlatma mantığı, kaynak kaydı veya eklenti bağımlılık tespiti gibi işlemler için uygundur.

### Tipik Olay Türleri

| Olay Adı                  | Tetiklenme Zamanı                 | Tipik Kullanım Alanları                               |
| ------------------------- | --------------------------------- | ----------------------------------------------------- |
| `beforeLoad` / `afterLoad` | Uygulama yüklenmeden önce / sonra | Kaynakları kaydetme, yapılandırmayı başlatma          |
| `beforeStart` / `afterStart` | Servis başlamadan önce / sonra    | Görevleri başlatma, başlangıç günlüklerini yazdırma    |
| `beforeInstall` / `afterInstall` | Uygulama kurulmadan önce / sonra  | Verileri başlatma, şablonları içe aktarma             |
| `beforeStop` / `afterStop` | Servis durmadan önce / sonra      | Kaynakları temizleme, durumu kaydetme                 |
| `beforeDestroy` / `afterDestroy` | Uygulama yok edilmeden önce / sonra | Önbelleği silme, bağlantıları kesme                   |
| `beforeLoadPlugin` / `afterLoadPlugin` | Eklenti yüklenmeden önce / sonra  | Eklenti yapılandırmasını değiştirme veya işlevselliği genişletme |
| `beforeEnablePlugin` / `afterEnablePlugin` | Eklenti etkinleştirilmeden önce / sonra | Bağımlılıkları kontrol etme, eklenti mantığını başlatma |
| `beforeDisablePlugin` / `afterDisablePlugin` | Eklenti devre dışı bırakılmadan önce / sonra | Eklenti kaynaklarını temizleme                        |
| `afterUpgrade`            | Uygulama yükseltmesi tamamlandıktan sonra | Veri geçişi veya uyumluluk düzeltmeleri yapma         |

Örnek: Uygulama başlatma olayını dinleme

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase servisi başlatıldı!');
});
```

Örnek: Eklenti yükleme olayını dinleme

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Eklenti ${plugin.name} yüklendi`);
});
```

## Veritabanı Olaylarını Dinleme `db.on()`

Veritabanı olayları, model seviyesindeki çeşitli veri değişikliklerini yakalayabilir; denetim, senkronizasyon, otomatik doldurma gibi işlemler için uygundur.

### Tipik Olay Türleri

| Olay Adı                                                  | Tetiklenme Zamanı                               |
| --------------------------------------------------------- | ----------------------------------------------- |
| `beforeSync` / `afterSync`                                | Veritabanı yapısı senkronize edilmeden önce / sonra |
| `beforeValidate` / `afterValidate`                        | Veri doğrulanmadan önce / sonra                 |
| `beforeCreate` / `afterCreate`                            | Kayıt oluşturulmadan önce / sonra               |
| `beforeUpdate` / `afterUpdate`                            | Kayıt güncellenmeden önce / sonra               |
| `beforeSave` / `afterSave`                                | Kaydedilmeden önce / sonra (oluşturma ve güncelleme dahil) |
| `beforeDestroy` / `afterDestroy`                          | Kayıt silinmeden önce / sonra                   |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | İlişkili verileri içeren işlemlerden sonra      |
| `beforeDefineCollection` / `afterDefineCollection`        | Koleksiyon tanımlanmadan önce / sonra           |
| `beforeRemoveCollection` / `afterRemoveCollection`        | Koleksiyon silinmeden önce / sonra              |

Örnek: Veri oluşturulduktan sonraki olayı dinleme

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Veri oluşturuldu!');
});
```

Örnek: Veri güncellenmeden önceki olayı dinleme

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Veri güncellenmek üzere!');
});
```