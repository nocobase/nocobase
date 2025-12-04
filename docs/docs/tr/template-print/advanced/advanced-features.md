:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


## Gelişmiş Özellikler

### Sayfalandırma

#### 1. Sayfa Numarası Güncelleme

##### Söz Dizimi
Office yazılımınızda kolayca ekleyebilirsiniz.

##### Örnek
Microsoft Word'de:
- "Ekle → Sayfa Numarası" özelliğini kullanın.
LibreOffice'te:
- "Ekle → Alan → Sayfa Numarası" özelliğini kullanın.

##### Sonuç
Oluşturulan raporda, her sayfanın sayfa numaraları otomatik olarak güncellenecektir.


#### 2. İçerik Tablosu Oluşturma

##### Söz Dizimi
Office yazılımınızda kolayca ekleyebilirsiniz.

##### Örnek
Microsoft Word'de:
- "Ekle → Dizin ve Tablo → İçerik Tablosu" özelliğini kullanın.
LibreOffice'te:
- "Ekle → İçerik Tablosu ve Dizin → Tablo, Dizin veya Kaynakça" özelliğini kullanın.

##### Sonuç
Raporun içerik tablosu, belge içeriğine göre otomatik olarak güncellenecektir.


#### 3. Tekrarlayan Tablo Başlıkları

##### Söz Dizimi
Office yazılımınızda kolayca ekleyebilirsiniz.

##### Örnek
Microsoft Word'de:
- Tablo başlığına sağ tıklayın → Tablo Özellikleri → "Her sayfanın üstünde başlık satırı olarak tekrarla" seçeneğini işaretleyin.
LibreOffice'te:
- Tablo başlığına sağ tıklayın → Tablo Özellikleri → Metin Akışı sekmesi → "Başlığı tekrarla" seçeneğini işaretleyin.

##### Sonuç
Bir tablo birden fazla sayfaya yayıldığında, başlık her sayfanın üstünde otomatik olarak tekrarlanacaktır.


### Uluslararasılaştırma (i18n)

#### 1. Statik Metin Çevirisi

##### Söz Dizimi
Statik metinleri uluslararasılaştırmak için `{t(metin)}` etiketini kullanın:
```
{t(meeting)}
```

##### Örnek
Şablonda:
```
{t(meeting)} {t(apples)}
```
JSON verisinde veya harici bir yerelleştirme sözlüğünde (örneğin "fr-fr" için) ilgili çeviriler sağlanır, örneğin "meeting" → "rendez-vous", "apples" → "Pommes".

##### Sonuç
Rapor oluşturulurken, metin hedef dile göre ilgili çeviriyle değiştirilecektir.


#### 2. Dinamik Metin Çevirisi

##### Söz Dizimi
Veri içeriği için `:t` biçimlendiricisini kullanabilirsiniz, örneğin:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Örnek
Şablonda:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
JSON verisi ve yerelleştirme sözlüğü ilgili çevirileri sağlar.

##### Sonuç
Koşul değerlendirmesine göre, çıktı "lundi" veya "mardi" olacaktır (hedef dil örneği olarak).


### Anahtar-Değer Eşlemesi

#### 1. Enum Dönüşümü (:convEnum)

##### Söz Dizimi
```
{veri:convEnum(enumAdı)}
```
Örneğin:
```
0:convEnum('ORDER_STATUS')
```

##### Örnek
API seçenekleri örneğinde aşağıdaki veri sağlanır:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
Şablonda:
```
0:convEnum('ORDER_STATUS')
```

##### Sonuç
"pending" çıktısını verir; eğer indeks enum aralığının dışındaysa, orijinal değeri çıktı olarak verir.


### Dinamik Görseller
:::info
Şu anda XLSX ve DOCX dosya türlerini desteklemektedir
:::
Belge şablonlarınıza "dinamik görseller" ekleyebilirsiniz. Bu, şablondaki yer tutucu görsellerin, veriye göre oluşturma sırasında otomatik olarak gerçek görsellerle değiştirileceği anlamına gelir. Bu süreç oldukça basittir ve yalnızca şu adımları gerektirir:

1. Yer tutucu olarak geçici bir görsel ekleyin.
2. Görselin "Alternatif Metni"ni düzenleyerek alan etiketini ayarlayın.
3. Belgeyi oluşturduğunuzda, sistem otomatik olarak gerçek görselle değiştirecektir.

Aşağıda, DOCX ve XLSX için işlem yöntemlerini belirli örneklerle açıklayacağız.


#### DOCX Dosyalarına Dinamik Görsel Ekleme
##### Tek Görsel Değişimi

1. DOCX şablonunuzu açın ve geçici bir görsel ekleyin (bu, herhangi bir yer tutucu görsel olabilir, örneğin [düz mavi bir görsel](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)).

:::info
**Görsel Formatı Talimatları**

- Şu anda, yer tutucu görseller yalnızca PNG formatını desteklemektedir. Sağladığımız örnek [düz mavi görseli](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png) kullanmanızı öneririz.
- Hedef oluşturulan görseller yalnızca PNG, JPG, JPEG formatlarını desteklemektedir. Diğer görsel türleri oluşturulamayabilir.

**Görsel Boyutu Talimatları**

DOCX veya XLSX için olsun, nihai oluşturulan görsel boyutu, şablondaki geçici görselin boyutlarını takip edecektir. Yani, gerçek değiştirilen görsel, eklediğiniz yer tutucu görselin boyutuyla eşleşecek şekilde otomatik olarak ölçeklenecektir. Eğer oluşturulan görselin 150×150 olmasını istiyorsanız, lütfen şablonda geçici bir görsel kullanın ve bu boyuta ayarlayın.
:::

2. Bu görsele sağ tıklayın, "Alternatif Metin"ini düzenleyin ve eklemek istediğiniz görsel alan etiketini, örneğin `{d.imageUrl}` şeklinde doldurun:

![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Oluşturma için aşağıdaki örnek veriyi kullanın:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
}
```

4. Oluşturulan sonuçta, geçici görsel gerçek görselle değiştirilecektir:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Çoklu Görsel Döngüsel Değişimi

Şablona bir görsel grubu, örneğin bir ürün listesi eklemek isterseniz, bunu döngüler aracılığıyla da gerçekleştirebilirsiniz. Adımlar şunlardır:

1. Verilerinizin aşağıdaki gibi olduğunu varsayalım:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg"
    }
  ]
}
```

2. DOCX şablonunda bir döngü alanı ayarlayın ve her döngü öğesine geçici görseller ekleyin. Alternatif metni `{d.products[i].imageUrl}` olarak ayarlayın, aşağıdaki gibi:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Oluşturulduktan sonra, tüm geçici görseller ilgili veri görselleriyle değiştirilecektir:

![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### XLSX Dosyalarına Dinamik Görsel Ekleme

Excel şablonlarında (XLSX) işlem yöntemi temelde aynıdır, sadece aşağıdaki noktalara dikkat edin:

1. Görseli ekledikten sonra, görselin hücrenin üzerinde yüzmek yerine "hücre içindeki görsel" olarak seçildiğinden emin olun.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Hücreyi seçtikten sonra, alan etiketini, örneğin `{d.imageUrl}` şeklinde doldurmak için "Alternatif Metin"i görüntülemek üzere tıklayın.

### Barkod
:::info
Şu anda XLSX ve DOCX dosya türlerini desteklemektedir
:::

#### Barkod Oluşturma (QR kodları gibi)

Barkod oluşturma, Dinamik Görseller ile aynı şekilde çalışır ve yalnızca üç adım gerektirir:

1. Barkodun konumunu işaretlemek için şablona geçici bir görsel ekleyin.
2. Görselin "Alternatif Metni"ni düzenleyin ve barkod formatı alan etiketini, örneğin `{d.code:barcode(qrcode)}` şeklinde yazın. Burada `qrcode` barkod türüdür (aşağıdaki desteklenen listeye bakın).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Oluşturulduktan sonra, yer tutucu görsel otomatik olarak ilgili barkod görseliyle değiştirilecektir:

![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Desteklenen Barkod Türleri

| Barkod Adı | Tür   |
| ---------- | ----- |
| QR Kodu    | qrcode |