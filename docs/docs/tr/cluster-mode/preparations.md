:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Ön Hazırlıklar

Bir küme uygulaması dağıtmadan önce, aşağıdaki ön hazırlıkları tamamlamanız gerekir.

## Ticari Eklenti Lisansı

NocoBase uygulamasını küme modunda çalıştırmak için aşağıdaki eklentilerin desteği gereklidir:

| İşlev                  | Eklenti                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Önbellek adaptörü      | Dahili                                                                              |
| Senkronizasyon sinyal adaptörü | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Mesaj kuyruğu adaptörü | `@nocobase/plugin-queue-adapter-redis` veya `@nocobase/plugin-queue-adapter-rabbitmq` |
| Dağıtık kilit adaptörü | `@nocobase/plugin-lock-adapter-redis`                                               |
| Worker ID tahsis edici | `@nocobase/plugin-workerid-allocator-redis`                                         |

Öncelikle, yukarıdaki eklentiler için lisansları aldığınızdan emin olun (ilgili eklenti lisanslarını ticari eklenti hizmet platformu üzerinden satın alabilirsiniz).

## Sistem Bileşenleri

Uygulama örneğinin kendisi dışındaki diğer sistem bileşenleri, ekibin operasyonel ihtiyaçlarına göre operasyon personeli tarafından seçilebilir.

### Veritabanı

Mevcut küme modu yalnızca uygulama örneklerini hedeflediğinden, veritabanı geçici olarak tek düğümü desteklemektedir. Eğer master-slave gibi bir veritabanı mimariniz varsa, bunu ara yazılımlar aracılığıyla kendiniz uygulamanız ve NocoBase uygulaması için şeffaf olmasını sağlamanız gerekir.

### Ara Yazılım

NocoBase'in küme modu, kümeler arası iletişimi ve koordinasyonu sağlamak için bazı ara yazılımlara ihtiyaç duyar. Bunlar şunları içerir:

- **Önbellek**: Veri erişim hızını artırmak için Redis tabanlı dağıtık önbellek ara yazılımı kullanır.
- **Senkronizasyon sinyali**: Kümeler arası senkronizasyon sinyali iletimini sağlamak için Redis'in stream özelliğini kullanır.
- **Mesaj kuyruğu**: Asenkron mesaj işlemeyi sağlamak için Redis veya RabbitMQ tabanlı mesaj kuyruğu ara yazılımı kullanır.
- **Dağıtık kilit**: Kümedeki paylaşılan kaynaklara erişim güvenliğini sağlamak için Redis tabanlı dağıtık kilit kullanır.

Tüm ara yazılım bileşenleri Redis kullandığında, kümenin dahili ağında (veya Kubernetes'te) tek bir Redis hizmeti başlatabilirsiniz. Alternatif olarak, her bir işlev (önbellek, senkronizasyon sinyali, mesaj kuyruğu ve dağıtık kilit) için ayrı bir Redis hizmeti de etkinleştirebilirsiniz.

**Sürüm Önerileri**

- Redis: >=8.0 veya Bloom Filter özelliğini içeren bir redis-stack sürümü kullanın.
- RabbitMQ: >=4.0

### Paylaşımlı Depolama

NocoBase, sistemle ilgili dosyaları depolamak için `storage` dizinini kullanır. Çok düğümlü modda, birden fazla düğümün paylaşımlı erişimini desteklemek için bir bulut diski (veya NFS) bağlamanız gerekir. Aksi takdirde, yerel depolama otomatik olarak senkronize olmaz ve düzgün çalışmaz.

Kubernetes ile dağıtım yaparken, lütfen [Kubernetes Dağıtımı: Paylaşımlı Depolama](./kubernetes#shared-storage) bölümüne bakın.

### Yük Dengeleme

Küme modu, istekleri dağıtmak, uygulama örneklerinin sağlık kontrollerini yapmak ve hata durumunda devralmayı sağlamak için bir yük dengeleyiciye ihtiyaç duyar. Bu bölüm, ekibin operasyonel ihtiyaçlarına göre seçilmeli ve yapılandırılmalıdır.

Kendi barındırdığınız bir Nginx'i örnek alarak, yapılandırma dosyasına aşağıdaki içeriği ekleyin:

```
upstream myapp {
    # ip_hash; # Oturum sürekliliği için kullanılabilir. Etkinleştirildiğinde, aynı istemciden gelen istekler her zaman aynı arka uç sunucusuna gönderilir.
    server 172.31.0.1:13000; # Dahili düğüm 1
    server 172.31.0.2:13000; # Dahili düğüm 2
    server 172.31.0.3:13000; # Dahili düğüm 3
}

server {
    listen 80;

    location / {
        # Tanımlanan upstream'i yük dengeleme için kullanın
        proxy_pass http://myapp;
        # ... diğer yapılandırmalar
    }
}
```

Bu, isteklerin farklı sunucu düğümlerine ters proxy aracılığıyla dağıtılıp işlendiği anlamına gelir.

Diğer bulut hizmeti sağlayıcıları tarafından sunulan yük dengeleme ara yazılımları için, lütfen ilgili sağlayıcının yapılandırma belgelerine bakın.

## Ortam Değişkeni Yapılandırması

Kümedeki tüm düğümler aynı ortam değişkeni yapılandırmasını kullanmalıdır. NocoBase'in temel [ortam değişkenlerine](/api/cli/env) ek olarak, aşağıdaki ara yazılımla ilgili ortam değişkenlerinin de yapılandırılması gerekir.

### Çok Çekirdekli Mod

Uygulama çok çekirdekli bir düğümde çalıştığında, düğümün çok çekirdekli modunu etkinleştirebilirsiniz:

```ini
# PM2 çok çekirdekli modunu etkinleştir
# CLUSTER_MODE=max # Varsayılan olarak devre dışıdır, manuel yapılandırma gerektirir
```

Uygulama pod'larını Kubernetes'te dağıtıyorsanız, bu yapılandırmayı göz ardı edebilir ve uygulama örneklerinin sayısını pod replikalarının sayısı aracılığıyla kontrol edebilirsiniz.

### Önbellek

```ini
# Önbellek adaptörü, küme modunda redis olarak ayarlanmalıdır (varsayılan olarak boş bırakılırsa bellekte çalışır)
CACHE_DEFAULT_STORE=redis

# Redis önbellek adaptörü bağlantı URL'si, doldurulması zorunludur
CACHE_REDIS_URL=
```

### Senkronizasyon Sinyali

```ini
# Redis senkronizasyon adaptörü bağlantı URL'si, boş bırakılırsa varsayılan olarak redis://localhost:6379/0 olur
PUBSUB_ADAPTER_REDIS_URL=
```

### Dağıtık Kilit

```ini
# Kilit adaptörü, küme modunda redis olarak ayarlanmalıdır (varsayılan olarak boş bırakılırsa bellekteki yerel kilit olur)
LOCK_ADAPTER_DEFAULT=redis

# Redis kilit adaptörü bağlantı URL'si, boş bırakılırsa varsayılan olarak redis://localhost:6379/0 olur
LOCK_ADAPTER_REDIS_URL=
```

### Mesaj Kuyruğu

```ini
# Redis'i mesaj kuyruğu adaptörü olarak etkinleştirir, boş bırakılırsa varsayılan olarak bellekteki adaptör olur
QUEUE_ADAPTER=redis
# Redis mesaj kuyruğu adaptörü bağlantı URL'si, boş bırakılırsa varsayılan olarak redis://localhost:6379/0 olur
QUEUE_ADAPTER_REDIS_URL=
```

### Worker ID Tahsis Edici

NocoBase'deki bazı sistem koleksiyonları (collections) birincil anahtar olarak global benzersiz kimlikler (ID) kullanır. Küme genelinde birincil anahtar çakışmalarını önlemek için, her uygulama örneğinin Worker ID Tahsis Edici aracılığıyla benzersiz bir Worker ID alması gerekir. Mevcut Worker ID aralığı 0-31'dir, bu da her uygulamanın aynı anda en fazla 32 düğümde çalışabileceği anlamına gelir. Global benzersiz ID tasarımının detayları için [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id) adresine bakabilirsiniz.

```ini
# Worker ID Tahsis Edici için Redis bağlantı URL'si.
# Boş bırakılırsa, rastgele bir Worker ID atanır.
REDIS_URL=
```

:::info{title=İpucu}
Genellikle, ilgili adaptörlerin hepsi aynı Redis örneğini kullanabilir, ancak olası anahtar çakışması sorunlarını önlemek için farklı veritabanları kullanmak en iyisidir, örneğin:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Şu anda, her eklenti kendi Redis ile ilgili ortam değişkeni yapılandırmasını kullanmaktadır. Gelecekte, `REDIS_URL`'i genel bir yedek yapılandırma olarak kullanmayı düşüneceğiz.

:::

Kümeyi Kubernetes ile yönetiyorsanız, yukarıdaki ortam değişkenlerini bir ConfigMap veya Secret içinde yapılandırabilirsiniz. Daha fazla ilgili içerik için [Kubernetes Dağıtımı](./kubernetes) bölümüne bakabilirsiniz.

Yukarıdaki tüm hazırlıklar tamamlandıktan sonra, uygulama örneklerini yönetmeye devam etmek için [Operasyonlar](./operations) bölümüne geçebilirsiniz.