---
pkg: '@nocobase/plugin-workflow-javascript'
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/workflow/nodes/javascript).
:::

# Skrip JavaScript

## Pendahuluan

Node skrip JavaScript memungkinkan pengguna untuk mengeksekusi skrip JavaScript sisi server kustom dalam alur kerja. Skrip dapat menggunakan variabel dari hulu alur kerja sebagai parameter, dan nilai kembalian skrip dapat disediakan untuk digunakan oleh node hilir.

Skrip akan dijalankan dalam sebuah worker thread di sisi server aplikasi NocoBase, dan mendukung sebagian besar fitur Node.js, namun masih terdapat beberapa perbedaan dengan lingkungan eksekusi asli, lihat [Daftar Fitur](#daftar-fitur) untuk detailnya.

## Membuat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") dalam alur untuk menambahkan node "JavaScript":

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Konfigurasi Node

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parameter

Digunakan untuk meneruskan variabel konteks alur kerja atau nilai statis ke dalam skrip untuk digunakan oleh logika kode dalam skrip. Di mana `name` adalah nama parameter, yang akan menjadi nama variabel setelah diteruskan ke skrip. `value` adalah nilai parameter, dapat memilih variabel atau memasukkan konstanta.

### Konten Skrip

Konten skrip dapat dianggap sebagai sebuah fungsi, Anda dapat menulis kode JavaScript apa pun yang didukung dalam lingkungan Node.js, dan dapat menggunakan pernyataan `return` untuk mengembalikan sebuah nilai sebagai hasil eksekusi node, untuk digunakan sebagai variabel oleh node berikutnya.

Setelah menulis kode, Anda dapat mengklik tombol pengujian di bawah kotak edit untuk membuka dialog eksekusi pengujian, dan mengisi parameter dengan nilai statis untuk melakukan simulasi eksekusi. Setelah eksekusi, Anda dapat melihat nilai kembalian dan konten keluaran (log) di dalam dialog tersebut.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Pengaturan Batas Waktu

Satuan dihitung dalam milidetik, ketika diatur ke `0` berarti tidak ada batas waktu yang ditetapkan.

### Lanjutkan alur setelah kesalahan

Setelah dicentang, node berikutnya akan tetap dieksekusi meskipun skrip mengalami kesalahan atau kesalahan batas waktu.

:::info{title="Tips"}
Setelah skrip mengalami kesalahan, tidak akan ada nilai kembalian, dan hasil node akan diisi dengan pesan kesalahan. Jika node berikutnya menggunakan variabel hasil dari node skrip, harap menanganinya dengan hati-hati.
:::

## Daftar Fitur

### Versi Node.js

Sama dengan versi Node.js yang menjalankan aplikasi utama.

### Dukungan Modul

Modul dapat digunakan secara terbatas dalam skrip, konsisten dengan CommonJS, menggunakan instruksi `require()` dalam kode untuk mengimpor modul.

Mendukung modul asli Node.js, dan modul yang telah terinstal di `node_modules` (termasuk paket dependensi yang telah digunakan oleh NocoBase). Modul yang akan disediakan untuk digunakan dalam kode harus dideklarasikan dalam variabel lingkungan aplikasi `WORKFLOW_SCRIPT_MODULES`, dengan beberapa nama paket dipisahkan oleh koma, misalnya:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Tips"}
Modul yang tidak dideklarasikan dalam variabel lingkungan `WORKFLOW_SCRIPT_MODULES`, meskipun merupakan modul asli Node.js atau telah terinstal di `node_modules`, **tidak dapat** digunakan dalam skrip. Strategi ini dapat digunakan untuk mengontrol daftar modul yang dapat digunakan pengguna pada lapisan operasional, guna menghindari izin skrip yang terlalu tinggi dalam beberapa skenario.
:::

Dalam lingkungan penyebaran non-kode sumber, jika modul tertentu tidak terinstal di node_modules, Anda dapat menginstal paket yang diperlukan secara manual ke direktori storage. Misalnya, saat perlu menggunakan paket `exceljs`, Anda dapat melakukan operasi berikut:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Kemudian tambahkan jalur relatif (atau absolut) paket tersebut berdasarkan CWD (direktori kerja saat ini) aplikasi ke variabel lingkungan `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Maka paket `exceljs` dapat digunakan dalam skrip (nama `require` harus sama persis dengan yang didefinisikan dalam variabel lingkungan):

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

### Variabel Global

**Tidak mendukung** variabel global seperti `global`, `process`, `__dirname`, dan `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Parameter Masukan

Parameter yang dikonfigurasi dalam node akan berfungsi sebagai variabel global dalam skrip dan dapat digunakan secara langsung. Parameter yang diteruskan ke skrip hanya mendukung tipe dasar, seperti `boolean`, `number`, `string`, `object`, dan array. Objek `Date` akan dikonversi menjadi string berbasis format ISO setelah diteruskan. Tipe kompleks lainnya tidak dapat diteruskan secara langsung, seperti instans dari kelas kustom.

### Nilai Kembalian

Melalui pernyataan `return`, data tipe dasar (mengikuti aturan parameter yang sama) dapat dikembalikan ke node sebagai hasil. Jika pernyataan `return` tidak dipanggil dalam kode, maka eksekusi node tidak akan memiliki nilai kembalian.

```js
return 123;
```

### Keluaran (Log)

**Mendukung** penggunaan `console` untuk mengeluarkan log.

```js
console.log('hello world!');
```

Saat alur kerja dijalankan, keluaran dari node skrip juga akan dicatat ke dalam berkas log alur kerja yang sesuai.

### Asinkron

**Mendukung** penggunaan `async` untuk mendefinisikan fungsi asinkron, serta `await` untuk memanggil fungsi asinkron. **Mendukung** penggunaan objek global `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timer

Jika perlu menggunakan metode seperti `setTimeout`, `setInterval`, atau `setImmediate`, perlu diimpor melalui paket `timers` Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```