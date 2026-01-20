:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


### Dizi Biçimlendirme

#### 1. :arrayJoin(separator, index, count)

##### Söz Dizimi Açıklaması
Bir dize veya sayı dizisini tek bir dizeye birleştirir.  
Parametreler:
- `separator`: Ayırıcı (varsayılan olarak virgül `,` kullanılır).
- `index`: İsteğe bağlı; birleştirmeye başlanacak başlangıç dizini.
- `count`: İsteğe bağlı; `index` değerinden başlayarak birleştirilecek öğe sayısı (sondan saymak için negatif bir değer olabilir).

##### Örnek
```
['homer','bart','lisa']:arrayJoin()              // Çıktı: "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Çıktı: "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Çıktı: "homerbartlisa"
[10,50]:arrayJoin()                               // Çıktı: "10, 50"
[]:arrayJoin()                                    // Çıktı: ""
null:arrayJoin()                                  // Çıktı: null
{}:arrayJoin()                                    // Çıktı: {}
20:arrayJoin()                                    // Çıktı: 20
undefined:arrayJoin()                             // Çıktı: undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Çıktı: "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Çıktı: "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Çıktı: "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Çıktı: "homerbart"
```

##### Sonuç
Çıktı, belirtilen parametrelere göre dizi öğeleri birleştirilerek oluşturulan bir dizedir.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Söz Dizimi Açıklaması
Bir nesne dizisini bir dizeye dönüştürür. İç içe geçmiş nesneleri veya dizileri işlemez.  
Parametreler:
- `objSeparator`: Nesneler arasındaki ayırıcı (varsayılan olarak `, ` kullanılır).
- `attSeparator`: Nesne özellikleri arasındaki ayırıcı (varsayılan olarak `:` kullanılır).
- `attributes`: İsteğe bağlı; çıktı olarak verilecek nesne özelliklerinin bir listesi.

##### Örnek
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Çıktı: "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Çıktı: "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Çıktı: "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Çıktı: "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Çıktı: "2:homer"

['homer','bart','lisa']:arrayMap()    // Çıktı: "homer, bart, lisa"
[10,50]:arrayMap()                    // Çıktı: "10, 50"
[]:arrayMap()                         // Çıktı: ""
null:arrayMap()                       // Çıktı: null
{}:arrayMap()                         // Çıktı: {}
20:arrayMap()                         // Çıktı: 20
undefined:arrayMap()                  // Çıktı: undefined
```

##### Sonuç
Çıktı, iç içe geçmiş nesne içeriğini yok sayarak, dizi öğelerinin eşlenmesi ve birleştirilmesiyle oluşturulan bir dizedir.

#### 3. :count(start)

##### Söz Dizimi Açıklaması
Bir dizideki satır numarasını sayar ve geçerli satır numarasını çıktı olarak verir.  
Örneğin:
```
{d[i].id:count()}
```  
`id` değerinden bağımsız olarak, geçerli satır sayısını çıktı olarak verir.  
v4.0.0 sürümünden itibaren, bu biçimlendirici dahili olarak `:cumCount` ile değiştirilmiştir.

Parametre:
- `start`: İsteğe bağlı; sayımın başlangıç değeri.

##### Örnek ve Sonuç
Kullanıldığında, çıktıdaki satır numarası dizi öğelerinin sırasına göre görüntülenecektir.