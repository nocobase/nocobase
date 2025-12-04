:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Blok Uzantılarına Genel Bakış

NocoBase 2.0'da, blok uzantı mekanizması önemli ölçüde basitleştirilmiştir. Geliştiriciler, blokları hızlıca özelleştirmek için yalnızca ilgili **FlowModel** temel sınıfını miras alıp ilgili arayüz metotlarını (başlıca `renderComponent()` metodu) uygulamalıdır.

## Blok Kategorileri

NocoBase, blokları üç kategoriye ayırır ve bunları yapılandırma arayüzünde gruplar halinde gösterir:

- **Veri blokları (Data blocks)**: `DataBlockModel` veya `CollectionBlockModel`'den miras alan bloklar
- **Filtre blokları (Filter blocks)**: `FilterBlockModel`'den miras alan bloklar
- **Diğer bloklar (Other blocks)**: Doğrudan `BlockModel`'den miras alan bloklar

> Bloğun ait olduğu grup, ilgili temel sınıf tarafından belirlenir. Sınıflandırma mantığı kalıtım ilişkilerine dayanır ve ek bir yapılandırma gerektirmez.

## Temel Sınıf Açıklamaları

Sistem, uzantılar için dört temel sınıf sunar:

### BlockModel

**Temel Blok Modeli**, en çok yönlü blok temel sınıfıdır.

- Veriye bağımlı olmayan, sadece görüntüleme amaçlı bloklar için uygundur.
- **Diğer bloklar (Other blocks)** grubuna dahil edilir.
- Kişiselleştirilmiş senaryolarda kullanılabilir.

### DataBlockModel

**Veri Blok Modeli (veri tablosuna bağlı olmayan)**, özel veri kaynaklarına sahip bloklar için kullanılır.

- Doğrudan bir veri tablosuna bağlı değildir, veri alma mantığı özelleştirilebilir.
- **Veri blokları (Data blocks)** grubuna dahil edilir.
- Harici API'leri çağırma, özel veri işleme, istatistiksel grafikler gibi senaryolar için uygundur.

### CollectionBlockModel

**Koleksiyon Blok Modeli**, bir veri tablosuna bağlanması gereken bloklar için kullanılır.

- Bir veri tablosuna bağlanması gereken model temel sınıfıdır.
- **Veri blokları (Data blocks)** grubuna dahil edilir.
- Listeler, formlar, kanban panoları gibi belirli bir veri tablosuna açıkça bağımlı olan bloklar için uygundur.

### FilterBlockModel

**Filtre Blok Modeli**, filtre koşulları oluşturmaya yönelik bloklar içindir.

- Filtre koşulları oluşturmak için model temel sınıfıdır.
- **Filtre blokları (Filter blocks)** grubuna dahil edilir.
- Genellikle veri blokları ile birlikte çalışır.

## Temel Sınıf Nasıl Seçilir?

Temel sınıf seçerken aşağıdaki prensiplere uyabilirsiniz:

- **Belirli bir veri tablosuna bağlanmanız gerekiyorsa**: `CollectionBlockModel`'i öncelikli olarak seçin.
- **Özel bir veri kaynağınız varsa**: `DataBlockModel`'i seçin.
- **Filtre koşulları belirlemek ve veri blokları ile birlikte çalışmak için**: `FilterBlockModel`'i seçin.
- **Nasıl sınıflandıracağınızdan emin değilseniz**: `BlockModel`'i seçin.

## Hızlı Başlangıç

Özel bir blok oluşturmak için sadece üç adım gereklidir:

1. İlgili temel sınıfı miras alın (örneğin, `BlockModel`).
2. Bir React bileşeni döndürmek için `renderComponent()` metodunu uygulayın.
3. Blok modelini eklentide kaydedin.

Ayrıntılı örnekler için lütfen [Bir Blok Eklentisi Yazma](./write-a-block-plugin) bölümüne bakın.