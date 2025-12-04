:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Çoka Bir

Bir kütüphane veritabanında iki varlık bulunur: kitaplar ve yazarlar. Bir yazar birden fazla kitap yazabilir, ancak her kitabın genellikle tek bir yazarı vardır. Bu durumda, yazarlar ve kitaplar arasındaki ilişki çoka bir şeklindedir. Birden çok kitap aynı yazarla ilişkilendirilebilir, ancak her kitabın yalnızca bir yazarı olabilir.

Varlık-İlişki (ER) diyagramı aşağıdaki gibidir:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Alan Yapılandırması:

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Parametre Açıklamaları

### Source collection

Kaynak koleksiyon, yani mevcut alanın bulunduğu koleksiyon.

### Target collection

Hedef koleksiyon, yani ilişkilendirilecek koleksiyon.

### Foreign key

Kaynak koleksiyondaki, iki koleksiyon arasında ilişki kurmak için kullanılan alan.

### Target key

Yabancı anahtar tarafından referans alınan hedef koleksiyondaki alan. Benzersiz olmalıdır.

### ON DELETE

ON DELETE, üst koleksiyondaki kayıtlar silindiğinde ilgili alt koleksiyonlardaki yabancı anahtar referanslarına uygulanan kuralları ifade eder. Bu, bir yabancı anahtar kısıtlaması tanımlarken kullanılan bir seçenektir. Yaygın ON DELETE seçenekleri şunlardır:

- CASCADE: Üst koleksiyondaki bir kayıt silindiğinde, alt koleksiyondaki ilgili tüm kayıtlar otomatik olarak silinir.
- SET NULL: Üst koleksiyondaki bir kayıt silindiğinde, ilgili alt koleksiyon kayıtlarındaki yabancı anahtar değerleri NULL olarak ayarlanır.
- RESTRICT: Varsayılan seçenektir. Alt koleksiyonda ilgili kayıtlar varsa, üst koleksiyon kaydının silinmesini engeller.
- NO ACTION: RESTRICT'e benzer şekilde, alt koleksiyonda ilgili kayıtlar varsa, üst koleksiyon kaydının silinmesini engeller.