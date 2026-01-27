:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowModel Kalıcılığı

FlowEngine eksiksiz bir kalıcılık sistemi sunar.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository`, FlowEngine için bir model kalıcılık arayüzüdür. Modellerin uzaktan yüklenmesi, kaydedilmesi ve silinmesi gibi işlemleri tanımlar. Bu arayüzü uygulayarak, model verilerini bir arka uç veritabanına, API'ye veya başka bir depolama ortamına kalıcı hale getirebilir, böylece ön uç ve arka uç arasında veri senkronizasyonunu sağlayabilirsiniz.

### Ana Metotlar

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Benzersiz tanımlayıcı `uid`'ye göre model verilerini uzaktan yükler.

- **save(model: FlowModel): Promise<any\>**  
  Model verilerini uzaktan depolamaya kaydeder.

- **destroy(uid: string): Promise<boolean\>**  
  `uid`'ye göre modeli uzaktan depolamadan siler.

### FlowModelRepository Örneği

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Uygulama: uid'ye göre modeli alın
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Uygulama: Modeli kaydedin
    return model;
  }

  async destroy(uid: string) {
    // Uygulama: uid'ye göre modeli silin
    return true;
  }
}
```

### FlowModelRepository'yi Ayarlama

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## FlowEngine Tarafından Sağlanan Model Yönetimi Metotları

### Yerel Metotlar

```ts
flowEngine.createModel(options); // Yerel bir model örneği oluşturun
flowEngine.getModel(uid);        // Yerel bir model örneği alın
flowEngine.removeModel(uid);     // Yerel bir model örneğini kaldırın
```

### Uzaktan Metotlar (ModelRepository Tarafından Uygulanır)

```ts
await flowEngine.loadModel(uid);     // Modeli uzaktan yükleyin
await flowEngine.saveModel(model);   // Modeli uzaktan kaydedin
await flowEngine.destroyModel(uid);  // Modeli uzaktan silin
```

## model Örnek Metotları

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Uzaktan kaydedin
await model.destroy();  // Uzaktan silin
```