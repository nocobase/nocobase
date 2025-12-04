:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Veri Sorgulama

Grafik yapılandırma paneli genel olarak üç ana bölüme ayrılmıştır: Veri sorgulama, Grafik seçenekleri ve Etkileşim olayları. Ayrıca en altta İptal, Önizle ve Kaydet düğmeleri bulunur.

Şimdi öncelikle "Veri sorgulama" panelini inceleyelim ve iki sorgulama modunu (Builder/SQL) ile yaygın kullanılan özelliklerini anlayalım.

## Panel Yapısı

![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> İpucu: Mevcut içeriği daha kolay yapılandırmak için diğer panelleri öncelikle daraltabilirsiniz.

En üstte işlem çubuğu yer alır:
- Mod: Builder (grafiksel, basit ve kullanışlı) / SQL (manuel yazılan sorgular, daha esnek).
- Sorguyu Çalıştır: Veri sorgulama isteğini yürütmek için tıklayın.
- Sonucu Görüntüle: Veri sonuç panelini açar, burada Tablo/JSON görünümleri arasında geçiş yapabilirsiniz. Paneli daraltmak için tekrar tıklayın.

Yukarıdan aşağıya doğru sırasıyla:
- Veri kaynağı ve koleksiyon: Zorunludur. Veri kaynağını ve koleksiyonu seçin.
- Ölçütler (Measures): Zorunludur. Görüntülenecek sayısal alanlardır.
- Boyutlar (Dimensions): Alanlara göre gruplandırma yapar (örn. tarih, kategori, bölge).
- Filtre: Filtre koşullarını ayarlayın (örn. =, ≠, >, <, içerir, aralık). Birden fazla koşul birleştirilebilir.
- Sıralama: Sıralanacak alanı ve artan/azalan sırayı seçin.
- Sayfalama: Veri aralığını ve dönüş sırasını kontrol eder.

## Builder Modu

### Veri kaynağı ve koleksiyon seçimi
- "Veri sorgulama" panelinde modu "Builder" olarak ayarlayın.
- Bir veri kaynağı ve koleksiyon (veri tablosu) seçin. Eğer koleksiyon seçilemiyor veya boşsa, öncelikle izinleri ve oluşturulup oluşturulmadığını kontrol edin.

### Ölçütleri (Measures) Yapılandırma
- Bir veya daha fazla sayısal alan seçin ve bir toplama (aggregation) ayarlayın: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Yaygın kullanım senaryoları: Kayıt sayısını saymak için `Count`, toplam tutarı hesaplamak için `Sum`.

### Boyutları (Dimensions) Yapılandırma
- Bir veya daha fazla alanı gruplandırma boyutu olarak seçin.
- Tarih ve saat alanları, ay veya güne göre gruplandırmayı kolaylaştırmak için biçimlendirilebilir (örn. `YYYY-MM`, `YYYY-MM-DD`).

### Filtreleme, Sıralama ve Sayfalama
- Filtreleme: Koşullar ekleyin (örn. =, ≠, içerir, aralık). Birden fazla koşul birleştirilebilir.
- Sıralama: Bir alan ve sıralama düzeni (artan/azalan) seçin.
- Sayfalama: Döndürülen satır sayısını kontrol etmek için `Limit` ve `Offset` değerlerini ayarlayın. Hata ayıklarken küçük bir `Limit` değeri ayarlamanız önerilir.

### Sorguyu Çalıştırma ve Sonucu Görüntüleme
- Yürütmek için "Sorguyu Çalıştır" düğmesine tıklayın. Sorgu döndükten sonra, sütunları ve değerleri kontrol etmek için "Sonucu Görüntüle" bölümünde `Tablo / JSON` arasında geçiş yapın.
- Grafik alanlarını eşleştirmeden önce, ileride boş bir grafikle karşılaşmamak veya hata almamak için sütun adlarını ve türlerini burada onaylayın.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Sonraki Alan Eşleştirmesi

Daha sonra, "Grafik seçenekleri" yapılandırılırken, seçilen veri kaynağı ve koleksiyonun tablo alanlarına göre alan eşleştirmesi yapacaksınız.

## SQL Modu

### Sorgu Yazma
- "SQL" moduna geçin, sorgu ifadenizi girin ve "Sorguyu Çalıştır" düğmesine tıklayın.
- Örnek (tarihe göre toplam sipariş tutarı):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Sorguyu Çalıştırma ve Sonucu Görüntüleme

- Yürütmek için "Sorguyu Çalıştır" düğmesine tıklayın. Sorgu döndükten sonra, sütunları ve değerleri kontrol etmek için "Sonucu Görüntüle" bölümünde `Tablo / JSON` arasında geçiş yapın.
- Grafik alanlarını eşleştirmeden önce, ileride boş bir grafikle karşılaşmamak veya hata almamak için sütun adlarını ve türlerini burada onaylayın.

### Sonraki Alan Eşleştirmesi

Daha sonra, "Grafik seçenekleri" yapılandırılırken, sorgu sonucundaki sütunlara göre alan eşleştirmesi yapacaksınız.

> [!TIP]
> SQL modu hakkında daha fazla bilgi için lütfen Gelişmiş Kullanım — SQL Modunda Veri Sorgulama bölümüne bakın.