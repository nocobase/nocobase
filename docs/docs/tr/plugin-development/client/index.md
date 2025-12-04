:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Bakış

NocoBase istemci tarafı eklenti geliştirme, geliştiricilerin NocoBase'in ön uç özelliklerini özelleştirmelerine ve genişletmelerine yardımcı olmak için çeşitli işlevler ve yetenekler sunar. NocoBase istemci tarafı eklenti geliştirmenin temel yetenekleri ve ilgili bölümleri aşağıda listelenmiştir:

| Modül                  | Açıklama                                           | İlgili Bölüm                                      |
|---------------------------|----------------------------------------------------|---------------------------------------------------|
| **Eklenti Sınıfı**        | İstemci tarafı eklentileri oluşturun ve yönetin, ön uç işlevselliğini genişletin | [plugin.md](plugin.md)                       |
| **Yönlendirme Yönetimi**  | Ön uç yönlendirmeyi özelleştirin, sayfa navigasyonu ve yönlendirmeleri uygulayın | [router.md](router.md)                       |
| **Kaynak İşlemleri**      | Ön uç kaynaklarını yönetin, veri alımını ve işlemlerini ele alın | [resource.md](resource.md)                   |
| **İstek İşleme**          | HTTP isteklerini özelleştirin, API çağrılarını ve veri aktarımını yönetin | [request.md](request.md)                     |
| **Bağlam Yönetimi**       | Uygulama bağlamını alın ve kullanın, genel duruma ve hizmetlere erişin | [context.md](context.md)                   |
| **Erişim Kontrolü (ACL)** | Ön uç erişim kontrolünü uygulayın, sayfa ve özellik erişim izinlerini yönetin | [acl.md](acl.md)                             |
| **Veri Kaynağı Yönetimi** | Birden çok veri kaynağını yönetin ve kullanın, veri kaynağı geçişini ve erişimini uygulayın | [data-source-manager.md](data-source-manager.md) |
| **Stiller ve Temalar**    | Stilleri ve temaları özelleştirin, kullanıcı arayüzü özelleştirmesi ve güzelleştirmesi uygulayın | [styles-themes.md](styles-themes.md)          |
| **Çoklu Dil Desteği**     | Çoklu dil desteğini entegre edin, uluslararasılaştırma ve yerelleştirmeyi uygulayın | [i18n.md](i18n.md)                            |
| **Log Çıktısı**           | Log formatlarını ve çıktı yöntemlerini özelleştirin, hata ayıklama ve izleme yeteneklerini geliştirin | [logger.md](logger.md)                        |
| **Test Senaryoları Yazma**| Eklenti kararlılığını ve işlevsel doğruluğunu sağlamak için test senaryoları yazın ve çalıştırın | [test.md](test.md)                            |

**Kullanıcı Arayüzü (UI) Uzantıları**

| Modül                  | Açıklama                                                                                   | İlgili Bölüm                                      |
|---------------------------|--------------------------------------------------------------------------------------------|---------------------------------------------------|
| **UI Yapılandırması**     | Akış Motoru ve akış modellerini kullanarak bileşen özelliklerinin dinamik yapılandırmasını ve düzenlemesini uygulayın, karmaşık sayfaların ve etkileşimlerin görsel özelleştirmesini destekleyin | [flow-engine](../../flow-engine/index.md) ve [flow-model](../../flow-engine/flow-model.md) |
| **Blok Uzantıları**      | Sayfa bloklarını özelleştirin, yeniden kullanılabilir UI modülleri ve düzenleri oluşturun | [blocks](../../ui-development-block/index.md) |
| **Alan Uzantıları**      | Alan türlerini özelleştirin, karmaşık verilerin görüntülenmesini ve düzenlenmesini uygulayın | [fields](../../ui-development-field/index.md) |
| **İşlem Uzantıları**     | İşlem türlerini özelleştirin, karmaşık mantık ve etkileşim yönetimini uygulayın | [actions](../../ui-development-action/index.md) |