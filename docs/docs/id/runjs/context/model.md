---
title: "ctx.model"
description: "ctx.model adalah instance FlowModel dalam konteks eksekusi RunJS saat ini, entry default untuk JSBlock/JSField/JSAction, BlockModel, ActionModel, JSEditableFieldModel."
keywords: "ctx.model,FlowModel,BlockModel,ActionModel,JSBlock,JSField,JSAction,RunJS,NocoBase"
---

# ctx.model

Instance `FlowModel` dalam konteks eksekusi RunJS saat ini, adalah entry default untuk skenario seperti JSBlock, JSField, JSAction. Tipe spesifik berubah sesuai konteks: dapat berupa subclass seperti `BlockModel`, `ActionModel`, `JSEditableFieldModel`, dll.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock** | `ctx.model` adalah model block saat ini, dapat mengakses `resource`, `collection`, `setProps`, dll. |
| **JSField / JSItem / JSColumn** | `ctx.model` adalah field model, dapat mengakses `setProps`, `dispatchEvent`, dll. |
| **Action Event / ActionModel** | `ctx.model` adalah action model, dapat membaca/menulis parameter step, mendispatch event, dll. |

> Tips: Jika perlu mengakses **parent block yang menampung JS saat ini** (seperti form/table block), gunakan `ctx.blockModel`; jika perlu mengakses **model lain**, gunakan `ctx.getModel(uid)`.

## Definisi Tipe

```ts
model: FlowModel;
```

`FlowModel` adalah base class, pada runtime sebenarnya adalah berbagai subclass (seperti `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, dll.), properti dan method yang tersedia berbeda berdasarkan tipe.

## Properti Umum

| Properti | Tipe | Deskripsi |
|------|------|------|
| `uid` | `string` | Identifier unik model, dapat digunakan untuk `ctx.getModel(uid)` atau binding UID popup |
| `collection` | `Collection` | Data table yang terikat model saat ini (ada saat block/field terikat data) |
| `resource` | `Resource` | Instance resource terkait, untuk refresh, mendapatkan baris terpilih, dll. |
| `props` | `object` | Konfigurasi UI/perilaku model, dapat diupdate dengan `setProps` |
| `subModels` | `Record<string, FlowModel>` | Koleksi sub-model (seperti field di dalam form, kolom di dalam tabel) |
| `parent` | `FlowModel` | Parent model (jika ada) |

## Method Umum

| Method | Deskripsi |
|------|------|
| `setProps(partialProps: any): void` | Update konfigurasi model, memicu re-render (seperti `ctx.model.setProps({ loading: true })`) |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Dispatch event ke model, memicu flow yang dikonfigurasi di model tersebut yang memantau nama event itu. Opsional `payload` dikirim ke handler flow; `options.debounce` dapat mengaktifkan debounce |
| `getStepParams?.(flowKey, stepKey)` | Membaca parameter step dari configuration flow (skenario panel pengaturan, action kustom, dll.) |
| `setStepParams?.(flowKey, stepKey, params)` | Menulis parameter step configuration flow |

## Hubungan dengan ctx.blockModel, ctx.getModel

| Kebutuhan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Model dalam konteks eksekusi saat ini** | `ctx.model` |
| **Parent block tempat JS saat ini berada** | `ctx.blockModel`, sering digunakan untuk mengakses `resource`, `form`, `collection` |
| **Mendapatkan model apa pun berdasarkan uid** | `ctx.getModel(uid)` atau `ctx.getModel(uid, true)` (mencari lintas view stack) |

Pada JSField, `ctx.model` adalah field model, `ctx.blockModel` adalah form/table block yang menampung field tersebut.

## Contoh

### Update Status Block/Action

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Dispatch Event Model

```ts
// Dispatch event, memicu flow yang dikonfigurasi di model tersebut yang memantau nama event itu
await ctx.model.dispatchEvent('remove');
// Saat dengan payload, akan dikirim ke ctx.inputArgs handler flow
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Menggunakan uid untuk Mengikat Popup atau Akses Lintas Model

```ts
const myUid = ctx.model.uid;
// Pada konfigurasi popup dapat meneruskan openerUid: myUid, untuk asosiasi
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Terkait

- [ctx.blockModel](./block-model.md): Model parent block tempat JS saat ini berada
- [ctx.getModel()](./get-model.md): Mendapatkan model lain berdasarkan uid
