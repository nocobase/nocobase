:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/solution/ticket-system/installation) bakın.
:::

# Nasıl Kurulur

> Mevcut sürüm, dağıtım için **yedekleme ve geri yükleme** formunu kullanmaktadır. Gelecek sürümlerde, çözümü mevcut sistemlerinize entegre etmeyi kolaylaştırmak için **kademeli geçiş** formuna geçebiliriz.

İş akışı çözümünü kendi NocoBase ortamınıza hızlı ve sorunsuz bir şekilde dağıtabilmeniz için iki geri yükleme yöntemi sunuyoruz. Lütfen kullanıcı sürümünüze ve teknik geçmişinize en uygun olanı seçiniz.

Başlamadan önce lütfen şunlardan emin olunuz:

- Temel bir NocoBase çalışma ortamına sahipsiniz. Ana sistemin kurulumu için lütfen daha ayrıntılı olan [resmi kurulum dokümantasyonuna](https://docs-cn.nocobase.com/welcome/getting-started/installation) bakınız.
- NocoBase sürümü **2.0.0-beta.5 ve üzeri**
- İş emri sisteminin ilgili dosyalarını indirdiniz:
  - **Yedekleme dosyası**: [nocobase_tts_v2_backup_260302.nbdata](https://static-docs.nocobase.com/nocobase_tts_v2_backup_260302.nbdata) - Yöntem 1 için uygundur
  - **SQL dosyası**: [nocobase_tts_v2_sql_260302.zip](https://static-docs.nocobase.com/nocobase_tts_v2_sql_260302.zip) - Yöntem 2 için uygundur

**Önemli Notlar**:
- Bu çözüm **PostgreSQL 16** veritabanı temel alınarak hazırlanmıştır, lütfen ortamınızın PostgreSQL 16 kullandığından emin olunuz.
- **DB_UNDERSCORED true olamaz**: Lütfen `docker-compose.yml` dosyanızı kontrol ediniz ve `DB_UNDERSCORED` ortam değişkeninin `true` olarak ayarlanmadığından emin olunuz; aksi takdirde çözüm yedeği ile çakışacak ve geri yükleme başarısız olacaktır.

---

## Yöntem 1: Yedekleme Yöneticisi kullanarak geri yükleme (Profesyonel/Kurumsal sürüm kullanıcıları için önerilir)

Bu yöntem, NocoBase'in yerleşik "[Yedekleme Yöneticisi](https://docs-cn.nocobase.com/handbook/backups)" (Profesyonel/Kurumsal sürüm) eklentisi aracılığıyla tek tıkla geri yükleme sağlar ve en basit işlemdir. Ancak ortam ve kullanıcı sürümü için belirli gereksinimleri vardır.

### Temel Özellikler

* **Avantajlar**:
  1. **İşlem kolaylığı**: UI arayüzünde tamamlanabilir, eklentiler dahil tüm yapılandırmaları eksiksiz geri yükleyebilir.
  2. **Tam geri yükleme**: Şablon yazdırma dosyaları, tablolardaki dosya alanlarına yüklenen dosyalar vb. dahil olmak üzere **tüm sistem dosyalarını geri yükleyebilir**, işlevsel bütünlüğü sağlar.
* **Sınırlamalar**:
  1. **Profesyonel/Kurumsal sürümle sınırlıdır**: "Yedekleme Yöneticisi" kurumsal düzeyde bir eklentidir, yalnızca Profesyonel/Kurumsal sürüm kullanıcıları tarafından kullanılabilir.
  2. **Sıkı ortam gereksinimleri**: Veritabanı ortamınızın (sürüm, büyük/küçük harf duyarlılığı ayarları vb.) yedeği hazırladığımız ortamla yüksek derecede uyumlu olmasını gerektirir.
  3. **Eklenti bağımlılığı**: Çözüm, yerel ortamınızda bulunmayan ticari eklentiler içeriyorsa geri yükleme başarısız olur.

### İşlem Adımları

**1. Adım: 【Kesinlikle önerilir】 Uygulamayı `full` imajı ile başlatın**

Eksik veritabanı istemcisi nedeniyle geri yükleme hatalarını önlemek için, `full` sürüm Docker imajını kullanmanızı kesinlikle öneririz. Tüm gerekli yardımcı programları içinde barındırır, böylece ek yapılandırma yapmanıza gerek kalmaz.

İmajı çekmek için komut örneği:

```bash
docker pull nocobase/nocobase:beta-full
```

Ardından bu imajı kullanarak NocoBase servisinizi başlatınız.

> **Not**: `full` imajı kullanmazsanız, konteyner içine manuel olarak `pg_dump` veritabanı istemcisi kurmanız gerekebilir; bu işlem zahmetli ve kararsızdır.

**2. Adım: "Yedekleme Yöneticisi" eklentisini etkinleştirin**

1. NocoBase sisteminize giriş yapınız.
2. **`Eklenti yönetimi`** kısmına giriniz.
3. **`Yedekleme Yöneticisi`** eklentisini bulunuz ve etkinleştiriniz.

**3. Adım: Yerel yedekleme dosyasından geri yükleyin**

1. Eklentiyi etkinleştirdikten sonra sayfayı yenileyiniz.
2. Sol menüdeki **`Sistem yönetimi`** -> **`Yedekleme Yöneticisi`** kısmına giriniz.
3. Sağ üst köşedeki **`Yerel yedekten geri yükle`** düğmesine tıklayınız.
4. İndirdiğiniz yedekleme dosyasını yükleme alanına sürükleyiniz.
5. **`Gönder`**'e tıklayınız ve sistemin geri yüklemeyi tamamlamasını sabırla bekleyiniz; bu işlem birkaç on saniye ile birkaç dakika arasında sürebilir.

### Dikkat Edilmesi Gerekenler

* **Veritabanı uyumluluğu**: Bu yöntemin en kritik noktasıdır. PostgreSQL veritabanı **sürümünüz, karakter setiniz, büyük/küçük harf duyarlılığı ayarlarınız** yedek kaynak dosyasıyla eşleşmelidir. Özellikle `schema` adı aynı olmalıdır.
* **Ticari eklenti eşleşmesi**: Lütfen çözüm için gereken tüm ticari eklentilere sahip olduğunuzdan ve bunları etkinleştirdiğinizden emin olunuz, aksi takdirde geri yükleme kesintiye uğrayacaktır.

---

## Yöntem 2: Doğrudan SQL dosyası içe aktarma (Evrensel, Topluluk sürümü için daha uygun)

Bu yöntem, "Yedekleme Yöneticisi" eklentisini atlayarak verileri doğrudan veritabanı üzerinden geri yükler, bu nedenle Profesyonel/Kurumsal sürüm eklenti kısıtlaması yoktur.

### Temel Özellikler

* **Avantajlar**:
  1. **Sürüm kısıtlaması yok**: Topluluk sürümü dahil tüm NocoBase kullanıcıları için uygundur.
  2. **Yüksek uyumluluk**: Uygulama içindeki `dump` aracına bağımlı değildir, veritabanına bağlanabildiğiniz sürece işlem yapılabilir.
  3. **Yüksek hata toleransı**: Çözüm sahip olmadığınız ticari eklentiler içeriyorsa, ilgili özellikler etkinleştirilmez ancak diğer özelliklerin normal kullanımını etkilemez ve uygulama başarıyla başlatılabilir.
* **Sınırlamalar**:
  1. **Veritabanı işlem yeteneği gerektirir**: Kullanıcının bir `.sql` dosyasını nasıl çalıştıracağı gibi temel veritabanı işlem yeteneklerine sahip olması gerekir.
  2. **Sistem dosyası kaybı**: **Bu yöntem tüm sistem dosyalarını kaybeder**; şablon yazdırma dosyaları, tablolardaki dosya alanlarına yüklenen dosyalar vb. buna dahildir.

### İşlem Adımları

**1. Adım: Temiz bir veritabanı hazırlayın**

İçe aktaracağınız veriler için tamamen yeni ve boş bir veritabanı hazırlayınız.

**2. Adım: `.sql` dosyasını veritabanına içe aktarın**

İndirilen veritabanı dosyasını (genellikle `.sql` formatında) edinin ve içeriğini bir önceki adımda hazırladığınız veritabanına aktarın. Ortamınıza bağlı olarak birkaç yöntem vardır:

* **Seçenek A: Sunucu komut satırı üzerinden (Docker örneği)**
  NocoBase ve veritabanını kurmak için Docker kullanıyorsanız, `.sql` dosyasını sunucuya yükleyebilir ve ardından içe aktarmak için `docker exec` komutunu kullanabilirsiniz. PostgreSQL konteyner adınızın `my-nocobase-db` ve dosya adınızın `ticket_system.sql` olduğunu varsayalım:

  ```bash
  # sql dosyasını konteyner içine kopyalayın
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Konteynere girerek içe aktarma komutunu çalıştırın
  docker exec -it my-nocobase-db psql -U kullanıcı_adınız -d veritabanı_adınız -f /tmp/ticket_system.sql
  ```
* **Seçenek B: Uzak veritabanı istemcisi üzerinden**
  Veritabanınızın portu dışarıya açıksa, herhangi bir grafiksel veritabanı istemcisi (DBeaver, Navicat, pgAdmin vb.) kullanarak veritabanına bağlanabilir, yeni bir sorgu penceresi açabilir, `.sql` dosyasının tüm içeriğini yapıştırabilir ve çalıştırabilirsiniz.

**3. Adım: Veritabanına bağlanın ve uygulamayı başlatın**

NocoBase başlatma parametrelerinizi (ortam değişkenleri `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` vb.) az önce verileri içe aktardığınız veritabanını gösterecek şekilde yapılandırınız. Ardından NocoBase servisini normal şekilde başlatınız.

### Dikkat Edilmesi Gerekenler

* **Veritabanı yetkileri**: Bu yöntem, veritabanında doğrudan işlem yapabilen bir kullanıcı adı ve şifreye sahip olmanızı gerektirir.
* **Eklenti durumu**: İçe aktarma başarılı olduktan sonra, sistemdeki ticari eklenti verileri mevcut olsa bile, yerelinizde ilgili eklentiler kurulu ve etkin değilse ilgili özellikler görüntülenemez ve kullanılamaz; ancak bu durum uygulamanın çökmesine neden olmaz.

---

## Özet ve Karşılaştırma

| Özellik | Yöntem 1: Yedekleme Yöneticisi | Yöntem 2: Doğrudan SQL İçe Aktarma |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Uygun Kullanıcı** | **Profesyonel/Kurumsal** sürüm kullanıcıları | **Tüm kullanıcılar** (Topluluk sürümü dahil) |
| **İşlem Kolaylığı** | ⭐⭐⭐⭐⭐ (Çok basit, UI işlemi) | ⭐⭐⭐ (Temel veritabanı bilgisi gerektirir) |
| **Ortam Gereksinimi** | **Sıkı**, veritabanı ve sistem sürümleri yüksek derecede uyumlu olmalıdır | **Genel**, veritabanı uyumluluğu gerektirir |
| **Eklenti Bağımlılığı** | **Güçlü bağımlılık**,