---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/actions/types/duplicate) bakın.
:::

# Çoğalt

## Tanıtım

Çoğaltma işlemi, kullanıcıların mevcut verilere dayanarak hızlı bir şekilde yeni kayıtlar oluşturmasına olanak tanır. İki çoğaltma modu desteklenir: **Doğrudan çoğalt** ve **Forma kopyala ve doldurmaya devam et**.

## Kurulum

Yerleşik bir eklentidir, ayrıca kurulum gerektirmez.

## Çoğaltma Modu

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Doğrudan çoğalt

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Varsayılan olarak "Doğrudan çoğalt" şeklinde yürütülür;
- **Şablon alanları**: Kopyalanacak alanları belirtin. "Tümünü seç" desteklenir ve bu yapılandırma zorunludur.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Yapılandırma tamamlandıktan sonra, verileri çoğaltmak için düğmeye tıklayın.

### Forma kopyala ve doldurmaya devam et

Yapılandırılan şablon alanları, forma **varsayılan değerler** olarak doldurulur. Kullanıcılar, çoğaltma işlemini tamamlamak için bu değerleri gönderimden önce değiştirebilirler.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Şablon alanlarını yapılandırın**: Yalnızca seçilen alanlar varsayılan değer olarak aktarılır.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Form alanlarını senkronize et

- Mevcut form bloğunda yapılandırılmış olan alanları otomatik olarak şablon alanları olarak ayrıştırır;
- Daha sonra form bloğu alanları değiştirilirse (örneğin ilişki alanı bileşenlerinin ayarlanması), tutarlılığı sağlamak için şablon yapılandırmasını tekrar açmanız ve **Form alanlarını senkronize et** düğmesine tıklamanız gerekir.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Şablon verileri form varsayılanları olarak doldurulur ve kullanıcılar düzenleme yaptıktan sonra göndererek çoğaltmayı tamamlayabilirler.

### Ek Notlar

#### Kopyala, Referans, Ön Yükleme

Farklı alan türleri (ilişki türleri) farklı işlem mantığına sahiptir: **Kopyala / Referans / Ön Yükleme**. Bir ilişki alanının **alan bileşeni** de bu mantığı etkiler:

- Select / Record picker: **Referans** için kullanılır
- Sub-form / Sub-table: **Kopyalama** için kullanılır

**Kopyala**

- Normal alanlar kopyalanır;
- `hasOne` / `hasMany` yalnızca kopyalanabilir (bu tür ilişkiler için açılır liste veya kayıt seçici gibi seçim bileşenleri kullanılmamalı, bunun yerine Alt form veya Alt tablo gibi bileşenler kullanılmalıdır);
- `hasOne` / `hasMany` bileşeninin değiştirilmesi işlem mantığını **değiştirmez** (Kopyala olarak kalır);
- Kopyalanan ilişki alanlarında tüm alt alanlar seçilebilir.

**Referans**

- `belongsTo` / `belongsToMany` referans olarak kabul edilir;
- Alan bileşeni "Açılır liste"den "Alt form"a değiştirilirse, ilişki **Referans'tan Kopyala'ya** dönüşür (Kopyala olduğunda tüm alt alanlar seçilebilir hale gelir).

**Ön Yükleme**

- Bir Referans alanı altındaki ilişki alanları Ön Yükleme olarak kabul edilir;
- Ön yükleme alanları, bileşen değişikliğinden sonra Referans veya Kopyala'ya dönüşebilir.

#### Tümünü Seç

- Tüm **Kopyalama alanlarını** ve **Referans alanlarını** seçer.

#### Veri şablonu olarak seçilen kayıttan aşağıdaki alanlar filtrelenerek hariç tutulur:

- Kopyalanan ilişki verilerinin birincil anahtarları (primary keys) filtrelenir; Referans ve Ön Yükleme için birincil anahtarlar filtrelenmez;
- Yabancı anahtarlar (Foreign keys);
- Yinelenen değerlere izin vermeyen alanlar (Benzersiz);
- Sıralama alanları;
- Otomatik kodlama/sıralı dizi alanları;
- Şifre;
- Oluşturan, Oluşturulma tarihi;
- Son güncelleyen, Son güncelleme tarihi.

#### Form alanlarını senkronize et

- Mevcut form bloğunda yapılandırılmış alanları otomatik olarak şablon alanlarına ayrıştırır;
- Form bloğu alanlarını değiştirdikten sonra (örneğin ilişki alanı bileşenlerini ayarlama), tutarlılığı sağlamak için tekrar senkronize etmelisiniz.