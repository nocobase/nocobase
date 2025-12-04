---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Google Yapılandırması

### Ön Koşullar

Kullanıcıların Google Mail hesaplarını NocoBase'e bağlayabilmeleri için, NocoBase'in Google hizmetlerine erişimi olan bir sunucuya dağıtılması gerekmektedir. Arka uç, Google API'sini çağıracaktır.
    
### Hesap Kaydı

1.  Google Cloud'a gitmek için https://console.cloud.google.com/welcome adresini açın.
2.  İlk girişinizde ilgili hüküm ve koşulları kabul etmeniz gerekecektir.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Uygulama Oluşturma

1.  Üst kısımdaki "Select a project" (Bir proje seçin) düğmesine tıklayın.
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2.  Açılır penceredeki "NEW PROJECT" (YENİ PROJE) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3.  Proje bilgilerini doldurun.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4.  Proje oluşturulduktan sonra, projeyi seçin.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Gmail API'sini Etkinleştirme

1.  "APIs & Services" (API'ler ve Hizmetler) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2.  API'ler ve Hizmetler kontrol paneline gidin.

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3.  "mail" kelimesini aratın.

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4.  Gmail API'sini etkinleştirmek için "ENABLE" (ETKİNLEŞTİR) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### OAuth Onay Ekranını Yapılandırma

1.  Sol taraftaki "OAuth consent screen" (OAuth onay ekranı) menüsüne tıklayın.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2.  "External" (Harici) seçeneğini belirleyin.

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3.  Proje bilgilerini (bu bilgiler yetkilendirme sayfasında gösterilecektir) doldurun ve kaydedin.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4.  Geliştirici iletişim bilgilerini doldurun ve devam edin.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5.  Devam edin.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6.  Uygulama yayınlanmadan önce test etmek için test kullanıcıları ekleyin.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7.  Devam edin.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8.  Özet bilgileri gözden geçirin ve kontrol paneline geri dönün.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Kimlik Bilgileri Oluşturma

1.  Sol taraftaki "Credentials" (Kimlik Bilgileri) menüsüne tıklayın.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2.  "CREATE CREDENTIALS" (KİMLİK BİLGİLERİ OLUŞTUR) düğmesine tıklayın ve "OAuth client ID" (OAuth istemci kimliği) seçeneğini belirleyin.

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3.  "Web application" (Web uygulaması) seçeneğini belirleyin.

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4.  Uygulama bilgilerini doldurun.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5.  Projenin nihai dağıtım alan adını girin (buradaki örnek bir NocoBase test adresidir).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6.  Yetkilendirilmiş yönlendirme URI'sini ekleyin. Bu, `alan adı + "/admin/settings/mail/oauth2"` şeklinde olmalıdır. Örnek: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7.  Oluştur düğmesine tıklayarak OAuth bilgilerini görüntüleyebilirsiniz.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8.  Client ID (İstemci Kimliği) ve Client secret (İstemci Gizli Anahtarı) bilgilerini kopyalayın ve e-posta yapılandırma sayfasına yapıştırın.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9.  Kaydet düğmesine tıklayarak yapılandırmayı tamamlayın.

### Uygulamayı Yayınlama

Yukarıdaki işlemler tamamlandıktan ve test kullanıcı yetkilendirme girişi, e-posta gönderme gibi özellikler test edildikten sonra uygulamayı yayınlayabilirsiniz.

1.  "OAuth consent screen" (OAuth onay ekranı) menüsüne tıklayın.

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2.  "EDIT APP" (UYGULAMAYI DÜZENLE) düğmesine tıklayın, ardından alt kısımdaki "SAVE AND CONTINUE" (KAYDET VE DEVAM ET) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3.  Kullanıcı izin kapsamlarını seçmek için "ADD OR REMOVE SCOPES" (KAPSAMLARI EKLE VEYA KALDIR) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4.  "Gmail API" kelimesini aratın, ardından "Gmail API" seçeneğini işaretleyin (Kapsam değerinin "https://mail.google.com/" olan Gmail API olduğundan emin olun).

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5.  Kaydetmek için alt kısımdaki "UPDATE" (GÜNCELLE) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6.  Her sayfanın altındaki "SAVE AND CONTINUE" (KAYDET VE DEVAM ET) düğmesine tıklayın ve son olarak kontrol paneli sayfasına dönmek için "BACK TO DASHBOARD" (KONTROL PANELİNE DÖN) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7.  "PUBLISH APP" (UYGULAMAYI YAYINLA) düğmesine tıkladıktan sonra, yayınlama için gerekli bilgileri listeleyen bir onay sayfası görünecektir. Ardından "CONFIRM" (ONAYLA) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8.  Konsol sayfasına geri döndüğünüzde, yayınlama durumunun "In production" (Üretimde) olduğunu göreceksiniz.

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9.  "PREPARE FOR VERIFICATION" (DOĞRULAMA İÇİN HAZIRLA) düğmesine tıklayın, gerekli bilgileri doldurun ve "SAVE AND CONTINUE" (KAYDET VE DEVAM ET) düğmesine tıklayın (resimdeki veriler yalnızca örnek amaçlıdır).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Gerekli bilgileri doldurmaya devam edin (resimdeki veriler yalnızca örnek amaçlıdır).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. "SAVE AND CONTINUE" (KAYDET VE DEVAM ET) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Doğrulama için göndermek üzere "SUBMIT FOR VERIFICATION" (DOĞRULAMA İÇİN GÖNDER) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Onay sonucunu bekleyin.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Onay henüz beklemedeyken, kullanıcılar yetkilendirme ve giriş yapmak için güvenli olmayan bağlantıya tıklayabilirler.

![](https://static-docs.nocobase.com/mail-1735633689645.png)