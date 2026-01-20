---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Kimlik Doğrulama: DingTalk

## Giriş

Kimlik Doğrulama: DingTalk eklentisi, kullanıcıların DingTalk hesaplarını kullanarak NocoBase'e giriş yapmalarını sağlar.

## Eklentiyi Etkinleştirme

![](https://static-docs.nocobase.com/202406120929356.png)

## DingTalk Geliştirici Konsolu'nda API İzinleri İçin Başvuru

<a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalk Açık Platformu - Üçüncü Taraf Web Sitelerine Giriş Uygulama</a> belgesine bakarak bir uygulama oluşturun.

Uygulama yönetim konsoluna gidin ve "Kişisel Telefon Numarası Bilgileri" ile "Adres Defteri Kişisel Bilgileri Okuma İzni"ni etkinleştirin.

![](https://static-docs.nocobase.com/202406120006620.png)

## DingTalk Geliştirici Konsolu'ndan Anahtarları Alın

Client ID ve Client Secret'ı kopyalayın.

![](https://static-docs.nocobase.com/202406120000595.png)

## NocoBase'e DingTalk Kimlik Doğrulaması Ekleme

Kullanıcı kimlik doğrulama eklentisi yönetim sayfasına gidin.

![](https://static-docs.nocobase.com/202406112348051.png)

Ekle - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Yapılandırma

![](https://static-docs.nocobase.com/202406120016896.png)

- Kullanıcı mevcut değilse otomatik kaydol - Telefon numarasıyla eşleşen mevcut bir kullanıcı bulunamadığında yeni bir kullanıcı otomatik olarak oluşturulsun mu?
- Client ID ve Client Secret - Önceki adımda kopyaladığınız bilgileri buraya girin.
- Redirect URL - Geri Çağırma URL'si, kopyalayın ve bir sonraki adıma geçin.

## DingTalk Geliştirici Konsolu'nda Geri Çağırma URL'sini Yapılandırma

Kopyaladığınız geri çağırma URL'sini DingTalk Geliştirici Konsolu'na yapıştırın.

![](https://static-docs.nocobase.com/202406120012221.png)

## Giriş

Giriş sayfasını ziyaret edin ve üçüncü taraf girişi başlatmak için giriş formunun altındaki düğmeye tıklayın.

![](https://static-docs.nocobase.com/202406120014539.png)