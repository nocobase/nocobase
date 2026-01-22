:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Blok Bağlantı Kuralları

## Giriş

Blok bağlantı kuralları, kullanıcıların blokların görünümünü dinamik olarak kontrol etmesine ve öğelerin blok düzeyinde genel yönetimini sağlamasına olanak tanır. Bloklar, alanlar ve işlem düğmeleri için birer taşıyıcı görevi gördüğünden, bu kurallar aracılığıyla kullanıcılar, tüm görünümün gösterimini blok boyutunda esnek bir şekilde kontrol edebilirler.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Not**: Blok bağlantı kuralları uygulanmadan önce, bloğun görünümü öncelikle bir **ACL izin kontrolünden** geçmelidir. Yalnızca kullanıcı ilgili erişim izinlerine sahip olduğunda blok bağlantı kurallarının değerlendirme mantığına girilebilir. Başka bir deyişle, blok bağlantı kuralları yalnızca ACL görüntüleme izin gereksinimleri karşılandıktan sonra geçerli olur. Blok bağlantı kuralları yoksa, blok varsayılan olarak görüntülenir.

### Blokları Genel Değişkenlerle Kontrol Etme

**Blok bağlantı kuralları**, bloklarda görüntülenen içeriği dinamik olarak kontrol etmek için genel değişkenlerin kullanımını destekler; böylece farklı rol ve izinlere sahip kullanıcılar özelleştirilmiş veri görünümlerini görebilir ve bunlarla etkileşim kurabilir. Örneğin, bir sipariş yönetim sisteminde, farklı roller (yönetici, satış personeli ve finans personeli gibi) siparişleri görüntüleme iznine sahip olsa da, her rolün görmesi gereken alanlar ve işlem düğmeleri farklılık gösterebilir. Genel değişkenleri yapılandırarak, kullanıcının rolüne, izinlerine veya diğer koşullara göre görüntülenen alanları, işlem düğmelerini ve hatta veri sıralama ve filtreleme kurallarını esnek bir şekilde ayarlayabilirsiniz.

#### Özel Kullanım Senaryoları:

- **Rol ve İzin Kontrolü**: Farklı rollerin izinlerine göre belirli alanların görünürlüğünü veya düzenlenebilirliğini kontrol edin. Örneğin, satış personeli yalnızca temel sipariş bilgilerini görüntüleyebilirken, finans personeli ödeme detaylarını görüntüleyebilir.
- **Kişiselleştirilmiş Görünümler**: Farklı departmanlar veya ekipler için farklı blok görünümleri özelleştirerek, her kullanıcının yalnızca işiyle ilgili içeriği görmesini sağlayın ve böylece verimliliği artırın.
- **İşlem İzni Yönetimi**: Genel değişkenleri kullanarak işlem düğmelerinin görünümünü kontrol edin. Örneğin, bazı roller yalnızca verileri görüntüleyebilirken, diğer roller değiştirme veya silme gibi işlemleri gerçekleştirebilir.

### Blokları Bağlamsal Değişkenlerle Kontrol Etme

Bloklar ayrıca bağlamdaki değişkenler aracılığıyla görünümlerini kontrol edebilir. Örneğin, blokları dinamik olarak göstermek veya gizlemek için "Geçerli kayıt", "Geçerli form" ve "Geçerli açılır pencere kaydı" gibi bağlamsal değişkenleri kullanabilirsiniz.

Örnek: "Sipariş Fırsat Bilgileri" bloğu yalnızca sipariş durumu "Ödendi" olduğunda görüntülenir.

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Daha fazla bağlantı kuralı bilgisi için bkz. [Bağlantı Kuralları](/interface-builder/linkage-rule).