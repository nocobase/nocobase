:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Açılır Seçici

## Giriş
Açılır Seçici, hedef **koleksiyon**daki mevcut verilerden seçim yaparak veri ilişkilendirmeyi veya hedef **koleksiyon**a yeni veri ekledikten sonra ilişkilendirmeyi destekler. Açılır seçenekler bulanık aramayı destekler.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Alan Yapılandırması

### Veri Kapsamını Ayarlama
Açılır listenin veri kapsamını kontrol eder.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Daha fazla bilgi için [Veri Kapsamını Ayarlama](/interface-builder/fields/field-settings/data-scope) bölümüne bakınız.

### Sıralama Kurallarını Ayarlama
Açılır seçicideki verilerin sıralamasını kontrol eder.

Örnek: Hizmet tarihine göre azalan sırada sıralama.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Birden Fazla Kayıt Ekleme/İlişkilendirmeye İzin Ver
Çoktan çoğa bir ilişkide yalnızca tek bir kaydın ilişkilendirilmesine izin verilmesini kısıtlar.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Başlık Alanı
Başlık alanı, seçeneklerde görüntülenen etiket alanıdır.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Başlık alanına göre hızlı aramayı destekler.

Daha fazla bilgi için [Başlık Alanı](/interface-builder/fields/field-settings/title-field) bölümüne bakınız.

### Hızlı Oluşturma: Önce Ekle, Sonra Seç

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Açılır Menü Aracılığıyla Ekleme
Hedef **koleksiyon**da yeni bir kayıt oluşturduktan sonra, sistem bu kaydı otomatik olarak seçer ve form gönderildiğinde ilişkilendirir.

Aşağıdaki örnekte, Siparişler **koleksiyon**unda çoktan bire ilişki alanı **"Hesap"** bulunmaktadır.

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Modal Pencere Aracılığıyla Ekleme
Modal pencere ile oluşturma, daha karmaşık veri girişi senaryoları için uygundur ve yeni kayıtlar oluşturmak üzere özelleştirilmiş bir form yapılandırmanıza olanak tanır.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Alan Bileşeni](/interface-builder/fields/association-field)