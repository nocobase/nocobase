---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# API Dokümantasyonu

## Giriş

Bu eklenti, NocoBase HTTP API dokümantasyonunu Swagger tabanlı olarak oluşturur.

## Kurulum

Bu, yerleşik bir eklentidir, kurulum gerektirmez. Kullanmak için etkinleştirmeniz yeterlidir.

## Kullanım Talimatları

### API Dokümantasyon Sayfasına Erişim

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Dokümantasyona Genel Bakış

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Toplam API Dokümantasyonu: `/api/swagger:get`
- Çekirdek API Dokümantasyonu: `/api/swagger:get?ns=core`
- Tüm eklentilerin API Dokümantasyonu: `/api/swagger:get?ns=plugins`
- Her bir eklentinin Dokümantasyonu: `/api/swagger:get?ns=plugins/{name}`
- Özel koleksiyonlar için API dokümantasyonu: `/api/swagger:get?ns=collections`
- Belirli `${collection}` ve ilgili `${collection}.${association}` kaynakları: `/api/swagger:get?ns=collections/{name}`

## Geliştirici Kılavuzu

### Eklentiler için Swagger Dokümantasyonu Nasıl Yazılır?

Eklentinin `src` klasörüne aşağıdaki içeriğe sahip bir `swagger/index.ts` dosyası ekleyin:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

Detaylı yazım kuralları için lütfen [Swagger Resmi Dokümantasyonu](https://swagger.io/docs/specification/about/)na başvurun.