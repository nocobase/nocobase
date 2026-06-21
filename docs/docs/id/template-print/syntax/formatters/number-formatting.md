---
title: "Template Print - Format Angka"
description: "Formatter Format Angka Template Print: formatN memformat angka berdasarkan pengaturan localization, mendukung jumlah desimal."
keywords: "Template Print,Format Angka,formatN,NocoBase"
---

### Format Angka

#### 1. :formatN(precision)

##### Penjelasan Sintaks
Memformat angka berdasarkan pengaturan localization.  
Parameter:
- precision: Jumlah desimal  
  Untuk format ODS/XLSX, jumlah desimal yang ditampilkan ditentukan oleh text editor; format lain bergantung pada parameter ini.

##### Contoh
```
'10':formatN()         // Output "10.000"
'1000.456':formatN()   // Output "1,000.456"
```

##### Hasil
Angka di-output sesuai presisi dan format localization yang ditentukan.


#### 2. :round(precision)

##### Penjelasan Sintaks
Membulatkan angka, parameter menentukan jumlah desimal.

##### Contoh
```
10.05123:round(2)      // Output 10.05
1.05:round(1)          // Output 1.1
```

##### Hasil
Output adalah nilai setelah pembulatan.


#### 3. :add(value)

##### Penjelasan Sintaks
Menambahkan angka saat ini dengan nilai yang ditentukan.  
Parameter:
- value: Angka penambah

##### Contoh
```
1000.4:add(2)         // Output 1002.4
'1000.4':add('2')      // Output 1002.4
```

##### Hasil
Output adalah nilai setelah penjumlahan.


#### 4. :sub(value)

##### Penjelasan Sintaks
Mengurangi angka saat ini dengan nilai yang ditentukan.  
Parameter:
- value: Angka pengurang

##### Contoh
```
1000.4:sub(2)         // Output 998.4
'1000.4':sub('2')      // Output 998.4
```

##### Hasil
Output adalah nilai setelah pengurangan.


#### 5. :mul(value)

##### Penjelasan Sintaks
Mengalikan angka saat ini dengan nilai yang ditentukan.  
Parameter:
- value: Angka pengali

##### Contoh
```
1000.4:mul(2)         // Output 2000.8
'1000.4':mul('2')      // Output 2000.8
```

##### Hasil
Output adalah nilai setelah perkalian.


#### 6. :div(value)

##### Penjelasan Sintaks
Membagi angka saat ini dengan nilai yang ditentukan.  
Parameter:
- value: Angka pembagi

##### Contoh
```
1000.4:div(2)         // Output 500.2
'1000.4':div('2')      // Output 500.2
```

##### Hasil
Output adalah nilai setelah pembagian.


#### 7. :mod(value)

##### Penjelasan Sintaks
Menghitung modulo (sisa bagi) dari angka saat ini terhadap nilai yang ditentukan.  
Parameter:
- value: Angka modulo

##### Contoh
```
4:mod(2)              // Output 0
3:mod(2)              // Output 1
```

##### Hasil
Output adalah hasil operasi modulo.


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
Output adalah nilai absolut.


#### 9. :ceil

##### Penjelasan Sintaks
Pembulatan ke atas, yaitu mengembalikan integer terkecil yang lebih besar dari atau sama dengan angka saat ini.

##### Contoh
```
10.05123:ceil()       // Output 11
1.05:ceil()           // Output 2
-1.05:ceil()          // Output -1
```

##### Hasil
Output adalah integer setelah pembulatan.


#### 10. :floor

##### Penjelasan Sintaks
Pembulatan ke bawah, yaitu mengembalikan integer terbesar yang lebih kecil dari atau sama dengan angka saat ini.

##### Contoh
```
10.05123:floor()      // Output 10
1.05:floor()          // Output 1
-1.05:floor()         // Output -2
```

##### Hasil
Output adalah integer setelah pembulatan.


#### 11. :int

##### Penjelasan Sintaks
Mengkonversi angka menjadi integer (tidak direkomendasikan).

##### Contoh dan Hasil
Tergantung pada situasi konversi spesifik.


#### 12. :toEN

##### Penjelasan Sintaks
Mengkonversi angka ke format Inggris (titik desimal '.'), tidak direkomendasikan.

##### Contoh dan Hasil
Tergantung pada situasi konversi spesifik.


#### 13. :toFixed

##### Penjelasan Sintaks
Mengkonversi angka menjadi string, hanya mempertahankan jumlah desimal yang ditentukan, tidak direkomendasikan.

##### Contoh dan Hasil
Tergantung pada situasi konversi spesifik.


#### 14. :toFR

##### Penjelasan Sintaks
Mengkonversi angka ke format Prancis (titik desimal ','), tidak direkomendasikan.

##### Contoh dan Hasil
Tergantung pada situasi konversi spesifik.


