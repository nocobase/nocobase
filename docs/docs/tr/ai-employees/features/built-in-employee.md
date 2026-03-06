:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/ai-employees/features/built-in-employee) bakın.
:::

# Yerleşik AI Çalışanları

NocoBase, belirli senaryolara yönelik önceden yapılandırılmış birden fazla yerleşik AI çalışanı ile birlikte gelir.

Çalışmaya başlamak için tek yapmanız gereken LLM (Büyük Dil Modeli) servisini yapılandırmak ve ilgili çalışanı etkinleştirmektir; modeller oturum sırasında ihtiyaca göre değiştirilebilir.


## Tanıtım

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Çalışan Adı | Rol Konumlandırması | Temel Yetenekler |
| :--- | :--- | :--- |
| **Cole** | NocoBase Asistanı | Ürün kullanımı soru-cevap, doküman arama |
| **Ellis** | E-posta Uzmanı | E-posta yazımı, özet oluşturma, yanıt önerileri |
| **Dex** | Veri Düzenleme Uzmanı | Alan çevirisi, formatlama, bilgi çıkarma |
| **Viz** | İçgörü Analisti | Veri içgörüleri, trend analizi, anahtar metrik yorumlama |
| **Lexi** | Çeviri Yardımcısı | Çok dilli çeviri, iletişim desteği |
| **Vera** | Araştırma Analisti | Web araması, bilgi toplama, derinlemesine araştırma |
| **Dara** | Veri Görselleştirme Uzmanı | Grafik yapılandırma, görsel rapor oluşturma |
| **Orin** | Veri Modelleme Uzmanı | Veri tablosu yapısı tasarımı yardımı, alan önerileri |
| **Nathan** | Frontend Mühendisi | Frontend kod parçacıkları yazımı yardımı, stil düzenlemeleri |


Uygulama arayüzünün sağ alt köşesindeki **AI yüzen küresine** tıklayıp istediğiniz çalışanı seçerek iş birliğine başlayabilirsiniz.


## Özel Senaryo AI Çalışanları

Bazı yerleşik AI çalışanları (yapılandırma odaklı olanlar) sağ alt köşedeki AI çalışan listesinde görünmezler; bunların kendilerine özel çalışma alanları vardır, örneğin:

* Orin yalnızca veri kaynağı yapılandırma sayfasında görünür;
* Dara yalnızca grafik yapılandırma sayfasında görünür;
* Nathan yalnızca JS editöründe görünür.



---

Aşağıda, size ilham vermesi için AI çalışanlarının bazı tipik uygulama senaryoları listelenmiştir. Daha fazla potansiyeli gerçek iş süreçlerinizde keşfetmenizi bekliyoruz.


## Viz: İçgörü Analisti

### Tanıtım

> Tek tıkla grafikler ve içgörüler oluşturun, verilerin kendisini anlatmasına izin verin.

**Viz**, yerleşik **AI İçgörü Analisti**dir.
Mevcut sayfanızdaki verileri (Adaylar, Fırsatlar, Hesaplar gibi) okumayı bilir; otomatik olarak trend grafikleri, karşılaştırma grafikleri, KPI kartları ve kısa sonuçlar oluşturarak iş analizini kolay ve sezgisel hale getirir.

> "Son zamanlarda satışlar neden düştü?" diye mi merak ediyorsunuz?
> Viz'e tek bir cümle söylemeniz yeterli; size düşüşün nerede olduğunu, olası nedenlerini ve bir sonraki adımda neler yapılabileceğini söyleyebilir.

### Kullanım Senaryoları

Aylık işletme değerlendirmeleri, kanal ROI (Yatırım Getirisi) veya satış hunileri fark etmeksizin; Viz'in analiz yapmasını, grafikler oluşturmasını ve sonuçları yorumlamasını sağlayabilirsiniz.

| Senaryo | Öğrenmek İstediğiniz İçerik | Viz'in Çıktısı |
| -------- | ------------ | ------------------- |
| **Aylık Değerlendirme** | Bu ay geçen aya göre neden daha iyi? | KPI kartı + Trend grafiği + Üç iyileştirme önerisi |
| **Büyüme Analizi** | Gelir artışı miktar bazlı mı yoksa fiyat bazlı mı? | Faktör ayrıştırma grafiği + Karşılaştırma tablosu |
| **Kanal Analizi** | Hangi kanala yatırım yapmaya devam etmeye değer? | ROI grafiği + Elde tutma eğrisi + Öneriler |
| **Huni Analizi** | Trafik hangi adımda takılıyor? | Huni grafiği + Darboğaz açıklaması |
| **Müşteri Elde Tutma** | En değerli müşteriler hangileri? | RFM segmentasyon grafiği + Elde tutma eğrisi |
| **Promosyon Değerlendirmesi** | Büyük promosyonun etkisi nasıl oldu? | Karşılaştırma grafiği + Fiyat esnekliği analizi |

### Kullanım Şekli

**Sayfa Giriş Noktaları**

* **Sağ üst buton (Önerilen)**
  
  Adaylar (Leads), Fırsatlar (Opportunities), Hesaplar (Accounts) gibi sayfaların sağ üst köşesindeki **Viz simgesine** tıklayarak önceden tanımlanmış görevleri seçebilirsiniz, örneğin:

  * Aşama dönüşümü ve trendler
  * Kaynak kanal karşılaştırması
  * Aylık değerlendirme analizi

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Sağ alt genel panel**
  
  Hangi sayfada olursanız olun, genel AI panelini çağırabilir ve doğrudan Viz ile konuşabilirsiniz:

  ```
  Son 90 gündeki satış değişimlerini analiz et
  ```

  Viz, bulunduğunuz sayfanın veri bağlamını otomatik olarak dahil edecektir.

**Etkileşim Şekli**

Viz, doğal dildeki soruları destekler ve çok turlu takip sorularını anlayabilir.
Örnek:

```
Selam Viz, bu ayki aday trendlerini oluştur.
```

```
Sadece üçüncü taraf kanalların performansına bak.
```

```
Peki hangi bölge en hızlı büyüyor?
```

Her bir takip sorusu, veri koşullarını tekrar girmenize gerek kalmadan bir önceki analiz sonucunun üzerine derinleşmeye devam eder.

### Viz ile Sohbet İçin Küçük İpuçları

| Yöntem | Etki |
| ---------- | ------------------- |
| Zaman aralığını belirtin | "Son 30 gün", "Geçen ay vs Bu ay" daha doğrudur |
| Boyutları belirtin | "Bölgeye/kanala/ürüne göre bak" bakış açısını hizalamaya yardımcı olur |
| Detaylardan ziyade trendlere odaklanın | Viz, değişim yönünü ve temel nedenleri bulmada ustadır |
| Doğal dil kullanın | Komut dizimine gerek yok, sadece sohbet eder gibi soru sorun |


---



## Dex: Veri Düzenleme Uzmanı

### Tanıtım

> Formları hızlıca ayıklayın ve doldurun, dağınık bilgileri yapılandırılmış hale getirin.

`Dex` bir veri düzenleme uzmanıdır; yapılandırılmamış verilerden veya dosyalardan gerekli bilgileri ayıklayıp yapılandırılmış bilgilere dönüştürür ve araçları kullanarak bu bilgileri formlara doldurabilir.

### Kullanım Şekli

Form sayfasında `Dex`'i çağırın ve sohbet penceresini açın.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Giriş kutusundaki `Add work context` (Çalışma bağlamı ekle) seçeneğine tıklayın ve `Pick block` (Blok seç) öğesini seçin; sayfa blok seçim moduna girecektir.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Sayfadaki form bloğunu seçin.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Diyalog kutusuna `Dex`'in düzenlemesini istediğiniz verileri girin.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Gönderdikten sonra `Dex` verileri yapılandıracak ve yeteneklerini kullanarak verileri seçilen forma güncelleyecektir.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Veri Modelleme Uzmanı

### Tanıtım

> Veri tablolarını akıllıca tasarlayın ve veri tabanı yapısını optimize edin.

`Orin` bir veri modelleme uzmanıdır; ana veri kaynağı yapılandırma sayfasında `Orin`'in veri tabloları oluşturmanıza veya değiştirmenize yardımcı olmasını sağlayabilirsiniz.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Kullanım Şekli

Veri kaynağı yönetimi eklentisine girin ve ana veri kaynağını yapılandırmayı seçin.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Sağ üst köşedeki `Orin` avatarına tıklayarak AI çalışanı diyalog kutusunu açın.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Modelleme ihtiyaçlarınızı `Orin`'e açıklayın, gönderin ve yanıtı bekleyin. 

`Orin` ihtiyaçlarınızı onayladığında, yeteneklerini kullanacak ve size veri modellemesinin bir önizlemesini sunacaktır.

Önizlemeyi inceledikten sonra, `Orin`'in modellemesine göre veri tablolarını oluşturmak için `Finish review and apply` (İncelemeyi bitir ve uygula) butonuna tıklayın.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Frontend Mühendisi

### Tanıtım

> Karmaşık etkileşim mantıklarını gerçekleştirmek için frontend kodları yazmanıza ve optimize etmenize yardımcı olur.

`Nathan`, NocoBase'deki frontend geliştirme uzmanıdır. `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow`, `Linkage` gibi JavaScript yazılması gereken senaryolarda, kod editörünün sağ üst köşesinde `Nathan`'ın avatarı görünecektir; editördeki kodları yazması veya değiştirmesi için ondan yardım isteyebilirsiniz.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Kullanım Şekli

Kod editöründe `Nathan`'a tıklayarak AI çalışanı diyalog kutusunu açın; editördeki kodlar otomatik olarak giriş kutusuna eklenecek ve uygulama bağlamı olarak `Nathan`'a gönderilecektir.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Kodlama ihtiyacınızı girin, `Nathan`'a gönderin ve yanıtını bekleyin.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

`Nathan`'ın yanıtladığı kod bloğu üzerindeki `Apply to editor` (Editöre uygula) butonuna tıklayarak onun kodunu editördeki kodun üzerine yazın.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Efektleri gerçek zamanlı olarak görmek için kod editöründeki `Run` (Çalıştır) butonuna tıklayabilirsiniz.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Kod Geçmişi

`Nathan`'ın diyalog kutusunun sağ üst köşesindeki 'komut satırı' simgesine tıklayarak, mevcut oturumda gönderdiğiniz kod parçacıklarını ve `Nathan`'ın yanıtladığı kod parçacıklarını görüntüleyebilirsiniz.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)