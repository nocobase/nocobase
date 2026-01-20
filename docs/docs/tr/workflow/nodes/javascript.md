---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# JavaScript Betiği

## Giriş

JavaScript Betiği düğümü, kullanıcıların bir iş akışı içinde özel bir sunucu tarafı JavaScript betiği çalıştırmasına olanak tanır. Betiğin içinde, iş akışının önceki adımlarından gelen değişkenleri parametre olarak kullanabilirsiniz. Ayrıca, betiğin dönüş değerini sonraki düğümlerin kullanımına sunabilirsiniz.

Betiğiniz, NocoBase uygulamasının sunucu tarafında ayrı bir iş parçacığında (worker thread) çalışır ve Node.js özelliklerinin çoğunu destekler. Ancak, yerel (native) yürütme ortamından bazı farklılıkları vardır. Ayrıntılar için [Özellik Listesi](#özellik-listesi) bölümüne bakabilirsiniz.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, iş akışındaki artı (“+”) düğmesine tıklayarak bir “JavaScript” düğümü ekleyebilirsiniz:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Düğüm Yapılandırması

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parametreler

Betiğe, iş akışı bağlamından değişkenler veya statik değerler aktarmak için kullanılır. Bu değerler, betiğin içindeki kod mantığı tarafından kullanılır. `name` alanı parametre adını belirtir; bu ad, betiğe aktarıldığında bir değişken adı olarak kullanılır. `value` ise parametre değeridir; burada bir değişken seçebilir veya sabit bir değer girebilirsiniz.

### Betiğin İçeriği

Betiğin içeriği bir fonksiyon olarak düşünülebilir. Node.js ortamında desteklenen herhangi bir JavaScript kodunu yazabilirsiniz. Ayrıca, `return` ifadesini kullanarak düğümün çalışma sonucu olarak bir değer döndürebilirsiniz. Bu değer, sonraki düğümler tarafından bir değişken olarak kullanılabilir.

Kodu yazdıktan sonra, düzenleyici kutusunun altındaki test düğmesine tıklayarak bir test yürütme iletişim kutusu açabilirsiniz. Burada parametreleri statik değerlerle doldurarak simüle edilmiş bir çalıştırma yapabilirsiniz. Çalıştırma sonrasında, iletişim kutusunda dönüş değerini ve çıktı (log) içeriğini görebilirsiniz.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Zaman Aşımı Ayarı

Birim milisaniyedir. `0` olarak ayarlandığında, zaman aşımı belirlenmez.

### Hata Durumunda Akışı Sürdür

Bu seçenek işaretlendiğinde, betik bir hatayla karşılaşsa veya zaman aşımına uğrasa bile sonraki düğümler çalışmaya devam eder.

:::info{title="Not"}
Betiğin bir hata vermesi durumunda, herhangi bir dönüş değeri olmayacaktır. Düğümün sonucu hata mesajıyla doldurulur. Eğer sonraki düğümler betik düğümünün sonuç değişkenini kullanıyorsa, bu durumu dikkatli bir şekilde ele almanız gerekir.
:::

## Özellik Listesi

### Node.js Sürümü

Ana uygulamanın çalıştığı Node.js sürümüyle aynıdır.

### Modül Desteği

Betiğin içinde modülleri sınırlı bir şekilde kullanabilirsiniz. CommonJS ile uyumlu olarak, kodunuzda `require()` yönergesini kullanarak modülleri dahil edersiniz.

Node.js'in yerel modülleri ve `node_modules` içinde yüklü olan modüller (NocoBase tarafından zaten kullanılan bağımlılıklar dahil) desteklenir. Kodunuzda kullanmak istediğiniz modüllerin uygulamanın `WORKFLOW_SCRIPT_MODULES` ortam değişkeninde tanımlanması gerekir. Birden fazla paket adı, virgülle ayrılarak belirtilir, örneğin:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Not"}
`WORKFLOW_SCRIPT_MODULES` ortam değişkeninde tanımlanmamış modüller, Node.js'in yerel modülleri veya `node_modules` içinde yüklü olsalar bile, betiklerde **kullanılamazlar**. Bu politika, operasyonel düzeyde kullanıcıların kullanabileceği modül listesini kontrol etmek için kullanılabilir. Böylece, bazı senaryolarda betiklerin aşırı yetkilere sahip olması engellenir.
:::

Kaynak koddan dağıtım yapılmayan bir ortamda, eğer bir modül `node_modules` içinde yüklü değilse, ihtiyaç duyduğunuz paketi `storage` dizinine manuel olarak yükleyebilirsiniz. Örneğin, `exceljs` paketini kullanmanız gerektiğinde, aşağıdaki adımları uygulayabilirsiniz:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Ardından, bu paketin uygulamanın CWD'sine (mevcut çalışma dizini) göreceli (veya mutlak) yolunu `WORKFLOW_SCRIPT_MODULES` ortam değişkenine ekleyin:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Böylece `exceljs` paketini betiğinizde kullanabilirsiniz:

```js
const ExcelJS = require('exceljs');
// ...
```

### Global Değişkenler

`global`, `process`, `__dirname` ve `__filename` gibi global değişkenler **desteklenmez**.

```js
console.log(global); // will throw error: "global is not defined"
```

### Giriş Parametreleri

Düğümde yapılandırılan parametreler, betiğin içinde global değişkenler olarak doğrudan kullanılabilir. Betiğe aktarılan parametreler yalnızca `boolean`, `number`, `string`, `object` ve diziler gibi temel türleri destekler. Bir `Date` nesnesi aktarıldığında, ISO formatında bir dizgeye dönüştürülür. Özel sınıf örnekleri gibi diğer karmaşık türler doğrudan aktarılamaz.

### Dönüş Değeri

`return` ifadesini kullanarak temel veri türlerini (parametre kurallarıyla aynı) düğüme sonuç olarak döndürebilirsiniz. Eğer kodda `return` ifadesi çağrılmazsa, düğüm yürütmesinin bir dönüş değeri olmaz.

```js
return 123;
```

### Çıktı (Log)

Logları `console` kullanarak çıktı vermeniz **desteklenir**.

```js
console.log('hello world!');
```

İş akışı çalıştırıldığında, betik düğümünün çıktısı da ilgili iş akışının log dosyasına kaydedilir.

### Asenkron

`async` kullanarak asenkron fonksiyonlar tanımlamanız ve `await` ile asenkron fonksiyonları çağırmanız **desteklenir**. `Promise` global nesnesini kullanmanız da **desteklenir**.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Zamanlayıcılar

`setTimeout`, `setInterval` veya `setImmediate` gibi metotları kullanmak isterseniz, bunları Node.js'in `timers` paketinden dahil etmeniz gerekir.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```