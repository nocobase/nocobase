:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


## Sık Karşılaşılan Sorunlar ve Çözümleri

### 1. Excel Şablonlarındaki Boş Sütunlar ve Hücreler Oluşturulan Sonuçlarda Kayboluyor

**Sorun Açıklaması**: Excel şablonlarında, bir hücrenin içeriği veya herhangi bir stil tanımlaması yoksa, oluşturma (render) işlemi sırasında bu hücreler kaldırılabilir. Bu durum, nihai belgede bazı hücrelerin eksik görünmesine yol açar.

**Çözüm Yolları**:

-   **Arka plan rengi uygulayın**: Hedef alandaki boş hücrelere bir arka plan rengi uygulayarak, hücrelerin oluşturma süreci boyunca görünür kalmasını sağlayın.
-   **Boşluk karakteri ekleyin**: Boş hücrelerin içine bir boşluk karakteri ekleyin. Bu sayede, gerçek bir içerik olmasa bile hücrenin yapısı korunur.
-   **Kenarlıklar belirleyin**: Tabloya kenarlık stilleri ekleyerek hücre sınırlarını belirginleştirin ve oluşturma sırasında hücrelerin kaybolmasını önleyin.

**Örnek**:

Excel şablonunuzda, hedef hücrelerin tümüne açık gri bir arka plan rengi uygulayın ve boş hücrelere birer boşluk karakteri ekleyin.

### 2. Birleştirilmiş Hücreler Çıktıda Geçersiz Oluyor

**Sorun Açıklaması**: Döngü (loop) işlevini kullanarak tabloları oluştururken, şablonda birleştirilmiş hücreler bulunması, birleştirme etkisinin kaybolması veya verilerin yanlış hizalanması gibi beklenmedik oluşturma sorunlarına yol açabilir.

**Çözüm Yolları**:

-   **Birleştirilmiş hücreleri kullanmaktan kaçının**: Verilerin doğru şekilde oluşturulduğundan emin olmak için döngü ile oluşturulan tablolarda birleştirilmiş hücreler kullanmaktan mümkün olduğunca kaçının.
-   **Seçim boyunca ortala özelliğini kullanın**: Birden çok hücrede metni yatay olarak ortalamak isterseniz, hücreleri birleştirmek yerine "Seçim Boyunca Ortala" özelliğini kullanın.
-   **Birleştirilmiş hücre konumlarını sınırlayın**: Birleştirilmiş hücreler kullanmanız gerekiyorsa, birleştirme etkisinin oluşturma sırasında kaybolmasını önlemek için yalnızca tablonun üstünde veya sağında birleştirme yapın; altında veya solunda birleştirmekten kaçının.

### 3. Döngü Oluşturma Alanının Altındaki İçerik Biçim Bozukluğuna Neden Oluyor

**Sorun Açıklaması**: Excel şablonlarında, veri öğelerine göre dinamik olarak büyüyen bir döngü alanının (örneğin, sipariş detayları) altında başka içerik (örneğin, sipariş özeti, notlar) bulunuyorsa, oluşturma sırasında döngü tarafından üretilen veri satırları aşağı doğru genişleyecektir. Bu durum, aşağıdaki statik içeriğin üzerine yazılmasına veya onu aşağı itmesine neden olarak, nihai belgede biçim bozukluğuna ve içerik çakışmalarına yol açabilir.

**Çözüm Yolları**:

*   **Düzeni ayarlayın, döngü alanını en alta yerleştirin**: Bu en çok önerilen yöntemdir. Döngü ile oluşturulması gereken tablo alanını tüm çalışma sayfasının en altına yerleştirin. Başlangıçta altında bulunan tüm özet, imza vb. bilgileri döngü alanının üzerine taşıyın. Bu sayede, döngü verileri diğer hiçbir öğeyi etkilemeden serbestçe aşağı doğru genişleyebilir.
*   **Yeterli boş satır bırakın**: Döngü alanının altına içerik yerleştirmeniz gerekiyorsa, döngünün oluşturabileceği maksimum satır sayısını tahmin edebilir ve döngü alanı ile aşağıdaki içerik arasına manuel olarak yeterli sayıda boş satır ekleyerek bir tampon oluşturabilirsiniz. Ancak bu yöntemin riskleri vardır; gerçek veriler tahmin edilen satır sayısını aşarsa sorun tekrar ortaya çıkacaktır.
*   **Word şablonları kullanın**: Yerleşim gereksinimleri karmaşıksa ve Excel yapısını ayarlayarak çözülemiyorsa, şablon olarak Word belgelerini kullanmayı düşünebilirsiniz. Word'deki tablolar, satır sayısı arttığında aşağıdaki içeriği otomatik olarak aşağı kaydırır ve içerik çakışması sorunları yaşanmaz, bu da bu tür dinamik belgelerin oluşturulması için daha uygundur.

**Örnek**:

**Yanlış Yaklaşım**: "Sipariş Özeti" bilgilerini döngü ile oluşturulan "Sipariş Detayları" tablosunun hemen altına yerleştirmek.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Doğru Yaklaşım 1 (Düzeni Ayarlayın)**: "Sipariş Özeti" bilgilerini "Sipariş Detayları" tablosunun üzerine taşıyarak, döngü alanının sayfanın en alt öğesi olmasını sağlamak.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Doğru Yaklaşım 2 (Boş Satırlar Bırakın)**: "Sipariş Detayları" ve "Sipariş Özeti" arasına yeterli boş satır bırakarak, döngü içeriğinin genişlemesi için yeterli alan sağlamak.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Doğru Yaklaşım 3**: Word şablonları kullanın.

### 4. Şablon Oluşturma Sırasında Hata Uyarıları Görünüyor

**Sorun Açıklaması**: Şablon oluşturma (render) işlemi sırasında sistem hata uyarıları gösteriyor ve bu durum oluşturma işleminin başarısız olmasına yol açıyor.

**Olası Nedenler**:

-   **Yer tutucu hataları**: Yer tutucu adları veri kümesi alanlarıyla eşleşmiyor veya sözdizimi hataları içeriyor.
-   **Eksik veri**: Veri kümesinde şablonda referans verilen alanlar eksik.
-   **Biçimlendirici yanlış kullanımı**: Biçimlendirici parametreleri yanlış veya desteklenmeyen biçimlendirme türleri kullanılmış.

**Çözüm Yolları**:

-   **Yer tutucuları kontrol edin**: Şablondaki yer tutucu adlarının veri kümesindeki alan adlarıyla eşleştiğinden ve sözdiziminin doğru olduğundan emin olun.
-   **Veri kümesini doğrulayın**: Veri kümesinin şablonda referans verilen tüm alanları içerdiğini ve veri biçimlerinin gereksinimleri karşıladığını onaylayın.
-   **Biçimlendiricileri ayarlayın**: Biçimlendiricilerin kullanım yöntemlerini kontrol edin, parametrelerin doğru olduğundan ve desteklenen biçimlendirme türlerinin kullanıldığından emin olun.

**Örnek**:

**Yanlış şablon**:
```
Sipariş Numarası: {d.orderId}
Sipariş Tarihi: {d.orderDate:format('YYYY/MM/DD')}
Toplam Tutar: {d.totalAmount:format('0.00')}
```

**Veri kümesi**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // totalAmount alanı eksik
}
```

**Çözüm**: Veri kümesine `totalAmount` alanını ekleyin veya şablondan `totalAmount` referansını kaldırın.