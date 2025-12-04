---
pkg: "@nocobase/plugin-comments"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Yorum Koleksiyonu

## Giriş

Yorum koleksiyonu, kullanıcı yorumlarını ve geri bildirimlerini depolamak için tasarlanmış özel bir veri tablosu şablonudur. Yorum özelliği sayesinde, herhangi bir veri tablosuna yorum yapma yeteneği ekleyebilir, böylece kullanıcıların belirli kayıtlar hakkında tartışmasını, geri bildirimde bulunmasını veya notlar eklemesini sağlayabilirsiniz. Yorum koleksiyonu, zengin metin düzenlemeyi destekleyerek esnek içerik oluşturma yetenekleri sunar.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Özellikler

- **Zengin Metin Düzenleme**: Varsayılan olarak Markdown (vditor) düzenleyici içerir, zengin metin içeriği oluşturmayı destekler.
- **Herhangi Bir Veri Tablosuna Bağlama**: İlişki alanları aracılığıyla yorumları herhangi bir veri tablosundaki kayıtlara bağlayabilirsiniz.
- **Çok Düzeyli Yorumlar**: Yorumlara yanıt vermeyi ve bir yorum ağacı yapısı oluşturmayı destekler.
- **Kullanıcı Takibi**: Yorumu oluşturan kişiyi ve oluşturulma zamanını otomatik olarak kaydeder.

## Kullanım Kılavuzu

### Yorum Koleksiyonu Oluşturma

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Veri tablosu yönetim sayfasına gidin.
2. "Koleksiyon Oluştur" düğmesine tıklayın.
3. "Yorum Koleksiyonu" şablonunu seçin.
4. Tablo adını girin (örneğin: "Görev Yorumları", "Makale Yorumları" vb.).
5. Sistem, aşağıdaki varsayılan alanları içeren bir yorum tablosunu otomatik olarak oluşturacaktır:
   - Yorum içeriği (Markdown vditor tipi)
   - Oluşturan (kullanıcı tablosuna bağlı)
   - Oluşturulma zamanı (tarih-saat tipi)

### İlişkileri Yapılandırma

Yorumların hedef veri tablosuna bağlanabilmesi için ilişki alanlarını yapılandırmanız gerekir:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Yorum tablosuna bir "Çoka Bir" ilişki alanı ekleyin.
2. Bağlamak istediğiniz hedef veri tablosunu seçin (örneğin: görevler tablosu, makaleler tablosu vb.).
3. Alan adını belirleyin (örneğin: "İlgili Görev", "İlgili Makale" vb.).

### Sayfalarda Yorum Bloklarını Kullanma

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Yorum işlevselliği eklemek istediğiniz sayfaya gidin.
2. Hedef kaydın detaylarında veya açılır penceresinde bir blok ekleyin.
3. "Yorumlar" blok tipini seçin.
4. Az önce oluşturduğunuz yorum koleksiyonunu seçin.

### Tipik Kullanım Senaryoları

- **Görev Yönetim Sistemleri**: Ekip üyeleri görevler hakkında tartışır ve geri bildirimde bulunur.
- **İçerik Yönetim Sistemleri**: Okuyucular makalelere yorum yapar ve etkileşimde bulunur.
- **Onay İş Akışları**: Onaylayanlar başvuru formlarına notlar ve görüşler ekler.
- **Müşteri Geri Bildirimi**: Müşterilerin ürün veya hizmetler hakkındaki değerlendirmelerini toplar.

## Dikkat Edilmesi Gerekenler

- Yorum koleksiyonu ticari bir eklenti özelliğidir ve kullanılabilmesi için yorum eklentisinin etkinleştirilmesi gerekir.
- Yorumları kimlerin görüntüleyebileceğini, oluşturabileceğini ve silebileceğini kontrol etmek için yorum tablosuna uygun izinler ayarlamanız önerilir.
- Çok sayıda yorumun olduğu senaryolarda, performansı artırmak için sayfalama özelliğini etkinleştirmeniz önerilir.