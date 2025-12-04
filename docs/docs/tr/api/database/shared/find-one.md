:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


**Tip**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parametreler**

Parametrelerin çoğu `find()` ile aynıdır. Ancak `findOne()` yalnızca tek bir kayıt döndürdüğü için `limit` parametresine gerek yoktur ve sorgu sırasında bu değer her zaman `1` olarak kabul edilir.