:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


**Tip**

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**Detaylar**

- `values`: Oluşturulacak kayda ait veri nesnesidir.
- `whitelist`: Oluşturulacak kaydın veri nesnesinde hangi alanlara **yazılabileceğini** belirler. Bu parametre belirtilmezse, varsayılan olarak tüm alanlara yazmaya izin verilir.
- `blacklist`: Oluşturulacak kaydın veri nesnesinde hangi alanlara **yazılamayacağını** belirler. Bu parametre belirtilmezse, varsayılan olarak tüm alanlara yazmaya izin verilir.
- `transaction`: İşlem nesnesidir. Eğer bir işlem parametresi geçmezseniz, bu metot otomatik olarak dahili bir işlem oluşturur.