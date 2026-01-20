:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Filtre Formu

## Giriş

Filtre formu, kullanıcıların form alanlarını doldurarak verileri filtrelemesine olanak tanır. Tablo blokları, grafik blokları, liste blokları ve daha fazlasını filtrelemek için kullanılabilir.

## Nasıl Kullanılır

Filtre formunun nasıl kullanılacağını hızlıca anlamak için basit bir örnekle başlayalım. Kullanıcı bilgilerini içeren bir tablo bloğumuz olduğunu ve verileri bir filtre formu kullanarak aşağıdaki gibi filtrelemek istediğimizi varsayalım:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Yapılandırma adımları şunlardır:

1. Düzenleme modunu etkinleştirin ve sayfaya bir "Filtre Formu" bloğu ile bir "Tablo" bloğu ekleyin.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Hem tablo bloğuna hem de filtre formu bloğuna "Takma Ad" alanını ekleyin.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Artık kullanmaya başlayabilirsiniz.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Gelişmiş Kullanım

Filtre formu bloğu daha gelişmiş yapılandırmaları destekler. İşte bazı yaygın kullanım senaryoları.

### Birden Fazla Bloğu Bağlama

Tek bir form alanı, aynı anda birden fazla bloğun verilerini filtreleyebilir. İşte nasıl yapacağınız:

1. Alanın "Alanları Bağla" yapılandırma seçeneğine tıklayın.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Bağlamak istediğiniz hedef blokları ekleyin. Bu örnekte, sayfadaki liste bloğunu seçeceğiz.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Liste bloğundan bağlanacak bir veya daha fazla alan seçin. Burada "Takma Ad" alanını seçiyoruz.
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Yapılandırmayı tamamlamak için kaydet düğmesine tıklayın. Sonuç aşağıdaki gibi görünecektir:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Grafik Bloklarını Bağlama

Referans: [Sayfa filtreleri ve bağlantı](../../../data-visualization/guide/filters-and-linkage.md)

### Özel Alanlar

Veri tablolarından alan seçmenin yanı sıra, "Özel Alanlar" kullanarak da form alanları oluşturabilirsiniz. Örneğin, özel seçeneklere sahip bir açılır tek seçim alanı oluşturabilirsiniz. İşte nasıl yapacağınız:

1. Yapılandırma panelini açmak için "Özel Alanlar" seçeneğine tıklayın.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Alan başlığını doldurun, alan modeli olarak "Seç"i seçin ve seçenekleri yapılandırın.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Yeni eklenen özel alanların hedef bloklardaki alanlarla manuel olarak ilişkilendirilmesi gerekir. İşte nasıl yapacağınız:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Yapılandırma tamamlandı. Sonuç aşağıdaki gibi görünüyor:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Şu anda desteklenen alan modelleri şunlardır:

- Input: Tek satırlık metin girişi
- Number: Sayısal giriş
- Date: Tarih seçici
- Select: Açılır liste (tekli veya çoklu seçim için yapılandırılabilir)
- Radio group: Radyo düğmeleri
- Checkbox group: Onay kutuları

### Daraltma

Filtre formu içeriğini daraltmak ve genişletmek için bir daraltma düğmesi ekleyerek sayfa alanından tasarruf edebilirsiniz.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Desteklenen yapılandırmalar:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Daraltılmış satırlar**: Daraltılmış durumda kaç satır form alanının görüntüleneceğini ayarlar.
- **Varsayılan olarak daraltılmış**: Etkinleştirildiğinde, filtre formu varsayılan olarak daraltılmış durumda görüntülenir.