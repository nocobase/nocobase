:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Bakış

NocoBase sunucu tarafı eklenti geliştirme, geliştiricilerin NocoBase'in temel özelliklerini özelleştirmelerine ve genişletmelerine yardımcı olmak için çeşitli işlevler ve yetenekler sunar. NocoBase sunucu tarafı eklenti geliştirmenin ana yetenekleri ve ilgili bölümleri aşağıdadır:

| İşlev Modülü                      | Açıklama                                                                                                | İlgili Bölüm                                      |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------ |
| **Eklenti Sınıfı**                | Sunucu tarafı eklentileri oluşturun ve yönetin, temel işlevleri genişletin                               | [plugin.md](plugin.md)                            |
| **Veritabanı İşlemleri**          | Veritabanı işlemleri için arayüzler sunar, CRUD operasyonlarını ve işlem yönetimini destekler             | [database.md](database.md)                        |
| **Özel Koleksiyonlar**            | İş ihtiyaçlarınıza göre koleksiyon yapılarını özelleştirin, veri modellerini esnek bir şekilde yönetin   | [collections.md](collections.md)                  |
| **Eklenti Yükseltme Veri Uyumluluğu** | Eklenti yükseltmelerinin mevcut verileri etkilememesini sağlayın, veri geçişi ve uyumluluk işlemleri yapın | [migration.md](migration.md)                      |
| **Harici Veri Kaynağı Yönetimi**  | Harici veri kaynaklarını entegre edin ve yönetin, veri etkileşimini sağlayın                            | [data-source-manager.md](data-source-manager.md)  |
| **Özel API'ler**                  | API kaynak yönetimini genişletin, özel arayüzler (API'ler) yazın                                        | [resource-manager.md](resource-manager.md)        |
| **API İzin Yönetimi**             | API izinlerini özelleştirin, ayrıntılı izin kontrolü yapın                                              | [acl.md](acl.md)                                  |
| **İstek/Yanıt Engelleme ve Filtreleme** | İstek ve yanıt için engelleyiciler (interceptors) veya ara yazılımlar (middleware) ekleyin, günlükleme, kimlik doğrulama gibi işlemleri yönetin | [context.md](context.md) ve [middleware.md](middleware.md) |
| **Olay Dinleme**                  | Uygulama, veritabanı gibi sistem olaylarını dinleyin, olay işleyicilerini tetikleyin                     | [event.md](event.md)                              |
| **Önbellek Yönetimi**             | Uygulama performansını ve yanıt hızını artırmak için önbelleği yönetin                                  | [cache.md](cache.md)                              |
| **Zamanlanmış Görevler**          | Düzenli temizlik, veri senkronizasyonu gibi zamanlanmış görevleri oluşturun ve yönetin                   | [cron-job-manager.md](cron-job-manager.md)        |
| **Çoklu Dil Desteği**             | Uluslararasılaştırma ve yerelleştirmeyi uygulamak için çoklu dil desteğini entegre edin                 | [i18n.md](i18n.md)                                |
| **Günlük Çıktısı**                | Hata ayıklama ve izleme yeteneklerini geliştirmek için günlük (log) formatlarını ve çıktı yöntemlerini özelleştirin | [logger.md](logger.md)                            |
| **Özel Komutlar**                 | NocoBase CLI'ı genişletin, özel komutlar ekleyin                                                        | [command.md](command.md)                          |
| **Test Senaryoları Yazma**        | Eklenti kararlılığını ve işlevsel doğruluğunu sağlamak için test senaryoları yazın ve çalıştırın         | [test.md](test.md)                                |