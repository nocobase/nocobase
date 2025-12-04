:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Tema Düzenleyici

> Şu anki tema özelliği Ant Design 5.x sürümüne dayanmaktadır. Bu belgeye devam etmeden önce [Tema Özelleştirme](https://ant.design/docs/react/customize-theme-cn#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98) kavramlarını incelemeniz önerilir.

## Giriş

Tema Düzenleyici eklentisi, tüm ön uç sayfasının stillerini değiştirmek için kullanılır. Şu anda, genel kapsamdaki [SeedToken](https://ant.design/docs/react/customize-theme-cn#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme-cn#maptoken) ve [AliasToken](https://ant.design/docs/react/customize-theme-cn#aliastoken) düzenlemeyi destekler. Ayrıca, [Karanlık Mod](https://ant.design/docs/react/customize-theme-cn#%E4%BD%BF%E7%94%A8%E9%A2%84%E8%AE%BE%E7%AE%97%E6%B3%95) ve `Yoğun Mod` arasında geçiş yapma imkanı sunar. Gelecekte, [bileşen düzeyinde](https://ant.design/docs/react/customize-theme-cn#%E4%BF%AE%E6%94%B9%E7%BB%84%E4%BB%B6%E5%8F%98%E9%87%8F-component-token) tema özelleştirmesini de destekleyebiliriz.

## Kullanım Talimatları

### Tema Düzenleyici Eklentisini Etkinleştirme

Öncelikle NocoBase'i en son sürüme (v0.11.1 veya üzeri) güncelleyin. Ardından, Eklenti Yönetimi sayfasında `Tema Düzenleyici` kartını arayın. Kartın sağ alt köşesindeki `Etkinleştir` düğmesine tıklayın ve sayfanın yenilenmesini bekleyin.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Tema Yapılandırma Sayfasına Gitme

Eklentiyi etkinleştirdikten sonra, kartın sol alt köşesindeki ayarlar düğmesine tıklayarak tema düzenleme sayfasına gidin. Varsayılan olarak dört tema seçeneği sunulur: `Varsayılan Tema`, `Karanlık Tema`, `Yoğun Tema` ve `Yoğun Karanlık Tema`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Yeni Tema Ekleme

`Yeni Tema Ekle` düğmesine tıklayın ve `Tamamen Yeni Bir Tema Oluştur` seçeneğini belirleyin. Sayfanın sağ tarafında bir Tema Düzenleyici açılacaktır; bu düzenleyici `Renkler`, `Boyutlar`, `Stiller` gibi seçenekleri düzenlemenizi sağlar. Düzenlemeyi tamamladıktan sonra, tema adını girin ve kaydet düğmesine tıklayarak yeni temayı oluşturun.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Yeni Tema Uygulama

Fareyi sayfanın sağ üst köşesine getirdiğinizde tema değiştirme seçeneğini göreceksiniz. Buraya tıklayarak, az önce eklediğiniz tema gibi diğer temalara geçiş yapabilirsiniz.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Mevcut Bir Temayı Düzenleme

Kartın sol alt köşesindeki `Düzenle` düğmesine tıklayın. Sayfanın sağ tarafında bir Tema Düzenleyici (yeni tema eklerken gördüğünüzle aynı) açılacaktır. Düzenlemeyi tamamladıktan sonra, kaydet düğmesine tıklayarak temayı güncelleyin.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Kullanıcı Tarafından Seçilebilir Temaları Ayarlama

Yeni eklenen temalar varsayılan olarak kullanıcıların geçiş yapmasına izin verir. Eğer kullanıcıların belirli bir temaya geçiş yapmasını istemiyorsanız, tema kartının sağ alt köşesindeki `Kullanıcı tarafından seçilebilir` anahtarını kapatabilirsiniz. Bu durumda kullanıcılar o temaya geçiş yapamayacaktır.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Varsayılan Tema Olarak Ayarlama

Başlangıçta varsayılan tema `Varsayılan Tema`dır. Belirli bir temayı varsayılan olarak ayarlamak isterseniz, o tema kartının sağ alt köşesindeki `Varsayılan Tema` anahtarını açabilirsiniz. Bu sayede kullanıcılar sayfayı ilk açtıklarında bu temayı görecektir. Not: Varsayılan tema silinemez.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Tema Silme

Kartın altındaki `Sil` düğmesine tıklayın, ardından açılan onay iletişim kutusunda onaylayarak temayı silebilirsiniz.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)