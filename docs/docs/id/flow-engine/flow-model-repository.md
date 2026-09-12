---
title: "Persistensi dan Repository FlowModel"
description: "Persistensi FlowModel dan pola Repository: loading data, save, interaksi dengan data source, mendukung operasi CRUD, manajemen data FlowEngine."
keywords: "Persistensi FlowModel,Repository,Loading data,CRUD,Interaksi data source,FlowEngine,NocoBase"
---

# Persistensi FlowModel

FlowEngine menyediakan sistem persistensi yang lengkap

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` adalah interface persistensi model FlowEngine, yang mendefinisikan operasi loading remote, save, dan delete dari model. Dengan mengimplementasikan interface ini, data model dapat di-persisten ke database backend, API, atau media penyimpanan lainnya, sehingga mewujudkan sinkronisasi data frontend dan backend.

### Metode Utama

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Memuat data model dari remote berdasarkan identifier unik uid.

- **save(model: FlowModel): Promise<any\>**  
  Menyimpan data model ke storage remote.

- **destroy(uid: string): Promise<boolean\>**  
  Menghapus model dari storage remote berdasarkan uid.

### Contoh FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementasi: mendapatkan model berdasarkan uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementasi: menyimpan model
    return model;
  }

  async destroy(uid: string) {
    // Implementasi: menghapus model berdasarkan uid
    return true;
  }
}
```

### Mengatur FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Metode Manajemen Model yang Disediakan FlowEngine

### Metode Lokal

```ts
await flowEngine.createModelAsync(options); // Membuat instance model lokal
flowEngine.getModel(uid);        // Mendapatkan instance model lokal
flowEngine.removeModel(uid);     // Menghapus instance model lokal
```

### Metode Remote (Diimplementasikan oleh ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Memuat model dari remote
await flowEngine.saveModel(model);   // Menyimpan model ke remote
await flowEngine.destroyModel(uid);  // Menghapus model dari remote
```

## Metode Instance model

```ts
const model = await this.flowEngine.createModelAsync({
  use: 'FlowModel',
});
await model.save();     // Save ke remote
await model.destroy();  // Delete dari remote
```
