---
pkg: '@nocobase/plugin-workflow-sql'
---

:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# SQL İşlemi

## Giriş

Bazı özel senaryolarda, yukarıda bahsedilen basit **koleksiyon** işlem düğümleri karmaşık operasyonları gerçekleştirmek için yeterli olmayabilir. Bu gibi durumlarda, veritabanının karmaşık SQL ifadelerini doğrudan çalıştırmasını sağlamak için **SQL düğümünü** kullanabilirsiniz.

Uygulama dışında doğrudan veritabanına bağlanarak SQL işlemleri yapmaktan farklı olarak, bir **iş akışı** içinde, süreç bağlamındaki değişkenleri SQL ifadesinde parametre olarak kullanabilirsiniz.

## Kurulum

Bu, yerleşik bir **eklenti** olduğu için kurulum gerektirmez.

## Düğüm Oluşturma

**İş akışı** yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak bir "SQL İşlemi" düğümü ekleyin:

![SQL İşlemi Ekle](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Düğüm Yapılandırması

![SQL Düğümü_Düğüm Yapılandırması](https://static-docs.nocobase.com/20240904002334.png)

### Veri Kaynağı

SQL'i çalıştıracak **veri kaynağını** seçin.

**Veri kaynağı**, ana **veri kaynağı**, PostgreSQL tipi veya diğer Sequelize uyumlu **veri kaynakları** gibi bir veritabanı türünde olmalıdır.

### SQL İçeriği

SQL ifadesini düzenleyin. Şu anda yalnızca tek bir SQL ifadesi desteklenmektedir.

Düzenleyici kutusunun sağ üst köşesindeki değişken düğmesini kullanarak gerekli değişkenleri ekleyin. Bu değişkenler, yürütmeden önce metin değişimi yoluyla ilgili değerleriyle değiştirilecektir. Ortaya çıkan metin daha sonra nihai SQL ifadesi olarak kullanılacak ve sorgulama için veritabanına gönderilecektir.

## Düğüm Yürütme Sonucu

`v1.3.15-beta` sürümünden itibaren, bir SQL düğümünün yürütme sonucu saf verilerden oluşan bir dizidir. Bundan önce, sorgu meta bilgilerini içeren Sequelize'in yerel dönüş yapısıydı (ayrıntılar için: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Örneğin, aşağıdaki sorgu:

```sql
select count(id) from posts;
`v1.3.15-beta` öncesi sonuç:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

`v1.3.15-beta` sonrası sonuç:

```json
[
    { "count": 1 }
]
```

## Sıkça Sorulan Sorular

### SQL düğümünün sonucu nasıl kullanılır?

Eğer bir `SELECT` ifadesi kullanıldıysa, sorgu sonucu düğümde Sequelize'in JSON formatında saklanır ve [JSON-query](./json-query.md) **eklentisi** aracılığıyla ayrıştırılıp kullanılabilir.

### SQL işlemi koleksiyon olaylarını tetikler mi?

**Hayır**. SQL işlemi, SQL ifadesini doğrudan veritabanına göndererek işlenmesini sağlar. İlgili `CREATE` / `UPDATE` / `DELETE` işlemleri veritabanında gerçekleşirken, **koleksiyon** olayları Node.js uygulama katmanında (ORM tarafından işlenir) meydana gelir. Bu nedenle, **koleksiyon** olayları tetiklenmez.
```