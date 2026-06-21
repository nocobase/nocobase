---
title: "Membuat FlowModel"
description: "Membuat FlowModel: langkah-langkah seperti define, registerFlow, renderComponent, menulis komponen yang dapat diorkestrasi dari nol, pengantar pengembangan FlowEngine."
keywords: "Membuat FlowModel,define,registerFlow,renderComponent,Komponen yang dapat diorkestrasi,Pengembangan FlowEngine,NocoBase"
---

# Membuat FlowModel

## Sebagai Root Node

### Membangun Instance FlowModel

Membangun sebuah instance secara lokal

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Menyimpan FlowModel

Jika instance yang dibangun perlu di-persisten, dapat disimpan melalui metode save.

```ts
await model.save();
```

### Memuat FlowModel dari Repository Remote

Model yang sudah disimpan dapat dimuat melalui loadModel. Metode ini akan memuat seluruh model tree (termasuk node anak):

```ts
await engine.loadModel(uid);
```

### Memuat atau Membuat FlowModel

Jika model ada, akan dimuat; jika tidak ada, akan dibuat dan disimpan.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Render FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Sebagai Sub Node

Saat Anda perlu mengelola properti dan perilaku beberapa sub-komponen atau modul di dalam sebuah model, Anda perlu menggunakan SubModel, misalnya skenario nested layout, conditional rendering, dan sebagainya.

### Membuat SubModel

Direkomendasikan menggunakan `<AddSubModelButton />`

Dapat secara otomatis menangani masalah penambahan, binding, dan penyimpanan sub Model. Detail lihat [Petunjuk Penggunaan AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Render SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Sebagai ForkModel

Fork biasanya digunakan untuk skenario di mana template model yang sama perlu dirender di banyak posisi (tetapi dengan state yang independen), misalnya setiap baris di tabel.

### Membuat ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Render ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```
