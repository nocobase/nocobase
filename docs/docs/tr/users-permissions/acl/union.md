---
pkg: '@nocobase/plugin-acl'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Rol Birleşimi

Rol Birleşimi, bir yetki yönetimi modudur. Sistem ayarlarına göre, sistem geliştiricileri farklı yetki gereksinimlerini karşılamak için bağımsız rolleri, rol birleşimine izin vermeyi veya yalnızca rol birleşimini kullanmayı seçebilirler.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Bağımsız Roller

Sistem varsayılan olarak bağımsız rolleri kullanır: Rol birleşimi kullanılmaz ve kullanıcıların sahip oldukları rolleri tek tek değiştirmeleri gerekir.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Rol Birleşimine İzin Ver

Sistem geliştiricileri rol birleşimini etkinleştirebilir; bu, kullanıcıların sahip oldukları tüm rollerin yetkilerine aynı anda sahip olmalarını sağlarken, aynı zamanda rolleri tek tek değiştirmelerine de olanak tanır.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Yalnızca Rol Birleşimi

Kullanıcılar yalnızca Rol Birleşimini kullanmaya zorlanır ve rolleri tek tek değiştiremezler.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Rol Birleşimi Kuralları

Rol birleşimi, tüm rollerin en yüksek yetkilerini sağlar. Aşağıda, rollerin aynı yetki üzerinde farklı ayarlara sahip olması durumunda yetki çakışmalarının nasıl çözüleceğine dair açıklamalar bulunmaktadır.

### İşlem Yetkisi Birleşimi

Örnek: Rol1, arayüzü yapılandırmaya izin verecek şekilde yapılandırılmışken, Rol2, eklentileri kurmaya, etkinleştirmeye ve devre dışı bırakmaya izin verecek şekilde yapılandırılmıştır.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

**Tüm Yetkiler** rolüyle oturum açıldığında, kullanıcı aynı anda bu iki yetkiye de sahip olacaktır.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Veri Kapsamı Birleşimi

#### Veri Satırları

Senaryo 1: Aynı alan üzerinde birden fazla rolün koşul belirlemesi

Rol A filtresi: Yaş < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B filtresi: Yaş > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Birleştirme sonrası:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Senaryo 2: Farklı rollerin farklı alanları koşul olarak belirlemesi

Rol A filtresi: Yaş < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B filtresi: İsim "Ja" içeriyor

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Birleştirme sonrası:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Veri Sütunları

Rol A görünür sütunları: İsim, Yaş

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B görünür sütunları: İsim, Cinsiyet

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**Birleştirme sonrası:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Karışık Satırlar ve Sütunlar

Rol A filtresi: Yaş < 30, sütunlar İsim, Yaş

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rol B filtresi: İsim "Ja" içeriyor, sütunlar İsim, Cinsiyet

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**Birleştirme sonrası:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Not:** Kırmızı arka planlı hücreler, ayrı rollerde görünmeyen ancak birleştirilmiş rolde görünür olan verileri belirtir.

#### Özet

Rol birleşiminin veri kapsamı kuralları:

1. Satırlar arasında, koşullardan herhangi biri karşılandığında satır yetkiye sahip olur.
2. Sütunlar arasında, alanlar birleştirilir.
3. Hem satırlar hem de sütunlar yapılandırıldığında, satırlar ve sütunlar ayrı ayrı birleştirilir, (satır+sütun) ve (satır+sütun) kombinasyonları şeklinde birleştirilmez.