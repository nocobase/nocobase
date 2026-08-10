---
title: "Gunakan NocoBase untuk membangun dasbor operasional yang dapat ditautkan"
description: "Mengambil dasbor operasi perintah kerja sebagai contoh, blok bagan, blok filter, dan blok JS digabungkan untuk mencapai pemfilteran terpadu, KPI, penelusuran bagan, dan gaya kustom."
keywords: "NocoBase, dasbor operasional, visualisasi data, blok bagan, blok filter, blok JS, penelusuran bagan"
---

# Gunakan NocoBase untuk membangun dasbor operasional yang dapat ditautkan

Artikel ini mengambil dasbor operasi "sistem perintah kerja" sebagai contoh untuk memperkenalkan cara menggunakan blok bagan NocoBase, blok filter, dan blok JS dalam kombinasi untuk membangun dasbor data yang mendukung tautan filter, penelusuran bagan, dan gaya kustom.

Meskipun contohnya berasal dari skenario perintah kerja, metode ini juga dapat diterapkan pada sistem bisnis seperti CRM, pengoperasian peralatan, manajemen proyek, alur persetujuan, kesuksesan pelanggan, dll.

:::tip
Apa yang ingin diperkenalkan dalam artikel ini bukanlah "cara menggunakan blok JS untuk menulis layar besar", tetapi bagaimana menggabungkan kemampuan blok asli NocoBase dan blok JS: Biarkan blok asli bertanggung jawab atas kemampuan standar, dan biarkan blok JS melengkapi pengalaman yang dipersonalisasi.
:::

![](https://static-docs.nocobase.com/202607121920705.png)

## sasaran adegan

Kami berharap dapat membangun dasbor Operasi untuk membantu tim operasi atau layanan dengan cepat menentukan beban kerja saat ini:

- Berapa banyak perintah kerja terbuka yang ada saat ini?
- Perintah kerja manakah yang berisiko SLA?
- Bagaimana tren perintah kerja baru?
- Apa status dan distribusi prioritas perintah kerja?
- Setelah mengklik grafik, Anda dapat melihat detail terkait

Halaman ini secara kasar dapat dibagi menjadi empat lapisan:

1. Area filter teratas: waktu, grup layanan, jenis permintaan, prioritas, status SLA
2. Area statistik KPI: Open backlog, Unassigned, peringatan SLA, dll.
3. Area analisis grafik: tren, status, SLA, distribusi prioritas
4. Area detail penelusuran: Klik pada bagan untuk menampilkan catatan yang cocok

## Pertama, perjelas ide konstruksi

Saat banyak orang membuat dasbor data, mereka cenderung menganggap masalahnya sebagai salah satu dari dua pilihan:

Gunakan semua blok asli NocoBase, yang mudah dikonfigurasikan, tetapi khawatir gaya dan interaksinya tidak cukup fleksibel; atau cukup tulis blok JS besar dan kendalikan sendiri kueri, bagan, pemfilteran, dan penelusuran, tetapi ini akan kehilangan kenyamanan yang dibawa oleh konfigurasi kode rendah.

Padahal, cara yang lebih disarankan adalah dengan menggabungkan keduanya.

Di dasbor Operasi ini, kami tidak menulis seluruh halaman sebagai layar JS besar, namun membaginya berdasarkan tanggung jawab:

- Pemfilteran atas menggunakan blok pemfilteran yang disertakan dengan sistem NocoBase;
- Bagan tren, distribusi status, dan distribusi SLA menggunakan blok bagan asli;
- Kartu KPI dan detail penelusuran menggunakan blok JS;
- Blok filter memengaruhi blok bagan dan blok JS;
- Setelah bagan diklik, kondisi penelusuran diteruskan ke blok detail JS di bawah.

Keuntungannya adalah statistik standar dan pemfilteran masih mempertahankan kemampuan konfigurasi NocoBase, sementara tampilan yang dipersonalisasi dan interaksi kompleks diselesaikan oleh blok JS. Halaman ini bukan "hanya dapat dikonfigurasi" atau "semua kode", tetapi konfigurasi dan kode masing-masing menjalankan tugasnya sendiri.

---

## 1. Cara menyesuaikan gaya blok bagan

![](https://static-docs.nocobase.com/202607121920941.png)

Blok bagan NocoBase pertama-tama dapat menggunakan pembuat Kueri untuk menentukan kaliber statistik, lalu menggunakan opsi ECharts khusus untuk menyesuaikan gaya.

Mengambil "statistik status perintah kerja" sebagai contoh, pembuat Kueri dapat dikonfigurasi sebagai:

- Lembar Data: tiket
- Metrik: jumlah id, alias ticketCount
- Dimensi: status

Kuncinya adalah saat mengkustomisasi gaya, Anda tidak perlu menulis ulang query, Anda hanya perlu memproses tampilan grafik berdasarkan `ctx.data.objects`.

```javascript
const rows = Array.isArray(ctx.data?.objects) ? ctx.data.objects : [];
```

Baris kode ini membaca hasil kueri bagan. Kemudian tentukan label status dan warna:

```javascript
const labels = {
  new: ctx.t('New'),
  open: ctx.t('Open'),
  pending_customer: ctx.t('Pending customer'),
  resolved: ctx.t('Resolved'),
  closed: ctx.t('Closed'),
};

const colors = {
  new: '#1677ff',
  open: '#22a06b',
  pending_customer: '#f59f00',
  resolved: '#13c2c2',
  closed: '#8c8c8c',
};
```

Disarankan agar semua copywriting yang terlihat menggunakan `ctx.t()` untuk memfasilitasi dukungan multi-bahasa selanjutnya.

Saat membuat data bagan, Anda dapat melampirkan informasi penelusuran ke setiap titik data bagan:

```javascript
const data = rows.map((row) => ({
  value: Number(row.ticketCount || 0),
  itemStyle: {
    color: colors[row.status] || '#8c8c8c',
    borderRadius: [6, 6, 0, 0],
  },
  ticketingDrilldown: {
    label: ctx.t('Status') + ': ' + (labels[row.status] || row.status),
    filter: { status: { $eq: row.status } },
  },
}));
```

Yang paling penting di sini adalah `ticketingDrilldown`. Ini bukan bidang standar ECharts, tetapi konteks bisnis yang kita masukkan ke dalam diri kita sendiri, yang akan digunakan saat mengklik grafik nanti.

Akhirnya kembali ke opsi ECharts:

```javascript
return {
  grid: { top: 28, right: 22, bottom: 48, left: 42 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: rows.map((row) => labels[row.status] || row.status),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: ctx.t('Tickets'),
      type: 'bar',
      barWidth: 36,
      data,
    },
  ],
};
```

Ide inti dari bagian ini adalah:

- Pembuat kueri bertanggung jawab atas statistik;
- Opsi khusus bertanggung jawab atas ekspresi visual;
- Bidang khusus bertanggung jawab untuk membawa konteks penelusuran.

---

## 2. Biarkan blok filter sistem menjadi cakupan observasi seluruh halaman

![](https://static-docs.nocobase.com/202607121920687.png)

Area filter di dashboard operasional tidak boleh hanya berupa bentuk terisolasi. Ini mewakili diameter pengamatan seluruh halaman saat ini.

Misalnya, jika pengguna memilih grup layanan, jenis permintaan, dan waktu pembuatan, maka KPI, diagram tren, distribusi status, dan detail penelusuran harus ditampilkan berdasarkan serangkaian kondisi yang sama. Jika tidak, angka-angka di blok berbeda pada halaman akan saling bertarung, dan akan sulit bagi pengguna untuk menilai data mana yang merupakan hasil dalam rentang saat ini.

Di sini kita langsung menggunakan blok pemfilteran yang disertakan dengan sistem NocoBase alih-alih menulis sendiri komponen pemfilteran. Blok filter asli dapat terikat secara alami ke blok bagan, memungkinkan blok bagan untuk terus menggunakan pembuat Kueri, izin, penyegaran, dan mekanisme filter.

`Dashboard scope` teratas dapat mengonfigurasi item filter berikut:

- Created at
- Service group
- Request type
- Priority
- SLA status

Untuk blok JS, Anda hanya perlu membaca kumpulan kondisi filter yang sama dalam kode dan kemudian mengubahnya menjadi filter kueri. Dengan cara ini, KPI dan detail penelusuran juga dapat konsisten dengan diagram asli.

Kombinasi kondisi filter dapat diringkas menjadi fungsi kecil:

```javascript
function combineFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
```

Hitung berdasarkan filter:

```javascript
async function countTickets(filter) {
  const resource = ctx.makeResource('MultiRecordResource');
  resource.setResourceName('tickets');
  resource.setPageSize(1);

  if (filter) {
    resource.setFilter(filter);
  }

  await resource.refresh();

  const meta = resource.getMeta?.() || {};
  return Number(meta.count || meta.total || 0);
}
```

Poin-poin penting di sini adalah:

```javascript
resource.setFilter(filter);
await resource.refresh();
```

Blok JS menanyakan data bisnis melalui sumber daya alih-alih menulis SQL secara langsung. Hal ini mempermudah untuk tetap konsisten dengan izin, sumber data, dan waktu proses halaman NocoBase.

---

## 3. Gunakan blok JS untuk menampilkan kartu KPI

![](https://static-docs.nocobase.com/202607121920374.png)

KPI lebih cocok menggunakan blok JS. Karena KPI biasanya bukan kueri tunggal, melainkan kombinasi beberapa kaliber bisnis: belum selesai, belum ditetapkan, peringatan SLA, SLA dilanggar, baru, terselesaikan, dll.

Blok JS dapat meminta data berdasarkan rentang pemfilteran saat ini dan merendernya ke dalam kartu statistik.

```javascript
const { Card, Col, Row, Statistic, Tag } = ctx.libs.antd;

const scopeFilter = getDashboardScopeFilter();

const openBacklog = await countTickets(
  combineFilters(scopeFilter, {
    status: { $notIn: ['resolved', 'closed', 'cancelled'] },
  }),
);

ctx.render(
  <Row gutter={[12, 12]}>
    <Col span={6}>
      <Card size="small">
        <Tag color="blue">{ctx.t('Active')}</Tag>
        <Statistic title={ctx.t('Open backlog')} value={openBacklog} />
      </Card>
    </Col>
  </Row>,
);
```

Poin-poin penting dari blok JS adalah:

- Gunakan `ctx.makeResource()` untuk menanyakan data;
- Gunakan `ctx.libs.antd` untuk merender antarmuka;
- Gunakan `ctx.render()` untuk menampilkan konten;
- Render ulang potongan JS setelah memfilter perubahan.

Di halaman sebenarnya, tombol filter dan tombol reset dapat mengonfigurasi aliran peristiwa sehingga menyegarkan blok KPI JS dan menelusuri blok JS secara bersamaan setelah menyelesaikan tindakan filter asli. Dengan cara ini, pengguna mengklik sekali untuk memfilter, dan diagram serta konten khusus akan diperbarui berdasarkan rentang yang sama.

---

## 4. Blok JS keterkaitan bagan untuk menelusuri

![](https://static-docs.nocobase.com/202607121921577.png)

Mengklik grafik untuk menelusuri adalah interaksi yang sangat praktis di dasbor.

Dalam skenario perintah kerja, pengguna mengklik kolom "Status: Terbuka", dan semua perintah kerja Terbuka ditampilkan di area detail di bawah; ketika pengguna mengklik "SLA dilanggar", semua perintah kerja lembur ditampilkan di bawah.

Ide implementasinya adalah:

1. Poin data grafik membawa `ticketingDrilldown`;
2. Peristiwa grafik membaca informasi penelusuran ini;
3. Tulis informasi penelusuran ke dalam konteks blok JS target;
4. Memicu blok JS target untuk dirender ulang.

Kode kunci dalam event chart adalah sebagai berikut. Pertama-tama temukan blok JS penelusuran:

```javascript
const DRILLDOWN_TARGET_UID = 'v7mioopm6rm';

function getDrilldownTarget() {
  if (typeof ctx.getModel === 'function') {
    return ctx.getModel(DRILLDOWN_TARGET_UID);
  }

  const engine =
    ctx.model?.flowEngine || ctx.model?.context?.flowEngine || ctx.engine;
  return engine?.getModel?.(DRILLDOWN_TARGET_UID);
}
```

Kemudian tuliskan kondisi penelusuran yang diperoleh dengan mengklik grafik ke dalam blok target:

```javascript
function applyDrilldown(drilldown) {
  if (!drilldown?.filter) return;

  const target = getDrilldownTarget();
  if (!target?.context?.defineProperty) return;

  target.context.defineProperty('ticketingDashboardDrilldown', {
    value: drilldown,
  });

  target.rerender?.();
}
```

Yang paling penting adalah dua baris ini:

```javascript
target.context.defineProperty('ticketingDashboardDrilldown', {
  value: drilldown,
});
target.rerender?.();
```

Baris pertama meneruskan kondisi penelusuran ke blok JS, dan baris kedua memicu penyegaran blok JS.

Terakhir ikat acara klik bagan:

```javascript
const clickHandler = (params) => {
  applyDrilldown(params?.data?.ticketingDrilldown);
};

chart.on('click', clickHandler);

return () => chart.off('click', clickHandler);
```

Di sini disarankan agar Anda harus mengembalikan pembersihan:

```javascript
return () => chart.off('click', clickHandler);
```

Dengan cara ini, ketika bagan dikonfigurasi ulang atau dirender ulang, kejadian lama dapat dibersihkan untuk menghindari pengikatan berulang.

Kode terkait peristiwa klik di atas berlaku untuk [v2.2.0-beta.10](https://github.com/nocobase/nocobase/releases/tag/v2.2.0-beta.10) dan versi di atasnya. Referensi ke kode versi lama:

```javascript
chart.off('click');
chart.on('click', clickHandler);
```

---

## 5. Cara menampilkan detail di blok JS penelusuran

![](https://static-docs.nocobase.com/202607121921601.png)

Telusuri blok JS untuk membaca `ticketingDashboardDrilldown` yang baru saja ditulis, lalu kueri data sesuai dengan filter di dalamnya.

```javascript
const drilldown = ctx.model?.context?.ticketingDashboardDrilldown;

if (!drilldown) {
  ctx.render(
    <Alert
      type="info"
      showIcon
      message={ctx.t('Select a chart segment to inspect matching tickets')}
    />,
  );
  return;
}
```

Jika pengguna belum mengklik grafik, tampilkan prompt. Setelah mengklik, kueri perintah kerja berdasarkan `drilldown.filter`:

```javascript
const resource = ctx.makeResource('MultiRecordResource');
resource.setResourceName('tickets');
resource.setFilter(drilldown.filter);
resource.setPageSize(10);
await resource.refresh();

const rows = resource.getData?.() || [];
```

Kemudian render tabelnya:

```javascript
const { Table, Typography } = ctx.libs.antd;

ctx.render(
  <>
    <Typography.Title level={5}>
      {ctx.t('Drilldown')}: {drilldown.label}
    </Typography.Title>

    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      columns={[
        { title: ctx.t('Ticket No'), dataIndex: 'ticketNo' },
        { title: ctx.t('Title'), dataIndex: 'title' },
        { title: ctx.t('Status'), dataIndex: 'status' },
        { title: ctx.t('Priority'), dataIndex: 'priority' },
      ]}
    />
  </>,
);
```

Jika Anda perlu menghapus kondisi penelusuran, Anda dapat merujuk ke

```javascript
function clearChartDrilldown() {
  if (ctx.model?.context?.defineProperty) {
    ctx.model.context.defineProperty('ticketingDashboardDrilldown', {
      value: null,
    });
  }
  if (typeof ctx.model?.rerender === 'function') {
    ctx.model.rerender();
  }
}
```

Poin-poin penting pada bagian ini adalah:

- Bagan ini hanya bertanggung jawab untuk melewati filter;
- Blok JS bertanggung jawab untuk menanyakan dan menampilkan detail;
- Klik pada diagram yang berbeda untuk berbagi blok penelusuran yang sama.

---

## Saran praktis

### 1. Jangan terburu-buru mengkodekan halaman kompleks secara keseluruhan

Pelajaran terpenting dari halaman ini adalah: jangan mengadu kemampuan asli dengan kemampuan JS.

Jika suatu kemampuan sudah merupakan kemampuan asli NocoBase, seperti pemfilteran, kueri bagan, tampilan tabel, dan kontrol izin, blok asli akan digunakan terlebih dahulu. Dengan cara ini, ketika kolom, kondisi filter, dan kaliber bagan disesuaikan, semuanya masih dapat dikonfigurasi pada antarmuka.

Blok JS lebih cocok untuk memproses bagian yang tidak dikuasai oleh blok asli, seperti menggabungkan beberapa indikator ke dalam satu set KPI, gaya kartu khusus, menampilkan serangkaian detail khusus setelah mengklik grafik, atau meneruskan konteks bisnis di antara blok yang berbeda.

Dengan kata lain, blok asli bertanggung jawab atas "kemampuan standar yang dapat dikonfigurasi", dan blok JS bertanggung jawab atas "pengalaman pribadi yang berorientasi bisnis". Ini juga merupakan ide konstruksi yang paling dapat digunakan kembali untuk dasbor ini.

### 2. Untuk statistik sederhana, gunakan pembuat Kueri blok bagan terlebih dahulu.

Ini mempertahankan kueri standar, izin, pemfilteran, dan kemampuan penyegaran NocoBase. Hanya ketika gaya bagan default tidak dapat mengekspresikan fokus bisnis, gunakan opsi ECharts yang disesuaikan untuk pengoptimalan visual.

### 3. Kartu KPI mengutamakan penggunaan blok JS

KPI sering kali memerlukan beberapa kueri, kombinasi kondisi, dan tata letak khusus, dan blok JS lebih fleksibel. Terutama ketika KPI perlu merespons serangkaian kondisi filter sistem yang sama, akan lebih jelas jika menggunakan blok JS untuk menanganinya secara seragam.

### 4. Peristiwa grafik harus mengembalikan pembersihan

Metode penulisan yang disarankan:

```javascript
const handler = (params) => {
  // handle click
};

chart.on('click', handler);

return () => chart.off('click', handler);
```

Jangan langsung menggunakan `chart.off('click')` untuk menghapus semua peristiwa klik, karena hal ini dapat menghapus blok bagan secara tidak sengaja atau mengonfigurasi pemantauan panel itu sendiri.

---

## Biarkan AI membantu Anda membangunnya

Dasbor jenis ini sangat cocok untuk pembuatan berbantuan AI karena melibatkan model data, kaliber statistik, gaya bagan, dan interaksi halaman pada saat yang bersamaan. Anda dapat menyerahkan isi artikel ini dan mengajukan pertanyaan menggunakan kata-kata cepat di bawah ini.

Anda dapat mengajukan pertanyaan seperti ini:

```markdown
Saya menggunakan NocoBase untuk membangun dasbor operasional untuk sistem perintah kerja.
Silakan ambil skenario perintah kerja sebagai contoh dan bantu saya merancang dasbor Operasi.

Tiket tabel data berisi:
ticketNo、title、status、priority、slaStatus、
requestType、serviceGroup、assignee、createdAt、updatedAt。

Halaman ini memerlukan:

1. Filter teratas: Dibuat di, Grup layanan, Jenis permintaan, Prioritas, status SLA.
2. Kartu KPI: Open backlog, Unassigned, peringatan SLA, SLA dilanggar, Tiket baru, Tiket terselesaikan.
3. Bagan: Tren tiket yang dibuat, Status tiket, status SLA, Campuran prioritas.
4. Setelah mengklik grafik, blok JS di bawah ini menampilkan tabel penelusuran Tiket yang cocok.
5. Gaya grafik harus sesuai untuk pasar operasi, dengan warna yang jelas dan tata letak yang ringkas.
6. Gunakan ctx.t() untuk semua salinan JS.
7. Peristiwa grafik menggunakan chart.on dan mengembalikan fungsi pembersihan.
8. Prioritaskan penggunaan blok filter dan blok bagan asli NocoBase. Hanya gunakan blok JS untuk KPI, detail penelusuran, gaya khusus, dan interaksi lintas blok. Jangan menulis seluruh halaman sebagai satu blok JS yang besar.

Tolong berikan ide konfigurasi untuk setiap blok dan tandai kode JS kuncinya.
```

Jika Anda sudah memiliki halaman, Anda juga dapat membiarkan AI membantu Anda mengoptimalkannya:

```markdown
Ini adalah desain dasbor NocoBase saya saat ini:
Di bagian atas adalah area filter, di tengah adalah 4 grafik, dan di bawah adalah blok JS penelusuran.
Tolong bantu saya mengoptimalkan dari perspektif pengalaman operator:

1. Indikator apa saja yang harus ditampilkan KPI?
2. Apakah diperlukan keterkaitan antar grafik;
3. Kolom mana yang harus ditampilkan dalam rincian penelusuran;
4. Bagaimana seharusnya acara blok dan grafik JS diatur;
5. Kode mana yang harus ditempatkan di opsi kustom bagan dan mana yang harus ditempatkan di blok JS.
```

Dengan cara ini, konten yang dihasilkan oleh AI akan lebih dekat dengan bisnis sebenarnya, bukan hanya memberikan kode yang terisolasi.

:::warning
Jika Anda memilih untuk membiarkan AI membantu Anda membangunnya, gunakan manajer cadangan untuk membuat cadangan proyek sebelum memulai.
:::

## Dokumentasi referensi

- [Konfigurasi bagan ](/data-visualization/guide/chart-options)
- [Jalankan Bagian DepanJS](/runjs/)
- [Bentuk filter ](/interface-builder/blocks/filter-blocks/form)
- [Konstruksi AI - Konstruksi Antarmuka ](/ai-builder/ui-builder)
- [ECharts Options](https://echarts.apache.org/en/option.html)
