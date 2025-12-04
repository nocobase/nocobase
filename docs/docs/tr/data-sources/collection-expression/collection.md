:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İfade Koleksiyonu

## İfade Koleksiyonu Şablonu Oluşturma

İş akışı içinde dinamik ifade işlem düğümlerini kullanmadan önce, farklı ifadeleri depolamak için koleksiyon yönetim aracında bir "İfade" koleksiyonu şablonu oluşturmanız gerekir:

![İfade Koleksiyonu Oluşturma](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## İfade Verilerini Girme

Ardından, bu şablon koleksiyonuna birkaç formül verisi eklemek için bir tablo bloğu oluşturabilirsiniz. "İfade" koleksiyonu şablonundaki her satır, belirli bir koleksiyon veri modeli için bir hesaplama kuralı olarak anlaşılabilir. Her formül verisi satırı, farklı koleksiyonların veri modellerindeki alan değerlerini değişken olarak kullanabilir, farklı ifadelerle hesaplama kuralları oluşturabilir ve elbette farklı hesaplama motorları da kullanabilirsiniz.

![İfade Verilerini Girme](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=İpucu}
Formüller oluşturulduktan sonra, bunları iş verileriyle ilişkilendirmeniz gerekir. Her bir iş verisi satırını doğrudan formül verisiyle ilişkilendirmek zahmetli olabilir. Bu nedenle, genellikle bir sınıflandırma koleksiyonuna benzer bir meta veri koleksiyonu kullanarak formül koleksiyonuyla çoktan-bire (veya bire-bir) bir ilişki kurarız. Ardından, iş verileri sınıflandırılmış meta verilerle çoktan-bire bir ilişkiyle ilişkilendirilir. Bu yaklaşım, iş verilerini oluştururken ilgili sınıflandırılmış meta verileri belirtmenizi sağlar, böylece oluşturulan ilişkilendirme yoluyla ilgili formül verilerini kolayca bulabilir ve kullanabilirsiniz.
:::

## Sürece İlgili Verileri Yükleme

Örnek olarak, bir koleksiyon olayı tarafından tetiklenen bir iş akışı oluşturalım. Bir sipariş oluşturulduğunda, tetikleyicinin ilgili ürün verilerini ve ürünle ilişkili ifade verilerini önceden yüklemesi gerekir:

![Koleksiyon Olayı_Tetikleyici Yapılandırması](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)