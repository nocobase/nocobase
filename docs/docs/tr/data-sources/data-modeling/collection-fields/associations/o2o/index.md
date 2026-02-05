:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Bire Bir

Çalışanlar ve kişisel profiller arasındaki ilişkide, her çalışanın yalnızca bir kişisel profil kaydı olabilir ve her kişisel profil kaydı da yalnızca bir çalışana karşılık gelebilir. Bu durumda, çalışan ile kişisel profil arasındaki ilişki bire bir olarak tanımlanır.

Bire bir ilişkideki yabancı anahtar, kaynak koleksiyonda veya hedef koleksiyonda bulunabilir. Eğer "bir şeye sahip olma" durumunu ifade ediyorsa, yabancı anahtarın hedef koleksiyonda olması daha uygun olur; "ait olma ilişkisini" belirtiyorsa, yabancı anahtarın kaynak koleksiyonda yer alması daha doğru olacaktır.

Örneğin, yukarıda bahsedilen durumda, bir çalışanın yalnızca bir kişisel profili varsa ve bu kişisel profil çalışana aitse, yabancı anahtarın kişisel profil koleksiyonuna yerleştirilmesi uygun olacaktır.

## Bire Bir (Bir Şeye Sahip Olma)

Bu, bir çalışanın bir kişisel profil kaydına sahip olduğunu gösterir.

ER İlişkisi

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Alan Yapılandırması

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Bire Bir (Ait Olma)

Bu, bir kişisel profilin belirli bir çalışana ait olduğunu gösterir.

ER İlişkisi

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Alan Yapılandırması

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Parametre Açıklamaları

### Kaynak Koleksiyon

Kaynak koleksiyon, yani mevcut alanın bulunduğu koleksiyon.

### Hedef Koleksiyon

Hedef koleksiyon, yani ilişkilendirilen koleksiyon.

### Yabancı Anahtar

İki koleksiyon arasında bir ilişki kurmak için kullanılır. Bire bir ilişkideki yabancı anahtar, kaynak koleksiyonda veya hedef koleksiyonda bulunabilir. Eğer "bir şeye sahip olma" durumunu ifade ediyorsa, yabancı anahtarın hedef koleksiyonda olması daha uygun olur; "ait olma ilişkisini" belirtiyorsa, yabancı anahtarın kaynak koleksiyonda yer alması daha doğru olacaktır.

### Kaynak Anahtar <- Yabancı Anahtar (Yabancı Anahtar Hedef Koleksiyonda)

Yabancı anahtar kısıtlaması tarafından referans alınan alan benzersiz olmalıdır. Yabancı anahtar hedef koleksiyonda bulunduğunda, "bir şeye sahip olma" durumunu ifade eder.

### Hedef Anahtar <- Yabancı Anahtar (Yabancı Anahtar Kaynak Koleksiyonda)

Yabancı anahtar kısıtlaması tarafından referans alınan alan benzersiz olmalıdır. Yabancı anahtar kaynak koleksiyonda bulunduğunda, "ait olma ilişkisini" ifade eder.

### ON DELETE

ON DELETE, ana koleksiyondaki kayıtlar silindiğinde, ilgili alt koleksiyondaki yabancı anahtar referansları için geçerli olan işlem kurallarını ifade eder. Bu, bir yabancı anahtar kısıtlaması tanımlanırken kullanılan bir seçenektir. Yaygın ON DELETE seçenekleri şunlardır:

- CASCADE: Ana koleksiyondaki bir kayıt silindiğinde, alt koleksiyondaki tüm ilgili kayıtları otomatik olarak siler.
- SET NULL: Ana koleksiyondaki bir kayıt silindiğinde, ilgili alt koleksiyondaki yabancı anahtar değerini NULL olarak ayarlar.
- RESTRICT: Varsayılan seçenektir. Ana koleksiyondaki bir kaydı silmeye çalışırken, ilgili alt koleksiyonda kayıtlar varsa, ana koleksiyon kaydının silinmesini reddeder.
- NO ACTION: RESTRICT'e benzer şekilde, ilgili alt koleksiyonda kayıtlar varsa, ana koleksiyon kaydının silinmesini reddeder.