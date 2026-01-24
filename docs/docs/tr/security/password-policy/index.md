---
pkg: '@nocobase/plugin-password-policy'
---

:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Parola Politikası

## Giriş

Tüm kullanıcılar için parola kurallarını, parola geçerlilik süresini ve parola oturum açma güvenlik politikalarını belirleyebilir, kilitli kullanıcıları yönetebilirsiniz.

## Parola Kuralları

![](https://static-docs.nocobase.com/202412281329313.png)

### Minimum Parola Uzunluğu

Parolalar için minimum uzunluk gereksinimini belirleyin. Maksimum uzunluk 64'tür.

### Parola Karmaşıklığı Gereksinimleri

Aşağıdaki seçenekler desteklenmektedir:

- Harf ve rakam içermelidir
- Harf, rakam ve sembol içermelidir
- Rakam, büyük ve küçük harf içermelidir
- Rakam, büyük ve küçük harf ve sembol içermelidir
- Aşağıdaki karakter türlerinden en az 3'ünü içermelidir: rakamlar, büyük harfler, küçük harfler ve özel karakterler.
- Kısıtlama yok

![](https://static-docs.nocobase.com/202412281331649.png)

### Parola Kullanıcı Adını İçeremez

Parolanın mevcut kullanıcının kullanıcı adını içerip içeremeyeceğini belirleyin.

### Parola Geçmişi Sayısı

Kullanıcının son kullandığı parola sayısını hatırlar. Kullanıcılar parola değiştirirken bu parolaları tekrar kullanamaz. 0, kısıtlama olmadığı anlamına gelir; maksimum sayı 24'tür.

## Parola Geçerlilik Süresi Yapılandırması

![](https://static-docs.nocobase.com/202412281335588.png)

### Parola Geçerlilik Süresi

Kullanıcı parolasının geçerlilik süresi. Kullanıcıların geçerlilik süresinin yeniden hesaplanması için parolalarını süresi dolmadan önce değiştirmeleri gerekir. Eğer parola süresi dolmadan önce değiştirilmezse, kullanıcı eski parolasıyla oturum açamaz ve bir yöneticinin sıfırlama konusunda yardımcı olması gerekir. Başka oturum açma yöntemleri yapılandırılmışsa, kullanıcı diğer yöntemleri kullanarak oturum açabilir.

### Parola Süresi Dolma Bildirim Kanalı

Kullanıcının parolasının süresi dolmasına 10 gün kala, kullanıcı her oturum açtığında bir hatırlatıcı gönderilir. Varsayılan olarak, hatırlatıcı "Parola Süresi Dolma Hatırlatıcısı" dahili mesaj kanalına gönderilir ve bu kanal bildirim yönetimi bölümünde yönetilebilir.

### Yapılandırma Önerileri

Parola süresinin dolması, yönetici hesapları da dahil olmak üzere hesaplara giriş yapılamamasına neden olabileceğinden, parolaları zamanında değiştirmeniz ve sistemde kullanıcı parolalarını değiştirebilecek yetkiye sahip birden fazla hesap oluşturmanız önerilir.

## Parola Oturum Açma Güvenliği

Geçersiz parola ile oturum açma denemelerine ilişkin limitleri belirleyin.

![](https://static-docs.nocobase.com/202412281339724.png)

### Maksimum Geçersiz Parola Oturum Açma Denemesi Sayısı

Kullanıcının belirli bir zaman aralığında yapabileceği maksimum oturum açma denemesi sayısını belirleyin.

### Maksimum Geçersiz Parola Oturum Açma Zaman Aralığı (Saniye)

Kullanıcının maksimum geçersiz oturum açma denemesi sayısını hesaplamak için zaman aralığını (saniye cinsinden) belirleyin.

### Kilitleme Süresi (Saniye)

Kullanıcının geçersiz parola ile oturum açma limitini aşmasından sonra kilitli kalacağı süreyi belirleyin (0, kısıtlama olmadığı anlamına gelir). Kilitleme süresi boyunca, kullanıcının API anahtarları da dahil olmak üzere herhangi bir kimlik doğrulama yöntemiyle sisteme erişimi engellenir. Kullanıcının manuel olarak kilidini açmanız gerekirse, [Kullanıcı Kilitleme](./lockout.md) bölümüne başvurabilirsiniz.

### Senaryolar

#### Kısıtlama Yok

Kullanıcıların geçersiz parola denemesi sayısında kısıtlama yoktur.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Deneme Sıklığını Sınırla, Kullanıcıyı Kilitleme

Örnek: Bir kullanıcı her 5 dakikada bir en fazla 5 kez oturum açmayı deneyebilir.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Limiti Aştıktan Sonra Kullanıcıyı Kilitle

Örnek: Bir kullanıcı 5 dakika içinde art arda 5 kez geçersiz parola ile oturum açmayı denerse, kullanıcı 2 saat boyunca kilitlenir.

![](https://static-docs.nocobase.com/202412281344952.png)

### Yapılandırma Önerileri

- Geçersiz parola oturum açma denemesi sayısı ve zaman aralığı yapılandırması, genellikle kısa sürede yüksek frekanslı parola oturum açma denemelerini sınırlamak ve kaba kuvvet saldırılarını önlemek için kullanılır.
- Limiti aştıktan sonra kullanıcının kilitlenip kilitlenmeyeceği, gerçek kullanım senaryolarına göre değerlendirilmelidir. Kilitleme süresi ayarı kötüye kullanılabilir; saldırganlar, hedef bir hesap için kasıtlı olarak birden fazla kez yanlış parola girerek hesabın kilitlenmesine ve normal şekilde kullanılamamasına neden olabilir. Bu tür saldırıları önlemek için IP kısıtlamaları, API frekans limitleri gibi yöntemlerle birleştirilebilir.
- Hesap kilitleme, yönetici hesapları da dahil olmak üzere sisteme erişimi engelleyeceğinden, sistemde kullanıcıların kilidini açma yetkisine sahip birden fazla hesap oluşturmanız tavsiye edilir.