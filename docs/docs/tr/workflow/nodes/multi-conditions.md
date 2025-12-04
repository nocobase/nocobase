:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Çoklu Koşullu Dallanma <Badge>v2.0.0+</Badge>

## Giriş

Programlama dillerindeki `switch / case` veya `if / else if` ifadelerine benzer şekilde çalışır. Sistem, yapılandırılan birden fazla koşulu sırayla tek tek değerlendirir. Bir koşul karşılandığında, ilgili dalın altındaki iş akışı yürütülür ve sonraki koşulların değerlendirilmesi atlanır. Tüm koşullar karşılanmazsa, 'Aksi Takdirde' dalı yürütülür.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, iş akışındaki artı ('+') düğmesine tıklayarak 'Çoklu Koşullu Dallanma' düğümünü ekleyebilirsiniz:

![Çoklu Koşullu Dallanma Düğümü Oluşturma](https://static-docs.nocobase.com/20251123222134.png)

## Dal Yönetimi

### Varsayılan Dallar

Düğüm oluşturulduktan sonra, varsayılan olarak iki dal içerir:

1.  **Koşul Dalı**: Belirli değerlendirme koşullarını yapılandırabilirsiniz.
2.  **Aksi Takdirde Dalı**: Tüm koşul dalları karşılanmadığında bu dala girilir; herhangi bir koşul yapılandırması gerektirmez.

Düğümün altındaki 'Dal Ekle' düğmesine tıklayarak daha fazla koşul dalı ekleyebilirsiniz.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Dal Ekleme

'Dal Ekle' düğmesine tıkladıktan sonra, yeni dal 'Aksi Takdirde' dalından önce eklenir.

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Dal Silme

Birden fazla koşul dalı mevcut olduğunda, dalın sağındaki çöp kutusu simgesine tıklayarak o dalı silebilirsiniz. Yalnızca bir koşul dalı kalırsa, bu dal silinemez.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Not}
Bir dalı silmek, o dalın içindeki tüm düğümleri de siler; lütfen dikkatli ilerleyin.

'Aksi Takdirde' dalı yerleşik bir daldır ve silinemez.
:::

## Düğüm Yapılandırması

### Koşul Yapılandırması

Dalın üst kısmındaki koşul adına tıklayarak belirli koşul içeriğini düzenleyebilirsiniz:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Koşul Etiketi

Özel etiketleri destekler. Doldurulduğunda, iş akışı şemasında koşul adı olarak görüntülenir. Yapılandırılmazsa (veya boş bırakılırsa), varsayılan olarak sırasıyla 'Koşul 1', 'Koşul 2' vb. şeklinde gösterilir.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Hesaplama Motoru

Şu anda üç motoru desteklemektedir:

-   **Temel**: Basit mantıksal karşılaştırmalar (örn. eşittir, içerir) ve 'VE'/'VEYA' kombinasyonları aracılığıyla sonuçları belirler.
-   **Math.js**: [Math.js](https://mathjs.org/) sözdizimini kullanarak ifade hesaplamalarını destekler.
-   **Formula.js**: [Formula.js](https://formulajs.info/) sözdizimini kullanarak ifade hesaplamalarını destekler (Excel formüllerine benzer).

Her üç mod da iş akışı bağlam değişkenlerini parametre olarak kullanmayı destekler.

### Hiçbir Koşul Karşılanmadığında

Düğüm yapılandırma panelinde, hiçbir koşul karşılanmadığında gerçekleştirilecek sonraki eylemi ayarlayabilirsiniz:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **İş akışını başarısızlıkla sonlandır (Varsayılan)**: İş akışı durumunu başarısız olarak işaretler ve süreci sonlandırır.
*   **Sonraki düğümleri yürütmeye devam et**: Mevcut düğüm tamamlandıktan sonra, iş akışındaki sonraki düğümleri yürütmeye devam eder.

:::info{title=Not}
Seçilen işleme yönteminden bağımsız olarak, hiçbir koşul karşılanmadığında, iş akışı önce 'Aksi Takdirde' dalına girerek içindeki düğümleri yürütür.
:::

## Yürütme Geçmişi

İş akışı yürütme geçmişinde, Çoklu Koşullu Dallanma düğümü her koşulun değerlendirme sonucunu farklı renklerle belirtir:

-   **Yeşil**: Koşul karşılandı; bu dala girildi ve yürütüldü.
-   **Kırmızı**: Koşul karşılanmadı (veya hesaplama hatası oluştu); bu dal atlandı.
-   **Mavi**: Değerlendirme yürütülmedi (önceki bir koşul zaten karşılandığı için sonraki değerlendirmeler atlandı).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Bir yapılandırma hatası nedeniyle koşul hesaplamasında bir istisna meydana gelirse, kırmızı renkte görüntülenmesinin yanı sıra, koşul adının üzerine fareyle gelindiğinde belirli hata bilgileri gösterilir:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Bir koşul hesaplama istisnası meydana geldiğinde, Çoklu Koşullu Dallanma düğümü 'Hata' durumuyla sona erer ve sonraki düğümleri yürütmeye devam etmez.