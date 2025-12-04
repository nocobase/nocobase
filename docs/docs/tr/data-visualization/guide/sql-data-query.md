:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# SQL Modunda Veri Sorgulama

Veri sorgulama panelinde SQL moduna geçerek sorgu ifadelerinizi yazabilir ve çalıştırabilirsiniz. Elde ettiğiniz sonuçları doğrudan grafik eşleme ve oluşturma için kullanabilirsiniz.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## SQL İfadeleri Yazma
- Veri sorgulama panelinde 'SQL' modunu seçin.
- SQL kodunuzu girin ve 'Sorguyu Çalıştır' butonuna tıklayarak çalıştırın.
- Çok tablolu JOIN'ler, VIEW'lar ve diğer karmaşık SQL ifadeleri desteklenmektedir.

Örnek: Aylık Sipariş Tutarı İstatistikleri
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Sonuçları Görüntüleme
- 'Veriyi Görüntüle' butonuna tıklayarak veri sonuçları önizleme panelini açabilirsiniz.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Veriler sayfalandırma özelliğini destekler; sütun adlarını ve tiplerini kontrol etmek için Tablo ve JSON görünümleri arasında geçiş yapabilirsiniz.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Alan Eşleme
- Grafik seçenekleri yapılandırmasında, sorgu verisi sonuç sütunlarına göre alan eşlemesini tamamlayın.
- Varsayılan olarak, ilk sütun boyut (X ekseni veya kategori) olarak, ikinci sütun ise ölçü (Y ekseni veya değer) olarak otomatik atanır. Bu nedenle, SQL'deki alan sırasına dikkat edin:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- boyut alanı ilk sütunda
  SUM(total_amount) AS total -- ölçü alanı sonrasında
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Bağlam Değişkenlerini Kullanma
SQL düzenleyicisinin sağ üst köşesindeki 'x' butonuna tıklayarak bağlam değişkenlerini kullanmayı seçebilirsiniz.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Onayladıktan sonra, değişken ifadesi SQL metnindeki imleç konumuna (veya seçili içeriğin konumuna) eklenir.

Örneğin `{{ ctx.user.createdAt }}`. Lütfen kendiniz ek tırnak işaretleri eklemeyin.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Daha Fazla Örnek
Daha fazla kullanım örneği için NocoBase [Demo uygulamasına](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) bakabilirsiniz.

**Öneriler:**
- Daha sonra hataları önlemek için sütun adlarını grafiklere eşlemeden önce sabitleyin.
- Hata ayıklama aşamasında, dönen satır sayısını azaltmak ve önizlemeyi hızlandırmak için `LIMIT` değerini ayarlayın.

## Önizleme, Kaydetme ve Geri Alma
- 'Sorguyu Çalıştır' butonuna tıklamak, veri talebini gerçekleştirir ve grafik önizlemesini yeniler.
- 'Kaydet' butonuna tıklamak, mevcut SQL metnini ve ilgili yapılandırmayı veritabanına kaydeder.
- 'İptal' butonuna tıklamak, son kaydedilen duruma geri döner ve mevcut kaydedilmemiş değişiklikleri atar.