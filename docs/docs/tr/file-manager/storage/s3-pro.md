---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Depolama Motoru: S3 (Pro)

## Giriş

Dosya Yöneticisi eklentisinin üzerine inşa edilen bu özellik, S3 protokolüyle uyumlu dosya depolama türlerini destekler. Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2 gibi S3 protokolünü destekleyen tüm nesne depolama hizmetlerini kolayca entegre edebilirsiniz. Bu sayede depolama hizmetlerinin uyumluluğu ve esnekliği daha da artırılır.

## Özellikler

1.  **İstemci Tarafından Yükleme**: Dosya yükleme süreci NocoBase sunucusu üzerinden geçmez; doğrudan dosya depolama hizmetine bağlanarak daha verimli ve hızlı bir yükleme deneyimi sunar.
2.  **Özel Erişim**: Dosyalara erişirken, tüm URL'ler imzalı geçici yetkilendirilmiş adreslerdir. Bu, dosya erişiminin güvenliğini ve güncelliğini sağlar.

## Kullanım Senaryoları

1.  **Dosya koleksiyonu yönetimi**: Yüklenen tüm dosyaları merkezi olarak yönetir ve depolar. Çeşitli dosya türlerini ve depolama yöntemlerini destekleyerek dosyaların kolayca sınıflandırılmasını ve aranmasını sağlar.
2.  **Ek alanı depolama**: Formlarda veya kayıtlarda yüklenen eklerin veri depolaması için kullanılır ve belirli veri kayıtlarıyla ilişkilendirmeyi destekler.

## Eklenti Yapılandırması

1.  `plugin-file-storage-s3-pro` eklentisini etkinleştirin.
2.  Dosya yöneticisi ayarlarına girmek için "Ayarlar -> Dosya Yöneticisi" üzerine tıklayın.
3.  "Yeni ekle" düğmesine tıklayın ve "S3 Pro"yu seçin.

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  Açılan pencerede doldurmanız gereken birçok alan içeren bir form göreceksiniz. İlgili dosya hizmeti için gerekli parametre bilgilerini almak ve bunları forma doğru bir şekilde doldurmak için sonraki belgelere başvurabilirsiniz.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Hizmet Sağlayıcı Yapılandırması

### Amazon S3

#### Bucket Oluşturma

1.  S3 konsoluna girmek için https://ap-southeast-1.console.aws.amazon.com/s3/home adresini açın.
2.  Sağdaki "Bucket oluştur" düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2.  Bucket Adı'nı (depolama alanı adı) doldurun. Diğer alanları varsayılan ayarlarda bırakabilirsiniz. Sayfanın en altına kaydırın ve oluşturma işlemini tamamlamak için **"Oluştur"** düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS Yapılandırması

1.  Bucket'lar listesine gidin, az önce oluşturduğunuz bucket'ı bulun ve detay sayfasına girmek için üzerine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  "İzinler" sekmesine tıklayın, ardından aşağı kaydırarak CORS yapılandırma bölümünü bulun.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  Aşağıdaki yapılandırmayı girin (daha fazla özelleştirebilirsiniz) ve kaydedin.

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### AccessKey ve SecretAccessKey Edinme

1.  Sayfanın sağ üst köşesindeki "Güvenlik kimlik bilgileri" düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  Aşağı kaydırarak "Erişim Anahtarları" bölümünü bulun ve "Erişim Anahtarı Oluştur" düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  Kabul et'e tıklayın (bu, ana hesapla yapılan bir gösterimdir; üretim ortamında IAM kullanmanız önerilir).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  Sayfada gösterilen Erişim anahtarını (Access key) ve Gizli erişim anahtarını (Secret access key) kaydedin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Parametreleri Edinme ve Yapılandırma

1.  AccessKey ID ve AccessKey Secret, önceki adımda edindiğiniz değerlerdir. Lütfen bunları doğru bir şekilde doldurun.
2.  Bucket detay sayfasının özellikler paneline gidin; burada Bucket adını ve Bölge (Region) bilgilerini edinebilirsiniz.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Genel Erişim (İsteğe Bağlı)

Bu isteğe bağlı bir yapılandırmadır. Yüklenen dosyaları tamamen herkese açık hale getirmeniz gerektiğinde bu ayarı yapın.

1.  İzinler paneline gidin, Nesne Sahipliği'ne (Object Ownership) kadar aşağı kaydırın, düzenle'ye tıklayın ve ACL'leri etkinleştirin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  Genel erişimi engelle (Block public access) bölümüne kaydırın, düzenle'ye tıklayın ve ACL'lerin kontrolüne izin verecek şekilde ayarlayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  NocoBase'de Genel erişim (Public access) seçeneğini işaretleyin.

#### Küçük Resim Yapılandırması (İsteğe Bağlı)

Bu yapılandırma isteğe bağlıdır ve görüntü önizleme boyutunu veya efektlerini optimize etmek için kullanılır. **Lütfen bu dağıtım çözümünün ek maliyetlere yol açabileceğini unutmayın. Belirli ücretler için lütfen AWS'nin ilgili şartlarına başvurun.**

1.  [Amazon CloudFront için Dinamik Görüntü Dönüşümü](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls) sayfasını ziyaret edin.

2.  Çözümü dağıtmaya başlamak için sayfanın altındaki `AWS Konsolunda Başlat` düğmesine tıklayın.
    ![](https://static-docs.nocobase.com/20250221164214117.png)

3.  Yapılandırmayı tamamlamak için talimatları izleyin. Aşağıdaki seçeneklere özellikle dikkat etmeniz gerekir:
    1.  Yığını (stack) oluştururken, kaynak görüntüleri içeren bir Amazon S3 bucket adı belirtmeniz gerekir. Lütfen daha önce oluşturduğunuz bucket adını girin.
    2.  Demo kullanıcı arayüzünü (UI) dağıtmayı seçerseniz, dağıtım tamamlandıktan sonra bu arayüz aracılığıyla görüntü işleme özelliklerini test edebilirsiniz. AWS CloudFormation konsolunda yığınızı seçin, "Çıktılar" (Outputs) sekmesine gidin, DemoUrl anahtarına karşılık gelen değeri bulun ve demo arayüzünü açmak için bağlantıya tıklayın.
    3.  Bu çözüm, görüntüleri verimli bir şekilde işlemek için `sharp` Node.js kütüphanesini kullanır. Kaynak kodunu GitHub deposundan indirebilir ve ihtiyacınıza göre özelleştirebilirsiniz.

    ![](https://static-docs.nocobase.com/20250221164315472.png)
    ![](https://static-docs.nocobase.com/20250221164404755.png)

4.  Yapılandırma tamamlandıktan sonra, dağıtım durumunun `CREATE_COMPLETE` olarak değişmesini bekleyin.

5.  NocoBase yapılandırmasında dikkat etmeniz gereken birkaç nokta vardır:
    1.  `Küçük resim kuralı` (`Thumbnail rule`): Görüntü işleme ile ilgili parametreleri doldurun, örneğin `?width=100`. Detaylar için [AWS belgelerine](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) başvurabilirsiniz.
    2.  `Erişim uç noktası` (`Access endpoint`): Dağıtımdan sonra Çıktılar (Outputs) -> ApiEndpoint değerini doldurun.
    3.  `Tam erişim URL stili` (`Full access URL style`): **Yoksay**'ı işaretlemeniz gerekir (çünkü yapılandırma sırasında bucket adı zaten doldurulmuştur, erişim sırasında artık buna gerek yoktur).

    ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### Bucket Oluşturma

1.  OSS konsolunu açın: https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  Sol menüdeki "Bucket'lar" üzerine tıklayın, ardından bir bucket oluşturmaya başlamak için "Bucket Oluştur" düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  Bucket ile ilgili bilgileri doldurun ve son olarak Oluştur düğmesine tıklayın.
    1.  Bucket Adı iş ihtiyaçlarınıza uygun olmalıdır; adı rastgele seçebilirsiniz.
    2.  Bölge (Region) olarak kullanıcılarınıza en yakın olanı seçin.
    3.  Diğer ayarları varsayılan olarak bırakabilir veya ihtiyaçlarınıza göre yapılandırabilirsiniz.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS Yapılandırması

1.  Önceki adımda oluşturduğunuz bucket'ın detay sayfasına gidin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  Ortadaki menüden "İçerik Güvenliği -> CORS" üzerine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  "Kural Oluştur" düğmesine tıklayın, ilgili içeriği doldurun, aşağı kaydırın ve "Tamam"a tıklayın. Aşağıdaki ekran görüntüsünü referans alabilir veya daha detaylı ayarlar yapabilirsiniz.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey ve SecretAccessKey Edinme

1.  Sağ üst köşedeki profil resminizin altındaki "AccessKey" üzerine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  Burada, gösterim kolaylığı için ana hesap kullanılarak bir AccessKey oluşturulmaktadır. Üretim ortamında RAM kullanarak oluşturmanız önerilir. Daha fazla bilgi için https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair adresine başvurabilirsiniz.
3.  "AccessKey Oluştur" düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  Hesap doğrulamasını gerçekleştirin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  Sayfada gösterilen Erişim anahtarını (Access key) ve Gizli erişim anahtarını (Secret access key) kaydedin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Parametreleri Edinme ve Yapılandırma

1.  AccessKey ID ve AccessKey Secret, önceki adımda edindiğiniz değerlerdir.
2.  Bucket adını almak için bucket detay sayfasına gidin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  Bölgeyi (Region) almak için aşağı kaydırın (".aliyuncs.com" uzantısı gerekli değildir).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  Uç nokta (endpoint) adresini alın ve NocoBase'e doldururken `https://` önekini eklemeniz gerekir.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Küçük Resim Yapılandırması (İsteğe Bağlı)

Bu yapılandırma isteğe bağlıdır ve yalnızca görüntü önizleme boyutunu veya efektlerini optimize etmeniz gerektiğinde kullanılmalıdır.

1.  `Küçük resim kuralı` (`Thumbnail rule`) ile ilgili parametreleri doldurun. Belirli parametre ayarları için [Görüntü İşleme Parametreleri](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images) sayfasına başvurabilirsiniz.

2.  `Tam yükleme URL stili` (`Full upload URL style`) ve `Tam erişim URL stili` (`Full access URL style`) aynı kalabilir.

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Bucket Oluşturma

1.  Soldaki Bucket'lar menüsüne tıklayın -> Oluşturma sayfasına gitmek için Bucket Oluştur'a tıklayın.
2.  Bucket adını doldurduktan sonra kaydet düğmesine tıklayın.

#### AccessKey ve SecretAccessKey Edinme

1.  Erişim Anahtarları'na (Access Keys) gidin -> Oluşturma sayfasına gitmek için Erişim anahtarı oluştur (Create access key) düğmesine tıklayın.

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  Kaydet düğmesine tıklayın.

![](https://static-docs.nocobase.com/20250106111850639.png)

1.  Açılır penceredeki Erişim Anahtarını (Access Key) ve Gizli Anahtarı (Secret Key) sonraki yapılandırmalar için kaydedin.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Parametre Yapılandırması

1.  NocoBase -> Dosya yöneticisi sayfasına gidin.

2.  Yeni ekle (Add new) düğmesine tıklayın ve S3 Pro'yu seçin.

3.  Formu doldurun:
    -   **AccessKey ID** ve **AccessKey Secret**, önceki adımda kaydettiğiniz metinlerdir.
    -   **Bölge (Region)**: Kendi barındırdığınız (self-hosted) bir MinIO'da Bölge kavramı yoktur, bu nedenle "auto" olarak yapılandırılabilir.
    -   **Uç nokta (Endpoint)**: Dağıtımınızın alan adını veya IP adresini doldurun.
    -   Tam erişim URL stili (Full access URL style) Path-Style olarak ayarlanmalıdır.

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Yukarıda belirtilen dosya hizmetlerinin yapılandırmasına başvurabilirsiniz, mantık benzerdir.

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Yukarıda belirtilen dosya hizmetlerinin yapılandırmasına başvurabilirsiniz, mantık benzerdir.

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414154500264.png)