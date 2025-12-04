:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Gelişmiş

## Giriş

Büyük dil modellerinin çoğu araç kullanma yeteneğine sahiptir. AI çalışan eklentisi, büyük dil modellerinin kullanabileceği bazı yaygın araçları bünyesinde barındırır.

AI çalışan ayarları sayfasında yapılandırdığınız beceriler, büyük dil modelinin kullanabileceği araçlardır.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Becerileri Ayarlama

AI çalışan eklentisi yapılandırma sayfasına gidin, `AI employees` sekmesine tıklayarak AI çalışan yönetimi sayfasına ulaşın.

Becerilerini ayarlamak istediğiniz AI çalışanını seçin, `Edit` (Düzenle) düğmesine tıklayarak AI çalışan düzenleme sayfasına girin.

`Skills` (Beceriler) sekmesinde, mevcut AI çalışanına bir beceri eklemek için `Add Skill` (Beceri Ekle) düğmesine tıklayın.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Becerilere Genel Bakış

### Frontend

Frontend grubu, AI çalışanının ön uç bileşenleriyle etkileşim kurmasını sağlar.

- `Form filler` (Form Doldurucu) becerisi, AI çalışanının oluşturulan form verilerini kullanıcı tarafından belirtilen bir forma geri doldurmasına olanak tanır.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Veri Modelleme

Veri modelleme beceri grubu, AI çalışanına NocoBase'in dahili API'lerini çağırarak veri modelleme yapma yeteneği kazandırır.

- `Intent Router` (Niyet Yönlendirici), kullanıcının bir koleksiyon yapısını mı değiştirmek istediğini yoksa yeni bir koleksiyon yapısı mı oluşturmak istediğini belirler.
- `Get collection names` (Koleksiyon Adlarını Al), sistemdeki mevcut tüm koleksiyonların adlarını alır.
- `Get collection metadata` (Koleksiyon Meta Verilerini Al), belirtilen bir koleksiyonun yapı bilgilerini alır.
- `Define collections` (Koleksiyonları Tanımla), AI çalışanının sistemde koleksiyonlar oluşturmasına olanak tanır.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### İş Akışı Çağırıcı

`Workflow caller` (İş Akışı Çağırıcı), AI çalışanına iş akışlarını yürütme yeteneği kazandırır. İş akışı eklentisinde `Trigger type` (Tetikleyici türü) `AI employee event` (AI çalışan olayı) olarak yapılandırılan iş akışları, burada AI çalışanının kullanabileceği beceriler olarak sunulur.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Kod Düzenleyici

Kod Düzenleyici grubu altındaki beceriler, AI çalışanının kod düzenleyiciyle etkileşim kurmasını sağlar.

- `Get code snippet list` (Kod Parçacığı Listesini Al), önceden tanımlanmış kod parçacıklarının listesini alır.
- `Get code snippet content` (Kod Parçacığı İçeriğini Al), belirtilen bir kod parçacığının içeriğini alır.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Diğerleri

- `Chart generator` (Grafik Oluşturucu), AI çalışanına grafik oluşturma ve bunları doğrudan konuşma içinde çıktı olarak verme yeteneği kazandırır.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)