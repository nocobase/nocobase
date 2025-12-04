:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Bakış

Veri modelleme, veritabanı tasarlarken kritik bir adımdır. Gerçek dünyadaki çeşitli veri türlerini ve bunların birbirleriyle olan ilişkilerini derinlemesine analiz etme ve soyutlama sürecini içerir. Bu süreçte, veriler arasındaki içsel bağlantıları ortaya çıkarmaya ve bunları veri modelleri olarak biçimlendirmeye çalışırız; böylece bilgi sisteminin veritabanı yapısı için temel oluştururuz. NocoBase, veri modelleriyle çalışan bir platformdur ve aşağıdaki özelliklere sahiptir:

## Çeşitli Kaynaklardan Veri Erişimini Destekler

NocoBase, yaygın veritabanları, API/SDK platformları ve dosyalar dahil olmak üzere çeşitli kaynaklardan veri kaynaklarını destekler.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase, çeşitli veri kaynaklarını ve koleksiyonlarını yönetmek için bir [veri kaynağı yöneticisi eklentisi](/data-sources/data-source-manager) sunar. Veri kaynağı yöneticisi eklentisi, yalnızca tüm veri kaynakları için bir yönetim arayüzü sağlar ve veri kaynaklarına doğrudan erişim yeteneği sunmaz. Çeşitli veri kaynağı eklentileriyle birlikte kullanılması gerekir. Şu anda desteklenen veri kaynakları şunlardır:

- [Ana Veritabanı](/data-sources/data-source-main): NocoBase'in ana veritabanıdır; MySQL, PostgreSQL ve MariaDB gibi ilişkisel veritabanlarını destekler.
- [KingbaseES](/data-sources/data-source-kingbase): KingbaseES veritabanını veri kaynağı olarak kullanır; hem ana veritabanı hem de harici veritabanı olarak kullanılabilir.
- [Harici MySQL](/data-sources/data-source-external-mysql): Harici bir MySQL veritabanını veri kaynağı olarak kullanır.
- [Harici MariaDB](/data-sources/data-source-external-mariadb): Harici bir MariaDB veritabanını veri kaynağı olarak kullanır.
- [Harici PostgreSQL](/data-sources/data-source-external-postgres): Harici bir PostgreSQL veritabanını veri kaynağı olarak kullanır.
- [Harici MSSQL](/data-sources/data-source-external-mssql): Harici bir MSSQL (SQL Server) veritabanını veri kaynağı olarak kullanır.
- [Harici Oracle](/data-sources/data-source-external-oracle): Harici bir Oracle veritabanını veri kaynağı olarak kullanır.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Çeşitli Veri Modelleme Araçları Sunar

**Basit koleksiyon yönetim arayüzü**: Çeşitli modeller (koleksiyonlar) oluşturmak veya mevcut olanlara bağlanmak için kullanılır.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**ER benzeri görsel arayüz**: Kullanıcı ve iş gereksinimlerinden varlıkları ve aralarındaki ilişkileri çıkarmak için kullanılır. Veri modellerini açıklamak için sezgisel ve anlaşılması kolay bir yol sunar. ER diyagramları aracılığıyla, sistemdeki ana veri varlıklarını ve ilişkilerini daha net anlayabilirsiniz.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Çeşitli Koleksiyon Türlerini Destekler

| Koleksiyon | Açıklama |
| - | - |
| [Genel koleksiyon](/data-sources/data-source-main/general-collection) | Yaygın sistem alanlarını içerir. |
| [Takvim koleksiyonu](/data-sources/calendar/calendar-collection) | Takvimle ilgili etkinlik koleksiyonları oluşturmak için kullanılır. |
| Yorum koleksiyonu | Verilerle ilgili yorumları veya geri bildirimleri depolamak için kullanılır. |
| [Ağaç koleksiyonu](/data-sources/collection-tree) | Ağaç yapılı koleksiyon olup, şu anda yalnızca bitişik liste modelini destekler. |
| [Dosya koleksiyonu](/data-sources/file-manager/file-collection) | Dosya depolama yönetimi için kullanılır. |
| [SQL koleksiyonu](/data-sources/collection-sql) | Gerçek bir veritabanı koleksiyonu değildir, ancak SQL sorgularını yapılandırılmış bir şekilde görselleştirir. |
| [Veritabanı görünümüne bağlan](/data-sources/collection-view) | Mevcut veritabanı görünümlerine bağlanır. |
| İfade koleksiyonu | İş akışlarındaki dinamik ifade senaryoları için kullanılır. |
| [Harici verilere bağlan](/data-sources/collection-fdw) | Veritabanı sisteminin FDW teknolojisine dayalı olarak harici veri kaynaklarındaki verilere doğrudan erişmesini ve sorgulamasını sağlar. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Daha fazla içerik için "[Koleksiyon / Genel Bakış](/data-sources/data-modeling/collection)" bölümüne bakınız.

## Zengin Çeşitlilikte Alan Türleri Sunar

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Daha fazla içerik için "[Koleksiyon Alanları / Genel Bakış](/data-sources/data-modeling/collection-fields)" bölümüne bakınız.