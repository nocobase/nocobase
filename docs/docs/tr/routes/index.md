---
pkg: "@nocobase/plugin-client"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Rota Yöneticisi

## Giriş

Rota yöneticisi, sistemin ana sayfa rotalarını yönetmek için kullanılan bir araçtır ve `masaüstü` ile `mobil` uç noktalarını destekler. Rota yöneticisi aracılığıyla oluşturduğunuz rotalar, menüde otomatik olarak gösterilir (menüde görünmeyecek şekilde de yapılandırabilirsiniz). Benzer şekilde, sayfa menüsüne eklediğiniz menüler de rota yöneticisi listesinde senkronize olarak yer alacaktır.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Kullanım Kılavuzu

### Rota Türleri

Sistem dört farklı rota türünü destekler:

- Grup (group): Rotları gruplandırarak yönetmek için kullanılır ve alt rotalar içerebilir.
- Sayfa (page): Sistemin dahili sayfalarını temsil eder.
- Sekme (tab): Bir sayfa içinde sekmeler arasında geçiş yapmak için kullanılan rota türüdür.
- Bağlantı (link): Dahili veya harici bir bağlantıdır; yapılandırılan bağlantı adresine doğrudan yönlendirme sağlar.

### Rota Ekleme

Sağ üst köşedeki "Add new" (Yeni Ekle) düğmesine tıklayarak yeni bir rota oluşturabilirsiniz:

1. Rota türünü seçin (Type).
2. Rota başlığını girin (Title).
3. Rota simgesini seçin (Icon).
4. Menüde gösterilip gösterilmeyeceğini ayarlayın (Show in menu).
5. Sayfa sekmelerinin etkinleştirilip etkinleştirilmeyeceğini belirleyin (Enable page tabs).
6. Sayfa türü için sistem, benzersiz bir rota yolu (Path) otomatik olarak oluşturacaktır.

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Rota İşlemleri

Her bir rota girdisi aşağıdaki işlemleri destekler:

- Alt öğe ekle (Add child): Bir alt rota ekler.
- Düzenle (Edit): Rota yapılandırmasını düzenler.
- Görüntüle (View): Rota sayfasını gösterir.
- Sil (Delete): Rotayı siler.

### Toplu İşlemler

Üst araç çubuğu aşağıdaki toplu işlem özelliklerini sunar:

- Yenile (Refresh): Rota listesini yeniler.
- Sil (Delete): Seçili rotaları siler.
- Menüde gizle (Hide in menu): Seçili rotaları menüde gizler.
- Menüde göster (Show in menu): Seçili rotaları menüde gösterir.

### Rota Filtreleme

Üst kısımdaki "Filter" (Filtrele) özelliğini kullanarak rota listesini ihtiyacınıza göre filtreleyebilirsiniz.

:::info{title=Bilgi}
Rota yapılandırmalarında yapacağınız değişiklikler, sistemin gezinme menüsü yapısını doğrudan etkileyecektir. Lütfen dikkatli ilerleyin ve rota yapılandırmalarının doğruluğundan emin olun.
:::