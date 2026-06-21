---
title: "Ikhtisar FlowEngine"
description: "FlowEngine adalah engine pengembangan no-code/low-code frontend NocoBase 2.0 yang menggabungkan Model dan Flow untuk menyederhanakan logika frontend dan orkestrasi yang dapat dikonfigurasi, mendukung FlowModel, event flow, dan ekstensi JS Model."
keywords: "FlowEngine,no-code,low-code,FlowModel,Flow,event flow,orkestrasi,frontend engine,NocoBase"
---

# Apa itu FlowEngine?

FlowEngine adalah engine pengembangan frontend no-code dan low-code yang baru diperkenalkan pada NocoBase 2.0. Engine ini menggabungkan Model dan Flow untuk menyederhanakan logika frontend serta meningkatkan reusabilitas dan kemudahan pemeliharaan. Pada saat yang sama, dengan kemampuan konfigurasi Flow, FlowEngine memberikan kemampuan konfigurasi dan orkestrasi tanpa kode kepada komponen frontend dan logika bisnis.

## Mengapa disebut FlowEngine?

Karena di dalam FlowEngine, properti dan logika komponen tidak lagi didefinisikan secara statis, melainkan didorong dan dikelola melalui **Flow**.

* **Flow** seperti aliran data yang memecah logika menjadi langkah-langkah berurutan (Step), yang secara bertahap memengaruhi komponen;
* **Engine** menyatakan bahwa ini adalah engine yang menggerakkan logika frontend dan interaksi.

Jadi, **FlowEngine = engine logika frontend yang digerakkan oleh flow**.

## Apa itu Model?

Di dalam FlowEngine, Model adalah model abstrak dari komponen, yang bertanggung jawab untuk:

* Mengelola **Props dan state** komponen;
* Mendefinisikan **cara render** komponen;
* Membawa dan menjalankan **Flow**;
* Menangani **dispatch event** dan **lifecycle** secara terpadu.

Dengan kata lain, **Model adalah otak logika dari komponen**, yang membuat komponen berubah dari statis menjadi unit dinamis yang dapat dikonfigurasi dan diorkestrasi.

## Apa itu Flow?

Di dalam FlowEngine, **Flow adalah aliran logika yang melayani Model**.
Fungsinya adalah:

* Memecah logika properti atau event menjadi langkah-langkah (Step), yang dieksekusi secara berurutan dalam bentuk flow;
* Dapat mengelola perubahan properti, juga dapat mengelola respons event;
* Membuat logika menjadi **dinamis, dapat dikonfigurasi, dan dapat digunakan ulang**.

## Bagaimana memahami konsep-konsep ini?

Anda dapat membayangkan **Flow** sebagai **aliran air**:

* **Step seperti node yang dilalui aliran air**
  Setiap Step menjalankan tugas kecil (misalnya mengatur properti, memicu event, memanggil API), seperti aliran air yang menggerakkan pintu air atau kincir air saat melewatinya.

* **Aliran bersifat berurutan**
  Aliran air mengikuti jalur yang telah ditentukan dari hulu ke hilir, melewati semua Step secara berurutan; demikian pula, logika dalam Flow akan dieksekusi sesuai urutan yang didefinisikan.

* **Aliran dapat bercabang dan digabungkan**
  Satu aliran air dapat terbagi menjadi beberapa aliran kecil, atau dapat menyatu kembali; Flow juga dapat dipecah menjadi beberapa sub-flow, atau digabungkan menjadi rantai logika yang lebih kompleks.

* **Aliran dapat dikonfigurasi dan dikendalikan**
  Arah dan debit aliran air dapat diatur melalui pintu air; cara eksekusi dan parameter Flow juga dapat dikontrol melalui konfigurasi (stepParams).

Ringkasan analogi

* **Komponen** seperti kincir air yang membutuhkan dorongan aliran air untuk berputar;
* **Model** adalah dudukan dan pengontrol kincir air ini, yang bertanggung jawab menerima aliran dan menggerakkan operasi;
* **Flow** adalah aliran air itu sendiri, yang melewati setiap Step secara berurutan, mendorong komponen agar terus berubah dan merespons.

Jadi di dalam FlowEngine:

* **Flow membuat logika mengalir secara alami seperti aliran air**;
* **Model membuat komponen menjadi pembawa dan pelaksana aliran**.
