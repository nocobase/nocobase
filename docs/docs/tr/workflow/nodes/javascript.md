---
pkg: '@nocobase/plugin-workflow-javascript'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/workflow/nodes/javascript) bakın.
:::

# JavaScript Betiği

## Giriş

JavaScript betiği düğümü, kullanıcıların bir iş akışı içinde özel bir sunucu tarafı JavaScript betiği yürütmesine olanak tanır. Betikte, iş akışının üst akışındaki değişkenler parametre olarak kullanılabilir ve betiğin dönüş değeri alt akış düğümlerinin kullanımına sunulabilir.

Betik, NocoBase uygulamasının sunucu tarafında bir iş parçacığında (worker thread) yürütülür ve Node.js özelliklerinin çoğunu destekler, ancak yerel yürütme ortamıyla bazı farklılıklar vardır; ayrıntılar için bkz. [Özellik Listesi](#özellik-listesi).

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak "JavaScript" düğümü ekleyin:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Düğüm Yapılandırması

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parametreler

Kod mantığında kullanılmak üzere iş akışı bağlamından değişkenleri veya statik değerleri betiğe aktarmak için kullanılır. Burada `name` parametre adıdır ve betiğe aktarıldıktan sonra değişken adı olarak kullanılır. `value` parametre değeridir; bir değişken seçebilir veya bir sabit girebilirsiniz.

### Betik İçeriği

Betik içeriği bir fonksiyon olarak görülebilir; Node.js ortamında desteklenen herhangi bir JavaScript kodu yazılabilir ve sonraki düğümlerin değişken olarak kullanabilmesi için düğümün çalışma sonucu olarak bir değer döndürmek üzere `return` ifadesi kullanılabilir.

Kod yazıldıktan sonra, düzenleme kutusunun altındaki test düğmesi aracılığıyla test yürütme iletişim kutusu açılabilir ve parametreler statik değerlerle doldurularak simüle edilmiş bir yürütme gerçekleştirilebilir. Yürütmeden sonra, iletişim kutusunda dönüş değerini ve çıktı (günlük) içeriğini görebilirsiniz.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Zaman Aşımı Ayarı

Birim milisaniyedir; `0` olarak ayarlandığında zaman aşımı ayarlanmadığı anlamına gelir.

### Hata Sonrası Akışa Devam Et

İşaretlendiğinde, betik hatası veya zaman aşımı hatası durumunda bile sonraki düğümler yürütülmeye devam eder.

:::info{title="İpucu"}
Betik hatasından sonra dönüş değeri olmayacak ve düğümün sonucu hata mesajıyla doldurulacaktır. Sonraki düğümlerde betik düğümünün sonuç değişkeni kullanılıyorsa, dikkatli olunmalıdır.
:::

## Özellik Listesi

### Node.js Sürümü

Ana uygulamanın çalıştığı Node.js sürümüyle aynıdır.

### Modül Desteği

Betikte modüller kısıtlı bir şekilde kullanılabilir; CommonJS ile tutarlı olarak, modülleri içe aktarmak için kodda `require()` komutu kullanılır.

Node.js yerel modülleri ve `node_modules` içinde yüklü olan modüller (NocoBase tarafından kullanılan bağımlılık paketleri dahil) desteklenir. Kodun kullanımına sunulacak modüllerin, uygulama ortam değişkeni `WORKFLOW_SCRIPT_MODULES` içinde bildirilmesi gerekir; birden fazla paket adı virgülle ayrılır, örneğin:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="İpucu"}
`WORKFLOW_SCRIPT_MODULES` ortam değişkeninde bildirilmemiş modüller, Node.js yerel modülleri olsalar veya `node_modules` içinde yüklü olsalar bile betikte **kullanılamaz**. Bu strateji, operasyonel düzeyde kullanıcıların kullanabileceği modül listesini kontrol etmek ve bazı senaryolarda betik yetkilerinin çok yüksek olmasını önlemek için kullanılabilir.
:::

Kaynak kod tabanlı olmayan dağıtım ortamlarında, eğer bir modül `node_modules` içinde yüklü değilse, gerekli paket `storage` dizinine manuel olarak yüklenebilir. Örneğin, `exceljs` paketini kullanmanız gerektiğinde şu işlemleri yapabilirsiniz:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Ardından, bu paketin uygulamanın CWD'sine (geçerli çalışma dizini) göreli (veya mutlak) yolunu `WORKFLOW_SCRIPT_MODULES` ortam değişkenine ekleyin:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Böylece betikte `exceljs` paketini kullanabilirsiniz (`require` adı, ortam değişkeninde tanımlananla tamamen aynı olmalıdır):

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

### Global Değişkenler

`global`, `process`, `__dirname` ve `__filename` gibi global değişkenler **desteklenmez**.

```js
console.log(global); // will throw error: "global is not defined"
```

### Giriş Parametreleri

Düğümde yapılandırılan parametreler betikte global değişkenler olarak işlev görür ve doğrudan kullanılabilir. Betiğe aktarılan parametreler yalnızca `boolean`, `number`, `string`, `object` ve diziler gibi temel türleri destekler. `Date` nesnesi aktarıldıktan sonra ISO formatında bir dizeye dönüştürülür. Özel sınıf örnekleri gibi diğer karmaşık türler doğrudan aktarılamaz.

### Dönüş Değeri

`return` ifadesi aracılığıyla, temel türdeki veriler (parametre kurallarıyla aynı) sonuç olarak düğüme döndürülebilir. Kodda `return` ifadesi çağrılmazsa, düğüm yürütmesinin dönüş değeri olmaz.

```js
return 123;
```

### Çıktı (Günlük)

Günlük çıktısı için `console` kullanımı **desteklenir**.

```js
console.log('hello world!');
```

İş akışı yürütüldüğünde, betik düğümünün çıktısı ilgili iş akışının günlük dosyasına da kaydedilir.

### Asenkron

Asenkron fonksiyonları tanımlamak için `async` ve asenkron fonksiyonları çağırmak için `await` kullanımı **desteklenir**. `Promise` global nesnesinin kullanımı **desteklenir**.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Zamanlayıcılar

`setTimeout`, `setInterval` veya `setImmediate` gibi yöntemleri kullanmanız gerekirse, bunları Node.js'in `timers` paketi aracılığıyla içe aktarmanız gerekir.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```