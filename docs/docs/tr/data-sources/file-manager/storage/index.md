:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Bakış

## Yerleşik Motorlar

Şu anda NocoBase, aşağıdaki yerleşik motor türlerini desteklemektedir:

- [Yerel Depolama](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Sistem kurulumu sırasında otomatik olarak bir yerel depolama motoru eklenir ve doğrudan kullanıma hazırdır. Ayrıca yeni motorlar ekleyebilir veya mevcut motorların parametrelerini düzenleyebilirsiniz.

## Ortak Motor Parametreleri

Farklı motor türlerine özgü parametrelerin yanı sıra, aşağıdakiler ortak parametrelerdir (yerel depolama örneğiyle):

![Dosya Depolama Motoru Yapılandırma Örneği](https://static-docs.nocobase.com/20240529115151.png)

### Başlık

Depolama motorunun adıdır, insan tarafından tanınması için kullanılır.

### Sistem Adı

Depolama motorunun sistem adıdır, sistem tarafından tanınması için kullanılır. Sistem genelinde benzersiz olmalıdır. Boş bırakılırsa, sistem tarafından otomatik olarak rastgele oluşturulur.

### Erişim Temel URL'si

Dosyaya harici erişim için URL adresinin ön ekidir. Bu, bir CDN'in temel URL'si olabilir, örneğin: "`https://cdn.nocobase.com/app`" (sondaki "`/`" olmadan).

### Yol

Dosyaları depolarken kullanılan göreli yoldur. Bu kısım, erişildiğinde nihai URL'ye otomatik olarak eklenecektir. Örneğin: "`user/avatar`" (baştaki veya sondaki "`/`" olmadan).

### Dosya Boyutu Sınırı

Bu depolama motoruna yüklenen dosyalar için boyut sınırıdır. Bu boyutu aşan dosyalar yüklenemez. Sistem varsayılan sınırı 20MB'tır ve ayarlanabilir maksimum sınır 1GB'tır.

### Dosya Türü

Yüklenebilecek dosya türlerini, [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) sözdizimi açıklama formatını kullanarak sınırlar. Örneğin, `image/*` resim dosyalarını temsil eder. Birden fazla tür, virgülle ayrılabilir; örneğin, `image/*, application/pdf` hem resim hem de PDF dosyalarına izin verir.

### Varsayılan Depolama Motoru

İşaretlendiğinde, bu sistemin varsayılan depolama motoru olarak ayarlanır. Bir eklenti alanı veya dosya tablosu bir depolama motoru belirtmediğinde, yüklenen dosyalar varsayılan depolama motoruna kaydedilir. Varsayılan depolama motoru silinemez.

### Kayıtlar Silinirken Dosyaları Sakla

İşaretlendiğinde, eklenti veya dosya tablosundaki veri kayıtları silinse bile depolama motorundaki yüklenen dosyalar korunur. Varsayılan olarak bu işaretli değildir, yani kayıtlar silindiğinde depolama motorundaki dosyalar da silinir.

:::info{title=İpucu}
Bir dosya yüklendikten sonra, nihai erişim yolu birkaç bölümün birleştirilmesiyle oluşturulur:

```
<Erişim temel URL'si>/<Yol>/<DosyaAdı><Uzantı>
```

Örneğin: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::