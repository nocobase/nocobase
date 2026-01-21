:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Apa itu FlowEngine?

FlowEngine adalah mesin pengembangan *no-code/low-code* *front-end* terbaru yang diperkenalkan di NocoBase 2.0. Mesin ini menggabungkan Model dan Flow untuk menyederhanakan logika *front-end* serta meningkatkan *reusability* dan *maintainability*. Selain itu, dengan memanfaatkan kemampuan konfigurasi Flow, FlowEngine memberikan kemampuan konfigurasi dan orkestrasi *no-code* untuk komponen *front-end* dan logika bisnis.

## Mengapa disebut FlowEngine?

Karena di FlowEngine, properti dan logika komponen tidak lagi didefinisikan secara statis, melainkan didorong dan dikelola oleh **Flow**.

*   **Flow**, seperti aliran data, memecah logika menjadi langkah-langkah (Step) yang berurutan dan diterapkan secara progresif pada komponen.
*   **Engine** menunjukkan bahwa ini adalah mesin yang mendorong logika dan interaksi *front-end*.

Jadi, **FlowEngine = Mesin logika *front-end* yang didorong oleh Flow**.

## Apa itu Model?

Di FlowEngine, Model adalah model abstrak dari sebuah komponen, yang bertanggung jawab untuk:

*   Mengelola **properti (Props) dan status** komponen;
*   Mendefinisikan **metode *rendering*** komponen;
*   Menampung dan mengeksekusi **Flow**;
*   Menangani **pengiriman *event*** dan **siklus hidup** secara terpadu.

Dengan kata lain, **Model adalah otak logis dari sebuah komponen**, mengubahnya dari unit statis menjadi unit dinamis yang dapat dikonfigurasi dan diorkestrasi.

## Apa itu Flow?

Di FlowEngine, **Flow adalah aliran logika yang melayani Model**.
Tujuannya adalah untuk:

*   Memecah logika properti atau *event* menjadi langkah-langkah (Step) dan mengeksekusinya secara berurutan dalam sebuah aliran;
*   Mengelola perubahan properti serta respons *event*;
*   Membuat logika menjadi **dinamis, dapat dikonfigurasi, dan dapat digunakan kembali**.

## Bagaimana memahami konsep-konsep ini?

Anda bisa membayangkan **Flow** sebagai **aliran air**:

*   **Step seperti titik di sepanjang aliran air**
    Setiap Step menjalankan tugas kecil (misalnya, mengatur properti, memicu *event*, memanggil API), sama seperti aliran air yang memiliki efek saat melewati pintu air atau kincir air.

*   **Aliran bersifat berurutan**
    Aliran air mengikuti jalur yang telah ditentukan dari hulu ke hilir, melewati semua Step secara berurutan; demikian pula, logika dalam Flow dieksekusi sesuai urutan yang didefinisikan.

*   **Aliran dapat bercabang dan digabungkan**
    Satu aliran air dapat terbagi menjadi beberapa aliran kecil atau bergabung kembali; Flow juga dapat dipecah menjadi beberapa sub-Flow atau digabungkan menjadi rantai logika yang lebih kompleks.

*   **Aliran dapat dikonfigurasi dan dikendalikan**
    Arah dan volume aliran air dapat diatur dengan pintu air; metode eksekusi dan parameter Flow juga dapat dikendalikan melalui konfigurasi (*stepParams*).

Ringkasan Analogi

*   **Komponen** seperti kincir air yang membutuhkan aliran air untuk berputar;
*   **Model** adalah dasar dan pengontrol kincir air ini, bertanggung jawab untuk menerima aliran air dan mendorong operasinya;
*   **Flow** adalah aliran air itu sendiri, melewati setiap Step secara berurutan, mendorong komponen untuk terus berubah dan merespons.

Jadi, di FlowEngine:

*   **Flow memungkinkan logika bergerak secara alami seperti aliran air**;
*   **Model memungkinkan komponen menjadi pembawa dan pelaksana aliran ini**.