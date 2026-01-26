---
pkg: "@nocobase/plugin-multi-space"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Çoklu Alan

## Giriş

**Çoklu Alan eklentisi**, tek bir uygulama örneği içinde, mantıksal izolasyon yoluyla birden fazla bağımsız veri alanı oluşturmanıza olanak tanır.

#### Kullanım Senaryoları
- **Çoklu Mağaza veya Fabrika**: İş süreçleri ve sistem yapılandırmaları oldukça tutarlıdır; örneğin, birleşik envanter yönetimi, üretim planlaması, satış stratejileri ve rapor şablonları gibi. Ancak her bir iş biriminin verilerinin birbirine karışmaması gerekir.
- **Çoklu Organizasyon veya Bağlı Ortaklık Yönetimi**: Bir grup şirketine bağlı birden fazla organizasyon veya bağlı ortaklık aynı platformu kullanır, ancak her markanın bağımsız müşteri, ürün ve sipariş verileri bulunur.

## Kurulum

Eklenti yöneticisinde **Çoklu Alan (Multi-Space)** eklentisini bulun ve etkinleştirin.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Kullanım Kılavuzu

### Çoklu Alan Yönetimi

Eklentiyi etkinleştirdikten sonra, **Kullanıcılar ve İzinler** ayarları sayfasına gidin ve **Alanlar** paneline geçerek alanları yönetebilirsiniz.

> Başlangıçta, yerleşik bir **Atanmamış Alan (Unassigned Space)** bulunur. Bu alan, herhangi bir alanla ilişkilendirilmemiş eski verileri görüntülemek için kullanılır.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Alan Oluşturma

Yeni bir alan oluşturmak için "Alan Ekle" düğmesine tıklayın:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Kullanıcı Atama

Oluşturduğunuz bir alanı seçtikten sonra, sağ tarafta bu alana ait kullanıcıları belirleyebilirsiniz:

> **İpucu:** Bir alana kullanıcı atadıktan sonra, sağ üst köşedeki alan değiştirme listesinin güncellenmesi ve en yeni alanı göstermesi için **sayfayı manuel olarak yenilemeniz gerekir**.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Çoklu Alanı Değiştirme ve Görüntüleme

Sağ üst köşeden mevcut alanı değiştirebilirsiniz.
Sağdaki **göz simgesine** (vurgulanmış durumdayken) tıkladığınızda, birden fazla alandaki verileri aynı anda görüntüleyebilirsiniz.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Çoklu Alan Veri Yönetimi

Eklentiyi etkinleştirdikten sonra, bir koleksiyon oluştururken sistem otomatik olarak bir **Alan alanı** ekler.
**Yalnızca bu alanı içeren koleksiyonlar, alan yönetimi mantığına dahil edilir.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Mevcut koleksiyonlar için, alan yönetimini etkinleştirmek amacıyla manuel olarak bir Alan alanı ekleyebilirsiniz:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Varsayılan Mantık

Alan alanını içeren koleksiyonlarda, sistem otomatik olarak aşağıdaki mantığı uygular:

1. Veri oluştururken, otomatik olarak mevcut seçili alanla ilişkilendirilir;
2. Verileri filtrelerken, otomatik olarak mevcut seçili alanın verileriyle sınırlandırılır.

### Eski Verilerin Çoklu Alana Sınıflandırılması

Çoklu Alan eklentisi etkinleştirilmeden önce mevcut olan veriler için, aşağıdaki adımları izleyerek alanlara ayırabilirsiniz:

#### 1. Alan Alanını Ekleme

Eski koleksiyona Alan alanını manuel olarak ekleyin:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Kullanıcıları Atanmamış Alana Atama

Eski verileri yöneten kullanıcıyı tüm alanlarla, **Atanmamış Alanı (Unassigned Space)** da dahil ederek ilişkilendirin. Bu sayede henüz bir alana atanmamış verileri görüntüleyebilirsiniz:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Tüm Alan Verilerini Görüntülemek İçin Geçiş Yapma

Üst kısımda, tüm alanlardaki verileri görüntülemek için seçim yapın:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Eski Veri Ataması İçin Bir Sayfa Yapılandırma

Eski veri ataması için yeni bir sayfa oluşturun. **Liste sayfasında** ve **düzenleme sayfasında** "Alan alanı"nı görüntüleyerek alan atamasını manuel olarak ayarlayabilirsiniz.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Alan alanını düzenlenebilir yapın

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Verileri Alanlara Manuel Olarak Atama

Yukarıda oluşturulan sayfa aracılığıyla, verileri manuel olarak düzenleyerek eski verilere doğru alanı kademeli olarak atayın (toplu düzenlemeyi kendiniz de yapılandırabilirsiniz).