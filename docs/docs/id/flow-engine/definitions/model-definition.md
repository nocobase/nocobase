---
title: "ModelDefinition Definisi Tipe"
description: "ModelDefinition mendefinisikan opsi pembuatan FlowModel CreateModelOptions: uid, use, props, flowRegistry, subModels, dll., penggunaan createModel."
keywords: "ModelDefinition,CreateModelOptions,createModel,flowRegistry,subModels,pembuatan FlowModel,FlowEngine,NocoBase"
---

# ModelDefinition

ModelDefinition mendefinisikan opsi pembuatan flow model, digunakan untuk membuat instance model melalui method `FlowEngine.createModelAsync()`. Berisi konfigurasi dasar, property, sub model, dll.

## Definisi Tipe

```ts
interface CreateModelOptions {
  uid?: string;
  use: RegisteredModelClassName | ModelConstructor;
  props?: IModelComponentProps;
  flowRegistry?: Record<string, Omit<FlowDefinitionOptions, 'key'>>;
  stepParams?: StepParams;
  subModels?: Record<string, CreateSubModelOptions[]>;
  parentId?: string;
  subKey?: string;
  subType?: 'array' | 'single';
  sortIndex?: number;
  flowRegistry?: Record<string, Omit<FlowDefinitionOptions, 'key'>>;
}
```

## Cara Penggunaan

```ts
const engine = new FlowEngine();

// Membuat instance model
const model = await engine.createModelAsync({
  uid: 'unique-model-id',
  use: 'MyModel',
  props: {
    title: 'My Model',
    description: 'A sample model'
  },
  stepParams: {
    step1: { param1: 'value1' }
  },
  subModels: {
    childModels: [
      {
        use: 'ChildModel',
        props: { name: 'Child 1' }
      }
    ]
  }
});
```

## Penjelasan Property

### uid

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Identifier unik instance model

Jika tidak disediakan, sistem akan otomatis menggenerate UID unik.

### use

**Tipe**: `RegisteredModelClassName | ModelConstructor`  
**Wajib**: Ya  
**Deskripsi**: Class model yang akan digunakan

Dapat berupa string nama class model yang sudah didaftarkan, atau constructor class model.

### props

**Tipe**: `IModelComponentProps`  
**Wajib**: Tidak  
**Deskripsi**: Konfigurasi property model, objek property yang dilewatkan ke constructor model.

### stepParams

**Tipe**: `StepParams`  
**Wajib**: Tidak  
**Deskripsi**: Konfigurasi parameter step, mengatur parameter untuk setiap step di flow.

### subModels

**Tipe**: `Record<string, CreateSubModelOptions[]>`  
**Wajib**: Tidak  
**Deskripsi**: Konfigurasi sub model, mendefinisikan sub model dari model, mendukung array dan sub model tunggal.

### parentId

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: UID parent model, digunakan untuk membangun hubungan parent-child antar model.

### subKey

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Nama key sub model di parent model, digunakan untuk mengidentifikasi posisi sub model di parent model.

### subType

**Tipe**: `'array' | 'single'`  
**Wajib**: Tidak  
**Deskripsi**: Tipe sub model

- `'array'`: Sub model tipe array, dapat berisi beberapa instance
- `'single'`: Sub model tunggal, hanya dapat berisi satu instance

### sortIndex

**Tipe**: `number`  
**Wajib**: Tidak  
**Deskripsi**: Index sorting, digunakan untuk mengontrol urutan tampilan model di list.

### flowRegistry

**Tipe**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Wajib**: Tidak  
**Deskripsi**: Registry flow, mendaftarkan definisi flow tertentu untuk instance model.
