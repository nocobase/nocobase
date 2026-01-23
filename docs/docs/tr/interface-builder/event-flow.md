:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Olay akışı

## Giriş

Bir formda değişiklik olduğunda özel işlemler tetiklemek isterseniz, olay akışlarını kullanabilirsiniz. Formların yanı sıra, sayfalar, bloklar, düğmeler ve alanlar da özel işlemler yapılandırmak için olay akışlarından faydalanabilir.

## Nasıl kullanılır

Olay akışlarını nasıl yapılandıracağınızı anlamak için basit bir örneği inceleyelim. İki tablo arasında bir bağlantı oluşturalım: sol tablodaki bir satıra tıkladığınızda, sağ tablodaki veriler otomatik olarak filtrelensin.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Yapılandırma adımları şunlardır:

1. Sol tablo bloğunun sağ üst köşesindeki "şimşek" simgesine tıklayarak olay akışı yapılandırma panelini açın.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. "Olay akışı ekle (Add event flow)" seçeneğine tıklayın, "Tetikleyici olay (Trigger event)" olarak "Satır tıklaması (Row click)" seçeneğini belirleyin. Bu, bir tablo satırına tıklandığında akışın tetikleneceği anlamına gelir.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. "Tetikleyici koşul (Trigger condition)", koşulları yapılandırmak için kullanılır. Olay akışı yalnızca bu koşullar karşılandığında tetiklenir. Bu örnekte herhangi bir koşul yapılandırmamıza gerek yok, bu nedenle herhangi bir satır tıklamasında akış tetiklenecektir.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. İşlem adımları eklemek için "Adım ekle (Add step)" üzerine gelin. Sağ tablonun veri kapsamını yapılandırmak için "Veri kapsamını ayarla (Set data scope)" seçeneğini seçin.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Sağ tablonun UID'sini kopyalayın ve "Hedef blok UID (Target block UID)" giriş alanına yapıştırın. Alt kısımda, sağ tablonun veri kapsamını yapılandırabileceğiniz bir koşul yapılandırma paneli hemen görünecektir.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6. Aşağıda gösterildiği gibi bir koşul yapılandıralım:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Veri kapsamını yapılandırdıktan sonra, filtrelenmiş sonuçları görüntülemek için bloğu yenilemeniz gerekir. Sağ tablo bloğunu yenilemeyi yapılandıralım. Bir "Hedef blokları yenile (Refresh target blocks)" adımı ekleyin ve sağ tablonun UID'sini girin.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Son olarak, sağ alt köşedeki kaydet düğmesine tıklayarak yapılandırmayı tamamlayın.

## Olay Türleri

### Oluşturmadan önce (Before render)

Sayfalarda, bloklarda, düğmelerde veya alanlarda kullanılabilen evrensel bir olaydır. Bu olayda, farklı koşullara göre farklı veri kapsamları yapılandırmak gibi başlatma görevleri yapabilirsiniz.

### Satır tıklaması (Row click)

Tablo bloğuna özel bir olaydır. Bir tablo satırına tıklandığında tetiklenir. Tetiklendiğinde, bağlama bir "Tıklanan satır kaydı (Clicked row record)" ekler ve bu, koşullarda ve adımlarda bir değişken olarak kullanılabilir.

### Form değerleri değişimi (Form values change)

Form bloğuna özel bir olaydır. Form alanı değerleri değiştiğinde tetiklenir. Koşullarda ve adımlarda "Mevcut form (Current form)" değişkeni aracılığıyla form değerlerine erişebilirsiniz.

### Tıklama (Click)

Düğmeye özel bir olaydır. Düğmeye tıklandığında tetiklenir.

## Adım Türleri

### Özel değişken (Custom variable)

Bağlam içinde kullanmak üzere özel bir değişken oluşturun.

#### Kapsam

Özel değişkenlerin bir kapsamı vardır. Örneğin, bir bloğun olay akışında tanımlanan bir değişken yalnızca o blok içinde kullanılabilir. Bir değişkeni mevcut sayfadaki tüm bloklarda kullanılabilir hale getirmek için, bunu sayfanın olay akışında yapılandırmanız gerekir.

#### Form değişkeni (Form variable)

Bir form bloğundaki değerleri değişken olarak kullanın. Yapılandırma:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- `Variable title`: Değişken başlığı
- `Variable identifier`: Değişken tanımlayıcısı
- `Form UID`: Form UID

#### Diğer değişkenler

Gelecekte daha fazla değişken türü desteklenecektir.

### Veri kapsamını ayarla (Set data scope)

Bir hedef bloğun veri kapsamını ayarlayın. Yapılandırma:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- `Target block UID`: Hedef blok UID
- `Condition`: Filtreleme koşulu

### Hedef blokları yenile (Refresh target blocks)

Hedef blokları yenileyin. Birden fazla blok yapılandırılabilir. Yapılandırma:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- `Target block UID`: Hedef blok UID

### URL'ye git (Navigate to URL)

Bir URL'ye gidin. Yapılandırma:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- `URL`: Hedef URL, değişken kullanımını destekler
- `Search parameters`: URL'deki sorgu parametreleri
- `Open in new window`: İşaretlenirse, yönlendirme sırasında yeni bir tarayıcı sekmesi açar

### Mesaj göster (Show message)

Genel geri bildirim mesajlarını görüntüleyin.

#### Ne zaman kullanılır

- Başarı, uyarı ve hata gibi geri bildirim mesajları sağlayabilir.
- Üstte ortalanmış olarak görüntülenir ve otomatik olarak kaybolur; bu, kullanıcı işlemlerini kesintiye uğratmayan hafif bir bildirim yöntemidir.

#### Yapılandırma

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- `Message type`: Mesaj türü
- `Message content`: Mesaj içeriği
- `Duration`: Görüntülenme süresi (saniye cinsinden)

### Bildirim göster (Show notification)

Genel bildirim uyarılarını görüntüleyin.

#### Ne zaman kullanılır

Sistemin dört köşesinde bildirim uyarılarını görüntüleyin. Genellikle aşağıdaki durumlar için kullanılır:

- Daha karmaşık bildirim içeriği.
- Kullanıcılara sonraki adımları sunan etkileşimli bildirimler.
- Sistem tarafından başlatılan bildirimler.

#### Yapılandırma

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- `Notification type`: Bildirim türü
- `Notification title`: Bildirim başlığı
- `Notification description`: Bildirim açıklaması
- `Placement`: Konum, seçenekler: sol üst, sağ üst, sol alt, sağ alt

### JavaScript Çalıştır (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

JavaScript kodunu çalıştırın.