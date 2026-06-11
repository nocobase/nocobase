---
title: "UI Schema"
description: "Referensi sintaks UI Schema NocoBase: protokol deskripsi Component berbasis Formily Schema, penjelasan property type, x-component, x-decorator, x-pattern, dll."
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema adalah protokol yang digunakan NocoBase untuk mendeskripsikan Component front-end, berbasis [Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema), dengan gaya mirip JSON Schema. Di FlowEngine, field `uiSchema` di `registerFlow` menggunakan sintaks ini untuk mendefinisikan UI panel konfigurasi.

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // Component wrapper
  ['x-decorator']?: string;
  // Property Component wrapper
  ['x-decorator-props']?: any;
  // Component
  ['x-component']?: string;
  // Property Component
  ['x-component-props']?: any;
  // Status tampilan, default 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // Child node Component
  ['x-content']?: any;
  // schema children node
  properties?: Record<string, ISchema>;

  // Berikut hanya digunakan saat Component field

  // Field linkage
  ['x-reactions']?: SchemaReactions;
  // Mode interaksi UI field, default 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readPretty';
  // Validasi field
  ['x-validator']?: Validator;
  // Data default
  default?: any;
}
```

## Penggunaan Dasar

### Component Paling Sederhana

Semua tag HTML native dapat dikonversi menjadi penulisan schema:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

Setara dengan JSX:

```tsx
<h1>Hello, world!</h1>
```

### Sub Component

Component children ditulis di `properties`:

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
    },
  },
}
```

Setara dengan JSX:

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## Penjelasan Property

### type

Tipe node:

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

Nama schema. Nama child node adalah key dari `properties`:

```ts
{
  name: 'root',
  properties: {
    child1: {
      // Tidak perlu menulis name di sini lagi
    },
  },
}
```

### title

Judul node, biasanya digunakan untuk label field form.

### x-component

Nama Component. Dapat berupa tag HTML native, atau Component React yang sudah didaftarkan:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

Property Component:

```ts
{
  type: 'void',
  'x-component': 'Table',
  'x-component-props': {
    loading: true,
  },
}
```

### x-decorator

Component wrapper. Kombinasi `x-decorator` + `x-component` dapat menempatkan dua Component dalam satu node schema — mengurangi kompleksitas struktur, meningkatkan reusabilitas.

Misalnya dalam skenario form, `FormItem` adalah decorator:

```ts
{
  type: 'void',
  'x-component': 'div',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    content: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
}
```

Setara dengan JSX:

```tsx
<div>
  <FormItem>
    <Input name={'title'} />
  </FormItem>
  <FormItem>
    <Input.TextArea name={'content'} />
  </FormItem>
</div>
```

### x-display

Status tampilan Component:

| Nilai | Penjelasan |
|----|------|
| `'visible'` | Tampilkan Component (default) |
| `'hidden'` | Sembunyikan Component, tetapi data tidak disembunyikan |
| `'none'` | Sembunyikan Component, data juga disembunyikan |

### x-pattern

Mode interaksi Component field:

| Nilai | Penjelasan |
|----|------|
| `'editable'` | Dapat diedit (default) |
| `'disabled'` | Tidak dapat diedit |
| `'readPretty'` | Mode baca yang ramah — misalnya Component teks satu baris di mode editable adalah `<input />`, di mode read pretty adalah `<div />` |

## Penggunaan dalam registerFlow

Dalam pengembangan plugin, uiSchema terutama digunakan dalam panel konfigurasi `registerFlow`. Setiap field biasanya dibungkus dengan `'x-decorator': 'FormItem'`:

```ts
MyModel.registerFlow({
  key: 'flow1',
  on: 'beforeRender',
  steps: {
    editTitle: {
      title: 'Edit Judul',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Judul',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        showBorder: {
          type: 'boolean',
          title: 'Tampilkan Border',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        color: {
          type: 'string',
          title: 'Warna',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: 'Merah', value: 'red' },
            { label: 'Biru', value: 'blue' },
            { label: 'Hijau', value: 'green' },
          ],
        },
      },
      handler(ctx, params) {
        ctx.model.props.title = params.title;
        ctx.model.props.showBorder = params.showBorder;
        ctx.model.props.color = params.color;
      },
    },
  },
});
```

:::tip Tips

v2 kompatibel dengan sintaks uiSchema, namun skenario penggunaan terbatas — terutama digunakan untuk mendeskripsikan UI form di panel konfigurasi Flow. Sebagian besar rendering Component runtime direkomendasikan menggunakan [Component Antd](https://5x.ant.design/components/overview) langsung.

:::

## Cheatsheet Component Umum

| Component | x-component | type | Penjelasan |
|------|-------------|------|------|
| Teks Satu Baris | `Input` | `string` | Input teks dasar |
| Teks Multi Baris | `Input.TextArea` | `string` | Text area multi baris |
| Angka | `InputNumber` | `number` | Input angka |
| Switch | `Switch` | `boolean` | Switch boolean |
| Dropdown Select | `Select` | `string` | Perlu dipasangkan dengan `enum` untuk menyediakan opsi |
| Radio | `Radio.Group` | `string` | Perlu dipasangkan dengan `enum` untuk menyediakan opsi |
| Checkbox | `Checkbox.Group` | `string` | Perlu dipasangkan dengan `enum` untuk menyediakan opsi |
| Tanggal | `DatePicker` | `string` | Date picker |

## Tautan Terkait

- [Ikhtisar FlowEngine (Plugin Development)](../plugin-development/client/flow-engine/index.md) — Penggunaan praktis uiSchema dalam registerFlow
- [Definisi FlowDefinition](./definitions/flow-definition.md) — Penjelasan parameter lengkap registerFlow
- [Dokumentasi Formily Schema](https://react.formilyjs.org/api/shared/schema) — Protokol Formily yang menjadi dasar uiSchema
