:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Persistensi FlowModel

FlowEngine menyediakan sistem persistensi yang lengkap.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` adalah antarmuka persistensi model untuk FlowEngine, yang mendefinisikan operasi seperti memuat, menyimpan, dan menghapus model dari jarak jauh. Dengan mengimplementasikan antarmuka ini, data model dapat dipersistensikan ke basis data backend, API, atau media penyimpanan lainnya, memungkinkan sinkronisasi data antara frontend dan backend.

### Metode Utama

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Memuat data model dari sumber jarak jauh berdasarkan pengidentifikasi unik `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Menyimpan data model ke penyimpanan jarak jauh.

- **destroy(uid: string): Promise<boolean\>**  
  Menghapus model dari penyimpanan jarak jauh berdasarkan `uid`.

### Contoh FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementasi: Dapatkan model berdasarkan uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementasi: Simpan model
    return model;
  }

  async destroy(uid: string) {
    // Implementasi: Hapus model berdasarkan uid
    return true;
  }
}
```

### Mengatur FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Metode Manajemen Model yang Disediakan oleh FlowEngine

### Metode Lokal

```ts
flowEngine.createModel(options); // Membuat instans model lokal
flowEngine.getModel(uid);        // Mendapatkan instans model lokal
flowEngine.removeModel(uid);     // Menghapus instans model lokal
```

### Metode Jarak Jauh (Diimplementasikan oleh ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Memuat model dari jarak jauh
await flowEngine.saveModel(model);   // Menyimpan model ke jarak jauh
await flowEngine.destroyModel(uid);  // Menghapus model dari jarak jauh
```

## Metode Instans Model

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Menyimpan ke jarak jauh
await model.destroy();  // Menghapus dari jarak jauh
```