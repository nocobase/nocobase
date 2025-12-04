:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


**Tip**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detaylar**

- `filter`: Silinecek kayıtlar için filtre koşullarını belirtir. Filter'ın detaylı kullanımı için [`find()`](#find) metoduna başvurabilirsiniz.
- `filterByTk`: TargetKey'e göre silinecek kayıtlar için filtre koşullarını belirtir.
- `truncate`: Koleksiyon verilerini boşaltıp boşaltmayacağını belirtir. Bu, yalnızca `filter` veya `filterByTk` parametreleri sağlanmadığında geçerlidir.
- `transaction`: İşlem nesnesi. Eğer bir işlem parametresi geçirilmezse, metot otomatik olarak dahili bir işlem oluşturur.