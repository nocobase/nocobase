:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Ek Alanı

## Giriş

Sistem, özel koleksiyonlarda dosya yüklemelerini desteklemek için yerleşik bir "Ek" alan türüne sahiptir.

Ek alanı, temel olarak, sistemin yerleşik "Ekler" (`attachments`) koleksiyonunu işaret eden Çoktan Çoğa bir ilişki alanıdır. Herhangi bir koleksiyonda bir Ek alanı oluşturduğunuzda, çoktan çoğa ilişki için otomatik olarak bir ara tablo oluşturulur. Yüklenen dosyaların meta verileri "Ekler" koleksiyonunda saklanır ve koleksiyonda referans verilen dosya bilgileri bu ara tablo aracılığıyla ilişkilendirilir.

## Alan Yapılandırması

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### MIME Türü Kısıtlamaları

Yüklenmesine izin verilen dosya türlerini kısıtlamak için kullanılır ve [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) sözdizimi formatını kullanır. Örneğin: `image/*` resim dosyalarını temsil eder. Birden fazla tür virgülle ayrılabilir, örneğin: `image/*,application/pdf` hem resim hem de PDF dosya türlerine izin verir.

### Depolama Motoru

Yüklenen dosyaları depolamak için depolama motorunu seçin. Boş bırakılırsa, sistemin varsayılan depolama motoru kullanılır.