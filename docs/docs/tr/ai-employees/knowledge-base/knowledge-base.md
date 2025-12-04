:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Bilgi Tabanı

## Giriş

Bilgi tabanı, RAG (Retrieval Augmented Generation) altyapısının temelini oluşturur. Belgeleri kategorilere ayırarak düzenler ve bir dizin oluşturur. Yapay zeka çalışanları bir soruyu yanıtlarken, öncelikli olarak bilgi tabanında cevap arar.

## Bilgi Tabanı Yönetimi

Yapay zeka çalışanı eklenti yapılandırma sayfasına gidin, `Knowledge base` sekmesine tıklayarak bilgi tabanı yönetim sayfasına ulaşın.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Sağ üst köşedeki `Add new` düğmesine tıklayarak yeni bir `Local` bilgi tabanı ekleyin.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Yeni bilgi tabanı için gerekli bilgileri girin:

- `Name` giriş kutusuna bilgi tabanının adını girin;
- `File storage` alanında dosya depolama konumunu seçin;
- `Vector store` alanında vektör depolamayı seçin, [Vektör Depolama](/ai-employees/knowledge-base/vector-store) bölümüne bakın;
- `Description` giriş kutusuna bilgi tabanının açıklamasını girin;

`Submit` düğmesine tıklayarak bilgi tabanını oluşturun.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Bilgi Tabanı Belge Yönetimi

Bilgi tabanını oluşturduktan sonra, bilgi tabanı listesi sayfasında, yeni oluşturduğunuz bilgi tabanına tıklayarak bilgi tabanı belge yönetim sayfasına gidin.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

Belgeleri yüklemek için `Upload` düğmesine tıklayın. Belgeler yüklendikten sonra, vektörleştirme otomatik olarak başlayacaktır. `Status` (Durum) alanının `Pending` (Beklemede) durumundan `Success` (Başarılı) durumuna geçmesini bekleyin.

Şu anda bilgi tabanı aşağıdaki belge türlerini desteklemektedir: txt, pdf, doc, docx, ppt, pptx; PDF dosyaları yalnızca düz metin desteği sunar.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## Bilgi Tabanı Türleri

### Local Bilgi Tabanı

`Local` bilgi tabanı, NocoBase içinde yerel olarak depolanan bir bilgi tabanıdır. Belgeler ve bu belgelerin vektör verileri NocoBase tarafından yerel olarak saklanır.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Readonly Bilgi Tabanı

`Readonly` (Salt Okunur) bilgi tabanı, belgelerin ve vektör verilerinin harici olarak yönetildiği bir bilgi tabanıdır. NocoBase'de yalnızca bir vektör veritabanı bağlantısı oluşturulur (şu anda sadece PGVector desteklenmektedir).

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### External Bilgi Tabanı

`External` (Harici) bilgi tabanı, belgelerin ve vektör verilerinin harici olarak yönetildiği bir bilgi tabanıdır. Vektör veritabanı alma işlemleri geliştiriciler tarafından genişletilmelidir; bu sayede NocoBase'in şu anda desteklemediği vektör veritabanları da kullanılabilir.

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)