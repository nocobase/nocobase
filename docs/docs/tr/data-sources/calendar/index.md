---
pkg: "@nocobase/plugin-calendar"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Takvim Bloğu

## Giriş

Takvim Bloğu, etkinlikleri ve tarihle ilgili verileri takvim görünümünde göstererek toplantı planlama, etkinlik düzenleme ve zamanınızı verimli bir şekilde organize etme gibi senaryolar için ideal bir çözüm sunar.

## Kurulum

Bu eklenti (plugin) yerleşik olarak gelir, bu nedenle ek bir kuruluma gerek yoktur.

## Blok Ekleme

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. Başlık Alanı: Takvim çubuklarında görüntülenecek bilgileri gösterir. Şu anda `input`, `select`, `phone`, `email`, `radioGroup` ve `sequence` gibi alan türlerini desteklemektedir. Takvim bloğunun desteklediği başlık alanı türleri eklentiler (plugins) aracılığıyla genişletilebilir.
2. Başlangıç Zamanı: Görevin başlangıç zamanını belirtir.
3. Bitiş Zamanı: Görevin bitiş zamanını belirtir.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Bir görev çubuğuna tıkladığınızda, ilgili görev çubuğu vurgulanır ve detaylı bir açılır pencere görüntülenir.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Blok Ayarları

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Ay Takvimini Göster

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

### Veri Aralığını Ayarla

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Daha fazla bilgi için bakınız.

### Blok Yüksekliğini Ayarla

Örnek: Sipariş takvim bloğunun yüksekliğini ayarlayın. Takvim bloğunun içinde kaydırma çubuğu görünmeyecektir.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Daha fazla bilgi için bakınız.

### Arka Plan Rengi Alanı

:::info{title=İpucu}
NocoBase sürümünüzün v1.4.0-beta veya üzeri olması gerekmektedir.
:::

Bu seçenek, takvim etkinliklerinin arka plan rengini yapılandırmak için kullanılabilir. Kullanım şekli şöyledir:

1. Takvim veri tablosunda **Tekli seçim (Single select)** veya **Radyo grubu (Radio group)** türünde bir alan bulunması ve bu alanın renklerle yapılandırılmış olması gerekir.
2. Ardından, takvim bloğu yapılandırma arayüzüne geri dönün ve **Arka Plan Rengi Alanı** kısmında az önce renklerle yapılandırdığınız alanı seçin.
3. Son olarak, bir takvim etkinliği için bir renk seçmeyi deneyin ve gönder'e tıklayın; rengin etkinleştiğini göreceksiniz.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Haftanın Başlangıç Günü

> v1.7.7 ve üzeri sürümlerde desteklenir

Takvim bloğu, haftanın başlangıç gününü ayarlamayı destekler; haftanın ilk günü olarak **Pazar** veya **Pazartesi** seçilebilir. Varsayılan başlangıç günü **Pazartesi**'dir, bu da kullanıcıların takvim görünümünü farklı bölgelerin alışkanlıklarına göre ayarlamasını kolaylaştırarak gerçek kullanım ihtiyaçlarına daha uygun hale getirir.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## İşlemleri Yapılandırma

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Bugün

Takvim Bloğu'ndaki "Bugün" düğmesi, kullanıcıların diğer tarihleri inceledikten sonra hızla mevcut tarihin bulunduğu takvim sayfasına dönmelerini sağlayan pratik bir navigasyon özelliği sunar.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Görünümü Değiştir

Varsayılan görünüm Ay olarak ayarlanmıştır.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)