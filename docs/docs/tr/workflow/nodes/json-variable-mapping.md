---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# JSON Değişken Eşleme

> v1.6.0

## Giriş

Yukarı akış düğümlerinin sonuçlarındaki karmaşık JSON yapılarını, sonraki düğümlerde kullanılmak üzere değişkenlere eşlemek için kullanılır. Örneğin, SQL İşlemi ve HTTP İstek düğümlerinin sonuçları eşlendikten sonra, bu sonuçlardaki özellik değerlerini sonraki düğümlerde kullanabilirsiniz.

:::info{title=İpucu}
JSON Hesaplama düğümünden farklı olarak, JSON Değişken Eşleme düğümü özel ifadeleri desteklemez ve üçüncü taraf bir motor kullanmaz. Yalnızca bir JSON yapısındaki özellik değerlerini eşlemek için kullanılır, ancak kullanımı daha basittir.
:::

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ('+') düğmesine tıklayarak bir "JSON Değişken Eşleme" düğümü ekleyin:

![Düğüm Oluşturma](https://static-docs.nocobase.com/20250113173635.png)

## Düğüm Yapılandırması

### Veri Kaynağı

Veri kaynağı, önceki bir düğümün sonucu veya iş akışı bağlamındaki bir veri nesnesi olabilir. Genellikle, bir SQL düğümünün veya bir HTTP İstek düğümünün sonucu gibi, yapılandırılmamış bir veri nesnesidir.

![Veri Kaynağı](https://static-docs.nocobase.com/20250113173720.png)

### Örnek Veri Girişi

Örnek veriyi yapıştırın ve değişken listesini otomatik olarak oluşturmak için ayrıştırma düğmesine tıklayın:

![Örnek Veri Girişi](https://static-docs.nocobase.com/20250113182327.png)

Otomatik olarak oluşturulan listede kullanmak istemediğiniz değişkenler varsa, sil düğmesine tıklayarak bunları kaldırabilirsiniz.

:::info{title=İpucu}
Örnek veri, nihai yürütme sonucu değildir; yalnızca değişken listesini oluşturmaya yardımcı olmak için kullanılır.
:::

### Yol Dizi İndeksi İçerir

İşaretlenmediğinde, dizi içeriği NocoBase iş akışlarının varsayılan değişken işleme yöntemine göre eşlenir. Örneğin, aşağıdaki örneği girin:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

Oluşturulan değişkenlerde, `b.c` ifadesi `[2, 3]` dizisini temsil edecektir.

Bu seçenek işaretlenirse, değişken yolu dizi indeksini içerecektir, örneğin `b.0.c` ve `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Dizi indeksleri dahil edildiğinde, giriş verilerindeki dizi indekslerinin tutarlı olduğundan emin olmanız gerekir; aksi takdirde bir ayrıştırma hatasına neden olacaktır.

## Sonraki Düğümlerde Kullanım

Sonraki düğümlerin yapılandırmasında, JSON Değişken Eşleme düğümü tarafından oluşturulan değişkenleri kullanabilirsiniz:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

JSON yapısı karmaşık olsa da, eşleme işleminden sonra yalnızca ilgili yoldaki değişkeni seçmeniz yeterlidir.