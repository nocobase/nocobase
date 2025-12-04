:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Koşul

## Giriş

Programlama dillerindeki `if` ifadesine benzer şekilde, yapılandırılmış bir koşulun sonucuna göre iş akışının ilerleyişini belirler.

## Düğüm Oluşturma

Koşul düğümünün iki modu vardır: "Doğruysa Devam Et" ve "Doğru/Yanlış Durumunda Dallan". Düğümü oluştururken bu modlardan birini seçmeniz gerekir ve bu seçim daha sonra düğümün yapılandırmasında değiştirilemez.

![Koşul_Mod_Seçimi](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

"Doğruysa Devam Et" modunda, koşulun sonucu "doğru" olduğunda, iş akışı sonraki düğümleri yürütmeye devam eder. Aksi takdirde, iş akışı sonlanır ve başarısız bir durumla erken çıkar.

!["Doğruysa Devam Et" modu](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Bu mod, koşul karşılanmadığında iş akışının ilerlememesi gereken senaryolar için uygundur. Örneğin, bir sipariş göndermek için kullanılan form gönderme düğmesi bir "Eylem Öncesi Olayı"na bağlıysa ve siparişteki ürünün stoğu yetersizse, sipariş oluşturma sürecine devam edilmemeli, bunun yerine başarısız olup çıkılmalıdır.

"Doğru/Yanlış Durumunda Dallan" modunda, koşul düğümü, koşulun "doğru" veya "yanlış" sonuçlarına karşılık gelen iki ayrı iş akışı dalı oluşturur. Her bir dal, kendi sonraki düğümleriyle ayrı ayrı yapılandırılabilir. Herhangi bir dalın yürütülmesi tamamlandıktan sonra, otomatik olarak koşul düğümünün üst dalına geri birleşir ve sonraki düğümlerin yürütülmesine devam edilir.

!["Doğru/Yanlış Durumunda Dallan" modu](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Bu mod, koşulun karşılanıp karşılanmamasına bağlı olarak farklı eylemlerin gerçekleştirilmesi gereken senaryolar için uygundur. Örneğin, belirli bir verinin var olup olmadığını kontrol etmek: yoksa yeni bir kayıt oluşturmak; varsa mevcut kaydı güncellemek.

## Düğüm Yapılandırması

### Hesaplama Motoru

Şu anda üç motor desteklenmektedir:

-   **Temel**: Basit ikili hesaplamalar ve "VE"/"VEYA" gruplandırması aracılığıyla mantıksal bir sonuç elde eder.
-   **Math.js**: [Math.js](https://mathjs.org/) motoru tarafından desteklenen ifadeleri hesaplayarak mantıksal bir sonuç elde eder.
-   **Formula.js**: [Formula.js](https://formulajs.info/) motoru tarafından desteklenen ifadeleri hesaplayarak mantıksal bir sonuç elde eder.

Her üç hesaplama türünde de iş akışı bağlamındaki değişkenler parametre olarak kullanılabilir.