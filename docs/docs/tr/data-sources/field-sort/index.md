---
pkg: "@nocobase/plugin-field-sort"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Sıralama Alanı

## Giriş

Sıralama alanları, bir koleksiyondaki kayıtları sıralamak için kullanılır ve gruplar içinde sıralamayı destekler.

:::warning
Sıralama alanı aynı koleksiyonun bir parçası olduğu için, grup bazlı sıralama kullanılırken bir kaydın birden fazla gruba atanması mümkün değildir.
:::

## Kurulum

Bu bir yerleşik eklentidir, ayrı bir kuruluma gerek yoktur.

## Kullanım Kılavuzu

### Sıralama Alanı Oluşturma

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Sıralama alanları oluşturulurken, sıralama değerleri şu şekilde başlatılır:

- Eğer grup bazlı sıralama seçilmezse, birincil anahtar alanı ve oluşturulma tarihi alanı temel alınarak başlatılır.
- Eğer grup bazlı sıralama seçilirse, veriler önce gruplandırılır ve ardından birincil anahtar alanı ile oluşturulma tarihi alanı temel alınarak başlatılır.

:::warning{title="İşlem Tutarlılığı Açıklaması"}
- Bir alan oluşturulurken, sıralama değeri başlatma işlemi başarısız olursa, sıralama alanı oluşturulmaz.
- Belirli bir aralıkta, bir kayıt A konumundan B konumuna taşınırsa, A ve B arasındaki tüm kayıtların sıralama değerleri değişir. Bu güncellemenin herhangi bir kısmı başarısız olursa, tüm taşıma işlemi geri alınır ve ilgili kayıtların sıralama değerleri değişmez.
:::

#### Örnek 1: sort1 Alanını Oluşturma

sort1 alanı gruplandırılmamıştır.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Her kaydın sıralama alanları, birincil anahtar alanı ve oluşturulma tarihi alanı temel alınarak başlatılır:

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Örnek 2: Sınıf Kimliğine Göre Gruplandırılmış bir sort2 Alanı Oluşturma

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Bu durumda, koleksiyondaki tüm kayıtlar önce gruplandırılır (Sınıf Kimliğine göre gruplandırılır) ve ardından sıralama alanı (sort2) başlatılır. Her kaydın başlangıç değerleri şunlardır:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Sürükle ve Bırak ile Sıralama

Sıralama alanları, çeşitli bloklardaki kayıtların sürükle ve bırak ile sıralanması için kullanılır. Şu anda sürükle ve bırak ile sıralamayı destekleyen bloklar arasında tablolar ve panolar bulunmaktadır.

:::warning
- Aynı sıralama alanı sürükle ve bırak ile sıralama için kullanıldığında, birden fazla blokta kullanılması mevcut sıralamayı bozabilir.
- Tablo sürükle ve bırak sıralaması için kullanılan alan, gruplandırma kuralı olan bir sıralama alanı olamaz.
  - İstisna: Bire çok ilişkili tablo bloklarında, yabancı anahtar bir grup olarak işlev görebilir.
- Şu anda, yalnızca pano bloğu gruplar içinde sürükle ve bırak ile sıralamayı desteklemektedir.
:::

#### Tablo Satırlarını Sürükle ve Bırak ile Sıralama

Tablo bloğu

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

İlişkisel tablo bloğu

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
Bire çok ilişkili bir blokta:

- Gruplandırılmamış bir sıralama alanı seçilirse, tüm kayıtlar sıralamaya dahil olabilir.
- Kayıtlar önce yabancı anahtara göre gruplandırılır ve ardından sıralanırsa, sıralama kuralı yalnızca mevcut grup içindeki verileri etkiler.

Nihai etki tutarlıdır, ancak sıralamaya katılan kayıt sayısı farklıdır. Daha fazla ayrıntı için [Sıralama Kuralı Açıklaması](#sıralama-kuralı-açıklaması) bölümüne bakın.
:::

#### Pano Kartlarını Sürükle ve Bırak ile Sıralama

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Sıralama Kuralı Açıklaması

#### Gruplandırılmamış (veya Aynı Gruptaki) Öğeler Arasındaki Yer Değiştirme

Bir veri kümesi olduğunu varsayalım:

```
[1,2,3,4,5,6,7,8,9]
```

Bir öğe, örneğin 5, 3'ün konumuna doğru hareket ettiğinde, yalnızca 3, 4 ve 5 numaralı öğelerin konumları değişir. 5, 3'ün konumunu alır ve 3 ile 4 numaralı öğeler birer konum geriye kayar.

```
[1,2,5,3,4,6,7,8,9]
```

Ardından 6 numaralı öğeyi 8'in konumuna doğru geriye taşırsak, 6, 8'in konumunu alır ve 7 ile 8 numaralı öğeler birer konum ileri kayar.

```
[1,2,5,3,4,7,8,6,9]
```

#### Farklı Gruplar Arasındaki Öğelerin Hareketi

Grup bazlı sıralama yaparken, bir kayıt başka bir gruba taşınırsa, grup ataması da değişir. Örneğin:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

1 numaralı öğe 6 numaralı öğeden sonra taşındığında (varsayılan davranış), grubu da A'dan B'ye değişir.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Sıralama Değişiklikleri Arayüzde Görüntülenen Verilerle İlişkili Değildir

Örneğin, bir veri kümesi düşünelim:

```
[1,2,3,4,5,6,7,8,9]
```

Arayüz yalnızca filtrelenmiş bir görünüm gösterir:

```
[1,5,9]
```

1 numaralı öğe 9'un konumuna taşındığında, görünür olmasalar bile tüm ara öğelerin (2, 3, 4, 5, 6, 7, 8) konumları da değişecektir.

```
[2,3,4,5,6,7,8,9,1]
```

Arayüz şimdi filtrelenmiş öğelere göre yeni sıralamayı gösterir:

```
[5,9,1]
```