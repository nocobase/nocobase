:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
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