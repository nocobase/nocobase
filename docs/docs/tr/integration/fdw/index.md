:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/integration/fdw/index) bakın.
:::

# Harici Veri Tablolarını Bağlama (FDW)

## Giriş

Veritabanının Foreign Data Wrapper (FDW) özelliğine dayalı olarak uzak veri tablolarına bağlanma işlevidir. Şu anda MySQL ve PostgreSQL veritabanlarını desteklemektedir.

:::info{title="Veri Kaynaklarını Bağlama vs. Harici Veri Tablolarını Bağlama"}
- **Veri kaynaklarını bağlama**, belirli bir veritabanı veya API servisi ile bağlantı kurmayı ifade eder; veritabanı özelliklerini veya API tarafından sunulan servisleri tam olarak kullanabilirsiniz.
- **Harici veri tablolarını bağlama**, verileri dışarıdan alıp yerel kullanım için eşlemeyi ifade eder. Veritabanı terminolojisinde FDW (Foreign Data Wrapper) olarak adlandırılan bu teknoloji, uzak tabloları yerel tablolar gibi kullanmaya odaklanır ve tabloları tek tek bağlar. Uzaktan erişim olduğu için kullanım sırasında çeşitli kısıtlamalar ve sınırlamalar olabilir.

Bu ikisi birlikte de kullanılabilir. İlki veri kaynağı ile bağlantı kurmak için, ikincisi ise veri kaynakları arası erişim için kullanılır. Örneğin, bir PostgreSQL veri kaynağına bağlandınız ve bu veri kaynağındaki bir tablo FDW tabanlı oluşturulmuş bir harici veri tablosudur.
:::

### MySQL

MySQL, etkinleştirilmesi gereken `federated` motorunu kullanır ve MariaDB gibi uzak MySQL ve protokol uyumlu veritabanlarına bağlanmayı destekler. Detaylı belgeler için [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html) sayfasına bakabilirsiniz.

### PostgreSQL

PostgreSQL'de, farklı uzak veri türlerini desteklemek için farklı `fdw` eklentileri kullanılabilir. Şu anda desteklenen eklentiler şunlardır:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): PostgreSQL içinde uzak bir PostgreSQL veritabanına bağlanın.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): PostgreSQL içinde uzak bir MySQL veritabanına bağlanın.
- Diğer fdw eklentileri için [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers) sayfasına bakabilirsiniz. NocoBase'e entegre etmek için kod tarafında ilgili uyum arayüzünü uygulamanız gerekir.

## Ön Koşullar

- NocoBase'in ana veritabanı MySQL ise, `federated` motorunu etkinleştirmeniz gerekir. Bakınız: [MySQL'de federated motoru nasıl etkinleştirilir](./enable-federated)

Ardından eklenti yöneticisi aracılığıyla eklentiyi kurun ve etkinleştirin.

![Eklentiyi kurun ve etkinleştirin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Kullanım Kılavuzu

"Koleksiyon yöneticisi > Koleksiyon oluştur" açılır menüsü altında "Harici veriye bağlan" seçeneğini seçin.

![Harici veriye bağlan](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

"Veritabanı Sunucusu" açılır menüsünden mevcut bir veritabanı servisini seçin veya "Veritabanı Sunucusu Oluştur" deyin.

![Veritabanı Servisi](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Veritabanı sunucusu oluşturun.

![Veritabanı sunucusu oluştur](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Veritabanı sunucusunu seçtikten sonra, "Uzak tablo" açılır menüsünden bağlamak istediğiniz veri tablosunu seçin.

![Bağlanacak veri tablosunu seçin](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Alan bilgilerini yapılandırın.

![Alan bilgilerini yapılandırın](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Uzak tabloda yapısal değişiklikler varsa, "Uzak tablodan senkronize et" işlemini de yapabilirsiniz.

![Uzak tablodan senkronize et](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Uzak tablo senkronizasyonu.

![Uzak tablo senkronizasyonu](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Son olarak, arayüzde görüntüleyin.

![Arayüzde görüntüle](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)