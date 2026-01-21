:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Hızlı Başlangıç

Bu kılavuzda, temel özelliklerini kullanarak sıfırdan bir grafik yapılandırmayı adım adım inceleyeceğiz. İsteğe bağlı yetenekler sonraki bölümlerde ele alınacaktır.

Ön Koşullar:
- Bir veri kaynağı ve koleksiyon (veri tablosu) yapılandırılmış olmalı ve okuma izniniz bulunmalıdır.

## Grafik Bloğu Ekleme

Sayfa tasarımcısında “Blok Ekle”ye tıklayın, “Grafik”i seçin ve bir grafik bloğu ekleyin.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Ekledikten sonra, bloğun sağ üst köşesindeki “Yapılandır”a tıklayın.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Sağ tarafta grafiğin yapılandırma paneli açılacaktır. Bu panel Veri Sorgusu, Grafik Seçenekleri ve Olaylar olmak üzere üç bölüm içerir.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Veri Sorgusunu Yapılandırma
“Veri Sorgusu” panelinde, veri kaynağını, sorgu filtrelerini ve ilgili seçenekleri yapılandırabilirsiniz.

- Öncelikle veri kaynağını ve koleksiyonu seçin
  - “Veri Sorgusu” panelinde, sorgunun temeli olarak veri kaynağını ve koleksiyonu seçin.
  - Eğer koleksiyon seçilemiyor veya boşsa, öncelikle oluşturulup oluşturulmadığını ve mevcut kullanıcı iznini kontrol edin.

- Ölçümleri (Measures) Yapılandırın
  - Bir veya daha fazla sayısal alanı ölçüm olarak seçin.
  - Her ölçüm için bir toplama (aggregation) türü belirleyin: Toplam (Sum) / Sayı (Count) / Ortalama (Avg) / Maksimum (Max) / Minimum (Min).

- Boyutları (Dimensions) Yapılandırın
  - Gruplandırma boyutları olarak bir veya daha fazla alan seçin (tarih, kategori, bölge vb.).
  - Tarih/saat alanları için, tutarlı bir görüntüleme sağlamak amacıyla bir format (örneğin, `YYYY-AA`, `YYYY-AA-GG`) belirleyebilirsiniz.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Filtreleme, sıralama ve sayfalama gibi diğer koşullar isteğe bağlıdır.

## Sorguyu Çalıştırma ve Verileri Görüntüleme

- “Sorguyu Çalıştır”a tıkladığınızda, veriler çekilir ve sol taraftaki sayfada doğrudan bir önizleme grafiği oluşturulur.
- Döndürülen veri sonuçlarını önizlemek için “Veriyi Görüntüle”ye tıklayabilirsiniz; Tablo/JSON formatları arasında geçiş yapma desteği mevcuttur. Tekrar tıkladığınızda veri önizlemesi kapanır.
- Veri sonucu boşsa veya beklentilerinizi karşılamıyorsa, sorgu paneline geri dönerek koleksiyon izinlerini, ölçüm/boyut alan eşleştirmelerini ve veri türlerini kontrol edin.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Grafik Seçeneklerini Yapılandırma

“Grafik Seçenekleri” panelinde, grafik türünü seçebilir ve grafik seçeneklerini yapılandırabilirsiniz.

- Öncelikle bir grafik türü seçin (çizgi/alan, sütun/çubuk, pasta/halka, dağılım vb.).
- Temel alan eşleştirmelerini tamamlayın:
  - Çizgi/Alan/Sütun/Çubuk: `xField` (boyut), `yField` (ölçüm), `seriesField` (seri, isteğe bağlı)
  - Pasta/Halka: `Category` (kategorik boyut), `Value` (ölçüm)
  - Dağılım: `xField`, `yField` (iki ölçüm veya boyut)
  - Daha fazla grafik ayarı için ECharts belgelerine başvurabilirsiniz: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- “Sorguyu Çalıştır”a tıkladıktan sonra alan eşleştirmeleri varsayılan olarak otomatik tamamlanır. Boyutları/ölçümleri değiştirdikten sonra lütfen eşleştirmeleri tekrar kontrol edin.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Önizleme ve Kaydetme
Yapılandırma değişiklikleri sol taraftaki önizlemede otomatik olarak gerçek zamanlı güncellenir ve grafiği görebilirsiniz. Ancak, “Kaydet” düğmesine tıklamadan önce tüm değişikliklerin gerçekten kaydedilmediğini unutmayın.

Ayrıca alttaki düğmeleri de kullanabilirsiniz:

- Önizleme: Yapılandırma değişiklikleri önizlemeyi otomatik olarak gerçek zamanlı yeniler; ayrıca alttaki “Önizleme” düğmesine tıklayarak manuel olarak da yenileme yapabilirsiniz.
- İptal: Mevcut yapılandırma değişikliklerini istemiyorsanız, alttaki “İptal” düğmesine tıklayabilir veya sayfayı yenileyerek bu değişiklikleri geri alıp son kaydedilen duruma dönebilirsiniz.
- Kaydet: “Kaydet”e tıkladığınızda, mevcut tüm sorgu ve grafik yapılandırmaları veritabanına kalıcı olarak kaydedilir ve tüm kullanıcılar için geçerli olur.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Sık Karşılaşılan İpuçları

- Minimum Çalışır Yapılandırma: Bir koleksiyon ve en az bir ölçüm seçin; gruplandırılmış görüntüleme için boyutlar eklemeniz önerilir.
- Tarih boyutları için, yatay eksende süreksizlik veya karışıklığı önlemek amacıyla uygun bir format (örneğin, aylık istatistikler için `YYYY-AA`) belirlemeniz önerilir.
- Sorgu boşsa veya grafik görüntülenmiyorsa:
  - Koleksiyonu/izinleri ve alan eşleştirmelerini kontrol edin;
  - “Veriyi Görüntüle” bölümünde sütun adlarının ve türlerinin grafik eşleştirmesiyle uyumlu olup olmadığını doğrulayın.
- Önizleme geçicidir: Yalnızca doğrulama ve ayarlamalar içindir. “Kaydet”e tıkladıktan sonra resmi olarak yürürlüğe girer.