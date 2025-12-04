:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


## Biçimlendiriciler

Biçimlendiriciler, ham veriyi okunması kolay metne dönüştürmek için kullanılır. Verilere iki nokta üst üste (:) kullanarak uygulanırlar ve zincirleme olarak çağrılabilirler; böylece her biçimlendiricinin çıktısı bir sonrakinin girdisi olur. Bazı biçimlendiriciler sabit veya dinamik parametreleri destekler.

### Genel Bakış

#### 1. Söz Dizimi Açıklaması
Bir biçimlendiricinin temel çağrı şekli şöyledir:
```
{d.özellik:biçimlendirici1:biçimlendirici2(...)}
```  
Örneğin, `"JOHN"` dizesini `"John"`'a dönüştürme örneğinde, önce `lowerCase` ile tüm harfler küçük harfe dönüştürülür, ardından `ucFirst` ile ilk harf büyük yapılır.

#### 2. Örnek
Veri:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Şablon:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Sonuç
Oluşturulduktan sonra çıktı:
```
My name is John. I was born on January 31, 2000.
```

### Sabit Parametreler

#### 1. Söz Dizimi Açıklaması
Birçok biçimlendirici, çıktıyı değiştirmek için bir veya daha fazla sabit parametreyi destekler. Bu parametreler virgülle ayrılır ve parantez içine alınır. Örneğin, `:prepend(myPrefix)` metnin önüne "myPrefix" ekler.  
**Not:** Eğer parametre virgül veya boşluk içeriyorsa, tek tırnak içine alınmalıdır, örneğin: `prepend('my prefix')`.

#### 2. Örnek
Şablon örneği (ayrıntılar için belirli biçimlendirici kullanımına bakınız).

#### 3. Sonuç
Çıktı, metnin önüne belirtilen öneki ekleyecektir.

### Dinamik Parametreler

#### 1. Söz Dizimi Açıklaması
Biçimlendiriciler dinamik parametreleri de destekler. Bu parametreler bir nokta (.) ile başlar ve tırnak içine alınmaz.  
Dinamik parametreleri belirtmek için iki yöntem vardır:
- **Mutlak JSON Yolu:** `d.` veya `c.` ile başlar (kök veriye veya ek verilere atıfta bulunur).
- **Göreceli JSON Yolu:** Tek bir nokta (.) ile başlar ve özelliğin mevcut üst nesneden arandığını belirtir.

Örneğin:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Göreceli bir yol olarak da yazılabilir:
```
{d.subObject.qtyB:add(.qtyC)}
```
Daha yüksek bir seviyedeki (üst veya daha üst) verilere erişmeniz gerekirse, birden fazla nokta kullanabilirsiniz:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Örnek
Veri:
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
Şablonda Kullanım:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Sonuç: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Sonuç: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Sonuç: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Sonuç: 6 (3 + 3)
```

#### 3. Sonuç
Örnekler sırasıyla 8, 8, 28 ve 6 değerlerini verir.

> **Not:** Özel yineleyicileri veya dizi filtrelerini dinamik parametre olarak kullanmaya izin verilmez, örneğin:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```