---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# SQL Koleksiyonu

## Giriş

SQL koleksiyonu, SQL sorguları kullanarak veri almanın güçlü bir yolunu sunar. SQL sorguları aracılığıyla veri alanlarını çıkarıp ilgili alan meta verilerini yapılandırdıktan sonra, kullanıcılar bu alanları standart bir tabloyla çalışıyormuş gibi kullanabilirler. Bu özellik, özellikle karmaşık birleştirme sorguları, istatistiksel analiz ve benzeri senaryolar için oldukça faydalıdır.

## Kullanım Kılavuzu

### Yeni Bir SQL Koleksiyonu Oluşturma

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Sağlanan SQL giriş kutusuna SQL sorgunuzu girin ve Yürüt (Execute) düğmesine tıklayın. Sistem, sorguyu analiz ederek hangi tabloların ve alanların kullanıldığını belirleyecek ve kaynak tablolardan ilgili alan meta verilerini otomatik olarak çıkaracaktır.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. Sistemin kaynak tabloları ve alanları otomatik olarak analiz etmesi yanlışsa, doğru meta verilerin kullanılmasını sağlamak için ilgili tabloları ve alanları manuel olarak seçebilirsiniz. Önce kaynak tabloyu seçerek başlayın, ardından aşağıdaki alan kaynağı bölümünde ilgili alanları seçin.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. Doğrudan bir kaynağı olmayan alanlar için sistem, veri türüne göre alan türünü çıkaracaktır. Bu çıkarım yanlışsa, doğru alan türünü manuel olarak seçebilirsiniz.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. Her alanı yapılandırırken, ayarlarınızın anlık etkisini görmenizi sağlayan önizleme alanında görüntüsünü önizleyebilirsiniz.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. Yapılandırmayı tamamlayıp her şeyin doğru olduğunu onayladıktan sonra, gönderimi sonlandırmak için SQL giriş kutusunun altındaki Onayla (Confirm) düğmesine tıklayın.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Düzenleme

1. SQL sorgusunu değiştirmeniz gerekirse, SQL ifadesini doğrudan düzenlemek ve alanları gerektiği gibi yeniden yapılandırmak için Düzenle (Edit) düğmesine tıklayın.

2. Alan meta verilerini ayarlamak için, alan ayarlarını normal bir tablo için yaptığınız gibi güncellemenizi sağlayan Alanları Yapılandır (Configure Fields) seçeneğini kullanın.

### Senkronizasyon

SQL sorgusu değişmeden kalır ancak temel veritabanı tablo yapısı değiştirilirse, Alanları Yapılandır (Configure Fields) - Veritabanından Senkronize Et (Sync from Database) seçeneğini belirleyerek alanları senkronize edebilir ve yeniden yapılandırabilirsiniz.

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### SQL Koleksiyonu ve Bağlantılı Veritabanı Görünümleri Karşılaştırması

| Şablon Türü | En Uygun Olduğu Durumlar | Uygulama Yöntemi | CRUD İşlemleri Desteği |
| :--- | :--- | :--- | :--- |
| SQL | Basit modeller, hafif kullanım senaryoları<br />Veritabanı ile sınırlı etkileşim<br />Görünümlerin bakımından kaçınma<br />Kullanıcı arayüzü odaklı işlemleri tercih etme | SQL alt sorgusu | Desteklenmiyor |
| Veritabanı görünümüne bağlan | Karmaşık modeller<br />Veritabanı etkileşimi gerektiren durumlar<br />Veri değişikliği ihtiyacı<br />Daha güçlü ve kararlı veritabanı desteği gerektiren durumlar | Veritabanı görünümü | Kısmen Destekleniyor |

:::warning
SQL koleksiyonunu kullanırken, NocoBase içinde yönetilebilir tabloları seçtiğinizden emin olun. Aynı veritabanında NocoBase'e bağlı olmayan tabloları kullanmak, SQL sorgusu ayrıştırmasının yanlış olmasına yol açabilir. Bu bir endişe kaynağıysa, bir görünüm oluşturmayı ve ona bağlanmayı düşünebilirsiniz.
:::