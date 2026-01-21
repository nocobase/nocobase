:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Hızlı Başlangıç

## İlk İş Akışınızı Yapılandırma

Üst menü çubuğundaki eklenti yapılandırma menüsünden iş akışı eklentisinin yönetim sayfasına gidin:

![İş akışı eklentisi yönetim girişi](https://static-docs.nocobase.com/20251027222721.png)

Yönetim arayüzünde oluşturulmuş tüm iş akışları listelenir:

![İş Akışı Yönetimi](https://static-docs.nocobase.com/20251027222900.png)

“Yeni Ekle” düğmesine tıklayarak yeni bir iş akışı oluşturun ve Koleksiyon Olayı'nı seçin:

![İş Akışı Oluşturma](https://static-docs.nocobase.com/20251027222951.png)

Gönderdikten sonra, listedeki “Yapılandır” bağlantısına tıklayarak iş akışı yapılandırma arayüzüne girin:

![Boş bir iş akışı](https://static-docs.nocobase.com/20251027223131.png)

Ardından, tetikleyici kartına tıklayarak tetikleyici yapılandırma çekmecesini açın. Daha önce oluşturduğunuz bir koleksiyonu (örneğin, “Yazılar” koleksiyonu) seçin, tetikleme zamanlaması için “Kayıt eklendikten sonra” seçeneğini belirleyin ve “Kaydet” düğmesine tıklayarak tetikleyici yapılandırmasını tamamlayın:

![Tetikleyiciyi Yapılandırma](https://static-docs.nocobase.com/20251027224735.png)

Daha sonra, akıştaki artı düğmesine tıklayarak akışa bir düğüm ekleyebiliriz. Örneğin, tetikleyici verilerindeki “Başlık” alanı ile “ID” alanını birleştirmek için bir hesaplama düğümü seçin:

![Hesaplama Düğümü Ekleme](https://static-docs.nocobase.com/20251027224842.png)

Düğüm kartına tıklayarak düğüm yapılandırma çekmecesini açın. Formula.js tarafından sağlanan `CONCATENATE` hesaplama fonksiyonunu kullanarak “Başlık” ve “ID” alanlarını birleştirin. İki alan da değişken seçici aracılığıyla eklenir:

![Fonksiyonlar ve değişkenler kullanan hesaplama düğümü](https://static-docs.nocobase.com/20251027224939.png)

Ardından, sonucu “Başlık” alanına kaydetmek için bir veri güncelleme düğümü oluşturun:

![Veri Güncelleme Düğümü Oluşturma](https://static-docs.nocobase.com/20251027232654.png)

Benzer şekilde, kartı tıklayarak veri güncelleme düğümünün yapılandırma çekmecesini açın. “Yazılar” koleksiyonunu seçin, güncellenecek veri ID'si için tetikleyicideki veri ID'sini, güncellenecek veri öğesi için “Başlık”ı ve güncellenecek veri değeri için hesaplama düğümünün sonucunu seçin:

![Veri Güncelleme Düğümünü Yapılandırma](https://static-docs.nocobase.com/20251027232802.png)

Son olarak, sağ üst köşedeki araç çubuğunda bulunan “Etkinleştir”/“Devre Dışı Bırak” anahtarına tıklayarak iş akışını etkin duruma getirin, böylece iş akışı tetiklenebilir ve çalıştırılabilir.

## İş Akışını Tetikleme

Sistem ana arayüzüne geri dönün, yazılar bloğu aracılığıyla bir yazı oluşturun ve yazı başlığını girin:

![Yazı verisi oluşturma](https://static-docs.nocobase.com/20251027233004.png)

Gönderdikten ve bloğu yeniledikten sonra, yazı başlığının otomatik olarak “Yazı Başlığı + Yazı ID” formatına güncellendiğini görebilirsiniz:

![İş akışı tarafından değiştirilen yazı başlığı](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=İpucu}
Koleksiyon olayları tarafından tetiklenen iş akışları eşzamansız olarak yürütüldüğünden, verileri gönderdikten hemen sonra arayüzde veri güncellemesini göremeyebilirsiniz. Ancak, kısa bir süre sonra sayfayı veya bloğu yenilediğinizde güncellenmiş içeriği görebilirsiniz.
:::

## Yürütme Geçmişini Görüntüleme

İş akışı az önce başarıyla tetiklendi ve bir kez çalıştırıldı. İlgili yürütme geçmişini görmek için iş akışı yönetim arayüzüne geri dönebiliriz:

![İş akışı listesini görüntüleme](https://static-docs.nocobase.com/20251027233246.png)

İş akışı listesinde, bu iş akışının bir yürütme geçmişi oluşturduğunu görebilirsiniz. Sayı sütunundaki bağlantıya tıklayarak ilgili iş akışının yürütme geçmişi kayıtlarını açabilirsiniz:

![İlgili iş akışının yürütme geçmişi listesi](https://static-docs.nocobase.com/20251027233341.png)

“Görüntüle” bağlantısına tıklayarak o yürütmenin detay sayfasına girebilir, burada her düğümün yürütme durumunu ve sonuç verilerini görebilirsiniz:

![İş akışı yürütme geçmişi detayları](https://static-docs.nocobase.com/20251027233615.png)

Tetikleyicinin bağlam verileri ve düğüm yürütmesinin sonuç verileri, ilgili kartın sağ üst köşesindeki durum düğmesine tıklanarak görüntülenebilir. Örneğin, hesaplama düğümünün sonuç verilerini inceleyelim:

![Hesaplama düğümü sonucu](https://static-docs.nocobase.com/20251027233635.png)

Hesaplama düğümünün sonuç verilerinde hesaplanmış başlığın yer aldığını görebilirsiniz; bu başlık, sonraki veri güncelleme düğümü tarafından güncellenen veridir.

## Özet

Yukarıdaki adımları takip ederek basit bir iş akışının yapılandırmasını ve tetiklenmesini tamamladık ve aşağıdaki temel kavramlarla tanıştık:

- **İş Akışı**: Akışın ad, tetikleyici türü ve etkin durumu gibi temel bilgilerini tanımlamak için kullanılır. İçinde istediğiniz sayıda düğüm yapılandırılabilir ve akışı taşıyan varlıktır.
- **Tetikleyici**: Her iş akışı, iş akışının tetiklenmesi için belirli koşullarla yapılandırılabilen bir tetikleyici içerir. Akışın giriş noktasıdır.
- **Düğüm**: Bir düğüm, bir iş akışı içinde belirli bir eylemi gerçekleştiren bir talimat birimidir. Bir iş akışındaki birden fazla düğüm, yukarı ve aşağı akış ilişkileri aracılığıyla eksiksiz bir yürütme akışı oluşturur.
- **Yürütme**: Bir iş akışı tetiklendikten sonraki belirli yürütme nesnesidir; aynı zamanda yürütme kaydı veya yürütme geçmişi olarak da bilinir. Yürütme durumu, tetikleyici bağlam verileri gibi bilgileri içerir. Her düğüm için de düğümün yürütme durumu ve sonuç verileri bilgilerini içeren ilgili yürütme sonuçları bulunur.

Daha ayrıntılı kullanım için aşağıdaki içeriklere başvurabilirsiniz:

- [Tetikleyiciler](./triggers/index)
- [Düğümler](./nodes/index)
- [Değişkenleri Kullanma](./advanced/variables)
- [Yürütmeler](./advanced/executions)
- [Sürüm Yönetimi](./advanced/revisions)
- [Gelişmiş Seçenekler](./advanced/options)