:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Gelişmiş Yapılandırma



# Gelişmiş Yapılandırma

## Çalışma Modu

İş akışları, oluşturulurken seçilen tetikleyici türüne bağlı olarak eşzamansız veya eşzamanlı olarak çalışır. Eşzamansız mod, belirli bir olay tetiklendikten sonra iş akışının bir kuyruğa girdiğini ve arka plan zamanlayıcı tarafından tek tek yürütüldüğünü ifade eder. Eşzamanlı mod ise tetiklendikten sonra zamanlama kuyruğuna girmez; doğrudan çalışmaya başlar ve tamamlandığında anında geri bildirim sağlar.

koleksiyon olayları, işlem sonrası olaylar, özel işlem olayları, zamanlanmış olaylar ve onay olayları varsayılan olarak eşzamansız olarak çalışır. İşlem öncesi olaylar ise varsayılan olarak eşzamanlı olarak çalışır. Hem koleksiyon olayları hem de form olayları her iki modu da destekler ve bir iş akışı oluştururken seçilebilir:

![Sync Mode_Create Sync Workflow](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=İpucu}
Doğaları gereği, eşzamanlı iş akışları "Manuel işlem" gibi "bekleme" durumu oluşturan düğümleri kullanamaz.
:::

## Çalışma Geçmişini Otomatik Silme

Bir iş akışı sık sık tetiklendiğinde, karmaşayı azaltmak ve veritabanı üzerindeki depolama baskısını hafifletmek için çalışma geçmişinin otomatik olarak silinmesini yapılandırabilirsiniz.

Bir iş akışının çalışma geçmişinin otomatik olarak silinip silinmeyeceğini, oluşturma ve düzenleme iletişim kutularında da yapılandırabilirsiniz:

![Auto-delete Execution History Configuration](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Otomatik silme, çalışma sonucu durumuna göre yapılandırılabilir. Çoğu durumda, yalnızca "Tamamlandı" durumunu işaretlemeniz önerilir; böylece başarısız olan çalışmaların kayıtlarını gelecekteki sorun giderme için saklayabilirsiniz.

Bir iş akışında hata ayıklarken, çalışma geçmişinin otomatik olarak silinmesini etkinleştirmemeniz önerilir; böylece geçmişi kullanarak iş akışının çalışma mantığının beklendiği gibi olup olmadığını kontrol edebilirsiniz.

:::info{title=İpucu}
Bir iş akışının geçmişini silmek, çalışma sayısını azaltmaz.
:::