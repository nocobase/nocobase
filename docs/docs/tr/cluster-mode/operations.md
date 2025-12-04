:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Bakım Prosedürleri

## İlk Uygulama Başlatma

Uygulamayı ilk kez başlatırken, önce bir düğümü başlatın. Eklentilerin yüklenmesini ve etkinleştirilmesini bekledikten sonra diğer düğümleri başlatabilirsiniz.

## Sürüm Yükseltme

NocoBase sürümünü yükseltmeniz gerektiğinde bu prosedürü uygulayın.

:::warning{title=Dikkat}
Küme **üretim ortamında** eklenti yönetimi ve sürüm yükseltmeleri gibi özelliklerin dikkatli kullanılması veya yasaklanması gerekmektedir.

NocoBase şu anda küme sürümleri için çevrimiçi yükseltmeyi desteklememektedir. Veri tutarlılığını sağlamak amacıyla, yükseltme işlemi sırasında harici hizmetlerin askıya alınması gerekmektedir.
:::

Adımlar:

1.  Mevcut hizmeti durdurun

    Tüm NocoBase uygulama örneklerini durdurun ve yük dengeleyici trafiğini bir 503 durum sayfasına yönlendirin.

2.  Verileri yedekleyin

    Yükseltme öncesinde, yükseltme işlemi sırasında herhangi bir sorunu önlemek için veritabanı verilerini yedeklemeniz şiddetle tavsiye edilir.

3.  Sürümü güncelleyin

    NocoBase uygulama imajının sürümünü güncellemek için [Docker Yükseltme](../get-started/upgrading/docker) bölümüne başvurun.

4.  Hizmeti başlatın

    1. Kümedeki bir düğümü başlatın ve güncellemenin tamamlanmasını ve düğümün başarıyla başlamasını bekleyin.
    2. İşlevselliğin doğru olduğunu doğrulayın. Herhangi bir sorun varsa ve sorun giderme ile çözülemiyorsa, önceki sürüme geri dönebilirsiniz.
    3. Diğer düğümleri başlatın.
    4. Yük dengeleyici trafiğini uygulama kümesine yönlendirin.

## Uygulama İçi Bakım

Uygulama içi bakım, uygulama çalışır durumdayken bakım ile ilgili işlevlerin gerçekleştirilmesini ifade eder ve şunları içerir:

*   Eklenti yönetimi (eklenti kurma, etkinleştirme, devre dışı bırakma vb.)
*   Yedekleme ve Geri Yükleme
*   Ortam Taşıma Yönetimi

Adımlar:

1.  Düğüm sayısını azaltın

    Küme içinde çalışan uygulama düğümlerinin sayısını 1'e düşürün ve diğer düğümlerdeki hizmeti durdurun.

2.  Eklenti kurma ve etkinleştirme, veri yedekleme gibi uygulama içi bakım işlemlerini gerçekleştirin.

3.  Düğümleri geri yükleyin

    Bakım işlemleri tamamlandıktan ve işlevsellik doğrulandıktan sonra, diğer düğümleri başlatın. Düğümler başarıyla başladıktan sonra kümenin çalışma durumunu geri yükleyin.