
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# AI Çalışanı · Viz: CRM Senaryosu Yapılandırma Rehberi

> CRM örneğini kullanarak, yapay zeka içgörü analistinizin işinizi gerçekten anlamasını ve tüm potansiyelini ortaya çıkarmasını nasıl sağlayacağınızı öğrenin.

## 1. Giriş: Viz'i "Veriyi Görmekten" "İşi Anlamaya" Taşımak

NocoBase sisteminde, **Viz** önceden oluşturulmuş bir yapay zeka içgörü analistidir.
Sayfa bağlamını (örneğin Potansiyel Müşteriler, Fırsatlar, Hesaplar gibi) tanıyabilir ve trend grafikleri, huni grafikleri ve KPI kartları oluşturabilir.
Ancak varsayılan olarak, yalnızca en temel sorgulama yeteneklerine sahiptir:

| Araç                      | İşlev Açıklaması    | Güvenlik  |
| ----------------------- | ------- | ---- |
| Get Collection Names    | Koleksiyon Listesini Al | ✅ Güvenli |
| Get Collection Metadata | Alan Yapısını Al  | ✅ Güvenli |

Bu araçlar Viz'in yalnızca "yapıyı tanımasını" sağlar, ancak içeriği henüz gerçekten "anlamasını" sağlamaz.
İçgörüler oluşturmasını, anormallikleri tespit etmesini ve trendleri analiz etmesini sağlamak için, onu **daha uygun analiz araçlarıyla genişletmeniz** gerekir.

Resmi CRM Demosu'nda iki yöntem kullandık:

*   **Overall Analytics (Genel Amaçlı Analiz Motoru)**: Şablon tabanlı, güvenli ve yeniden kullanılabilir bir çözüm;
*   **SQL Execution (Uzmanlaşmış Analiz Motoru)**: Daha fazla esneklik sunar ancak daha büyük riskler taşır.

Bu ikisi tek seçenek değildir; daha çok bir **tasarım paradigması** gibidirler:

> Kendi işinize daha uygun bir uygulama oluşturmak için bu ilkeleri takip edebilirsiniz.

---

## 2. Viz'in Yapısı: İstikrarlı Kişilik + Esnek Görevler

Viz'i nasıl genişleteceğinizi anlamak için, öncelikle içindeki katmanlı tasarımı anlamanız gerekir:

| Katman       | Açıklama                              | Örnek    |
| -------- | ------------------------------- | ----- |
| **Rol Tanımı** | Viz'in kişiliği ve analiz yöntemi: Anla → Sorgula → Analiz Et → Görselleştir | Sabit  |
| **Görev Tanımı** | Belirli bir iş senaryosu için özelleştirilmiş istemler ve araç kombinasyonları             | Değiştirilebilir   |
| **Araç Yapılandırması** | Viz'in harici veri kaynaklarını veya iş akışlarını çağırması için köprü              | Serbestçe değiştirilebilir |

Bu katmanlı tasarım, Viz'in istikrarlı bir kişiliği (tutarlı analiz mantığı) korumasını sağlarken, aynı zamanda farklı iş senaryolarına (CRM, hastane yönetimi, kanal analizi, üretim operasyonları...) hızlıca adapte olabilmesine olanak tanır.

## 3. Desen Bir: Şablon Tabanlı Analiz Motoru (Önerilen)

### 3.1 İlke Özeti

**Overall Analytics**, CRM Demosu'ndaki çekirdek analiz motorudur.
Tüm SQL sorgularını bir **veri analizi şablon koleksiyonu (data_analysis)** aracılığıyla yönetir.
Viz doğrudan SQL yazmaz, bunun yerine sonuçları oluşturmak için **önceden tanımlanmış şablonları çağırır**.

Yürütme akışı aşağıdaki gibidir:

```mermaid
flowchart TD
    A[Viz görevi alır] --> B[Overall Analytics iş akışını çağırır]
    B --> C[Mevcut sayfaya/göreve göre şablonu eşleştirir]
    C --> D[Şablon SQL'ini yürütür (salt okunur)]
    D --> E[Veri sonucunu döndürür]
    E --> F[Viz grafik oluşturur + kısa yorumlama]
```

Bu sayede Viz, saniyeler içinde güvenli ve standartlaştırılmış analiz sonuçları oluşturabilirken, yöneticiler de tüm SQL şablonlarını merkezi olarak yönetebilir ve inceleyebilir.

---

### 3.2 Şablon Koleksiyonu Yapısı (data_analysis)

| Alan Adı                                               | Tür       | Açıklama            | Örnek                                                 |
| ------------------------------------------------- | -------- | ------------- | -------------------------------------------------- |
| **id**                                            | Integer  | Birincil Anahtar            | 1                                                  |
| **name**                                          | Text     | Analiz şablonu adı        | Leads Data Analysis                                |
| **collection**                                    | Text     | İlgili koleksiyon         | Lead                                               |
| **sql**                                           | Code     | Analiz SQL ifadesi (salt okunur) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description**                                   | Markdown | Şablon açıklaması veya tanımı       | "Aşamaya göre potansiyel müşteri sayısını say"                                        |
| **createdAt / createdBy / updatedAt / updatedBy** | Sistem Alanı     | Denetim bilgisi          | Otomatik oluşturulur                                               |

#### CRM Demosu'ndaki Şablon Örnekleri

| Ad                             | Koleksiyon  | Açıklama |
| -------------------------------- | ----------- | ----------- |
| Account Data Analysis            | Account     | Hesap Veri Analizi      |
| Contact Data Analysis            | Contact     | İletişim Veri Analizi       |
| Leads Data Analysis              | Lead        | Potansiyel Müşteri Trend Analizi      |
| Opportunity Data Analysis        | Opportunity | Fırsat Aşaması Hunisi      |
| Task Data Analysis               | Todo Tasks  | Yapılacak Görevler Durum İstatistikleri    |
| Users (Sales Reps) Data Analysis | Users       | Satış Temsilcileri Performans Karşılaştırması    |

---

### 3.3 Bu Deseninin Avantajları

| Boyut       | Avantaj                     |
| -------- | ---------------------- |
| **Güvenlik**  | Tüm SQL'ler depolanır ve incelenir, doğrudan sorgu oluşturma önlenir |
| **Sürdürülebilirlik** | Şablonlar merkezi olarak yönetilir ve tek tip olarak güncellenir            |
| **Yeniden Kullanılabilirlik** | Aynı şablon birden fazla görev tarafından yeniden kullanılabilir           |
| **Taşınabilirlik** | Sadece aynı koleksiyon yapısını gerektirerek diğer sistemlere kolayca taşınabilir    |
| **Kullanıcı Deneyimi** | İş kullanıcılarının SQL hakkında endişelenmesine gerek yoktur; sadece bir analiz isteği başlatmaları yeterlidir  |

> 📘 Bu `data_analysis` koleksiyonunun bu isimde olması zorunlu değildir.
> Önemli olan: **analiz mantığını şablonlanmış bir şekilde depolamak** ve bir iş akışı tarafından tek tip olarak çağrılmasını sağlamaktır.

---

### 3.4 Viz'in Bunu Nasıl Kullanmasını Sağlarsınız

Görev tanımında, Viz'e açıkça şunları söyleyebilirsiniz:

```markdown
Merhaba Viz,

Lütfen mevcut modülün verilerini analiz edin.

**Öncelik:** Analiz sonuçlarını şablon koleksiyonundan almak için Overall Analytics aracını kullanın.
**Eşleşen bir şablon bulunamazsa:** Bir şablonun eksik olduğunu belirtin ve yöneticinin bir tane eklemesini önerin.

Çıktı gereksinimleri:
- Her sonuç için ayrı bir grafik oluşturun;
- Grafiğin altına 2-3 cümlelik kısa bir açıklama ekleyin;
- Veri uydurmayın veya varsayımlarda bulunmayın.
```

Bu sayede Viz, iş akışını otomatik olarak çağıracak, şablon koleksiyonundan en uygun SQL'i eşleştirecek ve grafiği oluşturacaktır.

---

## 4. Desen İki: Uzmanlaşmış SQL Yürütücü (Dikkatli Kullanın)

### 4.1 Uygulanabilir Senaryolar

Keşifsel analiz, geçici sorgular veya çoklu koleksiyon JOIN birleştirmeleri gerektiğinde, Viz'in bir **SQL Execution** aracını çağırmasını sağlayabilirsiniz.

Bu aracın özellikleri şunlardır:

*   Viz doğrudan `SELECT` sorguları oluşturabilir;
*   Sistem yürüttükten sonra sonucu döndürür;
*   Viz analiz ve görselleştirmeden sorumludur.

Örnek görev:

> "Lütfen son 90 gündeki bölgelere göre potansiyel müşteri dönüşüm oranlarının değişim trendini analiz edin."

Bu durumda Viz şunları oluşturabilir:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Riskler ve Koruma Önerileri

| Risk Noktası    | Koruma Stratejisi            |
| ------ | --------------- |
| Yazma işlemleri oluşturma  | `SELECT` ile sınırlamayı zorunlu kılın  |
| İlgisiz koleksiyonlara erişim  | Koleksiyon adının var olup olmadığını doğrulayın        |
| Büyük koleksiyonlarla performans riski | Zaman aralığını sınırlayın, satır sayısı için LIMIT kullanın |
| İşlem izlenebilirliği  | Sorgu günlüğünü ve denetimi etkinleştirin       |
| Kullanıcı izin kontrolü | Yalnızca yöneticiler bu aracı kullanabilir      |

> Genel öneriler:
>
> *   Normal kullanıcılar yalnızca şablon tabanlı analizi (Overall Analytics) etkinleştirmelidir;
> *   Yalnızca yöneticiler veya kıdemli analistler SQL Execution'ı kullanabilir.

---

## 5. Kendi "Overall Analytics" Sisteminizi Kurmak İsterseniz

Aşağıda, herhangi bir sisteme (NocoBase'e bağımlı olmadan) kopyalayabileceğiniz basit, genel bir yaklaşım bulunmaktadır:

### Adım 1: Şablon Koleksiyonunu Tasarlayın

Koleksiyon adı herhangi bir şey olabilir (örn. `analysis_templates`).
Sadece şu alanları içermesi yeterlidir: `name`, `sql`, `collection` ve `description`.

### Adım 2: "Şablonu Getir → Yürüt" Hizmeti veya İş Akışı Yazın

Mantık:

1.  Görevi veya sayfa bağlamını (örn. mevcut koleksiyon) alın;
2.  Bir şablonu eşleştirin;
3.  Şablon SQL'ini yürütün (salt okunur);
4.  Standartlaştırılmış bir veri yapısı (satırlar + alanlar) döndürün.

### Adım 3: Yapay Zekanın Bu Arayüzü Çağırmasını Sağlayın

Görev istemi şöyle yazılabilir:

```
Önce şablon analiz aracını çağırmayı deneyin. Şablonlarda eşleşen bir analiz bulunamazsa, SQL yürütücüyü kullanın.
Lütfen tüm sorguların salt okunur olduğundan emin olun ve sonuçları göstermek için grafikler oluşturun.
```

> Bu sayede, yapay zeka çalışan sisteminiz CRM Demosu'na benzer analiz yeteneklerine sahip olacak, ancak tamamen bağımsız ve özelleştirilebilir olacaktır.

---

## 6. En İyi Uygulamalar ve Tasarım Önerileri

| Öneri                     | Açıklama                                     |
| ---------------------- | -------------------------------------- |
| **Şablon tabanlı analize öncelik verin**            | Güvenli, istikrarlı ve yeniden kullanılabilir                              |
| **SQL Execution'ı yalnızca bir ek olarak kullanın** | Yalnızca dahili hata ayıklama veya geçici sorgularla sınırlıdır                            |
| **Bir grafik, bir ana nokta**              | Çıktıyı net tutun ve aşırı karmaşadan kaçının                            |
| **Şablon adlandırması net olsun**             | Sayfaya/iş alanına göre adlandırın, örn. `Leads-Stage-Conversion` |
| **Açıklamalar kısa ve net olsun**             | Her grafiğe 2-3 cümlelik bir özet eşlik etsin                          |
| **Bir şablon eksik olduğunda belirtin**             | Kullanıcıya boş çıktı yerine "İlgili şablon bulunamadı" bilgisini verin                    |

---

## 7. CRM Demosu'ndan Kendi Senaryonuza

Hastane CRM'i, üretim, depo lojistiği veya eğitim kayıtları ile çalışıyor olun, aşağıdaki üç soruyu yanıtlayabildiğiniz sürece Viz sisteminize değer katabilir:

| Soru             | Örnek                  |
| -------------- | ------------------- |
| **1. Ne analiz etmek istiyorsunuz?** | Potansiyel müşteri trendleri / Anlaşma aşamaları / Ekipman çalışma oranı |
| **2. Veriler nerede?**   | Hangi koleksiyon, hangi alanlar            |
| **3. Nasıl sunmak istiyorsunuz?**  | Çizgi grafik, huni, pasta grafik, karşılaştırma tablosu        |

Bu içerikleri tanımladıktan sonra, sadece şunları yapmanız yeterlidir:

*   Analiz mantığını şablon koleksiyonuna yazın;
*   Görev istemini sayfaya ekleyin;
*   Viz rapor analizlerinizi "devralabilir".

---

## 8. Sonuç: Paradigmayı Yanınızda Götürün

"Overall Analytics" ve "SQL Execution" sadece iki örnek uygulamadır.
Daha da önemlisi arkalarındaki fikirdir:

> **Yapay zeka çalışanının sadece istemleri yürütmek yerine iş mantığınızı anlamasını sağlayın.**

NocoBase, özel bir sistem veya kendi yazdığınız bir iş akışı kullanıyor olun, bu yapıyı kopyalayabilirsiniz:

*   Merkezi şablonlar;
*   İş akışı çağrıları;
*   Salt okunur yürütme;
*   Yapay zeka sunumu.

Bu sayede Viz, artık sadece "grafik oluşturabilen bir yapay zeka" değil,
verilerinizi, tanımlarınızı ve işinizi anlayan gerçek bir analist olacaktır.