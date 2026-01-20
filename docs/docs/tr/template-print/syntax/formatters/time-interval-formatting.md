:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


### Zaman Aralığı Biçimlendirme

#### 1. :formatI(patternOut, patternIn)

##### Söz Dizimi Açıklaması
Bir süreyi veya zaman aralığını biçimlendirir. Desteklenen çıktı formatları şunlardır:
- `human+` veya `human` (insan dostu gösterim için uygundur)
- Ayrıca `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` gibi birimler (veya bunların kısaltmaları).

Parametreler:
- **patternOut:** Çıktı formatı (örneğin, `'second'` veya `'human+'`).
- **patternIn:** İsteğe bağlı, giriş birimi (örneğin, `'milliseconds'` veya `'s'`).

##### Örnek
```
// Örnek ortam: API seçenekleri { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Çıktı: 2
2000:formatI('seconds')      // Çıktı: 2
2000:formatI('s')            // Çıktı: 2
3600000:formatI('minute')    // Çıktı: 60
3600000:formatI('hour')      // Çıktı: 1
2419200000:formatI('days')   // Çıktı: 28

// Fransızca örnek:
2000:formatI('human')        // Çıktı: "quelques secondes"
2000:formatI('human+')       // Çıktı: "dans quelques secondes"
-2000:formatI('human+')      // Çıktı: "il y a quelques secondes"

// İngilizce örnek:
2000:formatI('human')        // Çıktı: "a few seconds"
2000:formatI('human+')       // Çıktı: "in a few seconds"
-2000:formatI('human+')      // Çıktı: "a few seconds ago"

// Birim dönüştürme örneği:
60:formatI('ms', 'minute')   // Çıktı: 3600000
4:formatI('ms', 'weeks')      // Çıktı: 2419200000
'P1M':formatI('ms')          // Çıktı: 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Çıktı: 10296.085
```

##### Sonuç
Çıktı sonucu, giriş değerine ve birim dönüştürmesine bağlı olarak ilgili süre veya zaman aralığı olarak görüntülenir.