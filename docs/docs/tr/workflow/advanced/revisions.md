:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Sürüm Yönetimi

Yapılandırılmış bir iş akışı en az bir kez tetiklendikten sonra, eğer iş akışının yapılandırmasını veya düğümlerini değiştirmek isterseniz, önce yeni bir sürüm oluşturmanız gerekir. Bu yaklaşım, daha önce tetiklenmiş iş akışlarının yürütme geçmişini incelerken, gelecekteki değişikliklerden etkilenmemesini de sağlar.

İş akışı yapılandırma sayfasında, sağ üst köşedeki sürüm menüsünden mevcut iş akışı sürümlerini görüntüleyebilirsiniz:

![İş akışı sürümlerini görüntüle](https://static-docs.nocobase.com/ad93d2b08166b0e3e643fb148713a63f.png)

Sağındaki daha fazla işlem (“...”) menüsünde, o an görüntülediğiniz sürümü yeni bir sürüme kopyalama seçeneğini bulabilirsiniz:

![İş akışını yeni bir sürüme kopyala](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)

Yeni bir sürüme kopyaladıktan sonra, ilgili sürümü etkin duruma getirmek için "Etkinleştir"/"Devre Dışı Bırak" anahtarına tıklayın. Bu işlemden sonra yeni iş akışı sürümü yürürlüğe girecektir.

Eski bir sürümü yeniden seçmeniz gerekirse, sürüm menüsünden o sürüme geçiş yapın ve ardından tekrar "Etkinleştir"/"Devre Dışı Bırak" anahtarına tıklayarak etkin duruma getirin. Bu durumda, o an görüntülediğiniz sürüm yürürlüğe girecek ve sonraki tetiklemeler ilgili sürümün sürecini çalıştıracaktır.

İş akışını devre dışı bırakmanız gerektiğinde, "Etkinleştir"/"Devre Dışı Bırak" anahtarına tıklayarak devre dışı duruma getirin. Bu durumda, iş akışı artık tetiklenmeyecektir.

:::info{title=İpucu}
İş akışı yönetim listesindeki "Kopyala" iş akışından farklı olarak, "yeni bir sürüme kopyalanan" bir iş akışı hala aynı iş akışı grubunda yer alır; sadece sürümle ayırt edilir. Ancak, bir iş akışını kopyalamak, önceki iş akışının sürümleriyle ilgisi olmayan tamamen yeni bir iş akışı olarak kabul edilir ve yürütme sayısı da sıfırlanır.
:::