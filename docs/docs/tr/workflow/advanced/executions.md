:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Yürütme Planı (Geçmiş)

Bir iş akışı tetiklendiğinde, bu görevin yürütme sürecini takip etmek için ilgili bir yürütme planı oluşturulur. Her yürütme planının, mevcut yürütme durumunu gösteren bir durum değeri vardır. Bu durum, yürütme geçmişi listesinde ve detaylarında görüntülenebilir:

![Yürütme Planı Durumu](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Ana iş akışı dalındaki tüm düğümler "Tamamlandı" durumuyla iş akışının sonuna kadar yürütüldüğünde, tüm yürütme planı "Tamamlandı" durumuyla sona erecektir. Ana iş akışı dalındaki bir düğüm "Başarısız", "Hata", "İptal Edildi" veya "Reddedildi" gibi bir nihai duruma ulaştığında, tüm yürütme planı ilgili durumla **erken sonlandırılacaktır**. Ana iş akışı dalındaki bir düğüm "Beklemede" durumuna geçtiğinde, tüm yürütme planı duraklatılır ancak bekleyen düğüm devam ettirilene kadar "Yürütülüyor" durumunu göstermeye devam eder. Farklı düğüm türleri bekleme durumunu farklı şekilde ele alır. Örneğin, manuel bir düğüm manuel işlemeyi beklerken, gecikme düğümü belirtilen sürenin dolmasını bekledikten sonra devam eder.

Yürütme planının durumları aşağıdaki tabloda gösterilmiştir:

| Durum        | Ana iş akışında son yürütülen düğümün ilgili durumu | Anlamı                                                                 |
| ------------ | -------------------------------------------------- | ---------------------------------------------------------------------- |
| Kuyrukta     | -                                                  | İş akışı tetiklendi ve bir yürütme planı oluşturuldu, zamanlayıcının yürütmeyi düzenlemesini bekliyor. |
| Yürütülüyor  | Beklemede                                          | Düğüm duraklatma gerektiriyor, devam etmek için ek girdi veya geri arama bekliyor. |
| Tamamlandı   | Tamamlandı                                         | Herhangi bir sorunla karşılaşılmadı, tüm düğümler beklendiği gibi sırayla yürütüldü. |
| Başarısız    | Başarısız                                          | Düğüm yapılandırması karşılanmadığı için başarısız oldu.               |
| Hata         | Hata                                               | Düğüm, yakalanmamış bir program hatasıyla karşılaştı ve erken sonlandı. |
| İptal Edildi | İptal Edildi                                       | Bekleyen bir düğüm, iş akışı yöneticisi tarafından harici olarak iptal edildi ve erken sonlandı. |
| Reddedildi   | Reddedildi                                         | Manuel işlem düğümünde, manuel olarak reddedildi ve sonraki süreç devam etmeyecek. |

[Hızlı Başlangıç](../getting-started.md) örneğinde, bir iş akışının yürütme geçmişinin detaylarını görüntüleyerek, yürütme sırasında tüm düğümlerin normal şekilde çalışıp çalışmadığını, ayrıca her yürütülen düğümün yürütme durumunu ve sonuç verilerini kontrol edebileceğimizi zaten biliyoruz. Bazı gelişmiş iş akışlarında ve düğümlerde, bir düğümün birden fazla sonucu olabilir, örneğin döngü düğümünün sonuçları:

![Birden Fazla Yürütmenin Düğüm Sonuçları](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=İpucu}
İş akışları eş zamanlı olarak tetiklenebilir, ancak yürütmeleri sırayla bir kuyrukta gerçekleşir. Aynı anda birden fazla iş akışı tetiklense bile, bunlar paralel değil, art arda yürütülür. Bu nedenle, "Kuyrukta" durumu, başka iş akışlarının şu anda çalıştığı ve beklemeniz gerektiği anlamına gelir.

“Yürütülüyor” durumu yalnızca yürütme planının başladığını ve genellikle dahili bir düğümün bekleme durumu nedeniyle duraklatıldığını gösterir. Bu, yürütme planının kuyruğun başındaki yürütme kaynaklarını ele geçirdiği anlamına gelmez. Bu nedenle, “Yürütülüyor” durumunda bir yürütme planı varken, diğer “Kuyrukta” durumundaki yürütme planları yine de yürütülmek üzere zamanlanabilir.
:::

## Düğüm Yürütme Durumu

Bir yürütme planının durumu, içerdiği her bir düğümün yürütülmesiyle belirlenir. Bir tetiklemeden sonraki yürütme planında, her düğüm çalıştıktan sonra bir yürütme durumu üretir ve bu durum, sonraki iş akışının devam edip etmeyeceğini belirler. Normalde, bir düğüm başarıyla yürütüldükten sonra, tüm düğümler sırayla tamamlanana veya süreç kesintiye uğrayana kadar bir sonraki düğüm yürütülür. Dallanmalar, döngüler, paralel dallar, gecikmeler gibi iş akışı kontrolüyle ilgili düğümlerle karşılaşıldığında, bir sonraki düğümün yürütme akışı, düğümde yapılandırılan koşullara ve çalışma zamanı bağlam verilerine göre belirlenir.

Bir düğümün yürütme sonrası olası durumları aşağıdaki tabloda gösterilmiştir:

| Durum        | Nihai Durum mu? | Erken Sonlanır mı? | Anlamı                                                                 |
| ------------ | :-------------: | :----------------: | ---------------------------------------------------------------------- |
| Beklemede    | Hayır           | Hayır              | Düğüm duraklatma gerektiriyor, devam etmek için ek girdi veya geri arama bekliyor. |
| Tamamlandı   | Evet            | Hayır              | Herhangi bir sorunla karşılaşılmadı, başarıyla yürütüldü ve sona erene kadar bir sonraki düğüme devam eder. |
| Başarısız    | Evet            | Evet               | Düğüm yapılandırması karşılanmadığı için başarısız oldu.               |
| Hata         | Evet            | Evet               | Düğüm, yakalanmamış bir program hatasıyla karşılaştı ve erken sonlandı. |
| İptal Edildi | Evet            | Evet               | Bekleyen bir düğüm, iş akışı yöneticisi tarafından harici olarak iptal edildi ve erken sonlandı. |
| Reddedildi   | Evet            | Evet               | Manuel işlem düğümünde, manuel olarak reddedildi ve sonraki süreç devam etmeyecek. |

“Beklemede” durumu hariç, diğer tüm durumlar düğüm yürütmesi için nihai durumlardır. Yalnızca nihai durum “Tamamlandı” olduğunda süreç devam eder; aksi takdirde, tüm iş akışı yürütmesi erken sonlandırılır. Bir düğüm bir dallanma akışındayken (paralel dal, koşul, döngü vb.), düğüm yürütmesinin ürettiği nihai durum, dallanmayı başlatan düğüm tarafından ele alınır ve bu, tüm iş akışının akışını belirler.

Örneğin, “‘Evet’ ise devam et” modunda bir koşul düğümü kullandığımızda, yürütme sırasında sonuç “Hayır” ise, tüm iş akışı erken sonlandırılır ve “Başarısız” durumuyla çıkar, sonraki düğümler yürütülmez, aşağıdaki şekilde gösterildiği gibi:

![Düğüm yürütmesi başarısız oldu](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=İpucu}
“Tamamlandı” dışındaki tüm sonlandırma durumları başarısızlık olarak kabul edilebilir, ancak başarısızlık nedenleri farklıdır. Başarısızlığın nedenini daha iyi anlamak için düğümün yürütme sonuçlarını inceleyebilirsiniz.
:::