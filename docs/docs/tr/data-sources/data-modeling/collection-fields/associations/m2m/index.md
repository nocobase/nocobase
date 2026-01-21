:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Çoktan Çoka

Bir ders kayıt sisteminde, öğrenciler ve dersler olmak üzere iki varlık bulunur. Bir öğrenci birden fazla derse kaydolabilir ve bir dersin de birden fazla öğrencisi olabilir; bu durum çoktan çoka bir ilişkiyi oluşturur. İlişkisel bir veritabanında, öğrenciler ve dersler arasındaki çoktan çoka ilişkiyi temsil etmek için genellikle bir ders kayıt koleksiyonu gibi bir ara koleksiyon kullanılır. Bu koleksiyon, her öğrencinin hangi dersleri seçtiğini ve her dersin hangi öğrenciler tarafından alındığını kaydedebilir. Bu tasarım, öğrenciler ve dersler arasındaki çoktan çoka ilişkiyi etkili bir şekilde temsil eder.

ER Diyagramı:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Alan Yapılandırması:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Parametre Açıklamaları

### Kaynak koleksiyon

Kaynak koleksiyon, yani mevcut alanın bulunduğu koleksiyon.

### Hedef koleksiyon

Hedef koleksiyon, yani ilişkilendirilecek koleksiyon.

### Ara koleksiyon

Ara koleksiyon, iki varlık arasında çoktan çoka bir ilişki olduğunda bu ilişkiyi depolamak için kullanılır. Ara koleksiyon, iki varlık arasındaki ilişkiyi sürdürmek için kullanılan iki yabancı anahtara sahiptir.

### Kaynak anahtar

Yabancı anahtar tarafından referans alınan kaynak koleksiyondaki alan. Benzersiz olmalıdır.

### Yabancı anahtar 1

Kaynak koleksiyon ile ilişkiyi kuran ara koleksiyondaki alan.

### Yabancı anahtar 2

Hedef koleksiyon ile ilişkiyi kuran ara koleksiyondaki alan.

### Hedef anahtar

Yabancı anahtar tarafından referans alınan hedef koleksiyondaki alan. Benzersiz olmalıdır.

### ON DELETE

ON DELETE, üst koleksiyondaki kayıtlar silindiğinde ilgili alt koleksiyonlardaki yabancı anahtar referanslarına uygulanan kuralları ifade eder. Bu, bir yabancı anahtar kısıtlaması tanımlarken kullanılan bir seçenektir. Yaygın ON DELETE seçenekleri şunlardır:

- **CASCADE**: Üst koleksiyondaki bir kayıt silindiğinde, alt koleksiyondaki ilgili tüm kayıtlar otomatik olarak silinir.
- **SET NULL**: Üst koleksiyondaki bir kayıt silindiğinde, ilgili alt koleksiyon kayıtlarındaki yabancı anahtar değerleri NULL olarak ayarlanır.
- **RESTRICT**: Varsayılan seçenektir; üst koleksiyon kaydını silmeye çalışırken, alt koleksiyonda ilgili kayıtlar varsa silme işlemini engeller.
- **NO ACTION**: RESTRICT'e benzer; alt koleksiyonda ilgili kayıtlar varsa üst koleksiyon kaydının silinmesini engeller.