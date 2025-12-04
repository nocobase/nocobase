:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Eklenti Geliştirme

## Arka Plan

Tek düğümlü bir ortamda, eklentiler genellikle süreç içi durum, olaylar veya görevler aracılığıyla gereksinimleri karşılayabilir. Ancak, küme modunda, aynı eklenti birden fazla örnekte eş zamanlı olarak çalışabilir ve aşağıdaki tipik sorunlarla karşılaşabilir:

-   **Durum Tutarlılığı**: Yapılandırma veya çalışma zamanı verileri yalnızca bellekte depolanıyorsa, örnekler arasında senkronize edilmesi zordur ve bu durum kirli okumalara veya yinelenen yürütmelere yol açabilir.
-   **Görev Planlama**: Uzun süreli görevler için açık bir kuyruğa alma ve onay mekanizması olmadığında, birden fazla örnek aynı görevi eş zamanlı olarak yürütebilir.
-   **Yarış Koşulları**: Şema değişiklikleri veya kaynak tahsisi içeren işlemler, eş zamanlı yazmalardan kaynaklanan çakışmaları önlemek için serileştirme gerektirir.

NocoBase çekirdeği, küme ortamında eklentilerin birleşik yetenekleri yeniden kullanmasına yardımcı olmak için uygulama katmanında çeşitli ara katman yazılımı arayüzleri sağlar. Aşağıda, önbellekleme, senkron mesajlaşma, mesaj kuyrukları ve dağıtılmış kilitlerin kullanımını ve en iyi uygulamalarını kaynak kod referanslarıyla birlikte inceleyeceğiz.

## Çözümler

### Önbellek Bileşeni (Cache)

Bellekte saklanması gereken veriler için, sistemin yerleşik önbellek bileşenini kullanmanız önerilir.

-   Varsayılan önbellek örneğini `app.cache` aracılığıyla edinin.
-   `Cache`, `set/get/del/reset` gibi temel işlemleri sunar ve önbellekleme mantığını kapsüllemek için `wrap` ve `wrapWithCondition`'ı, ayrıca `mset/mget/mdel` gibi toplu yöntemleri de destekler.
-   Küme dağıtımında, paylaşılan verileri kalıcı depolama (Redis gibi) birimlerine yerleştirmeniz ve örnek yeniden başlatmalarında önbellek kaybını önlemek için uygun bir `ttl` (yaşam süresi) ayarlamanız önerilir.

Örnek: [`plugin-auth` içindeki önbellek başlatma ve kullanımı](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Bir eklentide önbellek oluşturma ve kullanma"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### Senkron Mesaj Yöneticisi (SyncMessageManager)

Bellekteki durum dağıtılmış bir önbellek ile yönetilemiyorsa (örneğin, serileştirilemiyorsa), durum kullanıcı eylemleri nedeniyle değiştiğinde, durum tutarlılığını korumak için bu değişikliğin senkron bir sinyal aracılığıyla diğer örneklere bildirilmesi gerekir.

-   Eklenti temel sınıfı `sendSyncMessage`'i zaten uygulamıştır. Bu yöntem dahili olarak `app.syncMessageManager.publish`'i çağırır ve kanal çakışmalarını önlemek için kanala otomatik olarak uygulama düzeyinde bir önek ekler.
-   `publish` bir `transaction` belirtebilir ve mesaj, veritabanı işlemi tamamlandıktan sonra gönderilerek durum ve mesaj senkronizasyonu sağlanır.
-   Diğer örneklerden gelen mesajları işlemek için `handleSyncMessage`'i kullanın. Bu, `beforeLoad` aşamasında abone olunarak yapılandırma değişiklikleri ve şema senkronizasyonu gibi senaryolar için oldukça uygundur.

Örnek: [`plugin-data-source-main` senkron mesajları kullanarak birden çok düğümde şema tutarlılığını korur](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Bir eklenti içinde şema güncellemelerini senkronize etme"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // app.syncMessageManager.publish'i otomatik olarak çağırır
  }
}
```

### Mesaj Yayın Yöneticisi (PubSubManager)

Mesaj yayınlama, senkron sinyallerin temel bileşenidir ve doğrudan da kullanılabilir. Örnekler arasında mesaj yayınlamanız gerektiğinde bu bileşeni kullanabilirsiniz.

-   `app.pubSubManager.subscribe(channel, handler, { debounce })` örnekler arasında bir kanala abone olmak için kullanılabilir; `debounce` seçeneği, tekrarlanan yayınlardan kaynaklanan sık geri aramaları önlemek için kullanılır.
-   `publish`, mesajın mevcut örneğe geri gönderilip gönderilmeyeceğini kontrol etmek için `skipSelf` (varsayılan olarak true) ve `onlySelf` seçeneklerini destekler.
-   Uygulama başlamadan önce bir adaptörün (Redis, RabbitMQ vb.) yapılandırılması gerekir; aksi takdirde, varsayılan olarak harici bir mesajlaşma sistemine bağlanmayacaktır.

Örnek: [`plugin-async-task-manager` görev iptal olaylarını yayınlamak için PubSub kullanır](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Görev iptal sinyalini yayınlama"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Olay Kuyruğu Bileşeni (EventQueue)

Mesaj kuyruğu, uzun süreli veya yeniden denenebilir işlemleri yönetmek için uygun olan eş zamansız görevleri planlamak için kullanılır.

-   `app.eventQueue.subscribe(channel, { idle, process, concurrency })` ile bir tüketici tanımlayın. `process` bir `Promise` döndürür ve zaman aşımlarını kontrol etmek için `AbortSignal.timeout` kullanabilirsiniz.
-   `publish` otomatik olarak uygulama adı önekini ekler ve `timeout`, `maxRetries` gibi seçenekleri destekler. Varsayılan olarak bellek içi kuyruk adaptörünü kullanır, ancak gerektiğinde RabbitMQ gibi genişletilmiş adaptörlere geçiş yapılabilir.
-   Bir kümede, görevlerin düğümler arasında parçalanmasını önlemek için tüm düğümlerin aynı adaptörü kullandığından emin olun.

Örnek: [`plugin-async-task-manager` görevleri planlamak için EventQueue kullanır](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Kuyrukta eş zamansız görevleri dağıtma"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Dağıtılmış Kilit Yöneticisi (LockManager)

Yarış koşullarını önlemeniz gerektiğinde, bir kaynağa erişimi serileştirmek için dağıtılmış bir kilit kullanabilirsiniz.

-   Varsayılan olarak süreç tabanlı bir `local` adaptörü sunar. Redis gibi dağıtılmış uygulamaları kaydedebilirsiniz; eş zamanlılığı `app.lockManager.runExclusive(key, fn, ttl)` veya `acquire`/`tryAcquire` aracılığıyla kontrol edin.
-   `ttl`, istisnai durumlarda kilidin süresiz olarak tutulmasını önlemek için bir güvenlik önlemi olarak kilidi serbest bırakmak için kullanılır.
-   Yaygın senaryolar şunları içerir: şema değişiklikleri, yinelenen görevleri önleme, hız sınırlama vb.

Örnek: [`plugin-data-source-main` alan silme sürecini korumak için dağıtılmış bir kilit kullanır](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Alan silme işlemini serileştirme"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Geliştirme Önerileri

-   **Bellek İçi Durum Tutarlılığı**: Geliştirme sırasında bellek içi durum kullanmaktan mümkün olduğunca kaçının. Bunun yerine, durum tutarlılığını korumak için önbellekleme veya senkron mesajları kullanın.
-   **Yerleşik Arayüzleri Yeniden Kullanmaya Öncelik Verin**: Eklentilerde düğümler arası iletişim mantığını yeniden uygulamaktan kaçınmak için `app.cache` ve `app.syncMessageManager` gibi birleşik yetenekleri kullanın.
-   **İşlem Sınırlarına Dikkat Edin**: Veri ve mesaj tutarlılığını sağlamak için işlem içeren operasyonlarda `transaction.afterCommit` (`syncMessageManager.publish` içinde yerleşik olarak bulunur) kullanmalısınız.
-   **Geri Çekilme Stratejisi Geliştirin**: Kuyruk ve yayın görevleri için, istisnai durumlarda yeni trafik artışlarını önlemek amacıyla makul `timeout`, `maxRetries` ve `debounce` değerleri ayarlayın.
-   **Tamamlayıcı İzleme ve Günlükleme Kullanın**: Kümedeki aralıklı sorunların giderilmesini kolaylaştırmak için kanal adları, mesaj yükleri, kilit anahtarları gibi bilgileri kaydetmek üzere uygulama günlüklerinden iyi bir şekilde yararlanın.

Bu yetenekler sayesinde eklentiler, farklı örnekler arasında durumu güvenli bir şekilde paylaşabilir, yapılandırmaları senkronize edebilir ve görevleri planlayabilir, böylece küme dağıtım senaryolarının kararlılık ve tutarlılık gereksinimlerini karşılayabilir.