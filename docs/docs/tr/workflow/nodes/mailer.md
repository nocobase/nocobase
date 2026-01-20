---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# E-posta Gönderme

## Giriş

E-posta gönderme işlevi sunar. Metin ve HTML formatındaki e-posta içeriklerini destekler.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak "E-posta Gönderme" düğümünü ekleyin:

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Düğüm Yapılandırması

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Her bir seçenek, iş akışı bağlamındaki değişkenleri kullanmanıza olanak tanır. Hassas bilgiler için genel değişkenleri ve sırları da kullanabilirsiniz.

## Sıkça Sorulan Sorular

### Gmail Gönderim Sıklığı Sınırı

Bazı e-postaları gönderirken aşağıdaki hatayla karşılaşabilirsiniz:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Bu durum, Gmail'in belirtilmemiş gönderim alan adlarından gelen istekleri sıklıkla sınırlamasından kaynaklanmaktadır. Uygulamayı dağıtırken, sunucunun ana bilgisayar adını Gmail'de yapılandırdığınız gönderim alan adıyla eşleşecek şekilde ayarlamanız gerekir. Örneğin, bir Docker dağıtımında:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Yapılandırdığınız gönderim alan adınıza ayarlayın
```

Kaynak: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)