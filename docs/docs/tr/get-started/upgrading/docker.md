:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Docker Kurulumunu Yükseltme



:::warning Yükseltmeden Önce

- Veritabanınızı mutlaka yedekleyin.

:::

## 1. docker-compose.yml Dosyasının Bulunduğu Dizine Geçin

Örneğin

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project

## 2. Image Sürüm Numarasını Güncelleyin

:::tip Sürüm Numaraları Hakkında

- `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full` gibi takma ad sürümleri genellikle değiştirmenize gerek yoktur.
- `1.7.14`, `1.7.14-full` gibi sayısal sürüm numaralarının hedef sürüm numarasına göre değiştirilmesi gerekir.
- Yalnızca yükseltmeler desteklenir; düşürmeler desteklenmez!!!
- Üretim ortamında, istenmeyen otomatik yükseltmeleri önlemek için belirli bir sayısal sürüme sabitlemeniz önerilir. [Tüm sürümleri görüntüleyin](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Alibaba Cloud (Aliyun) imajını kullanmanız önerilir (yerel ağlar için daha kararlı).
    image: nocobase/nocobase:1.7.14-full
    # Takma ad sürümlerini de kullanabilirsiniz (otomatik olarak yükseltilebilir, üretimde dikkatli kullanın).
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (yerel olarak yavaş veya başarısız olabilir)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Konteyneri Yeniden Başlatın

```bash
# En son imajı çekin
docker compose pull app

# Konteyneri yeniden oluşturun
docker compose up -d app

# app sürecinin durumunu kontrol edin
docker compose logs -f app
```

## 4. Üçüncü Taraf Eklentilerin Yükseltilmesi

[Eklentileri Kurma ve Yükseltme](../install-upgrade-plugins.mdx) bölümüne bakın.

## 5. Geri Alma Talimatları

NocoBase düşürmeyi desteklemez. Geri almanız gerekirse, lütfen yükseltme öncesi veritabanı yedeğinizi geri yükleyin ve imaj sürümünü orijinal sürüme geri değiştirin.

## 6. Sıkça Sorulan Sorular (SSS)

**S: İmaj çekme yavaş veya başarısız oluyor**

İmaj hızlandırma kullanın veya Alibaba Cloud (Aliyun) imajını kullanın: `nocobase/nocobase:<tag>`

**S: Sürüm değişmedi**

`image` değerini yeni sürüm numarasına değiştirdiğinizden ve `docker compose pull app` ile `up -d app` komutlarını başarıyla çalıştırdığınızdan emin olun.

**S: Ticari eklenti indirme veya güncelleme başarısız oldu**

Ticari eklentiler için lütfen sistemde lisans anahtarını doğrulayın ve ardından Docker konteynerini yeniden başlatın. Ayrıntılar için [NocoBase Ticari Lisans Aktivasyon Kılavuzu](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide) bölümüne bakın.
```