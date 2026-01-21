:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Apa itu FlowEngine?

FlowEngine adalah *engine* pengembangan *front-end* tanpa kode (*no-code*) dan kode rendah (*low-code*) yang baru diperkenalkan di NocoBase 2.0. Ia menggabungkan model (Model) dengan alur (Flow) untuk menyederhanakan logika *front-end* serta meningkatkan kemampuan penggunaan kembali (*reusability*) dan pemeliharaan (*maintainability*). Pada saat yang sama, dengan memanfaatkan kemampuan konfigurasi Flow, ia memberikan kemampuan konfigurasi dan orkestrasi tanpa kode untuk komponen *front-end* dan logika bisnis.

## Mengapa disebut FlowEngine?

Karena di FlowEngine, properti dan logika komponen tidak lagi didefinisikan secara statis, melainkan didorong dan dikelola oleh sebuah **Flow**.

*   **Flow**, seperti aliran data, memecah logika menjadi langkah-langkah (Step) yang berurutan dan menerapkannya pada komponen secara sekuensial;
*   **Engine** menandakan bahwa ini adalah *engine* yang mendorong logika dan interaksi *front-end*.

Oleh karena itu, **FlowEngine = *Engine* logika *front-end* yang didorong oleh *flow***.

## Apa itu Model?

Di FlowEngine, Model adalah model abstrak dari sebuah komponen, yang bertanggung jawab untuk:

*   Mengelola **properti (Props) dan status** komponen;
*   Mendefinisikan **metode *rendering*** komponen;
*   Menampung dan mengeksekusi **Flow**;
*   Menangani secara seragam **pengiriman *event*** dan **siklus hidup (*lifecycle*)**.

Dengan kata lain, **Model adalah otak logis dari komponen**, mengubahnya dari elemen statis menjadi unit dinamis yang dapat dikonfigurasi dan diorkestrasi.

## Apa itu Flow?

Di FlowEngine, **Flow adalah alur logis yang melayani Model**.
Tujuannya adalah:

*   Memecah logika properti atau *event* menjadi langkah-langkah (Step) dan mengeksekusinya secara berurutan seperti sebuah alur;
*   Mengelola perubahan properti serta respons *event*;
*   Membuat logika menjadi **dinamis, dapat dikonfigurasi, dan dapat digunakan kembali**.

## Bagaimana memahami konsep-konsep ini?

Anda dapat membayangkan **Flow** sebagai **aliran air**:

*   **Step seperti simpul di sepanjang jalur aliran air**
    Setiap Step menjalankan tugas kecil (misalnya, mengatur properti, memicu *event*, memanggil API), sama seperti air yang memiliki efek ketika melewati gerbang atau kincir air.

*   **Alur bersifat berurutan**
    Air mengalir di sepanjang jalur yang telah ditentukan dari hulu ke hilir, melewati semua Step secara berurutan; demikian pula, logika dalam Flow dieksekusi sesuai urutan yang ditentukan.

*   **Alur dapat bercabang dan digabungkan**
    Aliran air dapat terbagi menjadi beberapa aliran kecil atau menyatu kembali; Flow juga dapat dipecah menjadi beberapa sub-alur atau digabungkan menjadi rantai logis yang lebih kompleks.

*   **Alur dapat dikonfigurasi dan dikendalikan**
    Arah dan volume aliran air dapat disesuaikan dengan pintu air; metode eksekusi dan parameter Flow juga dapat dikendalikan melalui konfigurasi (stepParams).

Ringkasan Analogi

*   **Komponen** seperti kincir air yang membutuhkan aliran air untuk berputar;
*   **Model** adalah dasar dan pengontrol kincir air ini, bertanggung jawab untuk menerima air dan mendorong operasinya;
*   **Flow** adalah aliran air tersebut, yang melewati setiap Step secara berurutan, menyebabkan komponen terus berubah dan merespons.

Jadi di FlowEngine:

*   **Flow memungkinkan logika bergerak secara alami seperti aliran air**;
*   **Model menjadikan komponen sebagai pembawa dan pelaksana aliran ini**.