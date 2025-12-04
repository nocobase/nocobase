:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowModel Oluşturma

## Kök Düğüm Olarak

### Bir FlowModel Örneği Oluşturma

Yerel bir örnek oluşturun:

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel'i Kaydetme

Oluşturduğunuz bir örneği kalıcı hale getirmek istediğinizde, `save` metodunu kullanarak kaydedebilirsiniz.

```ts
await model.save();
```

### FlowModel'i Uzaktan Yükleme

Kaydedilmiş bir modeli `loadModel` metodunu kullanarak yükleyebilirsiniz. Bu metot, tüm model ağacını (alt düğümler dahil) yükleyecektir:

```ts
await engine.loadModel(uid);
```

### FlowModel'i Yükleme veya Oluşturma

Eğer model mevcutsa yüklenir; aksi takdirde oluşturulur ve kaydedilir.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel'i İşleme

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Alt Düğüm Olarak

Bir model içinde birden fazla alt bileşenin veya modülün özelliklerini ve davranışlarını yönetmeniz gerektiğinde, örneğin iç içe yerleşimler veya koşullu render gibi senaryolarda SubModel kullanmanız gerekir.

### SubModel Oluşturma

`<AddSubModelButton />` kullanmanız önerilir.

Bu, alt modellerin eklenmesi, bağlanması ve depolanması gibi sorunları otomatik olarak halledebilir. Detaylar için [AddSubModelButton Kullanım Talimatları](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model) bölümüne bakınız.

### SubModel'i İşleme

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## ForkModel Olarak

Fork, genellikle aynı model şablonunun birden fazla yerde (ancak bağımsız durumlarla) işlenmesi gereken senaryolarda kullanılır, örneğin bir tablodaki her bir satır gibi.

### ForkModel Oluşturma

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### ForkModel'i İşleme

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```