:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/template-print/syntax/formatters/time-interval-formatting) bakın.
:::

### Zaman Aralığı Biçimlendirme

#### 1. :formatI(patternOut, patternIn)

##### Söz Dizimi Açıklaması
Süreyi veya aralığı biçimlendirir, desteklenen çıktı formatları şunları içerir:
- `human+`, `human` (insan dostu görüntüleme için uygundur)
- ve `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` gibi birimler (veya kısaltmaları).

Parametreler:
- patternOut: Çıktı formatı (örneğin `'second'`, `'human+'` vb.)
- patternIn: İsteğe bağlı, giriş birimi (örneğin `'milliseconds'`, `'s'` vb.)

##### Örnek
```
2000:formatI('second')       // Çıktı 2
2000:formatI('seconds')      // Çıktı 2
2000:formatI('s')            // Çıktı 2
3600000:formatI('minute')    // Çıktı 60
3600000:formatI('hour')      // Çıktı 1
2419200000:formatI('days')   // Çıktı 28

// İnsan dostu görüntüleme:
2000:formatI('human')        // Çıktı "a few seconds"
2000:formatI('human+')       // Çıktı "in a few seconds"
-2000:formatI('human+')      // Çıktı "a few seconds ago"

// Birim dönüştürme örneği:
60:formatI('ms', 'minute')   // Çıktı 3600000
4:formatI('ms', 'weeks')      // Çıktı 2419200000
'P1M':formatI('ms')          // Çıktı 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Çıktı 10296.085
```

##### Sonuç
Çıktı sonucu, giriş değerine ve birim dönüştürmesine bağlı olarak ilgili süre veya aralık olarak görüntülenir.