---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Harici Veri Tablolarını Bağlama (FDW)

## Giriş

Bu eklenti, veritabanının foreign data wrapper özelliğini kullanarak uzak veri tablolarına bağlanmanızı sağlar. Şu anda MySQL ve PostgreSQL veritabanlarını desteklemektedir.

:::info{title="Veri Kaynaklarını Bağlama ile Harici Veri Tablolarını Bağlama Karşılaştırması"}
- **veri kaynağı** bağlama, belirli bir veritabanı veya API hizmetiyle bağlantı kurmayı ifade eder. Bu sayede veritabanının tüm özelliklerini veya API'nin sunduğu hizmetleri eksiksiz bir şekilde kullanabilirsiniz;
- **harici veri tablolarını bağlama** ise dışarıdan veri alıp yerel olarak kullanmak üzere eşlemeyi ifade eder. Veritabanı terminolojisinde FDW (Foreign Data Wrapper) olarak adlandırılan bu teknoloji, uzak tabloları yerel tablolar gibi kullanmaya odaklanır ve tabloları tek tek bağlamanıza olanak tanır. Uzak erişim olduğu için kullanım sırasında çeşitli kısıtlamalar ve sınırlamalarla karşılaşabilirsiniz.

Bu iki yöntem birlikte de kullanılabilir. Birincisi veri kaynağı ile bağlantı kurmak için, ikincisi ise veri kaynakları arası erişim için kullanılır. Örneğin, bir PostgreSQL veri kaynağına bağlandığınızda, bu veri kaynağında FDW tabanlı oluşturulmuş bir harici veri tablosu bulunabilir.
:::

### MySQL

MySQL, `federated` motorunu kullanır ve bu motorun etkinleştirilmesi gerekir. Uzak MySQL ve MariaDB gibi protokol uyumlu veritabanlarına bağlanmayı destekler. Daha fazla bilgi için [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html) belgelerine başvurabilirsiniz.

### PostgreSQL

PostgreSQL'de, farklı uzak veri türlerini desteklemek için çeşitli `fdw` eklentileri kullanılabilir. Şu anda desteklenen eklentiler şunlardır:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): PostgreSQL içinde uzak bir PostgreSQL veritabanına bağlanır.
- [mysql_fdw (geliştirme aşamasında)](https://github.com/EnterpriseDB/mysql_fdw): PostgreSQL içinde uzak bir MySQL veritabanına bağlanır.
- Diğer fdw eklenti türleri için [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers) sayfasına başvurabilirsiniz. NocoBase'e entegrasyon için kodda ilgili adaptasyon arayüzünü uygulamanız gerekir.

## Kurulum

Ön Koşullar

- NocoBase'in ana veritabanı MySQL ise, `federated` motorunu etkinleştirmeniz gerekir. [MySQL'de federated motoru nasıl etkinleştirilir?](./enable-federated.md) belgesine bakınız.

Ardından, eklenti yöneticisi aracılığıyla eklentiyi kurun ve etkinleştirin.

![Eklentiyi kurun ve etkinleştirin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Kullanım Kılavuzu

"**koleksiyon** yönetimi > **koleksiyon** oluştur" açılır menüsünden "Harici veri bağla" seçeneğini seçin.

![Harici Veri Bağla](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

"Veritabanı Hizmeti" açılır menüsünden mevcut bir veritabanı hizmetini seçin veya "Veritabanı Hizmeti Oluştur" seçeneğini kullanın.

![Veritabanı Hizmeti](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Veritabanı hizmeti oluşturun.

![Veritabanı Hizmeti Oluştur](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Veritabanı hizmetini seçtikten sonra, "Uzak tablo" açılır menüsünden bağlanmak istediğiniz veri tablosunu seçin.

![Bağlanmak istediğiniz veri tablosunu seçin](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Alan bilgilerini yapılandırın.

![Alan bilgilerini yapılandırın](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Uzak tabloda yapısal değişiklikler varsa, "Uzak tablodan senkronize et" seçeneğini de kullanabilirsiniz.

![Uzak Tablodan Senkronize Et](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Uzak tablo senkronizasyonu.

![Uzak tablo senkronizasyonu](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Son olarak, arayüzde görüntüleyin.

![Arayüzde görüntüle](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)