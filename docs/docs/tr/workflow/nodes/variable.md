---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Değişken

## Giriş

Bir iş akışında değişkenler tanımlayabilir veya tanımlanmış değişkenlere değer atayabilirsiniz. Bu, genellikle iş akışı içinde geçici verileri depolamak için kullanılır.

## Düğüm Oluşturma

iş akışı yapılandırma arayüzünde, iş akışındaki artı ('+') düğmesine tıklayarak bir "Değişken" düğümü ekleyebilirsiniz:

![Değişken Düğümü Ekle](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Düğümü Yapılandırma

### Mod

Değişken düğümü, programlamadaki değişkenlere benzerdir; kullanılmadan ve değer atanmadan önce tanımlanması gerekir. Bu nedenle, bir değişken düğümü oluştururken, değişkenin modunu seçmeniz gerekir. İki mod mevcuttur:

![Mod Seçimi](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Yeni bir değişken tanımlayın: Yeni bir değişken oluşturur.
- Mevcut bir değişkene değer atayın: İş akışında daha önce tanımlanmış bir değişkene değer atar, bu da değişkenin değerini değiştirmeye eşdeğerdir.

Oluşturulan düğüm, iş akışındaki ilk değişken düğümü olduğunda, yalnızca tanımlama modunu seçebilirsiniz, çünkü henüz atanabilecek herhangi bir değişken bulunmamaktadır.

Tanımlanmış bir değişkene değer atamayı seçtiğinizde, hedef değişkeni, yani değişkenin tanımlandığı düğümü de seçmeniz gerekir:

![Değer Atanacak Değişkeni Seçin](https://static-docs.nocobase.com/1ce891154d87347e693d8cc8ac1953eb.png)

### Değer

Bir değişkenin değeri herhangi bir türde olabilir. Dize, sayı, mantıksal değer veya tarih gibi bir sabit olabileceği gibi, iş akışındaki başka bir değişken de olabilir.

Tanımlama modunda, değişkenin değerini ayarlamak, ona bir başlangıç değeri atamaya eşdeğerdir.

![Başlangıç Değeri Tanımlama](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

Atama modunda, değişkenin değerini ayarlamak, tanımlanmış hedef değişkenin değerini yeni bir değerle değiştirmeye eşdeğerdir. Sonraki kullanımlarda bu yeni değer alınacaktır.

![Tanımlanmış bir değişkene tetikleyici değişken atayın](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Değişkenin Değerini Kullanma

Değişken düğümünden sonraki düğümlerde, "Düğüm Değişkenleri" grubundan tanımlanmış değişkeni seçerek bu değişkenin değerini kullanabilirsiniz. Örneğin, bir sorgu düğümünde, değişkenin değerini bir sorgu koşulu olarak kullanabilirsiniz:

![Değişken değerini sorgu filtre koşulu olarak kullanın](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Örnek

Değişken düğümünün daha kullanışlı olduğu bir senaryo, yeni değerlerin önceki değerlerle hesaplandığı veya birleştirildiği (programlamadaki `reduce`/`concat` gibi) ve dal bittikten sonra kullanıldığı durumlardır. Aşağıda, bir döngü dalı ve bir değişken düğümü kullanarak bir alıcı dizesini birleştirme örneği verilmiştir.

Öncelikle, "Makale" verileri güncellendiğinde tetiklenen ve ilgili "Yazar" ilişki verilerini (alıcıları almak için) önceden yükleyen bir koleksiyon tetiklemeli iş akışı oluşturun:

![Tetikleyiciyi Yapılandır](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Ardından, alıcı dizesini depolamak için bir değişken düğümü oluşturun:

![Alıcı değişken düğümü](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Daha sonra, makalenin yazarlarını yinelemek ve alıcı bilgilerini alıcı değişkenine birleştirmek için bir döngü dalı düğümü oluşturun:

![Makaledeki yazarlar arasında döngü oluşturun](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Döngü dalının içinde, mevcut yazarı daha önce depolanmış yazar dizesiyle birleştirmek için önce bir hesaplama düğümü oluşturun:

![Alıcı dizesini birleştirin](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Hesaplama düğümünden sonra başka bir değişken düğümü oluşturun. Atama modunu seçin, atama hedefi olarak alıcı değişken düğümünü belirleyin ve değer olarak hesaplama düğümünün sonucunu seçin:

![Birleştirilmiş alıcı dizesini alıcı düğümüne atayın](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Bu şekilde, döngü dalı tamamlandıktan sonra, alıcı değişkeni tüm makale yazarlarının alıcı dizesini depolamış olacaktır. Daha sonra, döngüden sonra bir HTTP İstek düğümü kullanarak bir e-posta gönderme API'sini çağırabilir ve alıcı değişkeninin değerini API'ye alıcı parametresi olarak iletebilirsiniz:

![İstek düğümü aracılığıyla alıcılara e-posta gönderin](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)

Bu noktada, döngü ve değişken düğümleri kullanılarak basit bir toplu e-posta özelliği uygulanmış oldu.