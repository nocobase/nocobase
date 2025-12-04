---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Şifreleme

## Giriş

Müşteri cep telefonu numarası, e-posta adresi, kart numarası gibi bazı özel iş verileri şifrelenebilir. Şifrelendikten sonra bu veriler, veritabanına şifreli metin olarak kaydedilir.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Şifreleme Yöntemi

:::warning
Eklenti otomatik olarak bir `uygulama anahtarı` oluşturur. Bu anahtar, `/storage/apps/main/encryption-field-keys` dizininde saklanır.

`Uygulama anahtarı` dosyası, anahtar ID'si olarak adlandırılır ve `.key` uzantısına sahiptir. Lütfen dosya adını keyfi olarak değiştirmeyin.

Lütfen `uygulama anahtarı` dosyasını güvenli bir şekilde saklayın. Eğer `uygulama anahtarı` dosyasını kaybederseniz, şifreli veriler çözülemez.

Eğer bir alt uygulama eklentiyi etkinleştirdiyse, anahtar varsayılan olarak `/storage/apps/${alt uygulama adı}/encryption-field-keys` dizininde saklanır.
:::

### Çalışma Prensibi

Zarf Şifreleme yöntemini kullanır.

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Anahtar Oluşturma Süreci
1. İlk kez şifreli bir alan oluşturulduğunda, sistem otomatik olarak 32 bitlik bir `uygulama anahtarı` oluşturur ve bunu Base64 kodlamasıyla varsayılan depolama dizinine kaydeder.
2. Her yeni şifreli alan oluşturulduğunda, bu alan için rastgele 32 bitlik bir `alan anahtarı` oluşturulur; ardından `uygulama anahtarı` ve rastgele oluşturulmuş 16 bitlik bir `alan şifreleme vektörü` kullanılarak (`AES` şifreleme algoritması ile) şifrelenir ve `fields` tablosunun `options` alanına kaydedilir.

### Alan Şifreleme Süreci
1. Şifreli bir alana her veri yazıldığında, öncelikle `fields` tablosunun `options` alanından şifreli `alan anahtarı` ve `alan şifreleme vektörü` alınır.
2. `Uygulama anahtarı` ve `alan şifreleme vektörü` kullanılarak şifreli `alan anahtarı` çözülür; ardından `alan anahtarı` ve rastgele oluşturulmuş 16 bitlik bir `veri şifreleme vektörü` kullanılarak veriler (`AES` şifreleme algoritması ile) şifrelenir.
3. Çözülmüş `alan anahtarı` kullanılarak veriler (`HMAC-SHA256` özet algoritması ile) imzalanır ve Base64 kodlamasıyla bir dizeye dönüştürülür (oluşturulan `veri imzası` daha sonra veri alımı için kullanılır).
4. 16 bitlik `veri şifreleme vektörü` ve şifreli `şifreli metin` ikili olarak birleştirilir ve Base64 kodlamasıyla bir dizeye dönüştürülür.
5. `Veri imzası` Base64 kodlu dizesi ve birleştirilmiş `şifreli metin` Base64 kodlu dizesi, `.` ayırıcı ile birleştirilir.
6. Son birleştirilmiş dize veritabanına kaydedilir.

## Ortam Değişkenleri

Eğer özel bir `uygulama anahtarı` belirtmek isterseniz, `ENCRYPTION_FIELD_KEY_PATH` ortam değişkenini kullanabilirsiniz. Eklenti, bu yoldaki dosyayı `uygulama anahtarı` olarak yükleyecektir.

Uygulama anahtarı dosyası için gereksinimler:
1. Dosya uzantısı `.key` olmalıdır.
2. Dosya adı anahtar ID'si olarak kullanılacaktır; benzersizliği sağlamak için UUID kullanılması önerilir.
3. Dosya içeriği, Base64 kodlu 32 bitlik ikili veri olmalıdır.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Alan Yapılandırması

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Şifrelemeden Sonra Filtrelemeye Etkisi

Şifreli alanlar yalnızca şunları destekler: eşittir, eşit değildir, mevcuttur, mevcut değildir.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Veri filtreleme iş akışı:
1. Şifreli alanın `alan anahtarı` alınır ve `uygulama anahtarı` kullanılarak çözülür.
2. Kullanıcının girdiği arama metni, `alan anahtarı` kullanılarak imzalanır (`HMAC-SHA256` özet algoritması).
3. İmzalanmış arama metni, `.` ayırıcı ile birleştirilir ve veritabanında şifreli alan üzerinde önek eşleşmeli bir arama yapılır.

## Anahtar Rotasyonu

:::warning
`nocobase key-rotation` komutunu kullanmadan önce, uygulamanın bu eklentiyi yüklediğinden emin olun.
:::

Bir uygulama yeni bir ortama taşındığında ve eski ortamla aynı anahtarı kullanmaya devam etmek istemediğinizde, `uygulama anahtarını` değiştirmek için `nocobase key-rotation` komutunu kullanabilirsiniz.

Anahtar rotasyonu komutunu çalıştırmak, eski ortamın `uygulama anahtarını` belirtmeyi gerektirir. Komut çalıştırıldıktan sonra yeni bir `uygulama anahtarı` oluşturulacak ve eski anahtarın yerini alacaktır. Yeni `uygulama anahtarı` Base64 kodlamasıyla varsayılan depolama dizinine kaydedilecektir.

```bash
# --key-path, veritabanındaki şifreli verilere karşılık gelen eski ortamın uygulama anahtarı dosyasını belirtir.
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Eğer bir alt uygulamanın `uygulama anahtarını` değiştirmek isterseniz, `--app-name` parametresini ekleyerek alt uygulamanın `adı`nı belirtmeniz gerekir.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```