:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mekanisme Reaktivitas: Observable

:::info
Mekanisme reaktivitas Observable di NocoBase pada dasarnya mirip dengan [MobX](https://mobx.js.org/README.html). Implementasi dasarnya saat ini menggunakan [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), dengan sintaks dan konsep yang sangat kompatibel dengan [MobX](https://mobx.js.org/README.html). Penggunaan [@formily/reactive] ini hanya karena alasan historis, bukan karena tidak langsung menggunakan [MobX].
:::

Di NocoBase 2.0, objek reaktif `Observable` ada di mana-mana. Ini adalah inti dari aliran data dasar dan responsivitas UI, serta banyak digunakan dalam komponen seperti FlowContext, FlowModel, dan FlowStep.

## Mengapa Memilih Observable?

NocoBase memilih Observable dibandingkan solusi manajemen status lain seperti Redux, Recoil, Zustand, dan Jotai, dengan alasan utama sebagai berikut:

- **Sangat Fleksibel**: Observable dapat membuat objek, array, Map, Set, dan lainnya menjadi reaktif. Ini secara alami mendukung penumpukan mendalam (deep nesting) dan struktur dinamis, sehingga sangat cocok untuk model bisnis yang kompleks.
- **Tidak Invasif**: Anda dapat langsung memanipulasi objek asli tanpa perlu mendefinisikan *action*, *reducer*, atau *store* tambahan, memberikan pengalaman pengembangan yang sangat baik.
- **Pelacakan Dependensi Otomatis**: Cukup bungkus komponen dengan `observer`, dan komponen akan secara otomatis melacak properti Observable yang digunakannya. Ketika data berubah, UI akan otomatis diperbarui tanpa perlu mengelola dependensi secara manual.
- **Cocok untuk Skenario Non-React**: Mekanisme reaktivitas Observable tidak hanya berlaku untuk React, tetapi juga dapat digabungkan dengan *framework* lain untuk memenuhi kebutuhan data reaktif yang lebih luas.

## Mengapa Menggunakan observer?

`observer` akan mendengarkan perubahan pada objek Observable dan secara otomatis memicu pembaruan komponen React ketika data berubah. Ini menjaga UI Anda tetap sinkron dengan data tanpa perlu memanggil `setState` atau metode pembaruan lainnya secara manual.

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

Untuk informasi lebih lanjut tentang penggunaan reaktif, silakan merujuk pada dokumentasi [@formily/reactive](https://reactive.formilyjs.org/).