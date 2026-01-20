:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İlişki Alanları

NocoBase'de, ilişki alanları gerçek alanlar değildir; bunun yerine koleksiyonlar arasında bağlantı kurmak için kullanılır. Bu kavram, ilişkisel veritabanlarındaki ilişkilere eşdeğerdir.

İlişkisel veritabanlarında en yaygın ilişki türleri şunlardır:

- [Bire Bir](./o2o/index.md): İki koleksiyondaki her bir varlık, diğer koleksiyondaki yalnızca bir varlığa karşılık gelir. Bu ilişki türü, genellikle bir varlığın farklı yönlerini ayrı koleksiyonlarda saklayarak veri fazlalığını azaltmak ve veri tutarlılığını artırmak için kullanılır.
- [Bire Çok](./o2m/index.md): Bir koleksiyondaki her bir varlık, başka bir koleksiyondaki birden çok varlıkla ilişkilendirilebilir. Bu, en yaygın ilişki türlerinden biridir. Örneğin, bir yazar birden fazla makale yazabilir, ancak bir makalenin yalnızca bir yazarı olabilir.
- [Çoka Bir](./m2o/index.md): Bir koleksiyondaki birden çok varlık, başka bir koleksiyondaki tek bir varlıkla ilişkilendirilebilir. Bu ilişki türü, veri modellemede de yaygındır. Örneğin, birden çok öğrenci aynı sınıfa ait olabilir.
- [Çoka Çok](./m2m/index.md): İki koleksiyondaki birden çok varlık birbiriyle ilişkilendirilebilir. Bu ilişki türü, genellikle varlıklar arasındaki ilişkileri kaydetmek için bir aracı koleksiyon gerektirir. Örneğin, öğrenciler ve dersler arasındaki ilişki: bir öğrenci birden çok derse kaydolabilir ve bir dersin birden çok öğrencisi olabilir.

Bu ilişki türleri, veritabanı tasarımında ve veri modellemede önemli bir rol oynar; gerçek dünyadaki karmaşık ilişkileri ve veri yapılarını tanımlamaya yardımcı olur.