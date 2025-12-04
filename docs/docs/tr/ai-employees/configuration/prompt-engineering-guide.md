:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Yapay Zeka Çalışanı · İstek Mühendisliği Rehberi

> "Nasıl yazılır"dan "iyi yazılır"a geçişi sağlayan bu rehber, yüksek kaliteli istekleri basit, istikrarlı ve yeniden kullanılabilir bir şekilde yazmayı öğretir.

## 1. İstekler Neden Bu Kadar Önemli?

İstekler, bir yapay zeka çalışanının "iş tanımı" gibidir; doğrudan onun tarzını, sınırlarını ve çıktı kalitesini belirler.

**Karşılaştırmalı Örnek:**

❌ Belirsiz İstek:

```
Siz bir veri analizi asistanısınız ve kullanıcıların verileri analiz etmesine yardımcı oluyorsunuz.
```

✅ Açık ve Kontrol Edilebilir İstek:

```
Siz bir veri analizi uzmanı olan Viz'siniz.

Rol Tanımı
- Tarz: Derinlemesine analiz yeteneği, net ifade, görselleştirmeye önem veren
- Misyon: Karmaşık verileri anlaşılır "grafik hikayelerine" dönüştürmek

İş Akışı
1) Gereksinimleri anlayın
2) Güvenli SQL oluşturun (yalnızca SELECT kullanın)
3) İçgörüleri çıkarın
4) Grafikler ile sunun

Katı Kurallar
- ZORUNLU: Yalnızca SELECT kullanın, verileri asla değiştirmeyin
- HER ZAMAN: Varsayılan olarak grafik görselleştirmeler üretin
- ASLA: Veri uydurmayın veya tahmin etmeyin

Çıktı Formatı
Kısa sonuç (2-3 cümle) + ECharts grafik JSON'ı
```

**Sonuç**: İyi bir istek, "kim olduğu, ne yapacağı, nasıl yapacağı ve hangi standartta yapacağı" konularını net bir şekilde tanımladığında, yapay zekanın performansı istikrarlı ve kontrol edilebilir olur.

## 2. İstekler İçin "Dokuz Öğe" Altın Formülü

Uygulamada etkinliği kanıtlanmış bir yapı:

```
Adlandırma + Çift Talimat + Simüle Edilmiş Onay + Tekrarlama + Katı Kurallar
+ Arka Plan Bilgisi + Pozitif Pekiştirme + Referans Örnekleri + Olumsuz Örnekler (İsteğe Bağlı)
```

### 2.1 Öğe Açıklamaları

| Öğe   | Ne Sorunu Çözer            | Neden Etkilidir        |
| ---- | ----------------- | ------------ |
| Adlandırma   | Kimliği ve tarzı netleştirir           | Yapay zekanın "rol duygusu" geliştirmesine yardımcı olur |
| Çift Talimat | "Ben kimim / Ne yapmam gerekiyor" ayrımını yapar     | Rol karmaşasını azaltır       |
| Simüle Edilmiş Onay | Yürütmeden önce anlamayı tekrar eder            | Sapmayı önler          |
| Tekrarlama | Anahtar noktaların tekrar tekrar görünmesi           | Önceliği artırır        |
| Katı Kurallar | ZORUNLU/HER ZAMAN/ASLA | Bir temel oluşturur         |
| Arka Plan Bilgisi | Gerekli bilgi ve kısıtlamalar           | Yanlış anlaşılmayı azaltır         |
| Pozitif Pekiştirme | Beklentileri ve tarzı yönlendirir           | Daha istikrarlı bir ton ve performans    |
| Referans Örnekleri | Doğrudan taklit edilecek bir model sağlar           | Çıktının beklentilere daha yakın olmasını sağlar      |
| Olumsuz Örnekler | Yaygın hatalardan kaçınır             | Hataları düzeltir, kullandıkça daha doğru hale gelir    |

### 2.2 Hızlı Başlangıç Şablonu

```yaml
# 1) Adlandırma
Siz [Ad], mükemmel bir [Rol/Uzmanlık Alanı]'sınız.

# 2) Çift Talimat
## Rol
Tarz: [Sıfat x2-3]
Misyon: [Ana sorumluluğu tek cümleyle açıklayın]

## Görev İş Akışı
1) Anlama: [Ana nokta]
2) Yürütme: [Ana nokta]
3) Doğrulama: [Ana nokta]
4) Sunma: [Ana nokta]

# 3) Simüle Edilmiş Onay
Yürütmeden önce anlayışınızı tekrar edin: "Şunu anladım ki ...'ya ihtiyacınız var. Bunu ... aracılığıyla tamamlayacağım."

# 4) Tekrarlama
Temel Gereksinim: [En kritik 1-2 madde] (başlangıçta/iş akışında/sonda en az 2 kez görünmeli)

# 5) Katı Kurallar
ZORUNLU: [İhlal edilemez kural]
HER ZAMAN: [Her zaman uyulması gereken ilke]
ASLA: [Açıkça yasaklanmış eylem]

# 6) Arka Plan Bilgisi
[Gerekli alan bilgisi/bağlam/yaygın tuzaklar]

# 7) Pozitif Pekiştirme
[Yetenek] konusunda üstün bir performans sergiliyorsunuz ve [Uzmanlık] alanında yeteneklisiniz. Lütfen görevi bu tarzı koruyarak tamamlayın.

# 8) Referans Örnekleri
["İdeal çıktı"nın kısa ve öz bir örneğini verin]

# 9) Olumsuz Örnekler (İsteğe Bağlı)
- [Yanlış yaklaşım] → [Doğru yaklaşım]
```

## 3. Pratik Örnek: Viz (Veri Analizi)

Şimdi dokuz öğeyi bir araya getirerek "doğrudan kullanılabilir" eksiksiz bir örnek oluşturalım.

```text
# Adlandırma
Siz bir veri analizi uzmanı olan Viz'siniz.

# Çift Talimat
【Rol】
Tarz: Derinlemesine analiz yeteneği, net ifade, görsel odaklı
Misyon: Karmaşık verileri "grafik hikayelerine" dönüştürmek

【Görev İş Akışı】
1) Anlama: Kullanıcının veri gereksinimlerini ve metrik kapsamını analiz edin
2) Sorgulama: Güvenli SQL oluşturun (yalnızca gerçek verileri sorgulayın, sadece SELECT)
3) Analiz: Anahtar içgörüleri çıkarın (trendler/karşılaştırmalar/oranlar)
4) Sunma: Net bir ifade için uygun grafiği seçin

# Simüle Edilmiş Onay
Yürütmeden önce tekrar edin: "[Nesne/kapsam]'ı analiz etmek istediğinizi anlıyorum ve sonuçları [sorgulama ve görselleştirme yöntemi] aracılığıyla sunacağım."

# Tekrarlama
Tekrar vurgulanır: Veri doğruluğu önceliklidir, nicelikten ziyade nitelik önemlidir; veri yoksa dürüstçe belirtin.

# Katı Kurallar
ZORUNLU: Yalnızca SELECT sorguları kullanın, hiçbir veriyi değiştirmeyin
HER ZAMAN: Varsayılan olarak görsel grafikler üretin
ASLA: Veri uydurmayın veya tahmin etmeyin

# Arka Plan Bilgisi
- ECharts, yorum/fonksiyon içermeyen "saf JSON" yapılandırması kullanmalıdır
- Her grafik 1 konuya odaklanmalı, birden fazla metriği üst üste yığmaktan kaçının

# Pozitif Pekiştirme
Gerçek verilerden eyleme geçirilebilir sonuçlar çıkarmakta ve bunları en basit grafiklerle ifade etmekte yeteneklisiniz.

# Referans Örnekleri
Açıklama (2-3 cümle) + Grafik JSON'ı

Örnek Açıklama:
Bu ay 127 yeni potansiyel müşteri eklendi, bu da bir önceki aya göre %23'lük bir artışa işaret ediyor ve başlıca üçüncü taraf kanallardan geldi.

Örnek Grafik:
{
  "title": {"text": "Bu Ayki Potansiyel Müşteri Eğilimi"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Hafta1","Hafta2","Hafta3","Hafta4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Olumsuz Örnekler (İsteğe Bağlı)
- İngilizce ve Çince karışımı → Dil tutarlılığını koruyun
- Grafikler aşırı dolu → Her grafik yalnızca bir konuyu ifade etmeli
- Veri eksik → "Şu anda kullanılabilir veri yok" şeklinde dürüstçe belirtin
```

**Tasarım Noktaları**

* "Doğruluk", iş akışında, vurgulamada ve kurallarda birden çok kez geçmektedir (güçlü bir hatırlatma).
* Ön uç entegrasyonunu kolaylaştırmak için "açıklama + JSON" şeklinde iki bölümlü bir çıktı seçilmiştir.
* Riski azaltmak için "salt okunur SQL" açıkça belirtilmiştir.

## 4. İstekleri Zamanla Nasıl Daha İyi Hale Getirirsiniz?

### 4.1 Beş Adımlı Yineleme

```
Önce çalışır hale getirin → Küçük ölçekli test yapın → Sorunları kaydedin → Sorunlara yönelik kurallar/örnekler ekleyin → Tekrar test edin
```

<img src="https://static-docs.nocobase.com/prompt-engineering-guide-2025-11-02-20-19-54.png" alt="Optimizasyon Süreci" width="50%">

Bir seferde 5-10 tipik görevi test etmeniz ve bir turu 30 dakika içinde tamamlamanız önerilir.

### 4.2 İlkeler ve Oranlar

* **Pozitif Yönlendirmeye Öncelik Verin**: Önce yapay zekaya ne yapması gerektiğini söyleyin.
* **Sorun Odaklı İyileştirme**: Kısıtlamaları yalnızca sorunlar ortaya çıktığında ekleyin.
* **Ölçülü Kısıtlamalar**: Başlangıçtan itibaren "yasakları" yığmayın.

Deneyimsel Oran: **%80 Pozitif : %20 Negatif**.

### 4.3 Tipik Bir Optimizasyon

**Sorun**: Aşırı yüklü grafikler, kötü okunabilirlik
**Optimizasyon**:

1. "Arka Plan Bilgisi" bölümüne ekleyin: her grafik bir tema içermeli.
2. "Referans Örnekleri" bölümünde "tek metrikli bir grafik" sağlayın.
3. Sorun devam ederse, "Katı Kurallar/Tekrarlama" bölümüne zorlayıcı bir kısıtlama ekleyin.

## 5. Gelişmiş Teknikler

### 5.1 Daha Net Bir Yapı İçin XML/Etiket Kullanımı (Uzun İstekler İçin Önerilir)

İçerik 1000 karakteri aştığında veya kafa karıştırıcı olabileceği durumlarda, etiketlerle bölümlere ayırmak daha istikrarlı bir yöntemdir:

```xml
<Rol>Siz bir veri düzenleme uzmanı olan Dex'siniz.</Rol>
<Tarz>Titiz, doğru ve düzenli.</Tarz>

<Görev>
Aşağıdaki adımlara göre tamamlanmalıdır:
1. Anahtar alanları belirleyin
2. Alan değerlerini çıkarın
3. Formatı standartlaştırın (Tarih YYYY-MM-DD)
4. JSON çıktısı verin
</Görev>

<Kurallar>
ZORUNLU: Alan değerlerinin doğruluğunu koruyun
ASLA: Eksik bilgileri tahmin etmeyin
HER ZAMAN: Belirsiz öğeleri işaretleyin
</Kurallar>

<Örnek>
{"Ad":"John Doe","Tarih":"2024-01-15","Miktar":5000,"Durum":"Onaylandı"}
</Örnek>
```

### 5.2 Katmanlı "Arka Plan + Görev" Yaklaşımı (Daha Sezgisel Bir Yöntem)

* **Arka Plan** (uzun vadeli istikrar): Bu çalışanın kim olduğu, tarzı ve hangi yeteneklere sahip olduğu.
* **Görev** (isteğe bağlı): Şu anda ne yapılması gerektiği, hangi metriklere odaklanılacağı ve varsayılan kapsamın ne olduğu.

Bu, NocoBase'in "Çalışan + Görev" modeliyle doğal olarak eşleşir: **sabit bir arka plan ve esnek görevler**.

### 5.3 Modüler Yeniden Kullanım

Yaygın kuralları modüllere ayırarak gerektiğinde birleştirin:

**Veri Güvenliği Modülü**

```
ZORUNLU: Yalnızca SELECT kullanın
ASLA: INSERT/UPDATE/DELETE çalıştırmayın
```

**Çıktı Yapısı Modülü**

```
Çıktı şunları içermelidir:
1) Kısa açıklama (2-3 cümle)
2) Temel içerik (grafik/veri/kod)
3) İsteğe bağlı öneriler (varsa)
```

## 6. Altın Kurallar (Pratik Sonuçlar)

1. Bir yapay zeka yalnızca tek bir iş türüyle ilgilenmeli, uzmanlaşma daha istikrarlıdır.
2. Örnekler sloganlardan daha etkilidir; önce pozitif örnekler sunun.
3. Sınırları belirlemek için ZORUNLU/HER ZAMAN/ASLA kullanın.
4. Belirsizliği azaltmak için süreç odaklı bir yaklaşım kullanın.
5. Küçük adımlarla başlayın, daha çok test edin, daha az değiştirin ve sürekli yineleyin.
6. Aşırı kısıtlama yapmayın; "katı kodlama" davranışından kaçının.
7. Sorunları ve değişiklikleri kaydederek versiyonlar oluşturun.
8. 80/20 Kuralı: Önce "nasıl doğru yapılacağını" açıklayın, sonra "neyin yanlış yapılmaması gerektiğini" kısıtlayın.

## 7. Sıkça Sorulan Sorular

**S1: İdeal uzunluk ne kadardır?**

* Temel çalışan: 500–800 karakter
* Karmaşık çalışan: 800–1500 karakter
* 2000 karakterden fazlası önerilmez (yavaşlamaya ve gereksizliğe yol açabilir).
  Standart: Dokuz öğenin tamamını kapsayın, ancak gereksiz ayrıntılardan kaçının.

**S2: Yapay zeka talimatlara uymazsa ne yapmalısınız?**

1. Sınırları netleştirmek için ZORUNLU/HER ZAMAN/ASLA kullanın.
2. Anahtar gereksinimleri 2-3 kez tekrarlayın.
3. Yapıyı güçlendirmek için etiketler/bölümler kullanın.
4. Daha fazla pozitif örnek verin, soyut prensiplerden kaçının.
5. Daha güçlü bir modele ihtiyaç olup olmadığını değerlendirin.

**S3: Pozitif ve negatif yönlendirmeyi nasıl dengelersiniz?**
Önce pozitif kısımları (rol, iş akışı, örnekler) yazın, ardından hatalara göre kısıtlamalar ekleyin ve yalnızca "tekrar tekrar yanlış yapılan" noktaları kısıtlayın.

**S4: Sık sık güncellenmeli mi?**

* Arka Plan (kimlik/tarz/temel yetenekler): Uzun vadeli istikrar.
* Görev (senaryo/metrikler/kapsam): İş ihtiyaçlarına göre ayarlayın.
* Herhangi bir değişiklik olduğunda yeni bir versiyon oluşturun ve "neden değiştirildiğini" kaydedin.

## 8. Sonraki Adımlar

**Uygulamalı Alıştırma**

* Basit bir rol (örneğin, müşteri hizmetleri asistanı) seçin, dokuz öğeyi kullanarak "çalışır bir versiyon" yazın ve 5 tipik görevle test edin.
* Mevcut bir çalışanı bulun, 3-5 gerçek sorunu toplayın ve küçük bir yineleme gerçekleştirin.

**Daha Fazla Okuma**

* [Yapay Zeka Çalışanı · Yönetici Yapılandırma Rehberi](./admin-configuration.md): İstekleri gerçek yapılandırmaya uygulayın.
* Her yapay zeka çalışanına özel kılavuzlar: Tam rol/görev şablonlarını görüntüleyin.

## Sonuç

**Önce çalışır hale getirin, sonra iyileştirin.**
"Çalışan" bir versiyonla başlayın ve gerçek görevlerde sürekli olarak sorunları toplayın, örnekler ve kurallar ekleyerek iyileştirin.
Unutmayın: **Önce ona doğru şeyleri nasıl yapacağını söyleyin (pozitif yönlendirme), sonra yanlış şeyler yapmasını kısıtlayın (ölçülü sınırlama).**