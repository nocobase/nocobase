:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Koleksiyonlara Genel Bakış

NocoBase, verilerin yapısını tanımlamak için **koleksiyon** adını verdiğimiz benzersiz bir DSL (Alan Odaklı Dil) sunar. Bu DSL, farklı kaynaklardan gelen veri yapılarını bir araya getirerek veri yönetimi, analizi ve uygulamaları için sağlam bir temel oluşturur.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Çeşitli veri modellerini rahatça kullanabilmeniz için farklı koleksiyon türleri oluşturmayı destekleriz:

- [Genel koleksiyon](/data-sources/data-source-main/general-collection): Sık kullanılan sistem alanlarını içerir;
- [Kalıtım koleksiyonu](/data-sources/data-source-main/inheritance-collection): Bir üst koleksiyon oluşturabilir, ardından bu üst koleksiyondan bir alt koleksiyon türetebilirsiniz. Alt koleksiyon, üst koleksiyonun yapısını devralırken kendi sütunlarını da tanımlayabilir.
- [Ağaç koleksiyonu](/data-sources/collection-tree): Ağaç yapılı koleksiyon; şu anda yalnızca komşuluk listesi tasarımını destekler;
- [Takvim koleksiyonu](/data-sources/calendar/calendar-collection): Takvimle ilgili etkinlik koleksiyonları oluşturmak için kullanılır;
- [Dosya koleksiyonu](/data-sources/file-manager/file-collection): Dosya depolama yönetimi için kullanılır;
- [ ](): İş akışlarındaki dinamik ifade senaryoları için kullanılır;
- [SQL koleksiyonu](/data-sources/collection-sql): Gerçek bir veritabanı koleksiyonu değildir; bunun yerine SQL sorgularını yapılandırılmış bir şekilde hızlıca sunar;
- [Görünüm koleksiyonu](/data-sources/collection-view): Mevcut veritabanı görünümlerine bağlanır;
- [Harici koleksiyon](/data-sources/collection-fdw): Veritabanı sisteminin harici veri kaynaklarındaki verilere doğrudan erişmesine ve sorgulamasına olanak tanır, FDW teknolojisine dayanır;