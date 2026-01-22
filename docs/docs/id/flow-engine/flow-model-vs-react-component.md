:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# FlowModel vs React.Component

## Perbandingan Tanggung Jawab Dasar

| Fitur/Kemampuan       | `React.Component`              | `FlowModel`                                  |
| --------------------- | ------------------------------ | -------------------------------------------- |
| Kemampuan Render      | Ya, metode `render()` menghasilkan UI | Ya, metode `render()` menghasilkan UI        |
| Manajemen State       | `state` dan `setState` bawaan  | Menggunakan `props`, tetapi manajemen state lebih bergantung pada struktur pohon model |
| Siklus Hidup          | Ya, contohnya `componentDidMount` | Ya, contohnya `onInit`, `onMount`, `onUnmount` |
| Tujuan                | Membangun komponen UI          | Membangun "pohon model" yang digerakkan oleh data, berbasis alur, dan terstruktur |
| Struktur Data         | Pohon komponen                 | Pohon model (mendukung model induk-anak, Fork multi-instans) |
| Komponen Anak         | Menggunakan JSX untuk menyarangkan komponen | Menggunakan `setSubModel`/`addSubModel` untuk secara eksplisit mengatur sub-model |
| Perilaku Dinamis      | Pengikatan event, pembaruan state menggerakkan UI | Mendaftarkan/mengirim Alur, menangani alur otomatis |
| Persistensi           | Tidak ada mekanisme bawaan     | Mendukung persistensi (misalnya `model.save()`) |
| Mendukung Fork (render berkali-kali) | Tidak (memerlukan penggunaan ulang manual) | Ya (`createFork` untuk multi-instansiasi)    |
| Kontrol Mesin         | Tidak ada                      | Ya, dikelola, didaftarkan, dan dimuat oleh `FlowEngine` |

## Perbandingan Siklus Hidup

| Hook Siklus Hidup | `React.Component`                 | `FlowModel`                                  |
| ----------------- | --------------------------------- | -------------------------------------------- |
| Inisialisasi      | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| Pembongkaran      | `componentWillUnmount`            | `onUnmount`                                  |
| Menanggapi Input  | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Penanganan Error  | `componentDidCatch`               | `onAutoFlowsError`                      |

## Perbandingan Struktur Konstruksi

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Pohon Komponen vs Pohon Model

*   **Pohon Komponen React**: Pohon render UI yang dibentuk oleh penyarangan JSX saat runtime.
*   **Pohon Model FlowModel**: Pohon struktur logis yang dikelola oleh FlowEngine, yang dapat dipertahankan, serta memungkinkan pendaftaran dan kontrol sub-model secara dinamis. Cocok untuk membangun blok halaman, alur tindakan, model data, dll.

## Fitur Khusus (Spesifik FlowModel)

| Fungsi                               | Deskripsi                                    |
| ------------------------------------ | -------------------------------------------- |
| `registerFlow`                       | Mendaftarkan alur                            |
| `applyFlow` / `dispatchEvent`        | Menjalankan/memicu alur                      |
| `setSubModel` / `addSubModel`        | Secara eksplisit mengontrol pembuatan dan pengikatan sub-model |
| `createFork`                         | Mendukung penggunaan ulang logika model untuk beberapa render (misalnya, setiap baris dalam tabel) |
| `openFlowSettings`                   | Pengaturan langkah alur                      |
| `save` / `saveStepParams()`          | Model dapat dipertahankan dan diintegrasikan dengan backend |

## Ringkasan

| Item              | React.Component                 | FlowModel                                    |
| ----------------- | ------------------------------- | -------------------------------------------- |
| Skenario yang Cocok | Organisasi komponen lapisan UI  | Manajemen alur dan blok yang digerakkan oleh data |
| Ide Inti          | UI Deklaratif                   | Alur terstruktur berbasis model              |
| Metode Manajemen  | React mengontrol siklus hidup   | FlowModel mengontrol siklus hidup dan struktur model |
| Keunggulan        | Ekosistem dan toolchain yang kaya | Sangat terstruktur, alur dapat dipertahankan, sub-model dapat dikontrol |

> FlowModel dapat digunakan secara komplementer dengan React: Menggunakan React untuk rendering di dalam FlowModel, sementara siklus hidup dan strukturnya dikelola oleh FlowEngine.