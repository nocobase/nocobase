:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


### Para Birimi Biçimlendirme

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Söz Dizimi Açıklaması
Bir para birimi sayısını biçimlendirir ve ondalık basamak sayısını veya belirli bir çıktı formatını belirtmenize olanak tanır.  
Parametreler:
- **precisionOrFormat:** İsteğe bağlı bir parametredir. Hem bir sayı (ondalık basamak sayısını belirtir) hem de bir format belirleyici olabilir:
  - Bir tam sayı: Varsayılan ondalık hassasiyetini değiştirir.
  - `'M'`: Yalnızca ana para birimi adını çıktılar.
  - `'L'`: Sayıyı para birimi sembolüyle birlikte çıktılar (varsayılan).
  - `'LL'`: Sayıyı ana para birimi adıyla birlikte çıktılar.
- **targetCurrency:** İsteğe bağlıdır; genel ayarları geçersiz kılan hedef para birimi kodudur (büyük harflerle, örn. USD, EUR).

##### Örnek
```
// Örnek ortam: API seçenekleri { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Çıktı: "$2,000.91"
'1000.456':formatC('M')    // Çıktı: "dollars"
'1':formatC('M')           // Çıktı: "dollar"
'1000':formatC('L')        // Çıktı: "$2,000.00"
'1000':formatC('LL')       // Çıktı: "2,000.00 dollars"

// Fransızca örnek (ortam ayarları farklı olduğunda):
'1000.456':formatC()      // Çıktı: "2 000,91 ..."  
'1000.456':formatC()      // Kaynak ve hedef para birimleri aynı olduğunda, çıktı: "1 000,46 €"
```

##### Sonuç
Çıktı, API seçeneklerine ve döviz kuru ayarlarına bağlıdır.

#### 2. :convCurr(target, source)

##### Söz Dizimi Açıklaması
Bir sayıyı bir para biriminden başka bir para birimine dönüştürür. Döviz kuru, API seçenekleri aracılığıyla veya global olarak ayarlanabilir.  
Eğer hiçbir parametre belirtilmezse, dönüşüm otomatik olarak `options.currencySource`'tan `options.currencyTarget`'a yapılır.  
Parametreler:
- **target:** İsteğe bağlıdır; hedef para birimi kodudur (varsayılan olarak `options.currencyTarget`'a eşittir).
- **source:** İsteğe bağlıdır; kaynak para birimi kodudur (varsayılan olarak `options.currencySource`'a eşittir).

##### Örnek
```
// Örnek ortam: API seçenekleri { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Çıktı: 20
1000:convCurr()            // Çıktı: 2000
1000:convCurr('EUR')        // Çıktı: 1000
1000:convCurr('USD')        // Çıktı: 2000
1000:convCurr('USD', 'USD') // Çıktı: 1000
```

##### Sonuç
Çıktı, dönüştürülmüş para birimi değeridir.