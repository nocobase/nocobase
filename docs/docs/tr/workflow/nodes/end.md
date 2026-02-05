:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İş Akışını Sonlandır

Bu düğüm çalıştırıldığında, mevcut iş akışını düğümde yapılandırılan durumla birlikte anında sonlandırır. Genellikle belirli bir mantığa dayalı iş akışı kontrolü için kullanılır; belirli koşullar karşılandığında mevcut iş akışından çıkarak sonraki işlemlerin yürütülmesini durdurur. Bu, programlama dillerindeki, mevcut fonksiyondan çıkmak için kullanılan `return` komutuna benzetilebilir.

## Düğüm Ekleme

İş akışı yapılandırma arayüzünde, iş akışındaki artı ("+") düğmesine tıklayarak "İş Akışını Sonlandır" düğümünü ekleyebilirsiniz:

![İş Akışını Sonlandır_Ekle](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Düğüm Yapılandırması

![İş Akışını Sonlandır_Düğüm Yapılandırması](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Sonlandırma Durumu

Sonlandırma durumu, iş akışı yürütme planının nihai durumunu etkiler. "Başarılı" veya "Başarısız" olarak yapılandırılabilir. İş akışı yürütmesi bu düğüme ulaştığında, yapılandırılan durumla birlikte anında çıkış yapar.

:::info{title=Not}
"Eylem öncesi olay" türündeki bir iş akışında kullanıldığında, eylemi başlatan isteği engelleyecektir. Ayrıntılar için lütfen ["Eylem öncesi olay" kullanımı](../triggers/pre-action) bölümüne bakın.

Ayrıca, eylemi başlatan isteği engellemenin yanı sıra, sonlandırma durumu yapılandırması bu tür iş akışlarında "yanıt mesajındaki" geri bildirimin durumunu da etkileyecektir.
:::