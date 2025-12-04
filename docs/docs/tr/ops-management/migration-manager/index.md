---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Taşıma Yöneticisi

## Giriş

Uygulama yapılandırmalarını bir uygulama ortamından diğerine taşımak için kullanılır. Taşıma Yöneticisi, özellikle "uygulama yapılandırmalarının" taşınmasına odaklanır. Tam kapsamlı bir taşıma yapmanız gerekiyorsa, "[Yedekleme Yöneticisi](../backup-manager/index.mdx)"nin yedekleme ve geri yükleme özelliklerini kullanmanızı öneririz.

## Kurulum

Taşıma Yöneticisi, [Yedekleme Yöneticisi](../backup-manager/index.mdx) eklentisine bağımlıdır. Lütfen bu eklentinin kurulu ve etkinleştirilmiş olduğundan emin olun.

## Süreç ve Prensipler

Ana veritabanındaki veri tablolarını ve verileri, taşıma kurallarına göre bir uygulamadan diğerine taşır. Harici veritabanlarından ve alt uygulamalardan gelen verilerin taşınmadığını unutmayın.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Taşıma Kuralları

### Dahili Kurallar

Taşıma Yöneticisi, ana veritabanındaki tüm veri tablolarının taşınmasını sağlar ve şu anda aşağıdaki beş kuralı destekler:

-   **Yalnızca Yapı (Şema):** Sadece veri tablosu yapısını taşır, veri ekleme veya güncelleme işlemleri yapılmaz.
-   **Üzerine Yaz (Temizle ve Yeniden Ekle):** Mevcut veri tablosundaki tüm kayıtları temizler ve ardından yeni verileri ekler.
-   **Ekle veya Güncelle:** Eğer kayıt mevcutsa günceller, mevcut değilse ekler.
-   **Tekrarı Yoksayarak Ekle:** Veri eklerken, eğer kayıt zaten mevcutsa, güncelleme yapmadan yoksayar.
-   **Atla:** Herhangi bir işlem yapmaz.

**Notlar:**

-   Üzerine Yaz, Ekle veya Güncelle ve Tekrarı Yoksayarak Ekle kuralları, tablo yapısı değişikliklerini de senkronize eder.
-   Birincil anahtarı otomatik artan kimlik olan veya birincil anahtarı olmayan veri tablolarında `Ekle veya Güncelle` ve `Tekrarı Yoksayarak Ekle` kuralları uygulanamaz.
-   `Ekle veya Güncelle` ve `Tekrarı Yoksayarak Ekle` kuralları, kaydın mevcut olup olmadığını birincil anahtar aracılığıyla belirler.

### Detaylı Tasarım

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Yapılandırma Arayüzü

Taşıma kurallarını yapılandırın

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Bağımsız kuralları etkinleştirin

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Bağımsız kuralları ve mevcut bağımsız kurallara göre işlenecek tabloları seçin

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Taşıma Dosyaları

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Yeni Taşıma Oluşturma

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Taşıma İşlemini Gerçekleştirme

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Uygulama ortam değişkeni kontrolü ([Ortam Değişkenleri](#) hakkında daha fazla bilgi edinin)

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Eğer eksik varsa, bir açılır pencere kullanıcıyı uyaracak ve burada eklenmesi gereken yeni ortam değişkenlerini doldurmasını isteyecek, ardından devam edecektir.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Taşıma Kayıtları

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Geri Alma

Herhangi bir taşıma işlemi başlamadan önce, mevcut uygulama otomatik olarak yedeklenir. Eğer taşıma başarısız olursa veya sonuçlar beklendiği gibi olmazsa, [Yedekleme Yöneticisi](../backup-manager/index.mdx) aracılığıyla geri alarak kurtarma yapabilirsiniz.

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)