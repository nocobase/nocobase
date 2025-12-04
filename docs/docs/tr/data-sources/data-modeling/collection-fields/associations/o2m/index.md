:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Bire Çok İlişki

Bir sınıfın birden fazla öğrencisi olabilir, ancak her öğrenci yalnızca bir sınıfa aittir. Sınıf ve öğrenciler arasındaki bu ilişki, bire çok ilişkiye bir örnektir.

ER Diyagramı:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Alan Yapılandırması:

![alt text](https://static-docs.nocobase.com/a608ce44821172dad7e8ab760107ff4e.png)

## Parametre Açıklamaları

### Kaynak Koleksiyon

Kaynak koleksiyonu, yani mevcut alanın bulunduğu koleksiyon.

### Hedef Koleksiyon

Hedef koleksiyonu, yani ilişkilendirilecek koleksiyon.

### Kaynak Anahtar

Yabancı anahtar kısıtlamasının referans aldığı kaynak koleksiyondaki alan. Benzersiz olmalıdır.

### Yabancı Anahtar

İki koleksiyon arasındaki ilişkiyi kurmak için kullanılan hedef koleksiyondaki alan.

### Hedef Anahtar

İlişki bloğundaki her bir satır kaydını görüntülemek için kullanılan hedef koleksiyondaki alan, genellikle benzersiz bir alandır.

### ON DELETE

ON DELETE, üst koleksiyondaki kayıtlar silindiğinde ilgili alt koleksiyonlardaki yabancı anahtar referanslarına uygulanan kuralları ifade eder. Bu, bir yabancı anahtar kısıtlaması tanımlarken kullanılan bir seçenektir. Yaygın ON DELETE seçenekleri şunlardır:

- **CASCADE**: Üst koleksiyondaki bir kayıt silindiğinde, alt koleksiyondaki ilgili tüm kayıtlar otomatik olarak silinir.
- **SET NULL**: Üst koleksiyondaki bir kayıt silindiğinde, ilgili alt koleksiyon kayıtlarındaki yabancı anahtar değerleri NULL olarak ayarlanır.
- **RESTRICT**: Varsayılan seçenektir. Üst koleksiyondaki bir kaydı silmeye çalışıldığında, alt koleksiyonda ilgili kayıtlar varsa, üst koleksiyon kaydının silinmesini engeller.
- **NO ACTION**: RESTRICT seçeneğine benzer şekilde, alt koleksiyonda ilgili kayıtlar varsa, üst koleksiyon kaydının silinmesini engeller.