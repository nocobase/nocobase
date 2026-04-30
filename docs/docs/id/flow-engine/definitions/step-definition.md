---
title: "StepDefinition Definisi Step"
description: "StepDefinition mendefinisikan step tunggal di flow, setiap step dapat berupa action, penanganan event, atau operasi lainnya, adalah unit eksekusi dasar Flow."
keywords: "StepDefinition,definisi step,step Flow,unit eksekusi Flow,FlowEngine,NocoBase"
---

# StepDefinition

StepDefinition mendefinisikan step tunggal di flow, setiap step dapat berupa action, penanganan event, atau operasi lainnya. Step adalah unit eksekusi dasar dari flow.

## Definisi Tipe

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## Cara Penggunaan

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Logika pemrosesan kustom
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Penjelasan Property

### key

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Identifier unik step di flow. Jika tidak disediakan, akan menggunakan nama key step di objek `steps`.

### use

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Nama ActionDefinition yang sudah didaftarkan yang akan digunakan. Melalui property `use` dapat merujuk action yang sudah didaftarkan, menghindari definisi berulang.

### title

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Judul tampilan step, untuk presentasi UI dan debugging.

### sort

**Tipe**: `number`  
**Wajib**: Tidak  
**Deskripsi**: Urutan eksekusi step, semakin kecil semakin dieksekusi terlebih dahulu. Digunakan untuk mengontrol urutan eksekusi beberapa step di flow yang sama.

### handler

**Tipe**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Wajib**: Tidak  
**Deskripsi**: Function handler step. Saat tidak menggunakan property `use`, dapat langsung mendefinisikan function handler.

### defaultParams

**Tipe**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Wajib**: Tidak  
**Deskripsi**: Parameter default step, mengisi nilai default untuk parameter sebelum step dieksekusi.

### uiSchema

**Tipe**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Wajib**: Tidak  
**Deskripsi**: Pola konfigurasi UI step, mendefinisikan cara tampilan step di antarmuka dan konfigurasi form.

### beforeParamsSave

**Tipe**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wajib**: Tidak  
**Deskripsi**: Function hook sebelum penyimpanan parameter, dieksekusi sebelum parameter step disimpan, dapat digunakan untuk validasi atau konversi parameter.

### afterParamsSave

**Tipe**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wajib**: Tidak  
**Deskripsi**: Function hook setelah penyimpanan parameter, dieksekusi setelah parameter step disimpan, dapat digunakan untuk memicu operasi lain.

### uiMode

**Tipe**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Wajib**: Tidak  
**Deskripsi**: Mode tampilan UI step. Mode yang didukung: `'dialog'`, `'drawer'`, `'embed'`, atau objek konfigurasi kustom.

### preset

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Deskripsi**: Apakah step preset

Parameter step dengan `preset: true` perlu diisi saat pembuatan, yang tidak ditandai dapat diisi setelah pembuatan model.

### paramsRequired

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Deskripsi**: Apakah parameter step wajib

Jika `true`, modal konfigurasi akan dibuka sebelum menambahkan model.

### hideInSettings

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Deskripsi**: Apakah menyembunyikan step di menu pengaturan.

### isAwait

**Tipe**: `boolean`  
**Wajib**: Tidak  
**Default**: `true`  
**Deskripsi**: Apakah menunggu function handler selesai.
