:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Membuat FlowModel

## Sebagai Node Akar

### Membangun Instans FlowModel

Bangun sebuah instans secara lokal.

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Menyimpan FlowModel

Jika sebuah instans yang telah dibangun perlu dipertahankan (persisted), Anda dapat menyimpannya menggunakan metode `save`.

```ts
await model.save();
```

### Memuat FlowModel dari Repositori Jarak Jauh

Model yang sudah disimpan dapat dimuat menggunakan `loadModel`. Metode ini akan memuat seluruh pohon model (termasuk node anak):

```ts
await engine.loadModel(uid);
```

### Memuat atau Membuat FlowModel

Jika model sudah ada, model akan dimuat; jika tidak, model akan dibuat dan disimpan.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Merender FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Sebagai Node Anak

Ketika Anda perlu mengelola properti dan perilaku beberapa sub-komponen atau modul di dalam sebuah model, Anda perlu menggunakan SubModel. Contohnya adalah dalam skenario seperti tata letak bersarang (nested layouts), rendering kondisional, dan lain-lain.

### Membuat SubModel

Disarankan untuk menggunakan `<AddSubModelButton />`

Ini dapat secara otomatis menangani masalah seperti penambahan, pengikatan (binding), dan penyimpanan Model anak. Untuk detail lebih lanjut, lihat [Petunjuk Penggunaan AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Merender SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Sebagai ForkModel

Fork biasanya digunakan dalam skenario di mana template model yang sama perlu dirender di beberapa lokasi (tetapi dengan status independen), misalnya setiap baris dalam sebuah tabel.

### Membuat ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Merender ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```