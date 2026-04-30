---
title: "Mekanisme Reaktif FlowEngine Observable"
description: "Mekanisme reaktif Observable: perubahan properti FlowEngine dan update view, memahami prinsip reaktif dan data binding FlowModel."
keywords: "Observable,Reaktif,Perubahan properti,Update view,FlowModel reaktif,FlowEngine,NocoBase"
---

# Mekanisme Reaktif: Observable

:::info
Mekanisme reaktif Observable pada NocoBase secara prinsip mirip dengan [MobX](https://mobx.js.org/README.html). Implementasi underlying saat ini menggunakan [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), yang memiliki sintaks dan ide yang sangat kompatibel dengan [MobX](https://mobx.js.org/README.html), hanya saja karena alasan historis tidak menggunakan [MobX](https://mobx.js.org/README.html) secara langsung.
:::

Pada NocoBase 2.0, objek reaktif `Observable` ada di mana-mana. Ini adalah inti dari aliran data underlying dan respons UI, yang banyak digunakan di FlowContext, FlowModel, FlowStep, dan komponen lainnya.

## Mengapa memilih Observable?

Alasan NocoBase memilih Observable, bukan solusi state management seperti Redux, Recoil, Zustand, Jotai, dan sebagainya, antara lain:

- **Sangat fleksibel**: Observable dapat membuat objek apa pun, array, Map, Set, dan sebagainya menjadi reaktif, secara alami mendukung deep nesting dan struktur dinamis, sangat cocok untuk model bisnis yang kompleks.
- **Zero intrusion**: Anda dapat langsung memanipulasi objek aslinya, tanpa perlu mendefinisikan action, reducer, atau store tambahan, pengalaman pengembangan sangat baik.
- **Pengumpulan dependency otomatis**: Cukup bungkus komponen dengan `observer`, komponen akan secara otomatis melacak properti Observable yang digunakan, dan secara otomatis me-refresh UI saat data berubah, tanpa perlu mengelola dependency secara manual.
- **Cocok untuk skenario non-React**: Mekanisme reaktif Observable tidak hanya berlaku untuk React, tetapi juga dapat dikombinasikan dengan framework lain, memenuhi kebutuhan data reaktif yang lebih luas.

## Mengapa harus menggunakan observer?

`observer` akan mendengarkan perubahan objek Observable, dan secara otomatis memicu update komponen React saat data berubah. Dengan demikian, UI Anda dapat tetap sinkron dengan data, tanpa perlu memanggil `setState` atau metode update lainnya secara manual.

## Penggunaan Dasar

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

Untuk mengetahui lebih banyak penggunaan reaktif, Anda dapat merujuk ke dokumentasi [@formily/reactive](https://reactive.formilyjs.org/).
