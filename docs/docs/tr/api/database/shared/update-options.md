:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


## Tip

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## Detaylar

- `values`: Güncellenecek kaydın veri nesnesi.
- `filter`: Güncellenecek kayıtlar için filtreleme koşullarını belirtir. `Filter`'ın detaylı kullanımı için [`find()`](#find) metoduna bakabilirsiniz.
- `filterByTk`: Güncellenecek kayıtlar için `TargetKey`'e göre filtreleme koşullarını belirtir.
- `whitelist`: `values` alanları için bir beyaz liste. Yalnızca bu listedeki alanlar yazılacaktır.
- `blacklist`: `values` alanları için bir kara liste. Bu listedeki alanlar yazılmayacaktır.
- `transaction`: İşlem (transaction) nesnesi. Eğer bir işlem parametresi geçirilmezse, metot otomatik olarak dahili bir işlem oluşturacaktır.

`filterByTk` veya `filter` parametrelerinden en az biri mutlaka geçirilmelidir.