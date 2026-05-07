---
pkg: '@nocobase/plugin-workflow-javascript'
title: "Node Workflow - JavaScript Script"
description: "Node JavaScript Script: mengeksekusi script kustom server-side, menggunakan variable upstream, return value untuk digunakan downstream."
keywords: "Workflow,JavaScript,script,logika kustom,script server-side,NocoBase"
---

# JavaScript Script

## Pengantar

Node JavaScript Script memungkinkan user untuk mengeksekusi sebuah JavaScript script kustom di server-side dalam workflow. Pada script Anda dapat menggunakan variable dari upstream alur sebagai parameter, dan dapat menyediakan return value dari script untuk digunakan oleh Node downstream.

Script akan dijalankan pada worker thread di server-side aplikasi NocoBase. Secara default menggunakan secure sandbox (isolated-vm) untuk dijalankan, tidak mendukung `require` dan API bawaan Node.js, untuk detailnya lihat [Engine Eksekusi](#engine-eksekusi) dan [Daftar Fitur](#daftar-fitur).

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "JavaScript":

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Konfigurasi Node

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parameter

Digunakan untuk meneruskan variable konteks alur atau nilai statis ke dalam script, untuk digunakan oleh logika code dalam script. `name` adalah nama parameter, setelah diteruskan ke script akan menjadi nama variable. `value` adalah nilai parameter, dapat memilih variable atau memasukkan konstanta.

### Isi Script

Isi script dapat dianggap sebagai sebuah fungsi, Anda dapat menulis kode JavaScript apa pun yang didukung pada environment Node.js, dan dapat menggunakan statement `return` untuk mengembalikan sebuah nilai sebagai hasil eksekusi Node, untuk digunakan oleh Node berikutnya sebagai variable.

Setelah menulis kode, Anda dapat membuka dialog test eksekusi melalui tombol test di bawah kotak editor, mengisi parameter dengan nilai statis untuk simulasi eksekusi. Setelah dieksekusi, Anda dapat melihat return value dan output (log) pada dialog.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Pengaturan Timeout

Satuan dalam milidetik. Saat diatur ke `0` berarti tidak ada timeout.

### Lanjutkan Alur Setelah Error

Jika dicentang, jika script error atau timeout error, Node berikutnya tetap akan dieksekusi.

:::info{title="Tips"}
Setelah script error, tidak ada return value, hasil Node akan diisi dengan informasi error. Jika Node berikutnya menggunakan variable hasil Node script, perlu ditangani dengan hati-hati.
:::

## Engine Eksekusi

Node JavaScript Script mendukung dua engine eksekusi, otomatis berganti berdasarkan apakah environment variable `WORKFLOW_SCRIPT_MODULES` dikonfigurasi:

### Mode Aman (default)

Saat environment variable `WORKFLOW_SCRIPT_MODULES` **tidak dikonfigurasi**, script dieksekusi menggunakan engine [isolated-vm](https://github.com/laverdet/isolated-vm). Engine ini menjalankan kode pada environment isolasi V8 yang independen, dengan karakteristik berikut:

- **Tidak mendukung** `require`, tidak dapat mengimport modul apa pun
- **Tidak mendukung** API bawaan Node.js (seperti `process`, `Buffer`, `global`, dll.)
- Hanya dapat menggunakan objek bawaan standar ECMAScript (seperti `JSON`, `Math`, `Promise`, `Date`, dll.)
- Mendukung penerusan data melalui parameter, mendukung output log dengan `console`, mendukung `async`/`await`

Ini adalah mode default yang direkomendasikan, cocok untuk logika komputasi murni dan pemrosesan data, menyediakan tingkat isolasi keamanan tertinggi.

### Mode Tidak Aman (membutuhkan dukungan modul)

Saat environment variable `WORKFLOW_SCRIPT_MODULES` **dikonfigurasi**, script beralih untuk dieksekusi menggunakan engine `vm` bawaan Node.js, untuk mendapatkan kemampuan `require`.

:::warning{title="Peringatan Keamanan"}
Pada mode tidak aman, meskipun script dijalankan dalam sandbox `vm` dan dibatasi modul yang dapat digunakan, modul `vm` Node.js bukan mekanisme sandbox yang aman. Mengaktifkan mode ini berarti memercayai semua user yang memiliki hak untuk mengedit script workflow. Administrator harus mengevaluasi sendiri risiko keamanan, dan ketat mengontrol whitelist modul dan hak edit workflow.
:::

Penggunaan modul dalam script konsisten dengan CommonJS, menggunakan instruksi `require()` dalam kode untuk mengimport modul.

Mendukung modul native Node.js dan modul yang sudah diinstal pada `node_modules` (termasuk dependency package yang sudah digunakan NocoBase). Modul yang akan disediakan untuk kode harus dideklarasikan pada environment variable `WORKFLOW_SCRIPT_MODULES` aplikasi, beberapa nama package dipisahkan dengan koma, contoh:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Tips"}
Modul yang tidak dideklarasikan pada environment variable `WORKFLOW_SCRIPT_MODULES`, meskipun native Node.js atau yang sudah diinstal pada `node_modules`, **tidak dapat** digunakan dalam script. Strategi ini dapat digunakan oleh tim ops untuk mengontrol daftar modul yang dapat digunakan user, untuk menghindari hak script terlalu tinggi pada beberapa skenario.
:::

Pada environment yang tidak deploy dari source code, jika suatu modul belum diinstal pada node_modules, package yang dibutuhkan dapat diinstal manual ke direktori storage. Misalnya saat membutuhkan package `exceljs`, dapat dilakukan operasi berikut:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Kemudian tambahkan path relatif (atau absolute) package tersebut berdasarkan CWD aplikasi (current working directory) ke environment variable `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Maka package `exceljs` dapat digunakan dalam script (nama pada `require` harus persis sama dengan yang didefinisikan pada environment variable):

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

## Daftar Fitur

### Versi Node.js

Sama dengan versi Node.js yang dijalankan oleh aplikasi utama.

### Variable Global

**Tidak mendukung** variable global seperti `global`, `process`, `__dirname`, dan `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Parameter Masuk

Parameter yang dikonfigurasi pada Node akan menjadi variable global pada script, dapat langsung digunakan. Parameter yang masuk ke script hanya mendukung tipe dasar, seperti `boolean`, `number`, `string`, `number`, `object` dan array. Objek `Date` setelah diteruskan akan dikonversi menjadi string format ISO. Tipe kompleks lainnya tidak dapat diteruskan secara langsung, seperti instance kelas kustom dll.

### Return Value

Melalui statement `return` dapat mengembalikan data tipe dasar (aturan sama dengan parameter) ke Node sebagai hasil. Jika kode tidak memanggil statement `return`, eksekusi Node tidak memiliki return value.

```js
return 123;
```

### Output (Log)

**Mendukung** penggunaan `console` untuk output log.

```js
console.log('hello world!');
```

Saat workflow dieksekusi, output Node script juga akan dicatat ke file log workflow yang sesuai.

### Async

**Mendukung** penggunaan `async` untuk mendefinisikan fungsi async, serta `await` untuk memanggil fungsi async. **Mendukung** penggunaan objek global `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timer

Jika perlu menggunakan method seperti `setTimeout`, `setInterval`, atau `setImmediate`, perlu di-import melalui package `timers` Node.js (hanya tersedia dalam mode tidak aman).

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```
