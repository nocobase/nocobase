:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

### Pemformatan Angka

#### 1. :formatN(precision)

##### Penjelasan Sintaks
Memformat angka sesuai dengan pengaturan lokalisasi.
Parameter:
- precision: Jumlah angka di belakang koma (desimal).
  Untuk format ODS/XLSX, jumlah angka desimal yang ditampilkan ditentukan oleh editor teks; sedangkan untuk format lain, parameter ini digunakan.

##### Contoh
```
// Contoh lingkungan: API options { "lang": "en-us" }
'10':formatN()         // Output "10.000"
'1000.456':formatN()   // Output "1,000.456"
```

##### Hasil
Angka akan ditampilkan sesuai dengan presisi yang ditentukan dan format lokalisasi.


#### 2. :round(precision)

##### Penjelasan Sintaks
Membulatkan angka ke jumlah angka desimal yang ditentukan oleh parameter.

##### Contoh
```
10.05123:round(2)      // Output 10.05
1.05:round(1)          // Output 1.1
```

##### Hasil
Hasilnya adalah angka yang telah dibulatkan.


#### 3. :add(value)

##### Penjelasan Sintaks
Menambahkan nilai yang ditentukan ke angka saat ini.
Parameter:
- value: Angka yang akan ditambahkan.

##### Contoh
```
1000.4:add(2)         // Output 1002.4
'1000.4':add('2')      // Output 1002.4
```

##### Hasil
Hasilnya adalah jumlah dari angka saat ini dan nilai yang ditentukan.


#### 4. :sub(value)

##### Penjelasan Sintaks
Mengurangi angka saat ini dengan nilai yang ditentukan.
Parameter:
- value: Angka pengurang.

##### Contoh
```
1000.4:sub(2)         // Output 998.4
'1000.4':sub('2')      // Output 998.4
```

##### Hasil
Hasilnya adalah angka saat ini dikurangi nilai yang ditentukan.


#### 5. :mul(value)

##### Penjelasan Sintaks
Mengalikan angka saat ini dengan nilai yang ditentukan.
Parameter:
- value: Angka pengali.

##### Contoh
```
1000.4:mul(2)         // Output 2000.8
'1000.4':mul('2')      // Output 2000.8
```

##### Hasil
Hasilnya adalah perkalian angka saat ini dengan nilai yang ditentukan.


#### 6. :div(value)

##### Penjelasan Sintaks
Membagi angka saat ini dengan nilai yang ditentukan.
Parameter:
- value: Angka pembagi.

##### Contoh
```
1000.4:div(2)         // Output 500.2
'1000.4':div('2')      // Output 500.2
```

##### Hasil
Hasilnya adalah pembagian angka saat ini dengan nilai yang ditentukan.


#### 7. :mod(value)

##### Penjelasan Sintaks
Menghitung modulus (sisa bagi) dari angka saat ini terhadap nilai yang ditentukan.
Parameter:
- value: Angka modulus (pembagi).

##### Contoh
```
4:mod(2)              // Output 0
3:mod(2)              // Output 1
```

##### Hasil
Hasilnya adalah sisa dari operasi modulus.


#### 8. :abs

##### Penjelasan Sintaks
Mengembalikan nilai absolut dari angka.

##### Contoh
```
-10:abs()             // Output 10
-10.54:abs()          // Output 10.54
10.54:abs()           // Output 10.54
'-200':abs()          // Output 200
```

##### Hasil
Hasilnya adalah nilai absolut.


#### 9. :ceil

##### Penjelasan Sintaks
Membulatkan angka ke atas, yaitu mengembalikan bilangan bulat terkecil yang lebih besar dari atau sama dengan angka saat ini.

##### Contoh
```
10.05123:ceil()       // Output 11
1.05:ceil()           // Output 2
-1.05:ceil()          // Output -1
```

##### Hasil
Hasilnya adalah bilangan bulat yang dibulatkan ke atas.


#### 10. :floor

##### Penjelasan Sintaks
Membulatkan angka ke bawah, yaitu mengembalikan bilangan bulat terbesar yang lebih kecil dari atau sama dengan angka saat ini.

##### Contoh
```
10.05123:floor()      // Output 10
1.05:floor()          // Output 1
-1.05:floor()         // Output -2
```

##### Hasil
Hasilnya adalah bilangan bulat yang dibulatkan ke bawah.


#### 11. :int

##### Penjelasan Sintaks
Mengonversi angka menjadi bilangan bulat (tidak direkomendasikan untuk digunakan).

##### Contoh dan Hasil
Tergantung pada kasus konversi spesifik.


#### 12. :toEN

##### Penjelasan Sintaks
Mengonversi angka ke format bahasa Inggris (menggunakan `.` sebagai pemisah desimal). Tidak direkomendasikan untuk digunakan.

##### Contoh dan Hasil
Tergantung pada kasus konversi spesifik.


#### 13. :toFixed

##### Penjelasan Sintaks
Mengonversi angka menjadi string, hanya mempertahankan jumlah angka desimal yang ditentukan. Tidak direkomendasikan untuk digunakan.

##### Contoh dan Hasil
Tergantung pada kasus konversi spesifik.


#### 14. :toFR

##### Penjelasan Sintaks
Mengonversi angka ke format bahasa Prancis (menggunakan `,` sebagai pemisah desimal). Tidak direkomendasikan untuk digunakan.

##### Contoh dan Hasil
Tergantung pada kasus konversi spesifik.