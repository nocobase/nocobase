---
pkg: "@nocobase/plugin-action-bulk-edit"
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/actions/types/bulk-edit) bakın.
:::

# Toplu Düzenleme

## Tanıtım

Toplu düzenleme, verilerin esnek bir şekilde toplu olarak güncellenmesi gereken senaryolar için uygundur. Toplu düzenleme düğmesine tıkladıktan sonra, açılır pencerede toplu düzenleme formunu yapılandırabilir ve her alan için farklı güncelleme stratejileri belirleyebilirsiniz.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## İşlem Yapılandırması

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## Kullanım Kılavuzu

### Toplu Düzenleme Formu Yapılandırması

1. Bir toplu düzenleme düğmesi ekleyin.

2. Toplu düzenleme kapsamını ayarlayın: Seçili / Tümü, varsayılan olarak Seçili'dir.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. Bir toplu düzenleme formu ekleyin.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. Düzenlenecek alanları yapılandırın ve bir gönder düğmesi ekleyin.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### Form Gönderimi

1. Düzenlenecek veri satırlarını seçin.

2. Alanlar için düzenleme modunu seçin ve gönderilecek değerleri doldurun.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title=Mevcut Düzenleme Modları}
* **Güncelleme yapma**: Alan değişmeden kalır.
* **Şuna değiştir**: Alanı gönderilen değerle günceller.
* **Temizle**: Alandaki verileri temizler.

:::

3. Formu gönderin.