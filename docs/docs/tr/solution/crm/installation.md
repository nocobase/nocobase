:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/solution/crm/installation) bakın.
:::

# Nasıl Kurulur

> Mevcut sürüm **yedekleme ve geri yükleme** şeklinde dağıtılmaktadır. Gelecek sürümlerde, çözümü mevcut sistemlerinize entegre etmeyi kolaylaştırmak için **artımlı geçiş** formuna geçebiliriz.

CRM 2.0 çözümünü kendi NocoBase ortamınıza hızlı ve sorunsuz bir şekilde dağıtabilmeniz için iki geri yükleme yöntemi sunuyoruz. Lütfen kullanıcı sürümünüze ve teknik geçmişinize en uygun olanı seçiniz.

Başlamadan önce lütfen şunlardan emin olunuz:

- Temel bir NocoBase çalışma ortamına sahipsiniz. Ana sistemin kurulumu hakkında lütfen daha ayrıntılı [resmi kurulum belgelerine](https://docs-cn.nocobase.com/welcome/getting-started/installation) bakınız.
- NocoBase sürümü **v2.1.0-beta.2 ve üzeri**
- CRM sisteminin ilgili dosyalarını indirmiş olmalısınız:
  - **Yedekleme dosyası**: [nocobase_crm_v2_backup_260223.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260223.nbdata) - Yöntem 1 için uygundur
  - **SQL dosyası**: [nocobase_crm_v2_sql_260223.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260223.zip) - Yöntem 2 için uygundur

**Önemli Açıklama**:
- Bu çözüm **PostgreSQL 16** veritabanı temel alınarak hazırlanmıştır, lütfen ortamınızın PostgreSQL 16 kullandığından emin olunuz.
- **DB_UNDERSCORED true olamaz**: Lütfen `docker-compose.yml` dosyanızı kontrol ediniz ve `DB_UNDERSCORED` ortam değişkeninin `true` olarak ayarlanmadığından emin olunuz; aksi takdirde çözüm yedeğiyle çakışarak geri yükleme hatasına neden olur.

---

## Yöntem 1: Yedekleme Yöneticisi kullanarak geri yükleme (Profesyonel/Kurumsal sürüm kullanıcıları için önerilir)

Bu yöntem, NocoBase'in yerleşik "[Yedekleme Yöneticisi](https://docs-cn.nocobase.com/handbook/backups)" (Profesyonel/Kurumsal sürüm) eklentisi aracılığıyla tek tıkla geri yükleme sağlar ve en basit işlemdir. Ancak ortam ve kullanıcı sürümü için belirli gereksinimleri vardır.

### Temel Özellikler

* **Avantajlar**:
  1. **İşlem kolaylığı**: Kullanıcı arayüzü (UI) üzerinden tamamlanabilir; eklentiler dahil tüm yapılandırmaları eksiksiz geri yükleyebilir.
  2. **Tam geri yükleme**: Yazdırma şablonu dosyaları ve koleksiyonlardaki dosya alanları aracılığıyla yüklenen dosyalar dahil olmak üzere **tüm sistem dosyalarını geri yükleyebilir**, işlevsel bütünlüğü sağlar.
* **Sınırlamalar**:
  1. **Profesyonel/Kurumsal sürüm kısıtlaması**: "Yedekleme Yöneticisi" kurumsal düzeyde bir eklentidir ve yalnızca Profesyonel/Kurumsal sürüm kullanıcıları tarafından kullanılabilir.
  2. **Sıkı ortam gereksinimleri**: Veritabanı ortamınızın (sürüm, büyük/küçük harf duyarlılığı ayarları vb.) yedeğin oluşturulduğu ortamla yüksek derecede uyumlu olmasını gerektirir.
  3. **Eklenti bağımlılığı**: Çözüm, yerel ortamınızda bulunmayan ticari eklentiler içeriyorsa geri yükleme başarısız olur.

### İşlem Adımları

**Adım 1: 【Kesinlikle Önerilir】 Uygulamayı `full` imajı ile başlatın**

Veritabanı istemcisinin eksikliği nedeniyle oluşabilecek geri yükleme hatalarını önlemek için, Docker imajının `full` sürümünü kullanmanızı kesinlikle öneririz. Bu sürüm, gerekli tüm yardımcı programları içerir ve ek yapılandırma gerektirmez.

İmajı çekmek için komut örneği:

```bash
docker pull nocobase/nocobase:beta-full
```

Ardından NocoBase hizmetinizi bu imajla başlatın.

> **Not**: `full` imajı kullanmazsanız, konteyner içine manuel olarak `pg_dump` veritabanı istemcisini kurmanız gerekebilir; bu işlem zahmetli ve kararsızdır.

**Adım 2: "Yedekleme Yöneticisi" eklentisini açın**

1. NocoBase sisteminize giriş yapın.
2. **`Eklenti Yönetimi`** kısmına gidin.
3. **`Yedekleme Yöneticisi`** eklentisini bulun ve etkinleştirin.

**Adım 3: Yerel yedekleme dosyasından geri yükleyin**

1. Eklentiyi etkinleştirdikten sonra sayfayı yenileyin.
2. Sol menüden **`Sistem Yönetimi`** -> **`Yedekleme Yöneticisi`** kısmına girin.
3. Sağ üst köşedeki **`Yerel yedeklemeden geri yükle`** düğmesine tıklayın.
4. İndirdiğiniz yedekleme dosyasını yükleme alanına sürükleyin.
5. **`Gönder`**'e tıklayın ve sistemin geri yüklemeyi tamamlamasını sabırla bekleyin; bu işlem birkaç on saniye ile birkaç dakika arasında sürebilir.

### Dikkat Edilmesi Gerekenler

* **Veritabanı uyumluluğu**: Bu, bu yöntemin en kritik noktasıdır. PostgreSQL veritabanı **sürümünüz, karakter setiniz ve büyük/küçük harf duyarlılığı ayarlarınız** yedek kaynak dosyasıyla eşleşmelidir. Özellikle `schema` adı tutarlı olmalıdır.
* **Ticari eklenti eşleşmesi**: Lütfen çözüm için gerekli tüm ticari eklentilere sahip olduğunuzdan ve bunları etkinleştirdiğinizden emin olunuz; aksi takdirde geri yükleme yarıda kesilecektir.

---

## Yöntem 2: Doğrudan SQL dosyasını içe aktarma (Genel, Topluluk sürümü için daha uygun)

Bu yöntem, verileri doğrudan veritabanı üzerinden geri yükleyerek "Yedekleme Yöneticisi" eklentisini devre dışı bırakır, bu nedenle Profesyonel/Kurumsal sürüm eklentisi kısıtlaması yoktur.

### Temel Özellikler

* **Avantajlar**:
  1. **Sürüm kısıtlaması yok**: Topluluk sürümü dahil tüm NocoBase kullanıcıları için uygundur.
  2. **Yüksek uyumluluk**: Uygulama içindeki `dump` aracına bağımlı değildir; veritabanına bağlanabildiğiniz sürece işlem yapabilirsiniz.
  3. **Yüksek hata toleransı**: Çözüm sahip olmadığınız ticari eklentiler içeriyorsa, ilgili özellikler etkinleştirilmez ancak diğer özelliklerin normal kullanımını etkilemez ve uygulama başarıyla başlatılabilir.
* **Sınırlamalar**:
  1. **Veritabanı işlem yeteneği gerektirir**: Kullanıcının bir `.sql` dosyasını nasıl yürüteceği gibi temel veritabanı işlem yeteneklerine sahip olması gerekir.
  2. **Sistem dosyası kaybı**: **Bu yöntem tüm sistem dosyalarını kaybeder**; buna yazdırma şablonu dosyaları ve koleksiyonlardaki dosya alanları aracılığıyla yüklenen dosyalar dahildir.

### İşlem Adımları

**Adım 1: Temiz bir veritabanı hazırlayın**

İçe aktaracağınız veriler için tamamen yeni ve boş bir veritabanı hazırlayın.

**Adım 2: `.sql` dosyasını veritabanına içe aktarın**

İndirilen veritabanı dosyasını (genellikle `.sql` formatında) edinin ve içeriğini bir önceki adımda hazırladığınız veritabanına aktarın. Ortamınıza bağlı olarak birkaç yürütme yolu vardır:

* **Seçenek A: Sunucu komut satırı üzerinden (Docker örneği)**
  NocoBase ve veritabanını kurmak için Docker kullanıyorsanız, `.sql` dosyasını sunucuya yükleyebilir ve ardından içe aktarmak için `docker exec` komutunu kullanabilirsiniz. PostgreSQL konteyner adınızın `my-nocobase-db` ve dosya adınızın `nocobase_crm_v2_sql_260223.sql` olduğunu varsayalım:

  ```bash
  # sql dosyasını konteyner içine kopyalayın
  docker cp nocobase_crm_v2_sql_260223.sql my-nocobase-db:/tmp/
  # Konteyner içine girerek içe aktarma komutunu yürütün
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260223.sql
  ```
* **Seçenek B: Uzak veritabanı istemcisi üzerinden (Navicat vb.)**
  Veritabanı portunuz dışarıya açıksa, veritabanına bağlanmak için herhangi bir grafiksel veritabanı istemcisini (Navicat, DBeaver, pgAdmin vb.) kullanabilir ve ardından:
  1. Hedef veritabanına sağ tıklayın
  2. "SQL Dosyasını Çalıştır" veya "SQL Betiğini Yürüt" seçeneğini seçin
  3. İndirilen `.sql` dosyasını seçin ve yürütün

**Adım 3: Veritabanına bağlanın ve uygulamayı başlatın**

NocoBase başlatma parametrelerinizi (örneğin `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` gibi ortam değişkenleri), verileri az önce içe aktardığınız veritabanına işaret edecek şekilde yapılandırın. Ardından, NocoBase hizmetini normal şekilde başlatın.

### Dikkat Edilmesi Gerekenler

* **Veritabanı yetkileri**: Bu yöntem, veritabanı üzerinde doğrudan işlem yapabilen bir kullanıcı adı ve şifreye sahip olmanızı gerektirir.
* **Eklenti durumu**: İçe aktarma başarılı olduktan sonra, sistemdeki ticari eklenti verileri mevcut olsa bile, yerel olarak ilgili eklentiyi kurup etkinleştirmediyseniz ilgili özellikler görüntülenemez ve kullanılamaz; ancak bu durum uygulamanın çökmesine neden olmaz.

---

## Özet ve Karşılaştırma

| Özellik | Yöntem 1: Yedekleme Yöneticisi | Yöntem 2: Doğrudan SQL İçe Aktarma |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Uygun Kullanıcılar** | **Profesyonel/Kurumsal Sürüm** kullanıcıları | **Tüm kullanıcılar** (Topluluk sürümü dahil) |
| **İşlem Kolaylığı** | ⭐⭐⭐⭐⭐ (Çok basit, UI işlemi) | ⭐⭐⭐ (Temel veritabanı bilgisi gerektirir) |
| **Ortam Gereksinimleri** | **Sıkı**, veritabanı ve sistem sürümleri yüksek derecede uyumlu olmalı | **Genel**, veritabanı uyumluluğu gerekir |
| **Eklenti Bağımlılığı** | **Güçlü bağımlılık**, geri yükleme sırasında eklentiler doğrulanır, herhangi bir eklenti eksikliği **geri yükleme hatasına** neden olur. | **Özellikler eklentilere güçlü şekilde bağlıdır**. Veriler bağımsız olarak içe aktarılabilir, sistem temel işlevlere sahip olur. Ancak ilgili eklenti eksikse, ilgili özellikler **tamamen kullanılamaz** olacaktır. |
| **Sistem Dosyaları** | **Tamamen korunur** (yazdırma şablonları, yüklenen dosyalar vb.) | **Kaybolur** (yazdırma şablonları, yüklenen dosyalar vb.) |
| **Önerilen Senaryo** | Kurumsal kullanıcılar, ortamın kontrol edilebilir ve tutarlı olduğu, tam işlevsellik gereken durumlar | Bazı eklentilerin eksik olduğu, yüksek uyumluluk ve esneklik aranan, Profesyonel/Kurumsal sürüm kullanıcısı olmayan, dosya işlevi kaybını kabul edebilen durumlar |

Bu kılavuzun CRM 2.0 sistemini sorunsuz bir şekilde dağıtmanıza yardımcı olacağını umuyoruz. İşlem sırasında herhangi bir sorunla karşılaşırsanız, lütfen bizimle iletişime geçmekten çekinmeyiniz!