:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


### Tarih Biçimlendirme

#### 1. :formatD(patternOut, patternIn)

##### Söz Dizimi Açıklaması
Tarihi biçimlendirmek için kullanılır. Bir çıkış biçimi (`patternOut`) ve isteğe bağlı bir giriş biçimi (`patternIn`) alır. `patternIn` varsayılan olarak ISO 8601'dir. Saat dilimi ve dil ayarlarını `options.timezone` ve `options.lang` seçenekleriyle yapabilirsiniz.

##### Örnek
```
// Örnek ortam: API seçenekleri { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Çıktı 01/31/2016
'20160131':formatD(LL)     // Çıktı January 31, 2016
'20160131':formatD(LLLL)   // Çıktı Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Çıktı Sunday

// Fransızca örnek:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Çıktı mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Çıktı dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Çıktı dimanche 14 septembre 2014 19:27
```

##### Sonuç
Sonuç, belirtilen biçimde biçimlendirilmiş bir tarih dizesidir.


#### 2. :addD(amount, unit, patternIn)

##### Söz Dizimi Açıklaması
Bir tarihe belirtilen miktarda zaman ekler. Desteklenen birimler şunlardır: gün, hafta, ay, çeyrek, yıl, saat, dakika, saniye, milisaniye.  
Parametreler:
- **amount:** Eklenecek miktar.
- **unit:** Zaman birimi (büyük/küçük harf duyarsız).
- **patternIn:** İsteğe bağlı, giriş biçimi (varsayılan olarak ISO8601).

##### Örnek
```
// Örnek ortam: API seçenekleri { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Çıktı "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Çıktı "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Çıktı "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Çıktı "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Çıktı "2016-04-30T00:00:00.000Z"
```

##### Sonuç
Sonuç, belirtilen zaman eklendikten sonraki yeni tarih olacaktır.


#### 3. :subD(amount, unit, patternIn)

##### Söz Dizimi Açıklaması
Bir tarihten belirtilen miktarda zaman çıkarır. Parametreler `addD` ile aynıdır.

##### Örnek
```
// Örnek ortam: API seçenekleri { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Çıktı "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Çıktı "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Çıktı "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Çıktı "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Çıktı "2015-10-31T00:00:00.000Z"
```

##### Sonuç
Sonuç, belirtilen zaman çıkarıldıktan sonraki yeni tarih olacaktır.


#### 4. :startOfD(unit, patternIn)

##### Söz Dizimi Açıklaması
Tarihi, belirtilen zaman biriminin başlangıç anına ayarlar.  
Parametreler:
- **unit:** Zaman birimi.
- **patternIn:** İsteğe bağlı, giriş biçimi.

##### Örnek
```
// Örnek ortam: API seçenekleri { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Çıktı "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Çıktı "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Çıktı "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Çıktı "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Çıktı "2016-01-01T00:00:00.000Z"
```

##### Sonuç
Sonuç, belirtilen birimin başlangıç anına ayarlanmış tarih dizesidir.


#### 5. :endOfD(unit, patternIn)

##### Söz Dizimi Açıklaması
Tarihi, belirtilen zaman biriminin bitiş anına ayarlar.  
Parametreler `startOfD` ile aynıdır.

##### Örnek
```
// Örnek ortam: API seçenekleri { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Çıktı "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Çıktı "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Çıktı "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Çıktı "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Çıktı "2016-01-31T23:59:59.999Z"
```

##### Sonuç
Sonuç, belirtilen birimin bitiş anına ayarlanmış tarih dizesidir.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Söz Dizimi Açıklaması
İki tarih arasındaki farkı hesaplar ve bu farkı belirtilen birimde çıktı olarak verir. Desteklenen çıktı birimleri şunlardır:
- `gün(ler)` veya `d`
- `hafta(lar)` veya `w`
- `çeyrek(ler)` veya `Q`
- `ay(lar)` veya `M`
- `yıl(lar)` veya `y`
- `saat(ler)` veya `h`
- `dakika(lar)` veya `m`
- `saniye(ler)` veya `s`
- `milisaniye(ler)` veya `ms` (varsayılan birim)

Parametreler:
- **toDate:** Hedef tarih.
- **unit:** Çıktı birimi.
- **patternFromDate:** İsteğe bağlı, başlangıç tarihinin biçimi.
- **patternToDate:** İsteğe bağlı, hedef tarihinin biçimi.

##### Örnek
```
'20101001':diffD('20101201')              // Çıktı 5270400000
'20101001':diffD('20101201', 'second')      // Çıktı 5270400
'20101001':diffD('20101201', 's')           // Çıktı 5270400
'20101001':diffD('20101201', 'm')           // Çıktı 87840
'20101001':diffD('20101201', 'h')           // Çıktı 1464
'20101001':diffD('20101201', 'weeks')       // Çıktı 8
'20101001':diffD('20101201', 'days')        // Çıktı 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Çıktı 5270400000
```

##### Sonuç
Sonuç, iki tarih arasındaki zaman farkının belirtilen birime dönüştürülmüş halidir.


#### 7. :convDate(patternIn, patternOut)

##### Söz Dizimi Açıklaması
Bir tarihi bir biçimden başka bir biçime dönüştürür (kullanılması önerilmez).  
Parametreler:
- **patternIn:** Giriş tarihi biçimi.
- **patternOut:** Çıkış tarihi biçimi.

##### Örnek
```
// Örnek ortam: API seçenekleri { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Çıktı "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Çıktı "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Çıktı "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Çıktı "Sunday"
1410715640:convDate('X', 'LLLL')          // Çıktı "Sunday, September 14, 2014 7:27 PM"
// Fransızca örnek:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Çıktı "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Çıktı "dimanche"
```

##### Sonuç
Sonuç, belirtilen biçime dönüştürülmüş tarih dizesidir.


#### 8. Tarih Biçimi Desenleri
Yaygın tarih biçimi sembolleri (DayJS belgelerine bakınız):
- `X`: Unix zaman damgası (saniye cinsinden), örn. 1360013296
- `x`: Unix milisaniye zaman damgası, örn. 1360013296123
- `YY`: İki haneli yıl, örn. 18
- `YYYY`: Dört haneli yıl, örn. 2018
- `M`, `MM`, `MMM`, `MMMM`: Ay (sayı, iki haneli, kısaltılmış, tam ad)
- `D`, `DD`: Gün (sayı, iki haneli)
- `d`, `dd`, `ddd`, `dddd`: Haftanın günü (sayı, en kısa, kısaltılmış, tam ad)
- `H`, `HH`, `h`, `hh`: Saat (24 saat veya 12 saat formatı)
- `m`, `mm`: Dakika
- `s`, `ss`: Saniye
- `SSS`: Milisaniye (3 haneli)
- `Z`, `ZZ`: UTC ofseti, örn. +05:00 veya +0500
- `A`, `a`: AM/PM
- `Q`: Çeyrek (1-4)
- `Do`: Sıra ekiyle birlikte ayın günü, örn. 1'inci, 2'nci, ...
- Diğer biçimler için tam belgelere bakınız.  
  Ek olarak, `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL` gibi dile dayalı yerelleştirilmiş biçimler de bulunmaktadır.