:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Ana ve Harici Veritabanları Karşılaştırması

NocoBase'deki ana ve harici veritabanları arasındaki farklar başlıca dört alanda kendini gösterir: veritabanı türü desteği, koleksiyon türü desteği, alan türü desteği ve yedekleme ile taşıma yetenekleri.

## 1. Veritabanı Türü Desteği

Daha fazla bilgi için: [Veri Kaynağı Yöneticisi](https://docs.nocobase.com/data-sources/data-source-manager)

### Veritabanı Türleri

| Veritabanı Türü | Ana Veritabanı Desteği | Harici Veritabanı Desteği |
|------------------|---------------------------|------------------------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Koleksiyon Yönetimi

| Koleksiyon Yönetimi | Ana Veritabanı Desteği | Harici Veritabanı Desteği |
|----------------------|-----------------------------|------------------------------|
| Temel Yönetim | ✅ | ✅ |
| Görsel Yönetim | ✅ | ❌ |

## 2. Koleksiyon Türü Desteği

Daha fazla bilgi için: [Koleksiyonlar](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Koleksiyon Türü | Ana Veritabanı | Harici Veritabanı | Açıklama |
|----------------|-------------------|---------------------|-------------|
| Genel | ✅ | ✅ | Temel koleksiyon |
| Görünüm | ✅ | ✅ | Veri kaynağı görünümü |
| Kalıtım | ✅ | ❌ | Veri modeli kalıtımını destekler, yalnızca ana veri kaynağı için geçerlidir |
| Dosya | ✅ | ❌ | Dosya yüklemeyi destekler, yalnızca ana veri kaynağı için geçerlidir |
| Yorum | ✅ | ❌ | Dahili yorum sistemidir, yalnızca ana veri kaynağı için geçerlidir |
| Takvim | ✅ | ❌ | Takvim görünümleri için koleksiyon |
| İfade | ✅ | ❌ | Formül hesaplamalarını destekler |
| Ağaç | ✅ | ❌ | Ağaç yapılı veri modellemesi için |
| SQL | ✅ | ❌ | SQL aracılığıyla tanımlanan koleksiyon |
| Harici Bağlantı | ✅ | ❌ | Harici veri kaynakları için bağlantı koleksiyonu, sınırlı işlevsellik |

## 3. Alan Türü Desteği

Daha fazla bilgi için: [Koleksiyon Alanları](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Temel Türler

| Alan Türü | Ana Veritabanı | Harici Veritabanı |
|-----------|----------------|-------------------|
| Tek Satır Metin | ✅ | ✅ |
| Uzun Metin | ✅ | ✅ |
| Telefon | ✅ | ✅ |
| E-posta | ✅ | ✅ |
| URL | ✅ | ✅ |
| Tam Sayı | ✅ | ✅ |
| Sayı | ✅ | ✅ |
| Yüzde | ✅ | ✅ |
| Parola | ✅ | ✅ |
| Renk | ✅ | ✅ |
| Simge | ✅ | ✅ |

### Seçim Türleri

| Alan Türü | Ana Veritabanı | Harici Veritabanı |
|-----------|----------------|-------------------|
| Onay Kutusu | ✅ | ✅ |
| Açılır Menü (Tek Seçim) | ✅ | ✅ |
| Açılır Menü (Çoklu Seçim) | ✅ | ✅ |
| Radyo Grubu | ✅ | ✅ |
| Onay Kutusu Grubu | ✅ | ✅ |
| Çin Bölgesi | ✅ | ❌ |

### Medya Türleri

| Alan Türü | Ana Veritabanı | Harici Veritabanı |
|-----------|----------------|-------------------|
| Medya | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Zengin Metin | ✅ | ✅ |
| Ek (İlişki) | ✅ | ❌ |
| Ek (URL) | ✅ | ✅ |

### Tarih ve Saat Türleri

| Alan Türü | Ana Veritabanı | Harici Veritabanı |
|-----------|----------------|-------------------|
| Tarih Saat (Saat Dilimli) | ✅ | ✅ |
| Tarih Saat (Saat Dilimsiz) | ✅ | ✅ |
| Unix Zaman Damgası | ✅ | ✅ |
| Tarih (Saatsiz) | ✅ | ✅ |
| Saat | ✅ | ✅ |

### Geometrik Türler

| Alan Türü | Ana Veritabanı | Harici Veritabanı |
|-----------|----------------|-------------------|
| Nokta | ✅ | ✅ |
| Çizgi | ✅ | ✅ |
| Çember | ✅ | ✅ |
| Çokgen | ✅ | ✅ |

### Gelişmiş Türler

| Alan Türü | Ana Veritabanı | Harici Veritabanı |
|-----------|----------------|-------------------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sıralama | ✅ | ✅ |
| Formül | ✅ | ✅ |
| Otomatik Sıra | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Koleksiyon Seçici | ✅ | ❌ |
| Şifreleme | ✅ | ✅ |

### Sistem Bilgisi Alanları

| Alan Türü | Ana Veritabanı | Harici Veritabanı |
|-----------|----------------|-------------------|
| Oluşturulma Tarihi | ✅ | ✅ |
| Son Güncelleme Tarihi | ✅ | ✅ |
| Oluşturan | ✅ | ❌ |
| Son Güncelleyen | ✅ | ❌ |
| Koleksiyon OID | ✅ | ❌ |

### İlişki Türleri

| Alan Türü | Ana Veritabanı | Harici Veritabanı |
|-----------|----------------|-------------------|
| Bire Bir | ✅ | ✅ |
| Bire Çok | ✅ | ✅ |
| Çoka Bir | ✅ | ✅ |
| Çoka Çok | ✅ | ✅ |
| Çoka Çok (Dizi) | ✅ | ✅ |

:::info
Ek alanları, yalnızca ana veritabanları tarafından desteklenen dosya koleksiyonlarına bağlıdır. Bu nedenle, harici veritabanları şu anda ek alanlarını desteklememektedir.
:::

## 4. Yedekleme ve Taşıma Desteği Karşılaştırması

| Özellik | Ana Veritabanı | Harici Veritabanı |
|---------|-------------------|---------------------|
| Yedekleme ve Geri Yükleme | ✅ | ❌ (Kullanıcı tarafından yönetilir) |
| Taşıma Yönetimi | ✅ | ❌ (Kullanıcı tarafından yönetilir) |

:::info
NocoBase, ana veritabanları için yedekleme, geri yükleme ve yapı taşıma yetenekleri sunar. Harici veritabanları için bu işlemlerin, kullanıcılar tarafından kendi veritabanı ortamlarına göre bağımsız olarak tamamlanması gerekmektedir. NocoBase yerleşik destek sağlamaz.
:::

## Özet Karşılaştırma

| Karşılaştırma Öğesi | Ana Veritabanı | Harici Veritabanı |
|----------------|-------------------|---------------------|
| Veritabanı Türleri | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Koleksiyon Türü Desteği | Tüm koleksiyon türleri | Yalnızca genel ve görünüm koleksiyonları |
| Alan Türü Desteği | Tüm alan türleri | Ek alanları dışındaki tüm alan türleri |
| Yedekleme ve Taşıma | Yerleşik destek | Kullanıcı tarafından yönetilir |

## Öneriler

- **NocoBase'i yeni bir iş sistemi kurmak için kullanıyorsanız**, lütfen **ana veritabanını** kullanın. Bu sayede NocoBase'in tüm işlevselliğinden faydalanabilirsiniz.
- **NocoBase'i diğer sistemlerin veritabanlarına temel CRUD (oluşturma, okuma, güncelleme, silme) işlemleri için bağlıyorsanız**, o zaman **harici veritabanlarını** kullanın.