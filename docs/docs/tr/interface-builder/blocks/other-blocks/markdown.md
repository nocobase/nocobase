:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Markdown Bloğu

## Giriş

Markdown bloğunu bir veri kaynağına bağlamanıza gerek yoktur. Metin içeriğini Markdown sözdizimi kullanarak tanımlayabilir ve biçimlendirilmiş metinleri görüntülemek için kullanabilirsiniz.

## Blok Ekleme

Bir sayfaya veya açılır pencereye Markdown bloğu ekleyebilirsiniz.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Ayrıca Form ve Detay bloklarının içine satır içi (inline-block) Markdown blokları da ekleyebilirsiniz.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Şablon Motoru

**[Liquid şablon motorunu](https://liquidjs.com/tags/overview.html)** kullanarak güçlü ve esnek şablon oluşturma yetenekleri elde edersiniz. Bu sayede içerikler dinamik olarak üretilebilir ve özelleştirilmiş bir şekilde görüntülenebilir. Şablon motoru ile şunları yapabilirsiniz:

- **Dinamik Değişken Ekleme (Interpolation)**: Şablonda değişkenlere referans vermek için yer tutucular kullanabilirsiniz. Örneğin, `{{ ctx.user.userName }}` otomatik olarak ilgili kullanıcı adıyla değiştirilir.
- **Koşullu Oluşturma (Conditional Rendering)**: Farklı veri durumlarına göre farklı içerik göstermek için koşullu ifadeleri (`{% if %}...{% else %}`) destekler.
- **Döngü Kullanımı**: Diziler veya koleksiyonlar üzerinde yineleme yapmak ve listeler, tablolar veya tekrarlayan modüller oluşturmak için `{% for item in list %}...{% endfor %}` yapısını kullanabilirsiniz.
- **Yerleşik Filtreler**: Verileri biçimlendirmek ve işlemek için zengin bir filtre seti (örneğin `upcase`, `downcase`, `date`, `truncate` vb.) sunar.
- **Genişletilebilirlik**: Şablon mantığını yeniden kullanılabilir ve sürdürülebilir hale getiren özel değişkenleri ve fonksiyonları destekler.
- **Güvenlik ve İzolasyon**: Şablon oluşturma, tehlikeli kodların doğrudan çalışmasını önlemek ve güvenliği artırmak için bir sanal ortamda (sandbox) yürütülür.

Liquid şablon motoru sayesinde geliştiriciler ve içerik oluşturucular, **dinamik içerik gösterimi, kişiselleştirilmiş belge oluşturma ve karmaşık veri yapıları için şablon oluşturmayı kolayca gerçekleştirebilir**, bu da verimliliği ve esnekliği önemli ölçüde artırır.

## Değişken Kullanımı

Bir sayfadaki Markdown, genel sistem değişkenlerini (örneğin, mevcut kullanıcı, mevcut rol vb.) destekler.

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Blok satırı işlem açılır penceresindeki (veya alt sayfasındaki) Markdown ise, daha fazla veri bağlamı değişkenini (örneğin, mevcut kayıt, mevcut açılır pencere kaydı vb.) destekler.

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

<!-- ## Yerelleştirme

Yerleşik `t` filtresi, metinlerin yerelleştirilmiş çevirilerini destekler.

> Not: Metinlerin önceden yerelleştirme tablosuna girilmesi gerekmektedir. Gelecekte, özel yerelleştirme terimlerinin oluşturulmasını destekleyecek şekilde optimize edilecektir.

![20251026223542](https://static-docs.nocobase.com/20251026223542.png) -->

## QR Kodu

Markdown içinde QR kodları yapılandırabilirsiniz.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```