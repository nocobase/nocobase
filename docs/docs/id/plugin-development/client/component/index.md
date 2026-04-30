---
title: "Pengembangan Component"
description: "Pengembangan Component client NocoBase: menggunakan React/Antd untuk mengembangkan Component halaman plugin, manajemen status observable, mendapatkan kapabilitas konteks NocoBase melalui useFlowContext()."
keywords: "Component,pengembangan Component,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Pengembangan Component

Di NocoBase, Component halaman yang di-mount oleh route adalah Component React biasa. Anda dapat langsung menggunakan React + [Antd](https://5x.ant.design/) untuk menulisnya, tidak ada bedanya dengan pengembangan front-end biasa.

NocoBase secara tambahan menyediakan:

- **`observable` + `observer`** — Cara manajemen status yang direkomendasikan, lebih cocok untuk ekosistem NocoBase daripada `useState`
- **`useFlowContext()`** — Mendapatkan kapabilitas konteks NocoBase (membuat request, internasionalisasi, navigasi route, dll.)

## Cara Penulisan Dasar

Component halaman paling sederhana:

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Setelah ditulis, daftarkan dengan `this.router.add()` di `load()` plugin, untuk detail lihat [Router](../router).

## Manajemen Status: observable

NocoBase merekomendasikan menggunakan `observable` + `observer` untuk mengelola status Component, bukan `useState` React. Manfaatnya:

- Memodifikasi property objek secara langsung dapat memicu update, tidak perlu `setState`
- Pengumpulan dependensi otomatis, Component hanya re-render saat property yang digunakan berubah
- Konsisten dengan mekanisme reaktif lapisan dasar NocoBase (FlowModel, FlowContext, dll.)

Penggunaan dasar: gunakan `observable.deep()` untuk membuat objek reaktif, gunakan `observer()` untuk membungkus Component. `observable` dan `observer` keduanya di-import dari `@nocobase/flow-engine`:

```tsx
import React from 'react';
import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Membuat objek status reaktif
const state = observable.deep({
  text: '',
});

// Bungkus Component dengan observer, status berubah otomatis update
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Ketik sesuatu..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>Anda mengetik: {state.text}</div>}
    </div>
  );
});

export default DemoPage;
```

Preview tampilan:

```tsx file="./_demos/observable-basic.tsx" preview
```

Untuk lebih banyak penggunaan lihat [Mekanisme Reaktif Observable](../../../flow-engine/observable).

## Menggunakan useFlowContext

`useFlowContext()` adalah entry point untuk menghubungkan kapabilitas NocoBase. Di-import dari `@nocobase/flow-engine`, mengembalikan objek `ctx`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();
  // ctx.api — Membuat request
  // ctx.t — Internasionalisasi
  // ctx.router — Navigasi route
  // ctx.logger — Log
  // ...
}
```

Berikut adalah contoh kapabilitas umum.

### Membuat Request

Memanggil API backend melalui `ctx.api.request()`, penggunaan sama dengan [Axios](https://axios-http.com/):

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### Internasionalisasi

Mendapatkan teks terjemahan melalui `ctx.t()`:

```tsx
const label = ctx.t('Hello');
// Menentukan namespace
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### Navigasi Route

Melakukan navigasi halaman melalui `ctx.router.navigate()`:

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

Mendapatkan parameter route saat ini:

```tsx
// Misalnya route didefinisikan sebagai /users/:id
const { id } = ctx.route.params; // Mendapatkan parameter dinamis
```

Mendapatkan nama route saat ini:

```tsx
const { name } = ctx.route; // Mendapatkan nama route
```

Untuk lebih banyak level log dan penggunaan lihat [Context → Kapabilitas Umum](../ctx/common-capabilities).

## Contoh Lengkap

Menggabungkan observable, useFlowContext, dan Antd, Component halaman yang mengambil data dari backend dan menampilkan:

```tsx
// pages/PostListPage.tsx
import React, { useEffect } from 'react';
import { Button, Card, List, Spin } from 'antd';
import { observable, observer, FlowContext, useFlowContext } from '@nocobase/flow-engine';

interface Post {
  id: number;
  title: string;
}

// Menggunakan observable untuk mengelola status halaman
const state = observable.deep({
  posts: [] as Post[],
  loading: true,
});

const PostListPage = observer(() => {
  const ctx = useFlowContext();

  useEffect(() => {
    loadPosts(ctx);
  }, []);

  return (
    <Card title={ctx.t('Post list')}>
      <Spin spinning={state.loading}>
        <List
          dataSource={state.posts}
          renderItem={(post: Post) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleDelete(ctx, post.id)}>
                  {ctx.t('Delete')}
                </Button>,
              ]}
            >
              {post.title}
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
});

async function loadPosts(ctx: FlowContext) {
  state.loading = true;
  try {
    const response = await ctx.api.request({
      url: 'posts:list',
      method: 'get',
    });
    state.posts = response.data?.data || [];
  } catch (error) {
    ctx.logger.error('Loading daftar artikel gagal', { error });
  } finally {
    state.loading = false;
  }
}

async function handleDelete(ctx: FlowContext, id: number) {
  await ctx.api.request({
    url: `posts:destroy/${id}`,
    method: 'post',
  });
  loadPosts(ctx); // Refresh daftar
}

export default PostListPage;
```

## Selanjutnya

- Kapabilitas lengkap yang disediakan `useFlowContext` — lihat [Context](../ctx/index.md)
- Style Component dan kustomisasi tema — lihat [Styles & Themes](./styles-themes)
- Jika Component Anda perlu muncul di menu "Tambah Block / Field / Action" NocoBase, mendukung konfigurasi visual oleh pengguna, perlu menggunakan FlowModel untuk membungkusnya — lihat [FlowEngine](../flow-engine/index.md)
- Tidak yakin menggunakan Component atau FlowModel? — lihat [Component vs FlowModel](../component-vs-flow-model)

## Tautan Terkait

- [Router](../router) — Mendaftarkan route halaman, mount Component ke URL
- [Context](../ctx/index.md) — Pengantar lengkap kapabilitas useFlowContext
- [Styles & Themes](./styles-themes) — createStyles, theme token, dll.
- [FlowEngine](../flow-engine/index.md) — Menggunakan FlowModel saat perlu konfigurasi visual
- [Mekanisme Reaktif Observable](../../../flow-engine/observable) — Manajemen status reaktif FlowEngine
- [Context → Kapabilitas Umum](../ctx/common-capabilities) — ctx.api, ctx.t, dan kapabilitas bawaan lainnya
- [Component vs FlowModel](../component-vs-flow-model) — Memilih Component atau FlowModel
