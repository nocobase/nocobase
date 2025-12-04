---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Ekleri Dışa Aktarma

## Giriş

Ekleri dışa aktarma özelliği, eklerle ilgili alanları sıkıştırılmış bir paket olarak dışa aktarmanızı sağlar.

#### Ek Dışa Aktarma Yapılandırması

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Dışa aktarmak istediğiniz ek alanlarını yapılandırabilirsiniz; çoklu seçim yapma imkanınız bulunmaktadır.
- Her kayıt için bir klasör oluşturulup oluşturulmayacağını seçebilirsiniz.

Dosya Adlandırma Kuralları:

- Her kayıt için bir klasör oluşturmayı seçerseniz, dosya adlandırma kuralı şöyledir: `{Kaydın başlık alanı değeri}/{Ek alanı adı}[-{Dosya sıra numarası}].{Dosya uzantısı}`.
- Klasör oluşturmamayı seçerseniz, dosya adlandırma kuralı şöyledir: `{Kaydın başlık alanı değeri}-{Ek alanı adı}[-{Dosya sıra numarası}].{Dosya uzantısı}`.

Ek alanında birden fazla ek bulunduğunda dosya sıra numarası otomatik olarak oluşturulur.

- [Bağlantı Kuralı](/interface-builder/actions/action-settings/linkage-rule): Düğmeyi dinamik olarak gösterir/gizler;
- [Düğmeyi Düzenle](/interface-builder/actions/action-settings/edit-button): Düğmenin başlığını, türünü ve simgesini düzenler;