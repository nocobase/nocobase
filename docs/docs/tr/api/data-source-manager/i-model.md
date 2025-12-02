:::tip AI Çeviri Uyarısı
Bu dokümantasyon yapay zeka tarafından otomatik olarak çevrilmiştir.
:::


# IModel

`IModel` arayüzü, bir model nesnesinin temel özelliklerini ve metotlarını tanımlar.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Model nesnesini JSON formatına dönüştürür.