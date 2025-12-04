---
pkg: '@nocobase/plugin-auth'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Token Güvenlik Politikası

## Giriş

Token Güvenlik Politikası, sistem güvenliğini korumak ve kullanıcı deneyimini geliştirmek için tasarlanmış işlevsel bir yapılandırmadır. Üç ana yapılandırma öğesi içerir: "Oturum Geçerlilik Süresi", "Token Geçerlilik Süresi" ve "Süresi Dolan Token Yenileme Süresi Sınırı".

## Yapılandırma Girişi

Yapılandırma girişini Eklenti Ayarları - Güvenlik - Token Politikası altında bulabilirsiniz:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Oturum Geçerlilik Süresi

**Tanım:**

Oturum Geçerlilik Süresi, kullanıcının giriş yapmasının ardından sistemin bir kullanıcının oturumunu aktif tutmasına izin verdiği maksimum süreyi ifade eder.

**İşlev:**

Oturum Geçerlilik Süresi aşıldığında, kullanıcı sisteme tekrar eriştiğinde 401 hata yanıtı alır ve ardından sistem, kimlik doğrulaması için kullanıcıyı giriş sayfasına yönlendirir.
Örnek:
Eğer Oturum Geçerlilik Süresi 8 saat olarak ayarlanırsa, kullanıcı giriş yaptığı andan itibaren, ekstra bir etkileşim olmaması durumunda, 8 saat sonra oturum geçersiz hale gelecektir.

**Önerilen Ayarlar:**

- Kısa süreli işlem senaryoları: Güvenliği artırmak için 1-2 saat önerilir.
- Uzun süreli çalışma senaryoları: İş gereksinimlerini karşılamak için 8 saat olarak ayarlanabilir.

## Token Geçerlilik Süresi

**Tanım:**

Token Geçerlilik Süresi, sistemin kullanıcının aktif oturumu sırasında verdiği her bir Token'ın yaşam döngüsünü ifade eder.

**İşlev:**

Bir Token süresi dolduğunda, sistem oturum etkinliğini sürdürmek için otomatik olarak yeni bir Token verir.
Süresi dolmuş her Token'ın yalnızca bir kez yenilenmesine izin verilir.

**Önerilen Ayarlar:**

Güvenlik nedenleriyle, 15 ila 30 dakika arasında ayarlanması önerilir.
Senaryo gereksinimlerine göre ayarlamalar yapılabilir. Örneğin:
- Yüksek güvenlikli senaryolar: Token Geçerlilik Süresi 10 dakikaya veya daha aza indirilebilir.
- Düşük riskli senaryolar: Token Geçerlilik Süresi uygun şekilde 1 saate kadar uzatılabilir.

## Süresi Dolan Token Yenileme Süresi Sınırı

**Tanım:**

Süresi Dolan Token Yenileme Süresi Sınırı, Token süresi dolduktan sonra kullanıcının bir yenileme işlemi aracılığıyla yeni bir Token almasına izin verilen maksimum zaman aralığını ifade eder.

**Özellikler:**

- Yenileme süresi sınırı aşılırsa, kullanıcının yeni bir Token alabilmek için tekrar giriş yapması gerekir.
- Yenileme işlemi Oturum Geçerlilik Süresini uzatmaz, yalnızca Token'ı yeniden oluşturur.

**Önerilen Ayarlar:**

Güvenlik nedenleriyle, 5 ila 10 dakika arasında ayarlanması önerilir.