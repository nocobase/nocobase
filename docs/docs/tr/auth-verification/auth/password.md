---
pkg: '@nocobase/plugin-auth'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Parola Kimlik Doğrulaması

## Yapılandırma Arayüzü

![](https://static-docs.nocobase.com/202411131505095.png)

## Kaydolmaya İzin Verilsin mi?

Kaydolmaya izin verildiğinde, giriş sayfasında hesap oluşturma bağlantısı görünür ve bu bağlantıdan kayıt sayfasına gidebilirsiniz.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Kayıt sayfası

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Kaydolmaya izin verilmediğinde, giriş sayfasında hesap oluşturma bağlantısı görünmez.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Kaydolmaya izin verilmediğinde, kayıt sayfasına erişilemez.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Kayıt Formu Ayarları<Badge>v1.4.0-beta.7+</Badge>

Kullanıcı **koleksiyonundaki** hangi alanların kayıt formunda gösterileceğini ve zorunlu olup olmayacağını ayarlayabilirsiniz. En az bir kullanıcı adı veya e-posta alanı gösterilecek ve zorunlu olarak ayarlanmalıdır.

![](https://static-docs.nocobase.com/202411262133669.png)

Kayıt sayfası

![](https://static-docs.nocobase.com/202411262135801.png)

## Parolamı Unuttum<Badge>v1.8.0+</Badge>

Parolamı unuttum özelliği, kullanıcıların parolalarını unutmaları durumunda e-posta doğrulaması yoluyla parolalarını sıfırlamalarına olanak tanır.

### Yönetici Yapılandırması

1.  **Parolamı Unuttum Özelliğini Etkinleştirin**

    `Ayarlar` > `Kullanıcı Kimlik Doğrulaması` > `Parolamı Unuttum` sekmesinde, `Parolamı Unuttum Özelliğini Etkinleştir` onay kutusunu işaretleyin.

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Bildirim Kanalını Yapılandırın**

    Bir e-posta bildirim kanalı seçin (şu anda yalnızca e-posta desteklenmektedir). Kullanılabilir bir bildirim kanalı yoksa, önce bir tane eklemeniz gerekir.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Parola Sıfırlama E-postasını Yapılandırın**

    E-posta konusunu ve içeriğini özelleştirebilirsiniz; HTML veya düz metin formatı desteklenmektedir. Aşağıdaki değişkenleri kullanabilirsiniz:
    - Mevcut kullanıcı
    - Sistem ayarları
    - Parola sıfırlama bağlantısı
    - Sıfırlama bağlantısı geçerlilik süresi (dakika)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Sıfırlama Bağlantısı Geçerlilik Süresini Ayarlayın**

    Sıfırlama bağlantısının geçerlilik süresini (dakika olarak) ayarlayın; varsayılan değer 120 dakikadır.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Kullanıcı İş Akışı

1.  **Parola Sıfırlama İsteği Başlatın**

    Giriş sayfasındaki `Parolamı Unuttum` bağlantısına tıklayarak (yöneticinin parolamı unuttum özelliğini önceden etkinleştirmesi gerekir) parolamı unuttum sayfasına gidin.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Kayıtlı e-posta adresinizi girin ve `Sıfırlama E-postası Gönder` düğmesine tıklayın.

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Parolayı Sıfırlayın**

    Kullanıcı, sıfırlama bağlantısı içeren bir e-posta alacaktır. Bağlantıya tıkladıktan sonra açılan sayfada yeni parolanızı belirleyin.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Ayarlama tamamlandıktan sonra, kullanıcı yeni parolasıyla sisteme giriş yapabilir.

### Notlar

- Sıfırlama bağlantısının bir zaman sınırı vardır; varsayılan olarak oluşturulduktan sonra 120 dakika boyunca geçerlidir (yönetici tarafından yapılandırılabilir).
- Bağlantı yalnızca bir kez kullanılabilir ve kullanıldıktan hemen sonra geçersiz hale gelir.
- Kullanıcı sıfırlama e-postasını almazsa, lütfen e-posta adresinin doğru olup olmadığını kontrol edin veya istenmeyen e-posta (spam) klasörünüze bakın.
- Yönetici, sıfırlama e-postasının başarıyla gönderilebilmesi için e-posta sunucusu yapılandırmasının doğru olduğundan emin olmalıdır.