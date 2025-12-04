:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Ek Alanı

## Giriş

Sistem, özel koleksiyonlarda dosya yüklemelerini desteklemek için yerleşik bir "Ek" alan türüne sahiptir.

Arka planda, ek alanı, sistemin yerleşik "Attachments" (`attachments`) koleksiyonunu işaret eden çoktan çoğa bir ilişki alanıdır. Herhangi bir koleksiyonda bir ek alanı oluşturduğunuzda, otomatik olarak çoktan çoğa bir ara tablo oluşturulur. Yüklenen dosyaların meta verileri "Attachments" koleksiyonunda depolanır ve koleksiyonunuzda referans verilen dosya bilgileri bu ara tablo aracılığıyla ilişkilendirilir.

## Alan Yapılandırması

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### MIME Türü Kısıtlaması

Yüklenmesine izin verilen dosya türlerini kısıtlamak için [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) sözdizimi kullanılır. Örneğin, `image/*` görsel dosyalarını temsil eder. Birden fazla tür virgülle ayrılabilir; örneğin, `image/*,application/pdf` hem görsel hem de PDF dosyalarına izin verir.

### Depolama Motoru

Yüklenen dosyaları depolamak için depolama motorunu seçin. Boş bırakılırsa, sistemin varsayılan depolama motoru kullanılır.