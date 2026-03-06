:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/template-print/syntax/formatters/currency-formatting) bakın.
:::

### Para Birimi Biçimlendirme

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Söz Dizimi Açıklaması
Para birimi sayılarını biçimlendirir; ondalık basamak sayısını veya belirli bir çıktı formatını belirleyebilirsiniz.  
Parametreler:
- precisionOrFormat: İsteğe bağlı parametre; hem bir sayı (ondalık basamak sayısını belirtir) hem de belirli bir format tanımlayıcı olabilir:
  - Tam sayı: Varsayılan ondalık hassasiyetini değiştirir
  - `'M'`: Yalnızca ana para birimi adını çıktılar
  - `'L'`: Sayıyı para birimi sembolüyle birlikte çıktılar (varsayılan)
  - `'LL'`: Sayıyı ana para birimi adıyla birlikte çıktılar
- targetCurrency: İsteğe bağlı; genel ayarları geçersiz kılan hedef para birimi kodu (USD, EUR gibi büyük harf)

##### Örnek
```
'1000.456':formatC()      // "$2,000.91" çıktısını verir
'1000.456':formatC('M')    // "dollars" çıktısını verir
'1':formatC('M')           // "dollar" çıktısını verir
'1000':formatC('L')        // "$2,000.00" çıktısını verir
'1000':formatC('LL')       // "2,000.00 dollars" çıktısını verir
```

##### Sonuç
Çıktı sonucu, API seçeneklerine ve döviz kuru ayarlarına bağlıdır.


#### 2. :convCurr(target, source)

##### Söz Dizimi Açıklaması
Bir sayıyı bir para biriminden diğerine dönüştürür. Döviz kuru, API seçenekleri aracılığıyla iletilebilir veya global olarak ayarlanabilir.  
Eğer parametre belirtilmezse, otomatik olarak `options.currencySource` üzerinden `options.currencyTarget` birimine dönüştürülür.  
Parametreler:
- target: İsteğe bağlı, hedef para birimi kodu (varsayılan olarak `options.currencyTarget` değerine eşittir)
- source: İsteğe bağlı, kaynak para birimi kodu (varsayılan olarak `options.currencySource` değerine eşittir)

##### Örnek
```
10:convCurr()              // 20 çıktısını verir
1000:convCurr()            // 2000 çıktısını verir
1000:convCurr('EUR')        // 1000 çıktısını verir
1000:convCurr('USD')        // 2000 çıktısını verir
1000:convCurr('USD', 'USD') // 1000 çıktısını verir
```

##### Sonuç
Çıktı, dönüştürülmüş para birimi değeridir.