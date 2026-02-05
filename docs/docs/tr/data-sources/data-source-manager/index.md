---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Veri Kaynağı Yönetimi

## Giriş

NocoBase, veri kaynaklarını ve onların koleksiyonlarını yönetmek için bir veri kaynağı yönetimi eklentisi sunar. Bu eklenti, tüm veri kaynakları için yalnızca bir yönetim arayüzü sunar; veri kaynaklarına doğrudan erişim yeteneği sağlamaz. Bunun yerine, çeşitli veri kaynağı eklentileriyle birlikte kullanılması gerekir. Şu anda erişimi desteklenen veri kaynakları şunlardır:

- [Ana Veritabanı](/data-sources/data-source-main): NocoBase'in ana veritabanı; MySQL, PostgreSQL ve MariaDB gibi ilişkisel veritabanlarını destekler.
- [Harici MySQL](/data-sources/data-source-external-mysql): Harici bir MySQL veritabanını veri kaynağı olarak kullanın.
- [Harici MariaDB](/data-sources/data-source-external-mariadb): Harici bir MariaDB veritabanını veri kaynağı olarak kullanın.
- [Harici PostgreSQL](/data-sources/data-source-external-postgres): Harici bir PostgreSQL veritabanını veri kaynağı olarak kullanın.
- [Harici MSSQL](/data-sources/data-source-external-mssql): Harici bir MSSQL (SQL Server) veritabanını veri kaynağı olarak kullanın.
- [Harici Oracle](/data-sources/data-source-external-oracle): Harici bir Oracle veritabanını veri kaynağı olarak kullanın.

Bunun yanı sıra, eklentiler aracılığıyla daha fazla tür eklenebilir. Bunlar, yaygın veritabanı türleri olabileceği gibi, API (SDK) sağlayan platformlar da olabilir.

## Kurulum

Dahili bir eklentidir, ayrı olarak kurmanıza gerek yoktur.

## Kullanım Talimatları

Uygulama ilk kurulduğunda, NocoBase verilerini depolamak için varsayılan olarak bir veri kaynağı sağlanır; buna ana veritabanı denir. Daha fazla bilgi için [Ana Veritabanı](/data-sources/data-source-main/) belgesine bakabilirsiniz.

### Harici Veri Kaynakları

Harici veritabanları veri kaynağı olarak desteklenir. Daha fazla bilgi için [Harici Veritabanı / Giriş](/data-sources/data-source-manager/external-database) belgesine bakabilirsiniz.

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Veritabanı Özel Tablolarını Senkronize Etme Desteği

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

HTTP API kaynaklarından gelen verilere de erişebilirsiniz. Daha fazla bilgi için [REST API Veri Kaynağı](/data-sources/data-source-rest-api/) belgesine bakabilirsiniz.