---
pkg: '@nocobase/plugin-record-history'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Geçmiş Kayıtları

## Giriş

Geçmiş Kayıtları eklentisi, verilerdeki değişiklik süreçlerini takip etmek için kullanılır. Oluşturma, güncelleme ve silme işlemlerinin anlık görüntülerini ve fark kayıtlarını otomatik olarak kaydederek, kullanıcıların veri değişikliklerini hızlıca gözden geçirmesine ve işlem faaliyetlerini denetlemesine yardımcı olur.

![](https://static-docs.nocobase.com/202511011338499.png)

## Geçmiş Kayıtlarını Etkinleştirme

### Koleksiyon ve Alan Ekleme

Öncelikle Geçmiş Kayıtları eklentisi ayarları sayfasına gidin ve işlem geçmişini kaydetmek istediğiniz koleksiyonları ve alanları ekleyin. Kayıt verimliliğini artırmak ve veri fazlalığını önlemek için yalnızca gerekli koleksiyonları ve alanları yapılandırmanız önerilir. Benzersiz kimlik (ID), oluşturulma tarihi, güncellenme tarihi, oluşturan kişi ve güncelleyen kişi gibi alanların genellikle kaydedilmesine gerek yoktur.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Geçmiş Veri Anlık Görüntülerini Senkronize Etme

- Geçmiş takibi etkinleştirilmeden önce oluşturulan kayıtlar için, değişiklikler ancak ilk güncelleme bir anlık görüntü oluşturduktan sonra kaydedilebilir; bu nedenle ilk güncelleme veya silme işlemi geçmişte yer almaz.
- Mevcut verilerin geçmişini korumak isterseniz, bir kerelik anlık görüntü senkronizasyonu yapabilirsiniz.
- Koleksiyon başına anlık görüntü boyutu şu şekilde hesaplanır: kayıt sayısı × takip edilecek alan sayısı.
- Veri miktarı büyükse, veri kapsamına göre filtreleme yapmanız ve yalnızca önemli kayıtları senkronize etmeniz önerilir.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

“Geçmiş Anlık Görüntülerini Senkronize Et” düğmesine tıklayın, senkronize edilecek alanları ve veri kapsamını ayarlayın ve senkronizasyonu başlatın.

![](https://static-docs.nocobase.com/202511011320958.png)

Senkronizasyon görevi arka planda sıraya alınacak ve çalışacaktır. Görevin tamamlanıp tamamlanmadığını görmek için listeyi yenileyebilirsiniz.

## Geçmiş Kayıtları Bloğunu Kullanma

### Blok Ekleme

Geçmiş Kayıtları Bloğunu seçin ve bir koleksiyon belirleyerek ilgili koleksiyonun geçmiş kayıtları bloğunu sayfanıza ekleyebilirsiniz.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Bir kaydın detay açılır penceresine geçmiş bloğu ekliyorsanız, o kayda özel geçmişi görüntülemek için “Mevcut Kayıt” seçeneğini belirleyebilirsiniz.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Açıklama Şablonlarını Düzenleme

Blok ayarlarındaki “Şablonu Düzenle”ye tıklayarak işlem kayıtları için açıklama metnini yapılandırabilirsiniz.

![](https://static-docs.nocobase.com/202511011340406.png)

Şu anda oluşturma, güncelleme ve silme kayıtları için açıklama metinlerini ayrı ayrı yapılandırabilirsiniz. Güncelleme kayıtları için, alan değişikliklerinin açıklama metnini de yapılandırabilirsiniz; bu hem tüm alanlar için tek bir yapılandırma hem de belirli bir alan için ayrı ayrı yapılandırma şeklinde olabilir.

![](https://static-docs.nocobase.com/202511011346400.png)

Metni yapılandırırken değişkenler kullanabilirsiniz.

![](https://static-docs.nocobase.com/202511011347163.png)

Yapılandırma tamamlandıktan sonra, şablonu “Mevcut koleksiyonun tüm geçmiş kayıtları blokları”na veya “Yalnızca bu geçmiş kayıtları bloğu”na uygulayabilirsiniz.

![](https://static-docs.nocobase.com/202511011348885.png)