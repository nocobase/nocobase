---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Değişkenler ve Sırlar

## Giriş

Hassas veri depolama, yapılandırma verilerini yeniden kullanma ve ortam yapılandırmasını izole etme gibi amaçlar için ortam değişkenlerini ve sırları merkezi olarak yapılandırın ve yönetin.

## .env Dosyasından Farkları

| **Özellik**                  | **`.env` Dosyası**                                                                                             | **Dinamik Olarak Yapılandırılan Değişkenler ve Sırlar**                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Depolama Konumu**          | Proje kök dizinindeki `.env` dosyasında depolanır.                                                             | Veritabanındaki `environmentVariables` tablosunda depolanır.                                                                                           |
| **Yükleme Yöntemi**          | `dotenv` gibi araçlar aracılığıyla uygulama başlangıcında `process.env` içine yüklenir.                        | Dinamik olarak okunur ve uygulama başlangıcında `app.environment` içine yüklenir.                                                                      |
| **Değişiklik Yöntemi**       | Doğrudan dosya düzenleme gerektirir; değişikliklerin etkili olması için uygulamanın yeniden başlatılması gerekir. | Çalışma zamanında değişiklikleri destekler; değişiklikler, uygulama yapılandırması yeniden yüklendikten hemen sonra etkili olur.                       |
| **Ortam İzolasyonu**         | Her ortam (geliştirme, test, üretim) için `.env` dosyalarının ayrı ayrı yönetilmesi gerekir.                   | Her ortam (geliştirme, test, üretim) için `environmentVariables` tablosundaki verilerin ayrı ayrı yönetilmesi gerekir.                               |
| **Uygulanabilir Senaryolar** | Uygulamanın ana veritabanı bilgileri gibi sabit statik yapılandırmalar için uygundur.                           | Harici veritabanları, dosya depolama bilgileri gibi sık ayarlama gerektiren veya iş mantığına bağlı dinamik yapılandırmalar için uygundur.             |

## Kurulum

Dahili bir eklenti olduğundan, ayrı bir kuruluma gerek yoktur.

## Kullanım

### Yapılandırma Verilerini Yeniden Kullanma

Örneğin, bir iş akışı içinde birden fazla yerde e-posta düğümleri ve SMTP yapılandırması gerekiyorsa, ortak SMTP yapılandırmasını ortam değişkenlerinde depolayabilirsiniz.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Hassas Veri Depolama

Çeşitli harici veritabanı yapılandırma bilgileri, bulut dosya depolama anahtarları gibi verilerin depolanması.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Ortam Yapılandırması İzolasyonu

Yazılım geliştirme, test ve üretim gibi farklı ortamlarda, her ortamın yapılandırmalarının ve verilerinin birbirini etkilememesini sağlamak için bağımsız yapılandırma yönetimi stratejileri kullanılır. Her ortamın kendi bağımsız ayarları, değişkenleri ve kaynakları vardır; bu, geliştirme, test ve üretim ortamları arasındaki çakışmaları önler ve sistemin her ortamda beklendiği gibi çalışmasını sağlar.

Örneğin, dosya depolama hizmetleri için yapılandırma, geliştirme ve üretim ortamları arasında farklılık gösterebilir, aşağıdaki gibi:

Geliştirme Ortamı

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Üretim Ortamı

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Ortam Değişkeni Yönetimi

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Ortam Değişkeni Ekleme

- Tekli ve toplu eklemeyi destekler
- Düz metin ve şifreli depolamayı destekler

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Tekli Ekleme

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Toplu Ekleme

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Notlar

### Uygulamayı Yeniden Başlatma

Ortam değişkenlerini değiştirdikten veya sildikten sonra, üst kısımda uygulamayı yeniden başlatma uyarısı görünecektir. Ortam değişkenlerindeki değişiklikler yalnızca uygulama yeniden başlatıldıktan sonra etkili olacaktır.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Şifreli Depolama

Ortam değişkenleri için şifreli veriler AES simetrik şifreleme kullanır. Şifreleme ve şifre çözme için `PRIVATE KEY`, depolama dizininde saklanır. Lütfen bu anahtarı güvende tutun; kaybolması veya üzerine yazılması durumunda, şifreli veriler çözülemez.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Ortam Değişkenlerini Destekleyen Mevcut Eklentiler

### Eylem: Özel İstek

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Kimlik Doğrulama: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Kimlik Doğrulama: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Kimlik Doğrulama: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Kimlik Doğrulama: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Kimlik Doğrulama: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Kimlik Doğrulama: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### veri kaynağı: Harici MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### veri kaynağı: Harici MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### veri kaynağı: Harici Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### veri kaynağı: Harici PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### veri kaynağı: Harici SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### veri kaynağı: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### veri kaynağı: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Dosya Depolama: Yerel

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Dosya Depolama: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Dosya Depolama: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Dosya Depolama: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Dosya Depolama: S3 Pro

Uyarlanmadı

### Harita: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Harita: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### E-posta Ayarları

Uyarlanmadı

### Bildirim: E-posta

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Herkese Açık Formlar

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Sistem Ayarları

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Doğrulama: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Doğrulama: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### iş akışı

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)