:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Önizleme ve Kaydetme

*   **Önizleme:** Yapılandırma panelindeki değişiklikleri geçici olarak sayfa grafiğine yansıtır ve böylece etkilerini doğrulamanızı sağlar.
*   **Kaydetme:** Yapılandırma panelindeki değişiklikleri kalıcı olarak veritabanına kaydeder.

## Erişim Noktaları

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

*   Görsel (Temel) yapılandırma modunda yapılan tüm değişiklikler, varsayılan olarak otomatik olarak önizlemeye yansıtılır.
*   SQL ve Özel (Custom) modlarda değişiklik yaptıktan sonra, sağdaki **Önizleme** düğmesine tıklayarak değişiklikleri önizlemeye yansıtabilirsiniz.
*   Tüm yapılandırma panelinin altında, birleşik bir "Önizleme" düğmesi bulunur.

## Önizleme Davranışı
*   Yapılandırmayı geçici olarak sayfada gösterir ancak veritabanına yazmaz. Sayfayı yenilediğinizde veya işlemi iptal ettiğinizde önizleme sonucu korunmaz.
*   Dahili gecikme (debounce) özelliği: Kısa süre içinde birden fazla yenileme tetiklendiğinde, yalnızca sonuncusu yürütülür ve sık isteklerin önüne geçilir.
*   "Önizleme"ye tekrar tıklamak, önceki önizleme sonucunun üzerine yazar.

## Hata Mesajları
*   Sorgu hataları veya doğrulama başarısızlıkları: "Verileri Görüntüle" alanında hata mesajları gösterilir.
*   Grafik yapılandırma hataları (Temel eşlemenin eksik olması, Özel JS'ten kaynaklanan istisnalar): Grafik alanında veya konsolda gösterilirken sayfanın çalışır durumda kalması sağlanır.
*   Hataları etkili bir şekilde azaltmak için, alan eşlemesi yapmadan veya Özel (Custom) kod yazmadan önce "Verileri Görüntüle" bölümünde sütun adlarını ve veri türlerini onaylayın.

## Kaydetme ve İptal Etme
*   **Kaydetme:** Mevcut paneldeki değişiklikleri blok yapılandırmasına yazar ve bunları sayfaya anında uygular.
*   **İptal Etme:** Mevcut paneldeki kaydedilmemiş değişiklikleri geri alır ve son kaydedilen duruma döner.
*   **Kaydetme Kapsamı:**
    *   **Veri sorgusu:** Oluşturucu (Builder) parametreleri; SQL modunda, SQL metni de kaydedilir.
    *   **Grafik seçenekleri:** Temel (Basic) tür, alan eşlemesi ve özellikler; Özel (Custom) JS metni.
    *   **Etkileşim olayları:** Olayların JS metni ve bağlama mantığı.
*   Kaydettikten sonra, blok tüm ziyaretçiler için geçerli olur (sayfa izin ayarlarına bağlıdır).

## Önerilen İş Akışı
*   Veri sorgusunu yapılandırın → Sorguyu çalıştırın → Sütun adlarını ve türlerini onaylamak için verileri görüntüleyin → Temel alanları eşlemek üzere grafik seçeneklerini yapılandırın → Doğrulamak için önizleyin → Uygulamak için kaydedin.