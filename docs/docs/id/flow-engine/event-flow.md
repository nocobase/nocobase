:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Alur Peristiwa

Di FlowEngine, semua komponen antarmuka bersifat **event-driven**.
Perilaku, interaksi, dan perubahan data komponen dipicu oleh peristiwa (Event) dan dieksekusi melalui alur (Flow).

## Alur Statis vs. Alur Dinamis

Di FlowEngine, alur (Flow) dapat dibagi menjadi dua jenis:

### **1. Alur Statis (Static Flow)**

- Didefinisikan oleh pengembang dalam kode;
- Beraksi pada **semua instans kelas Model**;
- Umumnya digunakan untuk menangani logika umum dari suatu kelas Model;

### **2. Alur Dinamis (Dynamic Flow)**

- Dikonfigurasi oleh pengguna pada antarmuka;
- Hanya berlaku untuk instans tertentu;
- Umumnya digunakan untuk perilaku yang dipersonalisasi dalam skenario tertentu;

Singkatnya: **Alur statis adalah templat logika yang didefinisikan pada sebuah kelas, sedangkan alur dinamis adalah logika yang dipersonalisasi yang didefinisikan pada sebuah instans.**

## Aturan Keterkaitan vs. Alur Dinamis

Dalam sistem konfigurasi FlowEngine, ada dua cara untuk mengimplementasikan logika peristiwa:

### **1. Aturan Keterkaitan (Linkage Rules)**

- Merupakan **enkapsulasi langkah-langkah alur peristiwa bawaan**;
- Lebih mudah dikonfigurasi dan lebih semantik;
- Pada dasarnya, ini masih merupakan bentuk sederhana dari **alur peristiwa (Flow)**.

### **2. Alur Dinamis (Dynamic Flow)**

- Kemampuan konfigurasi Flow yang lengkap;
- Dapat disesuaikan:
  - **Pemicu (on)**: Mendefinisikan kapan harus memicu;
  - **Langkah-langkah eksekusi (steps)**: Mendefinisikan logika yang akan dieksekusi;
- Cocok untuk logika bisnis yang lebih kompleks dan fleksibel.

Oleh karena itu, **Aturan Keterkaitan ≈ Alur Peristiwa Sederhana**, dan mekanisme intinya konsisten.

## Konsistensi FlowAction

Baik **Aturan Keterkaitan** maupun **Alur Peristiwa** harus menggunakan kumpulan **FlowAction** yang sama.
Artinya:

- **FlowAction** mendefinisikan tindakan yang dapat dipanggil oleh Flow;
- Keduanya berbagi satu sistem tindakan, alih-alih mengimplementasikan dua sistem yang terpisah;
- Ini memastikan penggunaan ulang logika dan ekstensi yang konsisten.

## Hierarki Konseptual

Secara konseptual, hubungan abstrak inti dari FlowModel adalah sebagai berikut:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Peristiwa Global (Global Events)
      │     └── Peristiwa Lokal (Local Events)
      └── FlowActionDefinition
            ├── Tindakan Global (Global Actions)
            └── Tindakan Lokal (Local Actions)
```

### Deskripsi Hierarki

- **FlowModel**  
  Merepresentasikan entitas model dengan logika alur yang dapat dikonfigurasi dan dieksekusi.

- **FlowDefinition**  
  Mendefinisikan serangkaian logika alur lengkap (termasuk kondisi pemicu dan langkah-langkah eksekusi).

- **FlowEventDefinition**  
  Mendefinisikan sumber pemicu alur, meliputi:
  - **Peristiwa global**: seperti startup aplikasi, penyelesaian pemuatan data;
  - **Peristiwa lokal**: seperti perubahan bidang, klik tombol.

- **FlowActionDefinition**  
  Mendefinisikan tindakan yang dapat dieksekusi oleh alur, meliputi:
  - **Tindakan global**: seperti menyegarkan halaman, notifikasi global;
  - **Tindakan lokal**: seperti memodifikasi nilai bidang, mengubah status komponen.

## Ringkasan

| Konsep | Tujuan | Lingkup |
|------|------|-----------|
| **Alur Statis (Static Flow)** | Logika alur yang didefinisikan dalam kode | Semua instans XXModel |
| **Alur Dinamis (Dynamic Flow)** | Logika alur yang didefinisikan pada antarmuka | Satu instans FlowModel |
| **FlowEvent** | Mendefinisikan pemicu (kapan harus memicu) | Global atau lokal |
| **FlowAction** | Mendefinisikan logika eksekusi | Global atau lokal |
| **Aturan Keterkaitan (Linkage Rule)** | Enkapsulasi langkah alur peristiwa yang disederhanakan | Tingkat blok, tindakan |