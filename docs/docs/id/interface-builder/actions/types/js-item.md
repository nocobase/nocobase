---
title: "JSItem JS Item"
description: "JSItem JS Item: menggunakan JavaScript/JSX di action bar untuk render item Action kustom, mendukung React, ctx, linkage konteks Collection/record/Form."
keywords: "JSItem, JS Item, item Action kustom, JavaScript, interface builder, NocoBase"
---

# JS Item

## Pengantar

JS Item digunakan untuk merender "item Action kustom" di action bar. Anda dapat langsung menulis JavaScript / JSX, mengoutput UI apa pun, seperti tombol, button group, dropdown menu, teks prompt, label status, atau komponen interaksi kecil, dan memanggil interface, membuka Popup, membaca record saat ini, atau refresh data Block di dalam komponen.

Dapat digunakan di lokasi seperti toolbar Form, toolbar Table (level collection), Action baris Table (level record), dll., cocok untuk skenario berikut:

- Perlu mengkustomisasi struktur tombol, bukan hanya bind event klik ke tombol;
- Perlu menggabungkan beberapa Action menjadi satu button group atau dropdown menu;
- Perlu menampilkan status real-time, informasi statistik, atau konten penjelasan di action bar;
- Perlu merender konten yang berbeda secara dinamis berdasarkan record saat ini, data terpilih, nilai Form.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM%20(1).png)

## Perbedaan dengan JS Action

- `JS Action`: Lebih cocok untuk "menjalankan script setelah klik tombol", fokus pada logika perilaku.
- `JS Item`: Lebih cocok untuk "render item Action sendiri", baik mengontrol antarmuka maupun mengontrol logika interaksi.

Jika hanya ingin menambahkan logika klik ke tombol yang sudah ada, prioritaskan `JS Action`; jika ingin mengkustomisasi struktur antarmuka item Action atau merender beberapa control, prioritaskan `JS Item`.

## API Konteks Runtime (Umum)

Saat JS Item dijalankan akan menginjeksikan kemampuan umum, dapat langsung digunakan dalam script:

- `ctx.render(vnode)`: render React element, HTML string, atau DOM node ke container item Action saat ini;
- `ctx.element`: container DOM item Action saat ini (ElementProxy);
- `ctx.api.request(options)`: mengirim HTTP request;
- `ctx.openView(viewUid, options)`: membuka view yang sudah dikonfigurasi (drawer / dialog / page);
- `ctx.message` / `ctx.notification`: prompt dan notifikasi global;
- `ctx.t()` / `ctx.i18n.t()`: internasionalisasi;
- `ctx.resource`: resource data konteks level collection, misalnya membaca record yang dipilih, refresh list;
- `ctx.record`: record baris saat ini di konteks level record;
- `ctx.form`: instance AntD Form di konteks level Form;
- `ctx.blockModel` / `ctx.collection`: meta info Block dan collection tempat berada;
- `ctx.requireAsync(url)`: load library AMD / UMD secara asynchronous berdasarkan URL;
- `ctx.importAsync(url)`: import modul ESM secara dinamis berdasarkan URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: library umum bawaan, dapat langsung digunakan untuk render JSX, pemrosesan waktu, pemrosesan data, dan operasi matematika.

> Variabel yang sebenarnya tersedia akan berbeda berdasarkan lokasi item Action. Misalnya Action baris Table biasanya dapat mengakses `ctx.record`, toolbar Form biasanya dapat mengakses `ctx.form`, toolbar Table biasanya dapat mengakses `ctx.resource`.

## Editor dan Snippet

- `Snippets`: Membuka daftar snippet kode bawaan, dapat dicari dan disisipkan ke posisi cursor saat ini dengan satu klik.
- `Run`: Langsung menjalankan kode saat ini, dan output log eksekusi ke panel `Logs` di bawah; mendukung `console.log/info/warn/error` dan highlight lokasi error.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM.png)

- Dapat dikombinasikan dengan AI Employee untuk generate / modify script: [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Penggunaan Umum (Contoh Ringkas)

### 1) Render Tombol Biasa

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      type="primary"
      onClick={() => ctx.message.success(ctx.t('Click from JS item'))}
    >
      {ctx.t('JS item')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 2) Action Collection: Kombinasi Tombol dan Dropdown Menu

```js
const { Space, Button, Dropdown } = ctx.libs.antd;
const { EllipsisOutlined } = ctx.libs.antdIcons;

function JsItem() {
  const items = [
    { key: 'export', label: ctx.t('Export selected') },
    { key: 'refresh', label: ctx.t('Refresh data') },
  ];

  const onMenuClick = async ({ key }) => {
    if (key === 'export') {
      const rows = ctx.resource?.getSelectedRows?.() || [];
      if (!rows.length) {
        ctx.message.warning(ctx.t('Please select records'));
        return;
      }
      ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
      return;
    }

    if (key === 'refresh') {
      await ctx.resource?.refresh?.();
      ctx.message.success(ctx.t('Refreshed'));
    }
  };

  return (
    <Space.Compact>
      <Button>{ctx.t('Actions')}</Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Space.Compact>
  );
}

ctx.render(<JsItem />);
```

### 3) Action Record: Membuka View Berdasarkan Baris Saat Ini

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      onClick={async () => {
        // Open a view as drawer and pass arguments at top-level
        const popupUid = `${ctx.model.uid}-details`;
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Details'),
          size: 'large',
        });
      }}
    >
      {ctx.t('Open')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 4) Render Konten Status Kustom

```js
const { Tag } = ctx.libs.antd;

function JsItem() {
  const count = ctx.resource?.getSelectedRows?.()?.length || 0;

  return (
    <Tag color={count ? 'processing' : 'default'}>
      Selected: {count}
    </Tag>
  );
}

ctx.render(<JsItem />);
```

## Perhatian

- Jika hanya perlu "menjalankan logika setelah klik", prioritaskan `JS Action`, implementasi lebih langsung.
- Tambahkan `try/catch` dan prompt pengguna untuk panggilan interface, hindari kegagalan diam-diam.
- Saat melibatkan linkage Table, List, Popup, setelah submit berhasil dapat refresh data secara aktif melalui `ctx.resource?.refresh?.()` atau resource Block tempat berada.
- Saat menggunakan library eksternal, disarankan untuk load melalui CDN terpercaya, dan siapkan fallback untuk kegagalan load.

## Dokumentasi Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Linkage](/interface-builder/linkage-rule)
- [View dan Popup](/interface-builder/actions/types/view)
- [JS Action](/interface-builder/actions/types/js-action)
