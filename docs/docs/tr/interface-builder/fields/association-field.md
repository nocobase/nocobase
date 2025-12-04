:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İlişki Alanı Bileşenleri

## Giriş

NocoBase'in ilişki alanı bileşenleri, kullanıcıların ilişkili verileri daha iyi görüntülemesine ve işlemesine yardımcı olmak için tasarlanmıştır. İlişki türünden bağımsız olarak, bu bileşenler esneklik ve çok yönlülük sunar, böylece kullanıcılar bunları belirli ihtiyaçlarına göre seçebilir ve yapılandırabilir.

### Açılır Seçici

Hedef **koleksiyon** bir dosya **koleksiyonu** olduğunda kullanılan ilişki alanları hariç, düzenleme modundaki tüm ilişki alanları için varsayılan bileşen açılır seçicidir. Açılır seçenekler, başlık alanının değerini gösterir ve ilişkili verilerin önemli bir alan bilgisi gösterilerek hızlıca seçilebildiği senaryolar için uygundur.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Daha fazla bilgi için [Açılır Seçici](/interface-builder/fields/specific/select) bölümüne bakınız.

### Veri Seçici

Veri seçici, verileri bir açılır pencere (modal) şeklinde sunar. Kullanıcılar, veri seçicide gösterilecek alanları (ilişkili **koleksiyonlardaki** alanlar dahil) yapılandırabilir, böylece ilişkili verileri daha hassas bir şekilde seçebilirler.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Daha fazla bilgi için [Veri Seçici](/interface-builder/fields/specific/picker) bölümüne bakınız.

### Alt Form

Daha karmaşık ilişki verileriyle uğraşırken, açılır seçici veya veri seçici kullanmak pek pratik olmayabilir. Bu tür durumlarda, kullanıcıların sık sık açılır pencereler açması gerekir. Bu senaryolar için alt form kullanılabilir. Alt form, kullanıcıların ilişkili **koleksiyon** alanlarını mevcut sayfada veya mevcut açılır pencere bloğunda doğrudan yönetmelerine olanak tanır, böylece yeni açılır pencereleri tekrar tekrar açmaya gerek kalmaz ve **iş akışı** daha sorunsuz hale gelir. Çok katmanlı ilişkiler, iç içe formlar şeklinde görüntülenir.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Daha fazla bilgi için [Alt Form](/interface-builder/fields/specific/sub-form) bölümüne bakınız.

### Alt Tablo

Alt tablo, bire çok veya çoka çok ilişki kayıtlarını tablo formatında görüntüler. İlişkili verileri görüntülemek ve yönetmek için net, yapılandırılmış bir yol sunar ve toplu olarak yeni veri oluşturmayı veya mevcut verileri ilişkilendirmeyi destekler.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Daha fazla bilgi için [Alt Tablo](/interface-builder/fields/specific/sub-table) bölümüne bakınız.

### Alt Detay

Alt detay, alt formun salt okunur moddaki karşılığı olan bir bileşendir. İç içe çok katmanlı ilişkilerle verilerin görüntülenmesini destekler.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Daha fazla bilgi için [Alt Detay](/interface-builder/fields/specific/sub-detail) bölümüne bakınız.

### Dosya Yöneticisi

Dosya yöneticisi, ilişkinin hedef **koleksiyonu** bir dosya **koleksiyonu** olduğunda özel olarak kullanılan bir ilişki alanı bileşenidir.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Daha fazla bilgi için [Dosya Yöneticisi](/interface-builder/fields/specific/file-manager) bölümüne bakınız.

### Başlık

Başlık alanı bileşeni, salt okunur modda kullanılan bir ilişki alanı bileşenidir. Başlık alanını yapılandırarak, ilgili alan bileşenini yapılandırabilirsiniz.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Daha fazla bilgi için [Başlık](/interface-builder/fields/specific/title) bölümüne bakınız.