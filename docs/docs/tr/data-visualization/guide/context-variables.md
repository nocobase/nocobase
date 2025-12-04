:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Bağlam Değişkenlerini Kullanma

Bağlam değişkenleri sayesinde, mevcut sayfa, kullanıcı, zaman ve filtre girdileri gibi bilgileri doğrudan yeniden kullanabilirsiniz. Bu, grafiklerinizi bağlama göre oluşturmanıza ve aralarında etkileşim kurmanıza olanak tanır.

## Uygulama Alanları
- Builder modundaki veri sorgularında filtre koşulları için değişkenleri seçerek kullanabilirsiniz.

![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- SQL modundaki veri sorgularında, sorgu ifadelerini oluştururken değişkenleri seçebilir ve (örneğin `{{ ctx.user.id }}`) gibi ifadeler ekleyebilirsiniz.

![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Grafik seçeneklerinin Özel (Custom) modunda doğrudan JS ifadeleri yazabilirsiniz.

![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Etkileşimli olaylarda (örneğin, detaylı bilgi için bir açılır pencere açmak ve veri aktarmak için tıklama) doğrudan JS ifadeleri yazabilirsiniz.

![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Not:**
- `{{ ... }}` ifadelerini tek veya çift tırnak içine almayın; bağlama sırasında sistem, değişken türüne (metin, sayı, zaman, NULL) göre güvenli bir şekilde işlem yapar.
- Bir değişken `NULL` veya tanımsız olduğunda, SQL'de `COALESCE(...)` veya `IS NULL` kullanarak boş değer mantığını açıkça ele alın.