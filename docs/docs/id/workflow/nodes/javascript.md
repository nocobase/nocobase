---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Skrip JavaScript

## Pendahuluan

Node Skrip JavaScript memungkinkan pengguna untuk menjalankan skrip JavaScript kustom sisi server dalam sebuah **alur kerja**. Skrip ini dapat menggunakan variabel dari node sebelumnya dalam **alur kerja** sebagai parameter, dan nilai kembaliannya dapat digunakan oleh node berikutnya.

Skrip akan berjalan dalam *worker thread* di server aplikasi NocoBase dan mendukung sebagian besar fitur Node.js. Namun, ada beberapa perbedaan dari lingkungan eksekusi asli. Untuk detailnya, lihat [Daftar Fitur](#daftar-fitur).

## Membuat Node

Di antarmuka konfigurasi **alur kerja**, klik tombol plus ("+") pada alur untuk menambahkan node "JavaScript":

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Konfigurasi Node

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parameter

Digunakan untuk meneruskan variabel atau nilai statis dari konteks **alur kerja** ke dalam skrip untuk digunakan dalam logika kode. `name` adalah nama parameter, yang akan menjadi nama variabel setelah diteruskan ke skrip. `value` adalah nilai parameter, yang dapat berupa variabel atau konstanta.

### Konten Skrip

Konten skrip dapat dianggap sebagai sebuah fungsi. Anda dapat menulis kode JavaScript apa pun yang didukung di lingkungan Node.js dan menggunakan pernyataan `return` untuk mengembalikan nilai sebagai hasil eksekusi node, yang dapat digunakan sebagai variabel oleh node berikutnya.

Setelah menulis kode, Anda dapat mengklik tombol uji di bawah editor untuk membuka dialog eksekusi uji. Di sana, Anda dapat mengisi parameter dengan nilai statis untuk menjalankan simulasi. Setelah eksekusi, Anda dapat melihat nilai kembalian dan konten keluaran (log) di dialog tersebut.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Pengaturan Batas Waktu (Timeout)

Unitnya adalah milidetik. Nilai `0` berarti tidak ada batas waktu yang diatur.

### Lanjutkan jika Terjadi Kesalahan

Jika dicentang, node berikutnya akan tetap dieksekusi meskipun skrip mengalami kesalahan atau batas waktu terlampaui.

:::info{title="Catatan"}
Jika skrip mengalami kesalahan, ia tidak akan memiliki nilai kembalian, dan hasil node akan diisi dengan pesan kesalahan. Jika node berikutnya menggunakan variabel hasil dari node skrip, penanganannya harus dilakukan dengan hati-hati.
:::

## Daftar Fitur

### Versi Node.js

Sama dengan versi Node.js yang menjalankan aplikasi utama.

### Dukungan Modul

Modul dapat digunakan dalam skrip dengan batasan, konsisten dengan CommonJS, menggunakan direktif `require()` untuk mengimpor modul.

Mendukung modul asli Node.js dan modul yang terinstal di `node_modules` (termasuk paket dependensi yang sudah digunakan oleh NocoBase). Modul yang akan disediakan untuk kode harus dideklarasikan dalam variabel lingkungan aplikasi `WORKFLOW_SCRIPT_MODULES`, dengan beberapa nama paket dipisahkan oleh koma, contohnya:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Catatan"}
Modul yang tidak dideklarasikan dalam variabel lingkungan `WORKFLOW_SCRIPT_MODULES` **tidak dapat** digunakan dalam skrip, meskipun itu adalah modul asli Node.js atau sudah terinstal di `node_modules`. Kebijakan ini dapat digunakan pada tingkat operasional untuk mengontrol daftar modul yang dapat digunakan oleh pengguna, mencegah skrip memiliki izin yang berlebihan dalam beberapa skenario.
:::

Dalam lingkungan yang tidak di-deploy dari sumber kode, jika suatu modul tidak terinstal di `node_modules`, Anda dapat menginstal paket yang diperlukan secara manual ke direktori `storage`. Misalnya, untuk menggunakan paket `exceljs`, Anda dapat melakukan langkah-langkah berikut:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Kemudian tambahkan jalur relatif (atau absolut) paket tersebut berdasarkan CWD (direktori kerja saat ini) aplikasi ke variabel lingkungan `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Anda kemudian dapat menggunakan paket `exceljs` dalam skrip Anda:

```js
const ExcelJS = require('exceljs');
// ...
```

### Variabel Global

**Tidak mendukung** variabel global seperti `global`, `process`, `__dirname`, dan `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Parameter Masukan

Parameter yang dikonfigurasi dalam node akan menjadi variabel global dalam skrip dan dapat digunakan secara langsung. Parameter yang diteruskan ke skrip hanya mendukung tipe dasar, seperti `boolean`, `number`, `string`, `object`, dan array. Objek `Date` akan dikonversi menjadi string format ISO saat diteruskan. Tipe kompleks lainnya, seperti instans kelas kustom, tidak dapat diteruskan secara langsung.

### Nilai Kembalian

Melalui pernyataan `return`, Anda dapat mengembalikan data tipe dasar (sesuai aturan parameter) kembali ke node sebagai hasilnya. Jika pernyataan `return` tidak dipanggil dalam kode, eksekusi node tidak akan memiliki nilai kembalian.

```js
return 123;
```

### Keluaran (Log)

**Mendukung** penggunaan `console` untuk mengeluarkan log.

```js
console.log('hello world!');
```

Saat **alur kerja** dieksekusi, keluaran dari node skrip juga akan dicatat dalam berkas log **alur kerja** yang bersangkutan.

### Asinkron

**Mendukung** penggunaan `async` untuk mendefinisikan fungsi asinkron, dan `await` untuk memanggilnya. **Mendukung** penggunaan objek global `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Pewaktu (Timers)

Untuk menggunakan metode seperti `setTimeout`, `setInterval`, atau `setImmediate`, Anda perlu mengimpornya dari paket `timers` Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```