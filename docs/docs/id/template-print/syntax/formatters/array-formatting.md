:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

### Pemformatan Array

#### 1. :arrayJoin(separator, index, count)

##### Penjelasan Sintaksis
Menggabungkan array berisi string atau angka menjadi satu string.  
Parameter:
- **separator:** Pemisah (nilai default adalah koma `,`).
- **index:** Opsional; indeks awal untuk memulai penggabungan.
- **count:** Opsional; jumlah item yang akan digabungkan mulai dari `index` (bisa berupa angka negatif untuk menghitung dari akhir).

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
Hasilnya adalah string yang dibuat dengan menggabungkan elemen array sesuai dengan parameter yang ditentukan.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Penjelasan Sintaksis
Mengubah array objek menjadi string. Fungsi ini tidak memproses objek atau array bertingkat (nested).  
Parameter:
- **objSeparator:** Pemisah antar objek (nilai default adalah `, `).
- **attSeparator:** Pemisah antar atribut objek (nilai default adalah `:`).
- **attributes:** Opsional; daftar atribut objek yang akan ditampilkan.

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
Hasilnya adalah string yang dihasilkan dengan memetakan dan menggabungkan elemen array, mengabaikan konten objek bertingkat.

#### 3. :count(start)

##### Penjelasan Sintaksis
Menghitung nomor baris dalam sebuah array dan menampilkan nomor baris saat ini.  
Contoh:
```
{d[i].id:count()}
```  
Terlepas dari nilai `id`, ini akan menampilkan hitungan baris saat ini.  
Mulai dari v4.0.0, pemformat ini secara internal telah digantikan oleh `:cumCount`.

Parameter:
- **start:** Opsional; nilai awal untuk hitungan.

##### Contoh dan Hasil
Saat digunakan, nomor baris yang ditampilkan akan sesuai dengan urutan elemen array.