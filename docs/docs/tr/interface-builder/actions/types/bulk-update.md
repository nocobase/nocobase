---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Toplu Güncelleme

## Giriş

Toplu güncelleme işlemi, bir grup kayda aynı güncellemeyi uygulamanız gerektiğinde kullanılır. Bu işlemi gerçekleştirmeden önce, güncellenecek alanların atama mantığını önceden tanımlamanız gerekir. Tanımladığınız bu mantık, güncelleme düğmesine tıkladığınızda seçilen tüm kayıtlara uygulanacaktır.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## İşlem Yapılandırması

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Güncellenecek Veriler

Seçili/Tümü, varsayılan olarak Seçili'dir.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Alan Ataması

Toplu güncelleme için alanları belirleyin. Yalnızca belirlediğiniz alanlar güncellenecektir.

Resimde gördüğünüz gibi, siparişler tablosunda toplu güncelleme işlemini yapılandırarak seçili verileri 'Onay Bekliyor' olarak toplu bir şekilde güncelleyebilirsiniz.

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Düğmeyi Düzenle](/interface-builder/actions/action-settings/edit-button): Düğmenin başlığını, türünü ve simgesini düzenleyebilirsiniz;
- [Bağlantı Kuralı](/interface-builder/actions/action-settings/linkage-rule): Düğmeyi dinamik olarak gösterebilir/gizleyebilirsiniz;
- [İkinci Onay](/interface-builder/actions/action-settings/double-check)