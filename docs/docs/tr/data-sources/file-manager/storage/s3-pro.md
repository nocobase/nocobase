---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Dosya Depolama: S3 (Pro)

## Giriş

Dosya yönetimi eklentisinin üzerine inşa edilen bu sürüm, S3 protokolüyle uyumlu dosya depolama türleri için destek ekler. Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2 gibi S3 protokolünü destekleyen herhangi bir nesne depolama hizmeti kolayca entegre edilebilir. Bu sayede depolama hizmetlerinin uyumluluğu ve esnekliği daha da artırılmıştır.

## Özellikler

1.  **İstemci Yüklemesi:** Dosya yükleme süreci NocoBase sunucusu üzerinden geçmez; doğrudan dosya depolama hizmetine bağlanır. Bu, daha verimli ve hızlı bir yükleme deneyimi sağlar.

2.  **Özel Erişim:** Dosyalara erişirken, tüm URL'ler imzalı geçici yetkilendirme adresleridir. Bu, dosya erişiminin güvenliğini ve süreli olmasını garanti eder.

## Kullanım Senaryoları

1.  **Dosya Koleksiyonu Yönetimi:** Yüklenen tüm dosyaları merkezi olarak yönetin ve depolayın. Çeşitli dosya türlerini ve depolama yöntemlerini destekleyerek dosyaların kolayca sınıflandırılmasını ve aranmasını sağlar.

2.  **Ek Alanı Depolama:** Formlar veya kayıtlar aracılığıyla yüklenen eklerin veri depolaması için kullanılır ve belirli veri kayıtlarıyla ilişkilendirmeyi destekler.

## Eklenti Yapılandırması

1.  `plugin-file-storage-s3-pro` eklentisini etkinleştirin.

2.  Dosya yönetimi ayarlarına erişmek için "Ayarlar -> Dosya Yöneticisi" yolunu izleyin.

3.  "Yeni ekle" düğmesine tıklayın ve "S3 Pro"yu seçin.

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  Açılan pencerede doldurmanız gereken ayrıntılı bir form göreceksiniz. Dosya hizmetiniz için ilgili parametre bilgilerini almak ve bunları forma doğru bir şekilde girmek için aşağıdaki belgelere başvurabilirsiniz.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Hizmet Sağlayıcı Yapılandırması

### Amazon S3

#### Bucket Oluşturma

1.  Amazon S3 Konsolu'na erişmek için [https://ap-southeast-1.console.aws.amazon.com/s3/home](https://ap-southeast-1.console.aws.amazon.com/s3/home) adresini ziyaret edin.

2.  Sağ taraftaki "Create bucket" (Bucket oluştur) düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3.  Bucket Adı'nı (depolama kovası adı) doldurun, diğer alanları varsayılan olarak bırakın, sayfanın en altına kaydırın ve işlemi tamamlamak için **"Create"** (Oluştur) düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS Yapılandırması

1.  Bucket listesinde, yeni oluşturduğunuz bucket'ı bulun ve ayrıntılarına erişmek için tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  "Permission" (İzinler) sekmesine gidin ve CORS yapılandırma bölümüne ilerleyin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  Aşağıdaki yapılandırmayı girin (ihtiyaca göre özelleştirebilirsiniz) ve kaydedin.

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

#### AccessKey ve SecretAccessKey Alma

1.  Sayfanın sağ üst köşesindeki "Security credentials" (Güvenlik kimlik bilgileri) düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  Aşağı kaydırın, "Access Keys" (Erişim Anahtarları) bölümünü bulun ve "Create Access Key" (Erişim Anahtarı Oluştur) düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  Şartları kabul edin (üretim ortamlarında IAM kullanımı önerilir).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  Görüntülenen Access Key (Erişim Anahtarı) ve Secret Access Key'i (Gizli Erişim Anahtarı) kaydedin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Parametre Alma ve Yapılandırma

1.  AccessKey ID ve AccessKey Secret, önceki adımda aldığınız değerlerdir; lütfen bunları doğru bir şekilde girin.

2.  Bucket'ın özellikler paneline gidin; burada Bucket Adı ve Bölge (Region) bilgilerini bulabilirsiniz.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Genel Erişim (İsteğe Bağlı)

Bu isteğe bağlı bir yapılandırmadır. Yüklenen dosyaları tamamen herkese açık hale getirmeniz gerektiğinde bu ayarı yapın.

1.  İzinler (Permissions) paneline gidin, "Object Ownership" (Nesne Sahipliği) bölümüne ilerleyin, "Edit" (Düzenle) düğmesine tıklayın ve ACL'leri etkinleştirin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  "Block public access" (Genel erişimi engelle) bölümüne ilerleyin, "Edit" (Düzenle) düğmesine tıklayın ve ACL kontrolüne izin verecek şekilde ayarlayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  NocoBase'de "Public access" (Genel erişim) seçeneğini işaretleyin.

#### Küçük Resim Yapılandırması (İsteğe Bağlı)

Bu yapılandırma isteğe bağlıdır ve yalnızca görüntü önizleme boyutunu veya efektini optimize etmeniz gerektiğinde kullanılmalıdır. **Lütfen dikkat, bu dağıtım ek maliyetlere neden olabilir. Daha fazla ayrıntı için AWS'nin ilgili hüküm ve koşullarına başvurun.**

1.  [Amazon CloudFront için Dinamik Görüntü Dönüşümü](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls) sayfasını ziyaret edin.

2.  Dağıtımı başlatmak için sayfanın altındaki `Launch in the AWS Console` (AWS Konsolunda Başlat) düğmesine tıklayın.
    ![](https://static-docs.nocobase.com/20250221164214117.png)

3.  Yapılandırmayı tamamlamak için talimatları izleyin. Aşağıdaki seçeneklere özellikle dikkat etmeniz gerekmektedir:
    1.  Yığını oluştururken, kaynak görüntüleri içeren Amazon S3 bucket adını belirtmeniz gerekecektir. Lütfen daha önce oluşturduğunuz bucket adını girin.
    2.  Demo kullanıcı arayüzünü dağıtmayı seçtiyseniz, dağıtım tamamlandıktan sonra görüntü işleme işlevselliğini test etmek için bu arayüzü kullanabilirsiniz. AWS CloudFormation konsolunda yığınızı seçin, "Outputs" (Çıktılar) sekmesine gidin, `DemoUrl` anahtarına karşılık gelen değeri bulun ve demo arayüzünü açmak için bağlantıya tıklayın.
    3.  Bu çözüm, görüntüleri verimli bir şekilde işlemek için `sharp` Node.js kütüphanesini kullanır. Kaynak kodunu GitHub deposundan indirebilir ve ihtiyacınıza göre özelleştirebilirsiniz.
    ![](https://static-docs.nocobase.com/20250221164315472.png)
    ![](https://static-docs.nocobase.com/20250221164404755.png)

4.  Yapılandırma tamamlandıktan sonra, dağıtım durumunun `CREATE_COMPLETE` olarak değişmesini bekleyin.

5.  NocoBase yapılandırmasında aşağıdaki noktalara dikkat edin:
    1.  `Thumbnail rule` (Küçük resim kuralı): `?width=100` gibi görüntü işleme parametrelerini girin. Ayrıntılar için [AWS belgelerine](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) başvurabilirsiniz.
    2.  `Access endpoint` (Erişim uç noktası): Dağıtım sonrası Çıktılar (Outputs) -> ApiEndpoint değerini girin.
    3.  `Full access URL style` (Tam erişim URL stili): **Yoksay** (Ignore) seçeneğini işaretlemeniz gerekmektedir (çünkü bucket adı yapılandırma sırasında zaten doldurulmuştur, erişim sırasında tekrar gerekmez).
    ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Bucket Oluşturma

1.  OSS Konsolu'nu açmak için [https://oss.console.aliyun.com/overview](https://oss.console.aliyun.com/overview) adresini ziyaret edin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  Sol menüden "Buckets" (Kovalar) seçeneğini belirleyin ve ardından bir depolama kovası oluşturmaya başlamak için "Create Bucket" (Kova Oluştur) düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  Bucket ayrıntılarını doldurun ve son olarak "Create" (Oluştur) düğmesine tıklayın.
    1.  Bucket Adı: İş ihtiyaçlarınıza uygun bir ad seçin.
    2.  Bölge (Region): Kullanıcılarınıza en yakın bölgeyi seçin.
    3.  Diğer ayarlar varsayılan olarak kalabilir veya ihtiyacınıza göre özelleştirilebilir.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS Yapılandırması

1.  Bir önceki adımda oluşturduğunuz bucket'ın ayrıntılar sayfasına gidin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  Orta menüden "Content Security" (İçerik Güvenliği) -> "CORS" seçeneğine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  "Create Rule" (Kural Oluştur) düğmesine tıklayın, ilgili alanları doldurun, aşağı kaydırın ve "OK" (Tamam) düğmesine tıklayın. Aşağıdaki ekran görüntüsüne başvurabilir veya daha ayrıntılı ayarlar yapabilirsiniz.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey ve SecretAccessKey Alma

1.  Sağ üst köşedeki hesap avatarınızın altındaki "AccessKey" seçeneğine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  Bu bölümde, gösterim kolaylığı için ana hesap kullanılarak bir AccessKey oluşturulacaktır. Üretim ortamlarında RAM kullanarak AccessKey oluşturmanız önerilir. Talimatlar için [Alibaba Cloud belgelerine](https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp) başvurabilirsiniz.

3.  "Create AccessKey" (AccessKey Oluştur) düğmesine tıklayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  Hesap doğrulamasını tamamlayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  Görüntülenen Access Key (Erişim Anahtarı) ve Secret Access Key'i (Gizli Erişim Anahtarı) kaydedin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Parametre Alma ve Yapılandırma

1.  AccessKey ID ve AccessKey Secret, önceki adımda elde ettiğiniz değerlerdir.

2.  Bucket adını almak için bucket ayrıntılar sayfasına gidin.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  Bölgeyi (Region) almak için aşağı kaydırın (".aliyuncs.com" uzantısına gerek yoktur).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  Uç nokta (endpoint) adresini alın ve NocoBase'e girerken `https://` önekini eklemeniz gerektiğini unutmayın.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Küçük Resim Yapılandırması (İsteğe Bağlı)

Bu yapılandırma isteğe bağlıdır ve yalnızca görüntü önizleme boyutunu veya efektini optimize etmeniz gerektiğinde kullanılmalıdır.

1.  `Thumbnail rule` (Küçük resim kuralı) için ilgili parametreleri doldurun. Belirli parametre ayarları için [Alibaba Cloud Görüntü İşleme belgelerine](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1) başvurabilirsiniz.

2.  `Full upload URL style` (Tam yükleme URL stili) ve `Full access URL style` (Tam erişim URL stili) ayarlarını aynı tutun.

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Bucket Oluşturma

1.  Soldaki "Buckets" (Kovalar) menüsüne tıklayın -> Oluşturma sayfasına gitmek için "Create Bucket" (Kova Oluştur) düğmesine tıklayın.
2.  Bucket adını girdikten sonra, "Kaydet" düğmesine tıklayın.

#### AccessKey ve SecretAccessKey Alma

1.  "Access Keys" (Erişim Anahtarları) bölümüne gidin -> Oluşturma sayfasına gitmek için "Create access key" (Erişim anahtarı oluştur) düğmesine tıklayın.

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  "Kaydet" düğmesine tıklayın.

![](https://static-docs.nocobase.com/20250106111850639.png)

3.  Açılan penceredeki Access Key (Erişim Anahtarı) ve Secret Key'i (Gizli Anahtar) ilerideki yapılandırmalar için kaydedin.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Parametre Yapılandırması

1.  NocoBase'de "Dosya Yöneticisi" sayfasına gidin.

2.  "Yeni ekle" düğmesine tıklayın ve "S3 Pro"yu seçin.

3.  Formu doldurun:
    -   **AccessKey ID** ve **AccessKey Secret**: Önceki adımda kaydettiğiniz değerleri kullanın.
    -   **Bölge (Region)**: Özel olarak dağıtılan MinIO'da bölge kavramı yoktur; bunu "auto" olarak ayarlayabilirsiniz.
    -   **Uç nokta (Endpoint)**: Dağıtılan hizmetinizin alan adını veya IP adresini girin.
    -   **Tam erişim URL stili (Full access URL style)** ayarını "Path-Style" olarak yapmanız gerekmektedir.

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Yukarıdaki dosya hizmetlerinin yapılandırmalarına başvurabilirsiniz. Mantık benzerdir.

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Yukarıdaki dosya hizmetlerinin yapılandırmalarına başvurabilirsiniz. Mantık benzerdir.

#### Yapılandırma Örneği

![](https://static-docs.nocobase.com/20250414154500264.png)

## Kullanıcı Rehberi

[Dosya yöneticisi eklentisi belgelerine](/data-sources/file-manager) başvurabilirsiniz.