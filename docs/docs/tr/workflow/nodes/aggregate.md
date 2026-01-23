---
pkg: '@nocobase/plugin-workflow-aggregate'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Agrega Sorgusu

## Giriş

Belirli koşulları karşılayan bir koleksiyondaki veriler üzerinde agrega fonksiyon sorguları yapmak ve ilgili istatistiksel sonuçları döndürmek için kullanılır. Raporlarla ilgili istatistiksel verileri işlemek için sıkça başvurulur.

Bu düğümün uygulaması, veritabanı agrega fonksiyonlarına dayanır. Şu anda, yalnızca bir koleksiyonun tek bir alanı üzerinde istatistiksel işlem yapmayı desteklemektedir. İstatistiksel sonuçların sayısal değeri, sonraki düğümler tarafından kullanılmak üzere düğümün çıktısında saklanır.

## Kurulum

Dahili bir eklentidir, kurulum gerektirmez.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, iş akışındaki artı ('+') düğmesine tıklayarak 'Agrega Sorgusu' düğümünü ekleyin:

![Agrega Sorgusu Düğümü Oluşturma](https://static-docs.nocobase.com/7f9d806ebf5064f80c30f8b67f316f0f.png)

## Düğüm Yapılandırması

![Agrega Sorgusu Düğümü_Düğüm Yapılandırması](https://static-docs.nocobase.com/57362f747b9992230567c6bb5e986fd2.png)

### Agrega Fonksiyonu

SQL'deki `COUNT`, `SUM`, `AVG`, `MIN` ve `MAX` olmak üzere toplam 5 agrega fonksiyonunu destekler. Veriler üzerinde agrega sorgusu yapmak için bunlardan birini seçin.

### Hedef Türü

Agrega sorgusunun hedefi iki farklı modda seçilebilir. Bunlardan biri, doğrudan hedef koleksiyonu ve bu koleksiyondaki bir alanı seçmektir. Diğeri ise, iş akışı bağlamında mevcut bir veri nesnesi aracılığıyla, bu nesnenin bire çok ilişkili koleksiyonunu ve alanını seçerek agrega sorgusu yapmaktır.

### Tekilleştirme

SQL'deki `DISTINCT` ifadesidir. Tekilleştirme alanı, seçilen koleksiyon alanıyla aynıdır. Şu anda bu ikisi için farklı alanlar seçilmesi desteklenmemektedir.

### Filtre Koşulları

Normal bir koleksiyon sorgusundaki filtre koşullarına benzer şekilde, iş akışının bağlam değişkenlerini kullanabilirsiniz.

## Örnek

Agrega hedefi 'Koleksiyon verisi' nispeten daha kolay anlaşılır. Burada, 'yeni bir makale eklendikten sonra o makalenin kategorisindeki toplam makale sayısını sayma' örneğini kullanarak, agrega hedefi 'İlişkili koleksiyon verisi'nin kullanımını açıklayacağız.

Öncelikle, 'Makaleler' ve 'Kategoriler' adında iki koleksiyon oluşturun. Makaleler koleksiyonunda, Kategoriler koleksiyonuna işaret eden çoktan bire ilişkili bir alan bulunur. Aynı zamanda, Kategoriler'den Makaleler'e doğru tersine bire çok ilişkili bir alan da oluşturulur:

| Alan Adı   | Tip                   |
| ---------- | --------------------- |
| Başlık     | Tek Satır Metin       |
| Kategori   | Çoktan Bire (Kategoriler) |

| Alan Adı    | Tip                 |
| ----------- | ------------------- |
| Kategori Adı | Tek Satır Metin     |
| Makaleler   | Bire Çok (Makaleler) |

Ardından, bir koleksiyon olayı tarafından tetiklenen bir iş akışı oluşturun. Makaleler koleksiyonuna yeni veri eklendikten sonra tetiklenecek şekilde ayarlayın.

Daha sonra bir agrega sorgusu düğümü ekleyin ve aşağıdaki gibi yapılandırın:

![Agrega Sorgusu Düğümü_Örnek_Düğüm Yapılandırması](https://static-docs.nocobase.com/542272e6373d1b37ddda78.png)

Bu şekilde, iş akışı tetiklendikten sonra, agrega sorgusu düğümü, yeni eklenen makalenin kategorisindeki tüm makalelerin sayısını sayacak ve bunu düğümün sonucu olarak kaydedecektir.

:::info{title=İpucu}
Koleksiyon olayı tetikleyicisinden ilişki verilerini kullanmanız gerekiyorsa, tetikleyicideki "İlişkili verileri önceden yükle" bölümünde ilgili alanları yapılandırmanız gerekir, aksi takdirde seçilemez.
:::