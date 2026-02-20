:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Bakış

## Giriş

Depolama motorları, dosyaları sunucunun sabit diskine kaydeden yerel depolama ve bulut depolama gibi belirli hizmetlere kaydetmek için kullanılır.

Herhangi bir dosya yüklemeden önce bir depolama motoru yapılandırmanız gerekir. Sistem, kurulum sırasında otomatik olarak bir yerel depolama motoru ekler; bunu doğrudan kullanabilirsiniz. Ayrıca yeni motorlar ekleyebilir veya mevcut motorların parametrelerini düzenleyebilirsiniz.

## Depolama Motoru Türleri

NocoBase şu anda aşağıdaki depolama motoru türlerini yerleşik olarak desteklemektedir:

- [Yerel Depolama](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Sistem, kurulum sırasında otomatik olarak bir yerel depolama motoru ekler; bunu doğrudan kullanabilirsiniz. Ayrıca yeni motorlar ekleyebilir veya mevcut motorların parametrelerini düzenleyebilirsiniz.

## Genel Parametreler

Farklı motor türlerine özgü parametrelerin yanı sıra, aşağıdakiler genel parametrelerdir (yerel depolama örneği kullanılmıştır):

![Dosya depolama motoru yapılandırma örneği](https://static-docs.nocobase.com/20240529115151.png)

### Başlık

Depolama motorunun adı, insan tarafından tanınması için kullanılır.

### Sistem Adı

Depolama motorunun sistem tarafından tanınması için kullanılan sistem adıdır. Sistem içinde benzersiz olmalıdır. Boş bırakılırsa, sistem otomatik olarak rastgele bir ad oluşturur.

### Erişim URL Ön Eki

Dosyanın dışarıdan erişilebilir URL adresinin ön ek kısmıdır. Bir CDN'in temel erişim URL'si olabilir, örneğin: "`https://cdn.nocobase.com/app`" (sondaki "/" işareti gerekmez).

### Yol

Dosyaları depolarken kullanılan göreli yoldur. Bu kısım, erişim sırasında nihai URL'ye otomatik olarak eklenecektir. Örneğin: "`user/avatar`" (başında veya sonunda "/" işareti gerekmez).

### Dosya Boyutu Sınırı

Bu depolama motoruna yüklenen dosyalar için boyut sınırlamasıdır. Belirlenen boyutu aşan dosyalar yüklenemez. Sistem varsayılan sınırı 20MB'tır ve maksimum 1GB'a kadar ayarlanabilir.

### Dosya Türleri

Yüklenebilecek dosya türlerini [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) söz dizimi açıklama formatını kullanarak kısıtlayabilirsiniz. Örneğin: `image/*` resim dosyalarını temsil eder. Birden fazla tür, İngilizce virgülle ayrılabilir, örneğin: `image/*, application/pdf` resim ve PDF türündeki dosyalara izin verildiğini gösterir.

### Varsayılan Depolama Motoru

İşaretlendiğinde, sistemin varsayılan depolama motoru olarak ayarlanır. Bir ek alanı veya dosya koleksiyonu bir depolama motoru belirtmediğinde, yüklenen tüm dosyalar varsayılan depolama motoruna kaydedilir. Varsayılan depolama motoru silinemez.

### Kayıt Silindiğinde Dosyayı Koru

İşaretlendiğinde, ek veya dosya koleksiyonundaki veri kaydı silindiğinde bile depolama motorundaki yüklenmiş dosya korunur. Varsayılan olarak işaretli değildir, yani kayıt silindiğinde depolama motorundaki dosya da silinir.

:::info{title=İpucu}
Bir dosya yüklendikten sonra, nihai erişim yolu birkaç bölümün birleştirilmesiyle oluşturulur:

```
<Erişim URL Ön Eki>/<Yol>/<Dosya Adı><Uzantı>
```

Örneğin: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::