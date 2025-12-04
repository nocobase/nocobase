---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Yanıt Mesajı

## Giriş

Yanıt mesajı düğümü, belirli türdeki iş akışlarında, bir eylemi başlatan istemciye iş akışından özel mesajlar geri bildirim olarak göndermenizi sağlar.

:::info{title=Not}
Şu anda, senkronize moddaki "Eylem öncesi olay" ve "Özel eylem olayı" türündeki iş akışlarında kullanabilirsiniz.
:::

## Düğüm Oluşturma

Desteklenen iş akışı türlerinde, iş akışının herhangi bir yerine bir "Yanıt mesajı" düğümü ekleyebilirsiniz. İş akışındaki artı ("+") düğmesine tıklayarak "Yanıt mesajı" düğümünü ekleyebilirsiniz:

![Düğüm ekleme](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Yanıt mesajı, tüm istek süreci boyunca bir dizi (array) olarak tutulur. İş akışında herhangi bir yanıt mesajı düğümü çalıştığında, yeni mesaj içeriği bu diziye eklenir. Sunucu yanıtı gönderirken, tüm mesajları istemciye tek seferde iletir.

## Düğüm Yapılandırması

Mesaj içeriği, içine değişkenlerin eklenebildiği bir şablon dizesidir. Bu şablon içeriğini düğüm yapılandırmasında dilediğiniz gibi düzenleyebilirsiniz:

![Düğüm yapılandırması](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

İş akışı bu düğüme ulaştığında, şablon ayrıştırılır ve mesaj içeriği oluşturulur. Yukarıdaki yapılandırmada, "Yerel değişken / Tüm ürünleri döngüye al / Döngü nesnesi / Ürün / Başlık" değişkeni, gerçek iş akışında belirli bir değerle değiştirilir, örneğin:

```
"iPhone 14 pro" ürününün stoğu yetersiz.
```

![Mesaj içeriği](https://static-docs.nocobase.com/06fd4a6b6ec499c853f0c39987f63a6a.png)

## İş Akışı Yapılandırması

Yanıt mesajının durumu, iş akışının başarılı veya başarısız olmasına göre belirlenir. Herhangi bir düğümün çalışması başarısız olursa, tüm iş akışı da başarısız olur. Bu durumda, mesaj içeriği istemciye başarısızlık durumuyla birlikte döndürülür ve gösterilir.

İş akışında aktif olarak bir başarısızlık durumu tanımlamak isterseniz, bir "Bitiş düğümü" kullanabilir ve bunu başarısızlık durumu olarak yapılandırabilirsiniz. Bu düğüm çalıştığında, iş akışı başarısızlık durumuyla sonlanır ve mesaj istemciye başarısızlık durumuyla birlikte döndürülür.

Eğer tüm iş akışı bir başarısızlık durumu üretmez ve başarıyla tamamlanırsa, mesaj içeriği istemciye başarı durumuyla döndürülür.

:::info{title=Not}
Eğer iş akışında birden fazla yanıt mesajı düğümü tanımlarsanız, çalıştırılan düğümler mesaj içeriğini bir diziye ekler. Sonunda istemciye döndürüldüğünde, tüm mesaj içeriği birlikte döndürülür ve gösterilir.
:::

## Kullanım Senaryoları

### "Eylem öncesi olay" iş akışı

"Eylem öncesi olay" iş akışında yanıt mesajı kullanmak, iş akışı tamamlandıktan sonra istemciye ilgili mesaj geri bildirimini göndermenizi sağlar. Ayrıntılar için [Eylem öncesi olay](../triggers/pre-action.md) bölümüne bakabilirsiniz.

### "Özel eylem olayı" iş akışı

Senkronize moddaki "Özel eylem olayı"nda yanıt mesajı kullanmak, iş akışı tamamlandıktan sonra istemciye ilgili mesaj geri bildirimini göndermenizi sağlar. Ayrıntılar için [Özel eylem olayı](../triggers/custom-action.md) bölümüne bakabilirsiniz.