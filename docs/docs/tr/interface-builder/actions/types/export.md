---
pkg: "@nocobase/plugin-action-export"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Dışa Aktar

## Giriş

Dışa aktarma özelliği, filtrelenmiş kayıtları **Excel** formatında dışa aktarmanıza olanak tanır ve dışa aktarılacak alanları yapılandırmayı destekler. Kullanıcılar, ihtiyaçlarına göre dışa aktarılacak alanları seçebilirler, böylece verileri daha sonra analiz edebilir, işleyebilir veya arşivleyebilirler. Bu özellik, veri işlemlerinin esnekliğini artırır; özellikle verilerin başka platformlara aktarılması veya daha fazla işlenmesi gereken senaryolarda kullanışlıdır.

### Öne Çıkan Özellikler:
- **Alan Seçimi**: Kullanıcılar, dışa aktarılacak alanları yapılandırabilir ve seçebilir, böylece dışa aktarılan verilerin doğru ve özlü olmasını sağlarlar.
- **Excel Format Desteği**: Dışa aktarılan veriler standart bir Excel dosyası olarak kaydedilir, bu da diğer verilerle kolayca entegre edilip analiz edilmesini sağlar.

Bu özellik sayesinde kullanıcılar, işlerindeki önemli verileri kolayca dışa aktarabilir ve harici kullanım için değerlendirebilir, böylece iş verimliliğini artırabilirler.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## İşlem Yapılandırması

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Dışa Aktarılabilir Alanlar

- Birinci seviye: Mevcut koleksiyonun tüm alanları;
- İkinci seviye: Eğer bir ilişki alanıysa, ilişkili koleksiyonun alanlarını seçmeniz gerekir;
- Üçüncü seviye: Yalnızca üç seviye işlenir; son seviyedeki ilişki alanları gösterilmez;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Bağlantı Kuralı](/interface-builder/actions/action-settings/linkage-rule): Düğmeyi dinamik olarak gösterir/gizler;
- [Düğmeyi Düzenle](/interface-builder/actions/action-settings/edit-button): Düğmenin başlığını, rengini ve simgesini düzenleyin;