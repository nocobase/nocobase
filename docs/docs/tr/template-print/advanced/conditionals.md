:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


## Koşullu İfadeler

Koşullu ifadeler, verilerin değerlerine göre belgedeki içeriğin görüntülenmesini veya gizlenmesini dinamik olarak kontrol etmenizi sağlar. Üç ana koşul yazma yöntemi sunulmuştur:

- **Satır İçi Koşullar**: Metni doğrudan çıktı olarak verir (veya başka bir metinle değiştirir).
- **Koşullu Bloklar**: Belgenin bir bölümünü gösterir veya gizler; birden fazla etiket, paragraf, tablo vb. için uygundur.
- **Akıllı Koşullar**: Tek bir etiketle hedef öğeleri (satırlar, paragraflar, resimler vb.) doğrudan kaldırır veya korur, daha kısa bir sözdizimi sunar.

Tüm koşullar, bir mantıksal değerlendirme biçimlendiricisiyle (örneğin `ifEQ`, `ifGT` vb.) başlar ve ardından eylem biçimlendiricileri (örneğin `show`, `elseShow`, `drop`, `keep` vb.) gelir.

### Genel Bakış

Koşullu ifadelerde desteklenen mantıksal operatörler ve eylem biçimlendiricileri şunları içerir:

- **Mantıksal Operatörler**
  - **ifEQ(value)**: Verinin belirtilen değere eşit olup olmadığını kontrol eder.
  - **ifNE(value)**: Verinin belirtilen değere eşit olmadığını kontrol eder.
  - **ifGT(value)**: Verinin belirtilen değerden büyük olup olmadığını kontrol eder.
  - **ifGTE(value)**: Verinin belirtilen değerden büyük veya eşit olup olmadığını kontrol eder.
  - **ifLT(value)**: Verinin belirtilen değerden küçük olup olmadığını kontrol eder.
  - **ifLTE(value)**: Verinin belirtilen değerden küçük veya eşit olup olmadığını kontrol eder.
  - **ifIN(value)**: Verinin bir dizi veya dize içinde bulunup bulunmadığını kontrol eder.
  - **ifNIN(value)**: Verinin bir dizi veya dize içinde bulunmadığını kontrol eder.
  - **ifEM()**: Verinin boş olup olmadığını kontrol eder (örneğin `null`, `undefined`, boş bir dize, boş bir dizi veya boş bir nesne).
  - **ifNEM()**: Verinin boş olmadığını kontrol eder.
  - **ifTE(type)**: Veri türünün belirtilen türe eşit olup olmadığını kontrol eder (örneğin "string", "number", "boolean" vb.).
  - **and(value)**: Birden fazla koşulu bağlamak için kullanılan mantıksal "ve" operatörü.
  - **or(value)**: Birden fazla koşulu bağlamak için kullanılan mantıksal "veya" operatörü.

- **Eylem Biçimlendiricileri**
  - **:show(text) / :elseShow(text)**: Satır içi koşullarda belirtilen metni doğrudan çıktı olarak vermek için kullanılır.
  - **:hideBegin / :hideEnd** ve **:showBegin / :showEnd**: Koşullu bloklarda belge bölümlerini gizlemek veya göstermek için kullanılır.
  - **:drop(element) / :keep(element)**: Akıllı koşullarda belirtilen belge öğelerini kaldırmak veya korumak için kullanılır.

Aşağıdaki bölümlerde her bir kullanımın ayrıntılı sözdizimi, örnekleri ve sonuçları tanıtılacaktır.

### Satır İçi Koşullar

#### 1. :show(text) / :elseShow(text)

##### Sözdizimi
```
{veri:koşul:show(metin)}
{veri:koşul:show(metin):elseShow(alternatif metin)}
```

##### Örnek
Verinin aşağıdaki gibi olduğunu varsayalım:
```json
{
  "val2": 2,
  "val5": 5
}
```
Şablon aşağıdaki gibidir:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Sonuç
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (Çoklu Koşullu İfadeler)

##### Sözdizimi
`switch-case` benzeri bir yapı oluşturmak için art arda koşul biçimlendiricileri kullanın:
```
{veri:ifEQ(değer1):show(sonuç1):ifEQ(değer2):show(sonuç2):elseShow(varsayılan sonuç)}
```
Veya `or` operatörünü kullanarak aynı sonucu elde edin:
```
{veri:ifEQ(değer1):show(sonuç1):or(veri):ifEQ(değer2):show(sonuç2):elseShow(varsayılan sonuç)}
```

##### Örnek
Veri:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Şablon:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Sonuç
```
val1 = A
val2 = B
val3 = C
```

#### 3. Çok Değişkenli Koşullu İfadeler

##### Sözdizimi
Birden fazla değişkeni test etmek için `and`/`or` mantıksal operatörlerini kullanabilirsiniz:
```
{veri1:ifEQ(koşul1):and(.veri2):ifEQ(koşul2):show(sonuç):elseShow(alternatif sonuç)}
{veri1:ifEQ(koşul1):or(.veri2):ifEQ(koşul2):show(sonuç):elseShow(alternatif sonuç)}
```

##### Örnek
Veri:
```json
{
  "val2": 2,
  "val5": 5
}
```
Şablon:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Sonuç
```
and = KO
or = OK
```

### Mantıksal Operatörler ve Biçimlendiriciler

Aşağıdaki bölümlerde açıklanan biçimlendiriciler, satır içi koşul sözdizimini aşağıdaki formatta kullanır:
```
{veri:biçimlendirici(parametre):show(metin):elseShow(alternatif metin)}
```

#### 1. :and(value)

##### Sözdizimi
```
{veri:ifEQ(değer):and(yeni veri veya koşul):ifGT(başka değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Sonuç
Eğer `d.car` `'delorean'` değerine eşit VE `d.speed` 80'den büyükse, çıktı `TravelInTime` olur; aksi takdirde çıktı `StayHere` olur.

#### 2. :or(value)

##### Sözdizimi
```
{veri:ifEQ(değer):or(yeni veri veya koşul):ifGT(başka değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Sonuç
Eğer `d.car` `'delorean'` değerine eşit VEYA `d.speed` 80'den büyükse, çıktı `TravelInTime` olur; aksi takdirde çıktı `StayHere` olur.

#### 3. :ifEM()

##### Sözdizimi
```
{veri:ifEM():show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Sonuç
`null` veya boş bir dizi için çıktı `Result true` olur; aksi takdirde `Result false` olur.

#### 4. :ifNEM()

##### Sözdizimi
```
{veri:ifNEM():show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Sonuç
Boş olmayan veriler (sayı 0 veya 'homer' dizesi gibi) için çıktı `Result true` olur; boş veriler için ise `Result false` olur.

#### 5. :ifEQ(value)

##### Sözdizimi
```
{veri:ifEQ(değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Sonuç
Veri belirtilen değere eşitse çıktı `Result true` olur, aksi takdirde `Result false` olur.

#### 6. :ifNE(value)

##### Sözdizimi
```
{veri:ifNE(değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Sonuç
İlk örnek `Result false` çıktısını verirken, ikinci örnek `Result true` çıktısını verir.

#### 7. :ifGT(value)

##### Sözdizimi
```
{veri:ifGT(değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Sonuç
İlk örnek `Result true` çıktısını verirken, ikinci örnek `Result false` çıktısını verir.

#### 8. :ifGTE(value)

##### Sözdizimi
```
{veri:ifGTE(değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Sonuç
İlk örnek `Result true` çıktısını verirken, ikinci örnek `Result false` çıktısını verir.

#### 9. :ifLT(value)

##### Sözdizimi
```
{veri:ifLT(değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Sonuç
İlk örnek `Result true` çıktısını verirken, ikinci örnek `Result false` çıktısını verir.

#### 10. :ifLTE(value)

##### Sözdizimi
```
{veri:ifLTE(değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Sonuç
İlk örnek `Result true` çıktısını verirken, ikinci örnek `Result false` çıktısını verir.

#### 11. :ifIN(value)

##### Sözdizimi
```
{veri:ifIN(değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Sonuç
Her iki örnek de `Result true` çıktısını verir (çünkü dize 'is' içerir ve dizi 2 içerir).

#### 12. :ifNIN(value)

##### Sözdizimi
```
{veri:ifNIN(değer):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Sonuç
İlk örnek `Result false` çıktısını verir (çünkü dize 'is' içerir), ikinci örnek ise `Result false` çıktısını verir (çünkü dizi 2 içerir).

#### 13. :ifTE(type)

##### Sözdizimi
```
{veri:ifTE('tür'):show(metin):elseShow(alternatif metin)}
```

##### Örnek
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Sonuç
İlk örnek `Result true` çıktısını verir ('homer' bir dize olduğu için), ikinci örnek ise `Result true` çıktısını verir (10.5 bir sayı olduğu için).

### Koşullu Bloklar

Koşullu bloklar, belgenin bir bölümünü göstermek veya gizlemek için kullanılır ve genellikle birden fazla etiketi veya tüm bir metin bloğunu kapsamak için tercih edilir.

#### 1. :showBegin / :showEnd

##### Sözdizimi
```
{veri:ifEQ(koşul):showBegin}
Belge bloğu içeriği
{veri:showEnd}
```

##### Örnek
Veri:
```json
{
  "toBuy": true
}
```
Şablon:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Sonuç
Koşul sağlandığında, aradaki içerik görüntülenir:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Sözdizimi
```
{veri:ifEQ(koşul):hideBegin}
Belge bloğu içeriği
{veri:hideEnd}
```

##### Örnek
Veri:
```json
{
  "toBuy": true
}
```
Şablon:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Sonuç
Koşul sağlandığında, aradaki içerik gizlenir ve çıktı şu şekilde olur:
```
Banana
Grapes
```