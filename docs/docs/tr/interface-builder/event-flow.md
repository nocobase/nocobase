:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/event-flow) bakın.
:::

# Olay akışı

## Giriş

Bir formda değişiklik olduğunda bazı özel işlemleri tetiklemek isterseniz, bunu gerçekleştirmek için olay akışını kullanabilirsiniz. Formların yanı sıra sayfalar, bloklar, düğmeler ve alanlar da özel işlemleri yapılandırmak için olay akışlarını kullanabilir.

## Nasıl kullanılır

Aşağıda, olay akışının nasıl yapılandırılacağını açıklamak için basit bir örnek verilmiştir. Sol taraftaki tablonun bir satırına tıklandığında sağ taraftaki tablonun verilerini otomatik olarak filtreleyen iki tablo arasındaki bağlantıyı gerçekleştirelim.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Yapılandırma adımları şunlardır:

1. Sol tablo bloğunun sağ üst köşesindeki "şimşek" simgesine tıklayarak olay akışı yapılandırma arayüzünü açın.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. "Olay akışı ekle (Add event flow)" seçeneğine tıklayın, "Tetikleyici olay" olarak "Satır tıklaması"nı seçin; bu, tablo satırına tıklandığında tetikleneceği anlamına gelir.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. "Yürütme zamanlaması"nı (Execution timing) yapılandırın; bu, bu olay akışının sistemin yerleşik süreçlerine göre sırasını kontrol etmek için kullanılır. Genellikle varsayılanı koruyabilirsiniz; yerleşik mantık yürütüldükten sonra bir bildirim/yönlendirme isterseniz "Tüm akışlardan sonra"yı seçebilirsiniz. Daha fazla açıklama için aşağıdaki [Yürütme zamanlaması](#yürütme-zamanlaması) bölümüne bakın.
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. "Tetikleyici koşul (Trigger condition)", koşulları yapılandırmak için kullanılır; olay akışı yalnızca koşullar karşılandığında tetiklenir. Burada yapılandırmamıza gerek yok, herhangi bir satıra tıklandığında olay akışı tetiklenecektir.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Fareyi "Adım ekle (Add step)" üzerine getirin, bazı işlem adımları ekleyebilirsiniz. Sağ tablonun veri kapsamını ayarlamak için "Veri kapsamını ayarla (Set data scope)" seçeneğini seçiyoruz.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Sağ tablonun UID'sini kopyalayın ve "Hedef blok UID (Target block UID)" giriş kutusuna girin. Hemen aşağıda, sağ tablonun veri kapsamını yapılandırabileceğiniz bir koşul yapılandırma arayüzü görüntülenecektir.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Aşağıdaki resimde gösterildiği gibi bir koşul yapılandıralım:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Veri kapsamını yapılandırdıktan sonra, filtreleme sonuçlarını görüntülemek için bloğu yenilemeniz gerekir. Ardından sağ tablo bloğunu yenilemeyi yapılandıralım. Bir "Hedef blokları yenile (Refresh target blocks)" adımı ekleyin ve ardından sağ tablonun UID'sini girin.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Son olarak sağ alt köşedeki kaydet düğmesine tıklayın, yapılandırma tamamlanmıştır.

## Olay detayları

### Render öncesi

Genel olay; sayfa, blok, düğme veya alanlarda kullanılabilir. Bu olayda bazı başlatma çalışmaları yapabilirsiniz. Örneğin, farklı koşullar altında farklı veri kapsamları yapılandırabilirsiniz.

### Satır tıklaması (Row click)

Tablo bloğuna özel olay. Tablo satırına tıklandığında tetiklenir. Tetiklendiğinde bağlama bir Clicked row record eklenir ve bu, koşullarda ve adımlarda değişken olarak kullanılabilir.

### Form değerleri değişimi (Form values change)

Form bloğuna özel olay. Form alanı değeri değiştiğinde tetiklenir. Koşullarda ve adımlarda "Current form" değişkeni aracılığıyla form değerleri alınabilir.

### Tıklama (Click)

Düğmeye özel olay. Düğmeye tıklandığında tetiklenir.

## Yürütme zamanlaması

Olay akışı yapılandırmasında karıştırılması kolay iki kavram vardır:

- **Tetikleyici olay:** Ne zaman yürütülmeye başlanacağı (örneğin: Render öncesi, Satır tıklaması, Tıklama, Form değerleri değişimi vb.).
- **Yürütme zamanlaması:** Aynı tetikleyici olay gerçekleştikten sonra, sizin bu **özel olay akışınızın** **yerleşik sürecin** neresine ekleneceği.

### "Yerleşik süreç / Yerleşik adımlar" nedir?

Birçok sayfa, blok veya işlemin kendisi bir dizi sistem yerleşik işlem süreciyle birlikte gelir (örneğin: gönderme, açılır pencere açma, veri isteme vb.). Aynı olay (örneğin "Tıklama") için yeni bir özel olay akışı eklediğinizde, "Yürütme zamanlaması" şunları belirlemek için kullanılır:

- Önce sizin olay akışınız mı yoksa yerleşik mantık mı yürütülecek;
- Veya olay akışınız yerleşik sürecin belirli bir adımından önce mi yoksa sonra mı yürütülecek.

### UI'daki yürütme zamanlaması seçenekleri nasıl anlaşılır?

- **Tüm akışlardan önce (varsayılan):** En önce yürütülür. "Engelleme/Hazırlık" (örneğin doğrulama, ikincil onay, değişkenleri başlatma vb.) yapmak için uygundur.
- **Tüm akışlardan sonra:** Yerleşik mantık tamamlandıktan sonra yürütülür. "Kapanış/Geri bildirim" (örneğin bildirim mesajları, diğer blokları yenileme, sayfaya yönlendirme vb.) yapmak için uygundur.
- **Belirli akıştan önce / Belirli akıştan sonra:** Daha hassas ekleme noktalarıdır. Seçildikten sonra belirli bir "Yerleşik süreç" seçilmesi gerekir.
- **Belirli akış adımından önce / Belirli akış adımından sonra:** En hassas ekleme noktalarıdır. Seçildikten sonra hem "Yerleşik süreç" hem de "Yerleşik süreç adımı" seçilmesi gerekir.

> İpucu: Hangi yerleşik süreci/adımı seçeceğinizden emin değilseniz, ilk iki seçeneği ("Önce / Sonra") kullanmaya öncelik verebilirsiniz.

## Adım detayları

### Özel değişken (Custom variable)

Özel bir değişken tanımlamak ve ardından bağlamda kullanmak için kullanılır.

#### Kapsam

Özel değişkenlerin kapsamı vardır; örneğin bir bloğun olay akışında tanımlanan değişkenler yalnızca o blokta kullanılabilir. Mevcut sayfadaki tüm bloklarda kullanılabilir olmasını istiyorsanız, sayfadaki olay akışında yapılandırmanız gerekir.

#### Form değişkeni (Form variable)

Bir form bloğunun değerini değişken olarak kullanın. Yapılandırma aşağıdaki gibidir:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Değişken başlığı
- Variable identifier: Değişken tanımlayıcısı
- Form UID: Form UID

#### Diğer değişkenler

Gelecekte diğer değişkenler de desteklenecektir, lütfen takipte kalın.

### Veri kapsamını ayarla (Set data scope)

Hedef bloğun veri kapsamını ayarlayın. Yapılandırma aşağıdaki gibidir:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: Hedef blok UID
- Condition: Filtreleme koşulu

### Hedef blokları yenile (Refresh target blocks)

Hedef bloğu yenileyin, birden fazla blok yapılandırmaya izin verir. Yapılandırma aşağıdaki gibidir:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: Hedef blok UID

### URL'ye git (Navigate to URL)

Belirli bir URL'ye yönlendirin. Yapılandırma aşağıdaki gibidir:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: Hedef URL, değişken kullanımını destekler
- Search parameters: URL'deki sorgu parametreleri
- Open in new window: İşaretlenirse, yönlendirme sırasında yeni bir tarayıcı sayfası açılır

### Mesaj göster (Show message)

İşlem geri bildirim bilgilerini küresel olarak görüntüleyin.

#### Ne zaman kullanılır

- Başarı, uyarı ve hata gibi geri bildirim bilgileri sağlayabilir.
- Üstte ortalanmış olarak görüntülenir ve otomatik olarak kaybolur; kullanıcı işlemlerini kesintiye uğratmayan hafif bir ipucu yöntemidir.

#### Yapılandırma

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: İpucu türü
- Message content: İpucu içeriği
- Duration: Ne kadar süre kalacağı, birimi saniyedir

### Bildirim göster (Show notification)

Bildirim hatırlatıcı bilgilerini küresel olarak görüntüleyin.

#### Ne zaman kullanılır

Sistemin dört köşesinde bildirim hatırlatıcı bilgilerini görüntüleyin. Genellikle aşağıdaki