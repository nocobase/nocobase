:::tip Yapay Zeka Çeviri Bildirimi
Bu dokümantasyon yapay zeka tarafından otomatik olarak çevrilmiştir.
:::


```yaml
pkg: '@nocobase/plugin-workflow-subflow'
---

# İş Akışı Çıktısı

## Giriş

`İş Akışı Çıktısı` düğümü, çağrılan bir iş akışında o iş akışının çıktı değerini tanımlamak için kullanılır. Bir iş akışı başka bir iş akışı tarafından çağrıldığında, bu düğüm aracılığıyla çağırana bir değer geri iletebilirsiniz.

## Düğüm Oluşturma

Çağrılan iş akışında bir `İş Akışı Çıktısı` düğümü ekleyin:

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Düğümü Yapılandırma

### Çıktı Değeri

Çıktı değeri olarak bir değişken girin veya seçin. Çıktı değeri, metin, sayı, mantıksal değer, tarih veya özel JSON gibi sabit bir değer olabileceği gibi, iş akışındaki başka bir değişken de olabilir.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=İpucu}
Çağrılan bir iş akışına birden fazla `İş Akışı Çıktısı` düğümü eklerseniz, iş akışı çağrıldığında çıktı olarak en son yürütülen `İş Akışı Çıktısı` düğümünün değeri verilecektir.
:::