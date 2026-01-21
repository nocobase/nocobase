:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Hizmet Ayırma <Badge>v1.9.0+</Badge>

## Giriş

Genellikle, bir NocoBase uygulamasının tüm hizmetleri aynı Node.js örneğinde çalışır. Uygulama içindeki işlevsellik iş gereksinimleriyle birlikte karmaşıklaştıkça, bazı zaman alan hizmetler genel performansı etkileyebilir.

Uygulama performansını artırmak için NocoBase, küme modunda uygulama hizmetlerini farklı düğümlerde çalışacak şekilde ayırmayı destekler. Bu sayede, tek bir hizmetin performans sorunlarının tüm uygulamayı etkilemesi ve kullanıcı isteklerine düzgün yanıt verememesi önlenir.

Öte yandan, bu yaklaşım belirli hizmetlere yönelik yatay ölçeklendirme yapılmasına da olanak tanır ve kümenin kaynak kullanımını artırır.

NocoBase, küme dağıtımında farklı hizmetleri farklı düğümlere ayırarak çalıştırabilir. Aşağıdaki şema, ayırma yapısını göstermektedir:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Hangi Hizmetler Ayrılabilir?

### Asenkron İş Akışı

**Hizmet ANAHTARI**: `workflow:process`

Asenkron moddaki iş akışları, tetiklendikten sonra bir kuyruğa girerek sırayla yürütülür. Bu tür iş akışları, genellikle kullanıcının sonuçları beklemesini gerektirmeyen arka plan görevleri olarak düşünülebilir. Özellikle karmaşık ve zaman alıcı süreçler, yüksek tetikleme hacmine sahip olduklarında, bunların bağımsız düğümlerde çalışacak şekilde ayrılması önerilir.

### Diğer Kullanıcı Düzeyindeki Asenkron Görevler

**Hizmet ANAHTARI**: `async-task:process`

Asenkron içe ve dışa aktarma gibi kullanıcı eylemleriyle oluşturulan görevleri içerir. Büyük veri hacimleri veya yüksek eşzamanlılık durumlarında, bunların bağımsız düğümlerde çalışacak şekilde ayrılması önerilir.

## Hizmetler Nasıl Ayrılır?

Farklı hizmetleri farklı düğümlere ayırmak, `WORKER_MODE` ortam değişkenini yapılandırarak gerçekleştirilir. Bu ortam değişkeni aşağıdaki kurallara göre yapılandırılabilir:

- `WORKER_MODE=<boş>`: Yapılandırılmadığında veya boş bırakıldığında, çalışma modu mevcut tekil örnekle aynıdır; tüm istekleri kabul eder ve tüm görevleri işler. Daha önce yapılandırılmamış uygulamalarla uyumludur.
- `WORKER_MODE=!`: Çalışma modu yalnızca istekleri işler, hiçbir görevi işlemez.
- `WORKER_MODE=workflow:process,async-task:process`: Bir veya daha fazla hizmet tanımlayıcısıyla (virgülle ayrılmış) yapılandırıldığında, çalışma modu yalnızca bu tanımlayıcılara ait görevleri işler, istekleri işlemez.
- `WORKER_MODE=*`: Çalışma modu tüm arka plan görevlerini, modül ayrımı yapmaksızın işler, ancak istekleri işlemez.
- `WORKER_MODE=!,workflow:process`: Çalışma modu istekleri işler ve aynı zamanda yalnızca belirli bir tanımlayıcıya ait görevleri işler.
- `WORKER_MODE=-`: Çalışma modu hiçbir isteği veya görevi işlemez (bu mod, worker süreci içinde gereklidir).

Örneğin, bir K8S ortamında, aynı ayırma işlevselliğine sahip düğümlerin tümü aynı ortam değişkeni yapılandırmasını kullanabilir, bu da belirli bir hizmet türünü yatay olarak ölçeklendirmeyi kolaylaştırır.

## Yapılandırma Örnekleri

### Birden Fazla Düğümde Ayrı İşleme

Üç düğüm olduğunu varsayalım: `node1`, `node2` ve `node3`. Bunlar aşağıdaki gibi yapılandırılabilir:

- `node1`: Yalnızca kullanıcı UI isteklerini işler, `WORKER_MODE=!` olarak yapılandırın.
- `node2`: Yalnızca iş akışı görevlerini işler, `WORKER_MODE=workflow:process` olarak yapılandırın.
- `node3`: Yalnızca asenkron görevleri işler, `WORKER_MODE=async-task:process` olarak yapılandırın.

### Birden Fazla Düğümde Karışık İşleme

Dört düğüm olduğunu varsayalım: `node1`, `node2`, `node3` ve `node4`. Bunlar aşağıdaki gibi yapılandırılabilir:

- `node1` ve `node2`: Tüm normal istekleri işler, `WORKER_MODE=!` olarak yapılandırın ve bir yük dengeleyici tarafından isteklerin bu iki düğüme otomatik olarak dağıtılmasını sağlayın.
- `node3` ve `node4`: Diğer tüm arka plan görevlerini işler, `WORKER_MODE=*` olarak yapılandırın.

## Geliştirici Referansı

İş eklentileri geliştirirken, senaryo gereksinimlerine göre önemli kaynak tüketen hizmetleri ayırabilirsiniz. Bu, aşağıdaki yollarla gerçekleştirilebilir:

1. Ortam değişkeni yapılandırması için `my-plugin:process` gibi yeni bir hizmet tanımlayıcısı tanımlayın ve bunun için dokümantasyon sağlayın.
2. Eklentinin sunucu tarafı iş mantığında, `app.serving()` arayüzünü kullanarak ortamı kontrol edin ve mevcut düğümün ortam değişkenine göre belirli bir hizmeti sağlayıp sağlamayacağına karar verin.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// Eklentinin sunucu tarafı kodunda
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Bu hizmetin iş mantığını işleyin
} else {
  // Bu hizmetin iş mantığını işlemeyin
}
```