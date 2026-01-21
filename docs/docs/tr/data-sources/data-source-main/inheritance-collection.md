---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Kalıtım Koleksiyonu

## Giriş

:::warning
Yalnızca ana veritabanı PostgreSQL olduğunda desteklenir.
:::

Bir üst koleksiyon oluşturabilir ve bu üst koleksiyondan alt koleksiyonlar türetebilirsiniz. Alt koleksiyonlar, üst koleksiyonun yapısını miras alır ve aynı zamanda kendi sütunlarını da tanımlayabilir. Bu tasarım deseni, benzer yapılara sahip ancak farklılıklar gösterebilen verileri düzenlemeye ve yönetmeye yardımcı olur.

Kalıtım koleksiyonlarının bazı yaygın özellikleri şunlardır:

- Üst Koleksiyon: Üst koleksiyon, ortak sütunları ve verileri içerir ve tüm kalıtım hiyerarşisinin temel yapısını tanımlar.
- Alt Koleksiyon: Alt koleksiyon, üst koleksiyonun yapısını miras alır ancak ek olarak kendi sütunlarını da tanımlayabilir. Bu, her alt koleksiyonun üst koleksiyonun genel özelliklerine sahip olmasını sağlarken, alt sınıfa özgü nitelikleri de içermesine olanak tanır.
- Sorgulama: Sorgulama yaparken, tüm kalıtım hiyerarşisini, yalnızca üst koleksiyonu veya belirli bir alt koleksiyonu sorgulamayı seçebilirsiniz. Bu, ihtiyaca göre farklı seviyelerdeki verilerin alınmasını ve işlenmesini mümkün kılar.
- Kalıtım İlişkisi: Üst koleksiyon ile alt koleksiyon arasında bir kalıtım ilişkisi kurulur. Bu, üst koleksiyonun yapısının tutarlı nitelikleri tanımlamak için kullanılabileceği, aynı zamanda alt koleksiyonun bu nitelikleri genişletmesine veya geçersiz kılmasına izin verildiği anlamına gelir.

Bu tasarım deseni, veri tekrarını azaltmaya, veritabanı modelini basitleştirmeye ve verilerin bakımını kolaylaştırmaya yardımcı olur. Ancak, kalıtım koleksiyonları, özellikle tüm kalıtım hiyerarşisiyle uğraşırken sorguların karmaşıklığını artırabileceğinden dikkatli kullanılmalıdır. Kalıtım koleksiyonlarını destekleyen veritabanı sistemleri genellikle bu tür koleksiyon yapılarını yönetmek ve sorgulamak için belirli sözdizimi ve araçlar sunar.

## Kullanım Kılavuzu

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)