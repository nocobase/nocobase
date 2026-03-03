:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/blocks/filter-blocks/form) bakın.
:::

# Filtre Formu

## Giriş

Filtre formu, kullanıcıların form alanlarını doldurarak verileri filtrelemesine olanak tanır. Tablo blokları, grafik blokları, liste blokları vb. filtrelemek için kullanılabilir.

## Nasıl Kullanılır

Filtre formunun kullanımını hızlıca anlamak için basit bir örnekle başlayalım. Kullanıcı bilgilerini içeren bir tablo bloğumuz olduğunu ve verileri bir filtre formu aracılığıyla filtrelemek istediğimizi varsayalım. Şunun gibi:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Yapılandırma adımları şunlardır:

1. Yapılandırma modunu açın, sayfaya bir "Filtre formu" bloğu ve bir "Tablo bloğu" ekleyin.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Tablo bloğuna ve filtre formu bloğuna "Takma ad" alanını ekleyin.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Artık kullanıma hazırdır.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Gelişmiş Kullanım

Filtre formu bloğu daha fazla gelişmiş yapılandırmayı destekler, aşağıda bazı yaygın kullanımlar yer almaktadır.

### Birden Fazla Bloğu Bağlama

Tek bir form alanı aynı anda birden fazla bloğun verilerini filtreleyebilir. İşlem adımları şunlardır:

1. Alanın "Connect fields" yapılandırma seçeneğine tıklayın.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. İlişkilendirilmesi gereken hedef blokları ekleyin, burada sayfadaki liste bloğunu seçiyoruz.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Liste bloğunda ilişkilendirilecek bir veya daha fazla alan seçin. Burada "Takma ad" alanını seçiyoruz.
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Kaydet düğmesine tıklayarak yapılandırmayı tamamlayın, sonuç aşağıda gösterildiği gibidir:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Grafik Bloklarını Bağlama

Referans: [Sayfa Filtreleri ve Bağlantı](../../../data-visualization/guide/filters-and-linkage.md)

### Özel Alanlar

Koleksiyondan alan seçmenin yanı sıra, "Özel alanlar" aracılığıyla da form alanları oluşturabilirsiniz. Örneğin, bir açılır tekli seçim alanı oluşturabilir ve seçenekleri özelleştirebilirsiniz. İşlem adımları şunlardır:

1. "Özel alanlar" seçeneğine tıklayın, yapılandırma arayüzü açılacaktır.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Alan başlığını doldurun, "Alan türü" kısmından "Seçim"i seçin ve seçenekleri yapılandırın.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Yeni eklenen özel alanların hedef bloktaki alanlarla manuel olarak ilişkilendirilmesi gerekir, işlem yöntemi şöyledir:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Yapılandırma tamamlandı, sonuç aşağıda gösterildiği gibidir:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Şu anda desteklenen alan türleri şunlardır:

- Metin kutusu
- Sayı
- Tarih
- Seçim
- Radyo düğmesi
- Onay kutusu
- İlişkili kayıtlar

#### İlişkili Kayıtlar (Özel İlişki Alanı)

"İlişkili kayıtlar", "ilişkili tablo kayıtlarına göre filtreleme" senaryoları için uygundur. Örneğin, bir sipariş listesinde siparişleri "Müşteri"ye göre filtrelemek veya bir görev listesinde görevleri "Sorumlu"ya göre filtrelemek gibi.

Yapılandırma öğesi açıklamaları:

- **Hedef koleksiyon**: Seçilebilir kayıtların hangi koleksiyondan yükleneceğini belirtir.
- **Başlık alanı**: Açılır seçenekler ve seçilen etiketler için görüntülenecek metin (ad, başlık gibi).
- **Değer alanı**: Gerçek filtreleme sırasında gönderilen değer, genellikle birincil anahtar alanı (id gibi) seçilir.
- **Çoklu seçime izin ver**: Etkinleştirildiğinde aynı anda birden fazla kayıt seçilebilir.
- **Operatör**: Filtreleme koşullarının nasıl eşleşeceğini tanımlar (aşağıdaki "Operatör" açıklamasına bakın).

Önerilen yapılandırma:

1. `Başlık alanı` için okunabilirliği yüksek bir alan (örneğin "Ad") seçin; ham ID kullanarak kullanılabilirliği olumsuz etkilemekten kaçının.
2. `Değer alanı` için filtrelemenin kararlı ve benzersiz olmasını sağlamak amacıyla birincil anahtar alanına öncelik verin.
3. Tekli seçim senaryolarında genellikle `Çoklu seçime izin ver` seçeneğini kapatın; çoklu seçim senaryolarında ise bu seçeneği açın ve uygun bir `Operatör` ile birlikte kullanın.

#### Operatör

`Operatör`, "filtre formu alan değeri" ile "hedef blok alan değeri" arasındaki eşleşme ilişkisini tanımlamak için kullanılır.

### Daraltma

Filtre formu içeriğini daraltmak ve genişletmek için bir daraltma düğmesi ekleyerek sayfa alanından tasarruf edebilirsiniz.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Aşağıdaki yapılandırmaları destekler:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Daraltıldığında gösterilecek satır sayısı**: Daraltılmış durumda görüntülenen form alanı satır sayısını ayarlar.
- **Varsayılan olarak daraltılmış**: Etkinleştirildiğinde, filtre formu varsayılan olarak daraltılmış durumda görüntülenir.