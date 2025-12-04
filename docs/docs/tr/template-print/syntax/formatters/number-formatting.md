:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


### Sayı Biçimlendirme

#### 1. :formatN(precision)

##### Söz Dizimi Açıklaması
Sayıyı yerelleştirme ayarlarına göre biçimlendirir.
Parametre:
- `precision`: Ondalık basamak sayısı.
  ODS/XLSX formatları için gösterilen ondalık basamak sayısı metin düzenleyici tarafından belirlenir; diğer formatlar için bu parametre kullanılır.

##### Örnek
```
// Örnek ortam: API seçenekleri { "lang": "en-us" }
'10':formatN()         // Çıktı "10.000"
'1000.456':formatN()   // Çıktı "1,000.456"
```

##### Sonuç
Sayı, belirtilen hassasiyet ve yerelleştirme formatına göre çıktı olarak verilir.

#### 2. :round(precision)

##### Söz Dizimi Açıklaması
Sayıyı belirtilen ondalık basamak sayısına göre yuvarlar.

##### Örnek
```
10.05123:round(2)      // Çıktı 10.05
1.05:round(1)          // Çıktı 1.1
```

##### Sonuç
Çıktı, belirtilen hassasiyete göre yuvarlanmış sayıdır.

#### 3. :add(value)

##### Söz Dizimi Açıklaması
Mevcut sayıya belirtilen değeri ekler.
Parametre:
- `value`: Eklenecek sayı.

##### Örnek
```
1000.4:add(2)         // Çıktı 1002.4
'1000.4':add('2')      // Çıktı 1002.4
```

##### Sonuç
Çıktı, mevcut sayı ile belirtilen değerin toplamıdır.

#### 4. :sub(value)

##### Söz Dizimi Açıklaması
Mevcut sayıdan belirtilen değeri çıkarır.
Parametre:
- `value`: Çıkarılacak sayı.

##### Örnek
```
1000.4:sub(2)         // Çıktı 998.4
'1000.4':sub('2')      // Çıktı 998.4
```

##### Sonuç
Çıktı, mevcut sayıdan belirtilen değerin çıkarılmasıyla elde edilen sonuçtur.

#### 5. :mul(value)

##### Söz Dizimi Açıklaması
Mevcut sayıyı belirtilen değerle çarpar.
Parametre:
- `value`: Çarpan.

##### Örnek
```
1000.4:mul(2)         // Çıktı 2000.8
'1000.4':mul('2')      // Çıktı 2000.8
```

##### Sonuç
Çıktı, mevcut sayı ile belirtilen değerin çarpımıdır.

#### 6. :div(value)

##### Söz Dizimi Açıklaması
Mevcut sayıyı belirtilen değere böler.
Parametre:
- `value`: Bölen.

##### Örnek
```
1000.4:div(2)         // Çıktı 500.2
'1000.4':div('2')      // Çıktı 500.2
```

##### Sonuç
Çıktı, bölme işleminin sonucudur.

#### 7. :mod(value)

##### Söz Dizimi Açıklaması
Mevcut sayının belirtilen değere göre modülünü (kalanını) hesaplar.
Parametre:
- `value`: Modül böleni.

##### Örnek
```
4:mod(2)              // Çıktı 0
3:mod(2)              // Çıktı 1
```

##### Sonuç
Çıktı, modül işleminin sonucudur.

#### 8. :abs

##### Söz Dizimi Açıklaması
Sayının mutlak değerini döndürür.

##### Örnek
```
-10:abs()             // Çıktı 10
-10.54:abs()          // Çıktı 10.54
10.54:abs()           // Çıktı 10.54
'-200':abs()          // Çıktı 200
```

##### Sonuç
Çıktı, sayının mutlak değeridir.

#### 9. :ceil

##### Söz Dizimi Açıklaması
Sayıyı yukarı yuvarlar, yani mevcut sayıdan büyük veya ona eşit olan en küçük tam sayıyı döndürür.

##### Örnek
```
10.05123:ceil()       // Çıktı 11
1.05:ceil()           // Çıktı 2
-1.05:ceil()          // Çıktı -1
```

##### Sonuç
Çıktı, yukarı yuvarlanmış tam sayıdır.

#### 10. :floor

##### Söz Dizimi Açıklaması
Sayıyı aşağı yuvarlar, yani mevcut sayıdan küçük veya ona eşit olan en büyük tam sayıyı döndürür.

##### Örnek
```
10.05123:floor()      // Çıktı 10
1.05:floor()          // Çıktı 1
-1.05:floor()         // Çıktı -2
```

##### Sonuç
Çıktı, aşağı yuvarlanmış tam sayıdır.

#### 11. :int

##### Söz Dizimi Açıklaması
Sayıyı bir tam sayıya dönüştürür (kullanılması önerilmez).

##### Örnek ve Sonuç
Dönüşüm durumuna göre değişir.

#### 12. :toEN

##### Söz Dizimi Açıklaması
Sayıyı İngilizce formatına dönüştürür (ondalık ayırıcı olarak `.` kullanır). Kullanılması önerilmez.

##### Örnek ve Sonuç
Dönüşüm durumuna göre değişir.

#### 13. :toFixed

##### Söz Dizimi Açıklaması
Sayıyı, yalnızca belirtilen ondalık basamak sayısını koruyarak bir dizeye dönüştürür. Kullanılması önerilmez.

##### Örnek ve Sonuç
Dönüşüm durumuna göre değişir.

#### 14. :toFR

##### Söz Dizimi Açıklaması
Sayıyı Fransızca formatına dönüştürür (ondalık ayırıcı olarak `,` kullanır). Kullanılması önerilmez.

##### Örnek ve Sonuç
Dönüşüm durumuna göre değişir.