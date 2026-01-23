---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Yapılandırma Süreci

## Genel Bakış
E-posta eklentisini etkinleştirdikten sonra, kullanıcıların e-posta hesaplarını NocoBase'e bağlayabilmeleri için yöneticilerin öncelikle gerekli yapılandırmayı tamamlaması gerekir. (Şu anda yalnızca Outlook ve Gmail e-posta hesapları için yetkilendirilmiş oturum açma desteklenmektedir; Microsoft ve Google hesaplarıyla doğrudan oturum açma henüz mevcut değildir).

Yapılandırmanın temelini, e-posta hizmet sağlayıcısının API çağrıları için kimlik doğrulama ayarları oluşturur. Eklentinin düzgün çalışmasını sağlamak için yöneticilerin aşağıdaki adımları tamamlaması gerekmektedir:

1.  **Hizmet Sağlayıcıdan Kimlik Doğrulama Bilgilerini Edinin**
    -   E-posta hizmet sağlayıcınızın geliştirici konsoluna (örneğin, Google Cloud Console veya Microsoft Azure Portal) giriş yapın.
    -   Yeni bir uygulama veya proje oluşturun ve Gmail veya Outlook e-posta API hizmetini etkinleştirin.
    -   İlgili İstemci Kimliği (Client ID) ve İstemci Gizli Anahtarını (Client Secret) edinin.
    -   Yönlendirme URI'sini, NocoBase eklentisinin geri arama adresiyle eşleşecek şekilde yapılandırın.

2.  **E-posta Hizmet Sağlayıcı Yapılandırması**
    -   E-posta eklentisinin yapılandırma sayfasına gidin.
    -   E-posta hizmet sağlayıcısıyla doğru yetkilendirme entegrasyonunu sağlamak için İstemci Kimliği (Client ID) ve İstemci Gizli Anahtarı (Client Secret) dahil olmak üzere gerekli API kimlik doğrulama bilgilerini sağlayın.

3.  **Yetkilendirme ile Oturum Açma**
    -   Kullanıcılar, OAuth protokolü aracılığıyla e-posta hesaplarına giriş yapar.
    -   Eklenti, kullanıcının yetkilendirme belirtecini (token) sonraki API çağrıları ve e-posta işlemleri için otomatik olarak oluşturur ve saklar.

4.  **E-posta Hesaplarını Bağlama**
    -   Başarılı yetkilendirmenin ardından, kullanıcının e-posta hesabı NocoBase'e bağlanacaktır.
    -   Eklenti, kullanıcının e-posta verilerini senkronize edecek ve e-postaları yönetme, gönderme ve alma özelliklerini sağlayacaktır.

5.  **E-posta Özelliklerini Kullanma**
    -   Kullanıcılar, platform içinde doğrudan e-postaları görüntüleyebilir, yönetebilir ve gönderebilir.
    -   Tüm işlemler, gerçek zamanlı senkronizasyon ve verimli aktarım sağlamak için e-posta hizmet sağlayıcısının API çağrıları aracılığıyla tamamlanır.

Yukarıda açıklanan süreç sayesinde, NocoBase'in E-posta eklentisi kullanıcılara verimli ve güvenli e-posta yönetim hizmetleri sunar. Yapılandırma sırasında herhangi bir sorunla karşılaşırsanız, lütfen ilgili belgelere başvurun veya yardım için teknik destek ekibiyle iletişime geçin.

## Eklenti Yapılandırması

### E-posta Eklentisini Etkinleştirme

1.  Eklenti yönetim sayfasına gidin
2.  "Email manager" eklentisini bulun ve etkinleştirin

### E-posta Hizmet Sağlayıcı Yapılandırması

E-posta eklentisini etkinleştirdikten sonra e-posta hizmet sağlayıcılarını yapılandırabilirsiniz. Şu anda Google ve Microsoft e-posta hizmetleri desteklenmektedir. Ayarlar sayfasına gitmek için üst çubukta "Ayarlar" -> "E-posta Ayarları" üzerine tıklayın.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Her bir hizmet sağlayıcı için İstemci Kimliği (Client ID) ve İstemci Gizli Anahtarı (Client Secret) doldurmanız gerekmektedir. Aşağıdaki bölümlerde bu iki parametreyi nasıl edineceğiniz ayrıntılı olarak açıklanacaktır.