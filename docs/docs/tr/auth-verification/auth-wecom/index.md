---
pkg: '@nocobase/plugin-auth-wecom'
---

:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Kimlik Doğrulama: WeCom

## Giriş

**WeCom** eklentisi, kullanıcıların WeCom hesaplarını kullanarak NocoBase'e giriş yapmasını sağlar.

## Eklentiyi Etkinleştirme

![](https://static-docs.nocobase.com/202406272056962.png)

## WeCom Özel Uygulaması Oluşturma ve Yapılandırma

WeCom yönetim konsoluna giderek özel bir uygulama oluşturun.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Uygulamaya tıklayarak detay sayfasına gidin, sayfayı aşağı kaydırın ve "WeCom Yetkili Girişi" seçeneğine tıklayın.

![](https://static-docs.nocobase.com/202406272104655.png)

Yetkili geri arama alanını NocoBase uygulama alan adınız olarak ayarlayın.

![](https://static-docs.nocobase.com/202406272105662.png)

Uygulama detay sayfasına geri dönün ve "Web Yetkilendirme ve JS-SDK" seçeneğine tıklayın.

![](https://static-docs.nocobase.com/202406272107063.png)

Uygulamanın OAuth2.0 web yetkilendirme özelliği için geri arama alan adını ayarlayın ve doğrulayın.

![](https://static-docs.nocobase.com/202406272107899.png)

Uygulama detay sayfasında "Kurumsal Güvenilir IP" seçeneğine tıklayın.

![](https://static-docs.nocobase.com/202406272108834.png)

NocoBase uygulama IP'sini yapılandırın.

![](https://static-docs.nocobase.com/202406272109805.png)

## WeCom Yönetim Konsolundan Kimlik Bilgilerini Alma

WeCom yönetim konsolunda, "Şirketim" altında, "Şirket Kimliği"ni kopyalayın.

![](https://static-docs.nocobase.com/202406272111637.png)

WeCom yönetim konsolunda, "Uygulama Yönetimi" altında, önceki adımda oluşturduğunuz uygulamanın detay sayfasına gidin ve AgentId ile Secret'ı kopyalayın.

![](https://static-docs.nocobase.com/202406272122322.png)

## NocoBase'e WeCom Kimlik Doğrulaması Ekleme

Kullanıcı kimlik doğrulama eklentisi yönetim sayfasına gidin.

![](https://static-docs.nocobase.com/202406272115044.png)

Ekle - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Yapılandırma

![](https://static-docs.nocobase.com/202412041459250.png)

| Seçenek                                                                                               | Açıklama                                                                                                                              | Sürüm Gereksinimi |
| :---------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :---------------- |
| Bir telefon numarası mevcut bir kullanıcıyla eşleşmediğinde, <br />yeni bir kullanıcı otomatik olarak oluşturulmalı mı? | Bir telefon numarası mevcut bir kullanıcıyla eşleşmediğinde yeni bir kullanıcı otomatik olarak oluşturulup oluşturulmayacağı. | -                 |
| Şirket Kimliği                                                                                        | WeCom yönetim konsolundan alınan Şirket Kimliği.                                                                                      | -                 |
| AgentId                                                                                               | WeCom yönetim konsolundaki özel uygulama yapılandırmasından alınır.                                                                   | -                 |
| Secret                                                                                                | WeCom yönetim konsolundaki özel uygulama yapılandırmasından alınır.                                                                   | -                 |
| Origin                                                                                                | Mevcut uygulama alan adı.                                                                                                             | -                 |
| Çalışma Alanı uygulama yönlendirme bağlantısı                                                         | Başarılı bir girişten sonra yönlendirilecek uygulama yolu.                                                                            | `v1.4.0`          |
| Otomatik giriş                                                                                        | Uygulama bağlantısı WeCom tarayıcısında açıldığında otomatik olarak giriş yapın. Birden fazla WeCom kimlik doğrulayıcısı yapılandırıldığında, bu seçenek yalnızca birinde etkinleştirilebilir. | `v1.4.0`          |
| Çalışma Alanı uygulama ana sayfa bağlantısı                                                           | Çalışma Alanı uygulama ana sayfa bağlantısı.                                                                                          | -                 |

## WeCom Uygulama Ana Sayfasını Yapılandırma

:::info
`v1.4.0` ve üzeri sürümlerde, "Otomatik giriş" seçeneği etkinleştirildiğinde, uygulama ana sayfa bağlantısı `https://<url>/<path>` şeklinde basitleştirilebilir; örneğin `https://example.nocobase.com/admin`.

Ayrıca, mobil ve masaüstü için ayrı bağlantılar yapılandırabilirsiniz; örneğin `https://example.nocobase.com/m` ve `https://example.nocobase.com/admin`.
:::

WeCom yönetici konsoluna gidin ve kopyaladığınız çalışma alanı uygulama ana sayfa bağlantısını ilgili uygulamanın ana sayfa adres alanına yapıştırın.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Giriş

Giriş sayfasını ziyaret edin ve giriş formunun altındaki düğmeye tıklayarak üçüncü taraf girişi başlatın.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
WeCom'un telefon numaraları gibi hassas bilgilere yönelik izin kısıtlamaları nedeniyle, yetkilendirme yalnızca WeCom istemcisi içinde tamamlanabilir. WeCom ile ilk kez giriş yaparken, lütfen ilk giriş yetkilendirmesini WeCom istemcisi içinde tamamlamak için aşağıdaki adımları izleyin.
:::

## İlk Kez Giriş Yapma

WeCom istemcisinden Çalışma Alanı'na gidin, en alta kaydırın ve daha önce yapılandırdığınız ana sayfaya girmek için uygulamaya tıklayın. Bu, ilk yetkilendirmeyi tamamlayacaktır. Daha sonra, NocoBase uygulamanızda WeCom kullanarak giriş yapabilirsiniz.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />