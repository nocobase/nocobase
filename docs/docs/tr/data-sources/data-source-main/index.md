---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Ana Veritabanı

## Giriş

NocoBase'in ana veritabanı, hem iş verilerini hem de uygulamanın meta verilerini (sistem tablo verileri ve özel tablo verileri dahil) depolamak için kullanılabilir. Ana veritabanı, MySQL ve PostgreSQL gibi ilişkisel veritabanlarını destekler. NocoBase uygulamasını kurarken, ana veritabanı da eş zamanlı olarak kurulmalı ve silinemez.

## Kurulum

Bu, yerleşik bir eklentidir, ayrı bir kuruluma gerek yoktur.

## Koleksiyon Yönetimi

Ana veri kaynağı, eksiksiz koleksiyon yönetimi işlevselliği sunar; NocoBase üzerinden yeni koleksiyonlar oluşturabilir veya veritabanındaki mevcut koleksiyon yapılarını senkronize edebilirsiniz.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Veritabanındaki Mevcut Koleksiyonları Senkronize Etme

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Ana veri kaynağının önemli bir özelliği, veritabanında zaten mevcut olan koleksiyonları NocoBase'e senkronize ederek yönetebilmesidir. Bu şu anlama gelir:

-   **Mevcut Yatırımı Koruma**: Veritabanınızda zaten çok sayıda iş koleksiyonu varsa, bunları yeniden oluşturmanıza gerek kalmaz; doğrudan senkronize edip kullanabilirsiniz.
-   **Esnek Entegrasyon**: SQL betikleri veya veritabanı yönetim araçları gibi farklı araçlarla oluşturulan koleksiyonlar, NocoBase yönetimine dahil edilebilir.
-   **Aşamalı Geçiş**: Mevcut sistemleri tek seferlik bir yeniden yapılandırma yerine, NocoBase'e aşamalı olarak taşıma desteği sunar.

“Veritabanından Yükle” özelliği aracılığıyla şunları yapabilirsiniz:
1.  Veritabanındaki tüm koleksiyonlara göz atın.
2.  Senkronize etmeniz gereken koleksiyonları seçin.
3.  Koleksiyon yapılarını ve alan tiplerini otomatik olarak tanımlar.
4.  Tek tıklamayla NocoBase'e aktararak yönetin.

### Birden Fazla Koleksiyon Tipini Destekleme

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase, çeşitli koleksiyon tiplerini oluşturmayı ve yönetmeyi destekler:
-   **Genel koleksiyon**: Sık kullanılan sistem alanlarını içerir;
-   **Miras koleksiyonu**: Bir üst koleksiyon oluşturmanıza olanak tanır ve bu üst koleksiyondan alt koleksiyonlar türetilebilir. Alt koleksiyonlar üst koleksiyonun yapısını miras alır ve kendi sütunlarını da tanımlayabilir.
-   **Ağaç koleksiyonu**: Ağaç yapılı bir koleksiyondur ve şu anda yalnızca komşuluk listesi tasarımını destekler;
-   **Takvim koleksiyonu**: Takvimle ilgili olay koleksiyonları oluşturmak için kullanılır;
-   **Dosya koleksiyonu**: Dosya depolama yönetimini sağlar;
-   **İfade koleksiyonu**: İş akışlarındaki dinamik ifade senaryoları için kullanılır;
-   **SQL koleksiyonu**: Gerçek bir veritabanı koleksiyonu değildir, ancak SQL sorgularını hızlı ve yapılandırılmış bir şekilde sunar;
-   **Veritabanı Görünüm koleksiyonu**: Mevcut veritabanı görünümlerine bağlanır;
-   **Harici koleksiyon**: Veritabanı sisteminin harici veri kaynaklarındaki verilere doğrudan erişmesini ve sorgulamasını sağlayan, FDW teknolojisine dayalı bir koleksiyondur;

### Koleksiyonların Sınıflandırma Yönetimini Destekleme

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Zengin Alan Tipleri Sunar

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Esnek Alan Tipi Dönüşümü

NocoBase, aynı veritabanı tipi temelinde esnek alan tipi dönüşümünü destekler.

**Örnek: String Tipi Alan Dönüşüm Seçenekleri**

Veritabanındaki bir alan String tipinde olduğunda, NocoBase'te aşağıdaki formlardan herhangi birine dönüştürülebilir:

-   **Temel**: Tek satır metin, Uzun metin, Telefon, E-posta, URL, Şifre, Renk, İkon
-   **Seçim**: Açılır menü (tek seçim), Radyo grubu
-   **Medya**: Markdown, Markdown (Vditor), Zengin Metin, Ek (URL)
-   **Tarih ve Saat**: Tarih saat (saat dilimi ile), Tarih saat (saat dilimi olmadan)
-   **Gelişmiş**: Otomatik sıralama, Koleksiyon seçici, Şifreleme

Bu esnek dönüşüm mekanizması şunları ifade eder:
-   **Veritabanı Yapısını Değiştirmeye Gerek Yok**: Alanın temel depolama tipi değişmeden kalır; yalnızca NocoBase'deki gösterim şekli değişir.
-   **İş Değişikliklerine Uyum**: İş ihtiyaçları değiştikçe, alanın görüntülenme ve etkileşim şeklini hızla ayarlayabilirsiniz.
-   **Veri Güvenliği**: Dönüşüm süreci, mevcut verilerin bütünlüğünü etkilemez.

### Alan Düzeyinde Esnek Senkronizasyon

NocoBase, yalnızca tüm koleksiyonları senkronize etmekle kalmaz, aynı zamanda alan düzeyinde ayrıntılı senkronizasyon yönetimini de destekler:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Alan Senkronizasyonunun Özellikleri:

1.  **Gerçek Zamanlı Senkronizasyon**: Veritabanı koleksiyon yapısı değiştiğinde, yeni eklenen alanlar istediğiniz zaman senkronize edilebilir.
2.  **Seçici Senkronizasyon**: Tüm alanları değil, ihtiyaç duyduğunuz alanları seçerek senkronize edebilirsiniz.
3.  **Otomatik Tip Tanıma**: Veritabanı alan tiplerini otomatik olarak tanır ve NocoBase alan tipleriyle eşleştirir.
4.  **Veri Bütünlüğünü Koruma**: Senkronizasyon süreci, mevcut verileri etkilemez.

#### Kullanım Senaryoları:

-   **Veritabanı Şeması Gelişimi**: İş ihtiyaçları değiştiğinde ve veritabanına yeni alanlar eklenmesi gerektiğinde, bunlar NocoBase'e hızla senkronize edilebilir.
-   **Ekip İşbirliği**: Diğer ekip üyeleri veya DBA'ler veritabanına alan eklediğinde, bunlar zamanında senkronize edilebilir.
-   **Hibrit Yönetim Modu**: Bazı alanlar NocoBase aracılığıyla, bazıları ise geleneksel yöntemlerle yönetilebilir; bu da esnek kombinasyonlar sunar.

Bu esnek senkronizasyon mekanizması, NocoBase'in mevcut teknik mimarilere iyi bir şekilde entegre olmasını sağlar. Mevcut veritabanı yönetim uygulamalarını değiştirmeye gerek kalmadan, NocoBase'in sunduğu düşük kodlu geliştirme kolaylıklarından faydalanabilirsiniz.

Daha fazla bilgi için "[Koleksiyon Alanları / Genel Bakış](/data-sources/data-modeling/collection-fields)" bölümüne bakın.