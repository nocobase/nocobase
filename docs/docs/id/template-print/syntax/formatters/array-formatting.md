---
title: "Template Print - Format Array"
description: "Formatter Format Array Template Print: arrayJoin menggabungkan array menjadi string, mendukung parameter delimiter, indeks, jumlah."
keywords: "Template Print,Format Array,arrayJoin,NocoBase"
---

### Format Array

#### 1. :arrayJoin(separator, index, count)

##### Penjelasan Sintaks
Menggabungkan array string atau angka menjadi satu string.  
Parameter:
- separator: Delimiter (default koma `,`)
- index: Opsional, mulai bergabung dari indeks ini
- count: Opsional, jumlah item yang digabung dimulai dari index (dapat negatif, berarti dihitung dari akhir)

##### Contoh
```
['homer','bart','lisa']:arrayJoin()              // Output "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Output "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Output "homerbartlisa"
[10,50]:arrayJoin()                               // Output "10, 50"
[]:arrayJoin()                                    // Output ""
null:arrayJoin()                                  // Output null
{}:arrayJoin()                                    // Output {}
20:arrayJoin()                                    // Output 20
undefined:arrayJoin()                             // Output undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Output "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Output "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Output "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Output "homerbart"
```

##### Hasil
Output adalah string setelah digabungkan berdasarkan parameter.


#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Penjelasan Sintaks
Mengkonversi array objek menjadi string, tidak memproses objek atau array bersarang.  
Parameter:
- objSeparator: Delimiter antar objek (default `, `)
- attSeparator: Delimiter antar properti objek (default `:`)
- attributes: Opsional, menentukan daftar properti objek yang akan di-output

##### Contoh
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Output "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Output "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Output "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Output "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Output "2:homer"

['homer','bart','lisa']:arrayMap()    // Output "homer, bart, lisa"
[10,50]:arrayMap()                    // Output "10, 50"
[]:arrayMap()                         // Output ""
null:arrayMap()                       // Output null
{}:arrayMap()                         // Output {}
20:arrayMap()                         // Output 20
undefined:arrayMap()                  // Output undefined
```

##### Hasil
Output adalah string yang digabungkan, mengabaikan konten bersarang dalam objek.


#### 3. :count(start)

##### Penjelasan Sintaks
Menghitung nomor baris dalam array, dan output nomor baris saat ini.  
Contoh:
```
{d[i].id:count()}
```  
Tidak peduli nilai `id`, semua output hitungan baris saat ini.  
Sejak v4.0.0, formatter ini secara internal telah diganti dengan `:cumCount`.

Parameter:
- start: Opsional, nilai awal hitungan

##### Contoh dan Hasil
Saat penggunaan spesifik, nomor baris yang di-output akan ditampilkan sesuai urutan elemen array.


