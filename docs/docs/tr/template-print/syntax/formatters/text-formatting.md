:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


### Metin Biçimlendirme

Metin verileri için çeşitli biçimlendiriciler sunulmaktadır. Aşağıdaki bölümlerde her bir biçimlendiricinin söz dizimi, örnekleri ve sonuçları sırasıyla açıklanmaktadır.

#### 1. :lowerCase

##### Söz Dizimi Açıklaması
Tüm harfleri küçük harfe dönüştürür.

##### Örnek
```
'My Car':lowerCase()   // Çıktı: "my car"
'my car':lowerCase()   // Çıktı: "my car"
null:lowerCase()       // Çıktı: null
1203:lowerCase()       // Çıktı: 1203
```

##### Sonuç
Her bir örneğin çıktısı, yorumlarda belirtildiği gibidir.


#### 2. :upperCase

##### Söz Dizimi Açıklaması
Tüm harfleri büyük harfe dönüştürür.

##### Örnek
```
'My Car':upperCase()   // Çıktı: "MY CAR"
'my car':upperCase()   // Çıktı: "MY CAR"
null:upperCase()       // Çıktı: null
1203:upperCase()       // Çıktı: 1203
```

##### Sonuç
Her bir örneğin çıktısı, yorumlarda belirtildiği gibidir.


#### 3. :ucFirst

##### Söz Dizimi Açıklaması
Yalnızca dizenin ilk harfini büyük harfe dönüştürür, geri kalanını olduğu gibi bırakır.

##### Örnek
```
'My Car':ucFirst()     // Çıktı: "My Car"
'my car':ucFirst()     // Çıktı: "My car"
null:ucFirst()         // Çıktı: null
undefined:ucFirst()    // Çıktı: undefined
1203:ucFirst()         // Çıktı: 1203
```

##### Sonuç
Çıktı, yorumlarda açıklandığı gibidir.


#### 4. :ucWords

##### Söz Dizimi Açıklaması
Dizideki her kelimenin ilk harfini büyük harfe dönüştürür.

##### Örnek
```
'my car':ucWords()     // Çıktı: "My Car"
'My cAR':ucWords()     // Çıktı: "My CAR"
null:ucWords()         // Çıktı: null
undefined:ucWords()    // Çıktı: undefined
1203:ucWords()         // Çıktı: 1203
```

##### Sonuç
Çıktı, örneklerde gösterildiği gibidir.


#### 5. :print(message)

##### Söz Dizimi Açıklaması
Orijinal veri ne olursa olsun, her zaman belirtilen mesajı döndürür; bu da onu bir yedek biçimlendirici olarak kullanışlı kılar.
Parametre:
- **message:** Yazdırılacak metin.

##### Örnek
```
'My Car':print('hello!')   // Çıktı: "hello!"
'my car':print('hello!')   // Çıktı: "hello!"
null:print('hello!')       // Çıktı: "hello!"
1203:print('hello!')       // Çıktı: "hello!"
```

##### Sonuç
Tüm durumlarda belirtilen "hello!" dizesini döndürür.


#### 6. :printJSON

##### Söz Dizimi Açıklaması
Bir nesneyi veya diziyi JSON biçimli bir dizeye dönüştürür.

##### Örnek
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Çıktı: "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Çıktı: ""my car""
```

##### Sonuç
Çıktı, verilen verinin JSON biçimli dizesidir.


#### 7. :unaccent

##### Söz Dizimi Açıklaması
Metindeki aksan işaretlerini kaldırarak metni aksansız bir biçime dönüştürür.

##### Örnek
```
'crÃ¨me brulÃ©e':unaccent()   // Çıktı: "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Çıktı: "CREME BRULEE"
'Ãªtre':unaccent()           // Çıktı: "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Çıktı: "euieea"
```

##### Sonuç
Tüm örnekler, aksan işaretleri kaldırılmış metni çıktı olarak verir.


#### 8. :convCRLF

##### Söz Dizimi Açıklaması
Metindeki satır başı ve yeni satır karakterlerini (`\r\n` veya `\n`) belgeye özgü satır sonu etiketlerine dönüştürür. Bu, DOCX, PPTX, ODT, ODP ve ODS gibi biçimler için kullanışlıdır.
**Not:** `:convCRLF` biçimlendiricisinden önce `:html` kullanıldığında, `\r\n` bir `<br>` etiketine dönüştürülür.

##### Örnek
```
// ODT biçimi için:
'my blue 
 car':convCRLF()    // Çıktı: "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Çıktı: "my blue <text:line-break/> car"

// DOCX biçimi için:
'my blue 
 car':convCRLF()    // Çıktı: "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Çıktı: "my blue </w:t><w:br/><w:t> car"
```

##### Sonuç
Çıktı, hedef belge biçimine uygun satır sonu işaretlerini gösterir.


#### 9. :substr(begin, end, wordMode)

##### Söz Dizimi Açıklaması
Bir dize üzerinde alt dize işlemleri gerçekleştirir; `begin` dizininden (0 tabanlı) başlar ve `end` dizininden hemen önce biter.
İsteğe bağlı `wordMode` parametresi (boolean veya `last`), bir kelimenin ortasında bölünmesini önleyerek kelime bütünlüğünü koruyup korumayacağını kontrol eder.

##### Örnek
```
'foobar':substr(0, 3)            // Çıktı: "foo"
'foobar':substr(1)               // Çıktı: "oobar"
'foobar':substr(-2)              // Çıktı: "ar"
'foobar':substr(2, -1)           // Çıktı: "oba"
'abcd efg hijklm':substr(0, 11, true)  // Çıktı: "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Çıktı: "abcd efg "
```

##### Sonuç
Çıktı, parametrelere göre çıkarılan alt dizedir.


#### 10. :split(delimiter)

##### Söz Dizimi Açıklaması
Bir dizeyi belirtilen `delimiter` (ayırıcı) kullanarak bir diziye böler.
Parametre:
- **delimiter:** Ayırıcı dize.

##### Örnek
```
'abcdefc12':split('c')    // Çıktı: ["ab", "def", "12"]
1222.1:split('.')         // Çıktı: ["1222", "1"]
'ab/cd/ef':split('/')      // Çıktı: ["ab", "cd", "ef"]
```

##### Sonuç
Örnek sonuç, verilen ayırıcıya göre bölünmüş bir dizidir.


#### 11. :padl(targetLength, padString)

##### Söz Dizimi Açıklaması
Bir dizenin sol tarafını belirtilen bir karakterle doldurarak nihai dizenin `targetLength` (hedef uzunluk) değerine ulaşmasını sağlar.
Eğer hedef uzunluk, orijinal dizenin uzunluğundan küçükse, orijinal dize döndürülür.
Parametreler:
- **targetLength:** İstenen toplam uzunluk.
- **padString:** Doldurma için kullanılan dize (varsayılan olarak boşluktur).

##### Örnek
```
'abc':padl(10)              // Çıktı: "       abc"
'abc':padl(10, 'foo')       // Çıktı: "foofoofabc"
'abc':padl(6, '123465')     // Çıktı: "123abc"
'abc':padl(8, '0')          // Çıktı: "00000abc"
'abc':padl(1)               // Çıktı: "abc"
```

##### Sonuç
Her bir örnek, sol taraftan doldurulmuş dizeyi çıktı olarak verir.


#### 12. :padr(targetLength, padString)

##### Söz Dizimi Açıklaması
Bir dizenin sağ tarafını belirtilen bir karakterle doldurarak nihai dizenin `targetLength` (hedef uzunluk) değerine ulaşmasını sağlar.
Parametreler, `:padl` ile aynıdır.

##### Örnek
```
'abc':padr(10)              // Çıktı: "abc       "
'abc':padr(10, 'foo')       // Çıktı: "abcfoofoof"
'abc':padr(6, '123465')     // Çıktı: "abc123"
'abc':padr(8, '0')          // Çıktı: "abc00000"
'abc':padr(1)               // Çıktı: "abc"
```

##### Sonuç
Çıktı, sağ taraftan doldurulmuş dizeyi gösterir.


#### 13. :ellipsis(maximum)

##### Söz Dizimi Açıklaması
Metin belirtilen karakter sayısını aşarsa, sonuna bir üç nokta ("...") ekler.
Parametre:
- **maximum:** İzin verilen maksimum karakter sayısı.

##### Örnek
```
'abcdef':ellipsis(3)      // Çıktı: "abc..."
'abcdef':ellipsis(6)      // Çıktı: "abcdef"
'abcdef':ellipsis(10)     // Çıktı: "abcdef"
```

##### Sonuç
Örnekler, gerektiğinde kesilmiş ve üç nokta eklenmiş metni gösterir.


#### 14. :prepend(textToPrepend)

##### Söz Dizimi Açıklaması
Belirtilen metni dizenin başına ekler.
Parametre:
- **textToPrepend:** Ön ek metni.

##### Örnek
```
'abcdef':prepend('123')     // Çıktı: "123abcdef"
```

##### Sonuç
Çıktı, belirtilen ön ek eklenmiş metni gösterir.


#### 15. :append(textToAppend)

##### Söz Dizimi Açıklaması
Belirtilen metni dizenin sonuna ekler.
Parametre:
- **textToAppend:** Son ek metni.

##### Örnek
```
'abcdef':append('123')      // Çıktı: "abcdef123"
```

##### Sonuç
Çıktı, belirtilen son ek eklenmiş metni gösterir.


#### 16. :replace(oldText, newText)

##### Söz Dizimi Açıklaması
Metindeki tüm `oldText` (eski metin) eşleşmelerini `newText` (yeni metin) ile değiştirir.
Parametreler:
- **oldText:** Değiştirilecek eski metin.
- **newText:** Yerine konulacak yeni metin.
**Not:** Eğer `newText` null ise, eşleşen metnin kaldırılması gerektiği anlamına gelir.

##### Örnek
```
'abcdef abcde':replace('cd', 'OK')    // Çıktı: "abOKef abOKe"
'abcdef abcde':replace('cd')          // Çıktı: "abef abe"
'abcdef abcde':replace('cd', null)      // Çıktı: "abef abe"
'abcdef abcde':replace('cd', 1000)      // Çıktı: "ab1000ef ab1000e"
```

##### Sonuç
Çıktı, belirtilen bölümlerin değiştirilmesinden sonraki metindir.


#### 17. :len

##### Söz Dizimi Açıklaması
Bir dizenin veya dizinin uzunluğunu döndürür.

##### Örnek
```
'Hello World':len()     // Çıktı: 11
'':len()                // Çıktı: 0
[1,2,3,4,5]:len()       // Çıktı: 5
[1,'Hello']:len()       // Çıktı: 2
```

##### Sonuç
Çıktı, karşılık gelen uzunluk değeridir.


#### 18. :t

##### Söz Dizimi Açıklaması
Metni bir çeviri sözlüğüne göre çevirir.
Örnekler ve sonuçlar, gerçek çeviri sözlüğü yapılandırmasına bağlıdır.


#### 19. :preserveCharRef

##### Söz Dizimi Açıklaması
Varsayılan olarak, XML'deki bazı geçersiz karakterler (örneğin `&`, `>`, `<` vb.) kaldırılır. Bu biçimlendirici, karakter referanslarını (örneğin `&#xa7;` değişmeden kalır) korur ve belirli XML oluşturma senaryoları için uygundur.
Örnekler ve sonuçlar, belirli kullanım durumuna bağlıdır.