---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/multi-space/multi-space) bakın.
:::

# Çoklu Alan

## Tanıtım

**Çoklu Alan eklentisi**, tek bir uygulama örneği içinde mantıksal izolasyon yoluyla birden fazla bağımsız veri alanı oluşturulmasına olanak tanır.

#### Uygulama Senaryoları
- **Çoklu mağaza veya fabrika**: Envanter yönetimi, üretim planlaması, satış stratejileri ve rapor şablonları gibi iş süreçleri ve sistem yapılandırmaları yüksek düzeyde tutarlıdır, ancak her bir iş biriminin verilerinin birbirine karışmaması ve bağımsız kalması gerekir.
- **Çoklu organizasyon veya bağlı ortaklık yönetimi**: Bir grup şirketi altındaki birden fazla organizasyon veya bağlı ortaklık aynı platformu paylaşır, ancak her markanın bağımsız müşteri, ürün ve sipariş verileri bulunur.

## Kurulum

Eklenti yönetiminde **Çoklu Alan (Multi-Space)** eklentisini bulun ve etkinleştirin.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Kullanım Kılavuzu

### Çoklu Alan Yönetimi

Eklentiyi etkinleştirdikten sonra, **"Kullanıcılar ve İzinler"** ayarlar sayfasına gidin ve alanları yönetmek için **Alan** paneline geçiş yapın.

> Başlangıç durumunda, henüz bir alanla ilişkilendirilmemiş eski verileri görüntülemek için kullanılan yerleşik bir **Atanmamış Alan (Unassigned Space)** bulunur.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Alan Oluşturma

Yeni bir alan oluşturmak için "Alan ekle" düğmesine tıklayın:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Kullanıcı Atama

Oluşturulan bir alanı seçtikten sonra, sağ taraftan bu alana ait kullanıcıları ayarlayabilirsiniz:

> **İpucu:** Bir alana kullanıcı atadıktan sonra, sağ üst köşedeki alan değiştirme listesinin güncellenmesi ve en son alanları görüntülemesi için **sayfayı manuel olarak yenilemeniz** gerekir.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Çoklu Alan Değiştirme ve Görüntüleme

Sağ üst köşeden mevcut alanı değiştirebilirsiniz.  
Sağdaki **göz simgesine** tıkladığınızda (vurgulanmış durum), aynı anda birden fazla alanın verilerini görüntüleyebilirsiniz.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Çoklu Alan Veri Yönetimi

Eklenti etkinleştirildiğinde, bir veri tablosu (Koleksiyon) oluştururken sistem otomatik olarak bir **Alan alanı** (Space field) önceden tanımlar.  
**Yalnızca bu alanı içeren tablolar alan yönetimi mantığına dahil edilecektir.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Mevcut veri tabloları için, alan yönetimini etkinleştirmek üzere manuel olarak bir alan alanı ekleyebilirsiniz:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Varsayılan Mantık

Alan alanı içeren veri tablolarında sistem otomatik olarak aşağıdaki mantığı uygular:

1. Veri oluştururken, veriyi otomatik olarak o an seçili olan alanla ilişkilendirir;
2. Verileri filtrelerken, sonuçları otomatik olarak o an seçili olan alanın verileriyle sınırlandırır.

### Eski Verilerin Çoklu Alanlara Sınıflandırılması

Çoklu alan eklentisi etkinleştirilmeden önce mevcut olan veriler için aşağıdaki adımları izleyerek alan sınıflandırması yapabilirsiniz:

#### 1. Alan Alanı Ekleme

Eski tabloya manuel olarak bir alan alanı ekleyin:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Kullanıcıları Atanmamış Alana Atama

Eski verileri yöneten kullanıcıları, henüz bir alana atanmamış verileri görebilmeleri için **Atanmamış Alan (Unassigned Space)** dahil tüm alanlarla ilişkilendirin:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Tüm Alan Verilerini Görüntülemek İçin Geçiş Yapma

Üst kısımdan tüm alanların verilerini görüntüleme seçeneğini belirleyin:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Eski Veri Atama Sayfasını Yapılandırma

Eski verilerin atanması için yeni bir sayfa oluşturun. Ait olduğu alanı manuel olarak ayarlayabilmek için **liste sayfasında** ve **düzenleme sayfasında** "Alan alanını" görüntüleyin.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Alan alanını düzenlenebilir olarak ayarlayın:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Veri Alanlarını Manuel Olarak Atama

Yukarıdaki sayfa aracılığıyla verileri manuel olarak düzenleyerek eski verilere kademeli olarak doğru alanları atayın (isterseniz toplu düzenleme de yapılandırabilirsiniz).