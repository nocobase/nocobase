---
title: "Template Print - Format Teks"
description: "Formatter Format Teks Template Print: lowerCase, upperCase, trim, replace, dan konversi serta pemrosesan teks lainnya."
keywords: "Template Print,Format Teks,lowerCase,upperCase,NocoBase"
---

### Format Teks

Untuk data teks tersedia berbagai formatter, di bawah ini diperkenalkan sintaks, contoh, dan hasil setiap formatter.

#### 1. :lowerCase

##### Penjelasan Sintaks
Mengkonversi semua huruf menjadi huruf kecil.

##### Contoh
```
'My Car':lowerCase()   // Output "my car"
'my car':lowerCase()   // Output "my car"
null:lowerCase()       // Output null
1203:lowerCase()       // Output 1203
```

##### Hasil
Output setiap contoh seperti yang ditunjukkan dalam komentar.


#### 2. :upperCase

##### Penjelasan Sintaks
Mengkonversi semua huruf menjadi huruf besar.

##### Contoh
```
'My Car':upperCase()   // Output "MY CAR"
'my car':upperCase()   // Output "MY CAR"
null:upperCase()       // Output null
1203:upperCase()       // Output 1203
```

##### Hasil
Output setiap contoh seperti yang ditunjukkan dalam komentar.


#### 3. :ucFirst

##### Penjelasan Sintaks
Hanya mengkonversi huruf pertama string menjadi huruf besar, sisanya tetap.

##### Contoh
```
'My Car':ucFirst()     // Output "My Car"
'my car':ucFirst()     // Output "My car"
null:ucFirst()         // Output null
undefined:ucFirst()    // Output undefined
1203:ucFirst()         // Output 1203
```

##### Hasil
Lihat penjelasan komentar.


#### 4. :ucWords

##### Penjelasan Sintaks
Mengkonversi huruf pertama setiap kata dalam string menjadi huruf besar.

##### Contoh
```
'my car':ucWords()     // Output "My Car"
'My cAR':ucWords()     // Output "My CAR"
null:ucWords()         // Output null
undefined:ucWords()    // Output undefined
1203:ucWords()         // Output 1203
```

##### Hasil
Lihat hasil dalam contoh.


#### 5. :print(message)

##### Penjelasan Sintaks
Selalu mengembalikan pesan yang ditentukan, tidak peduli data aslinya, digunakan sebagai formatter fallback.  
Parameter:
- message: Teks yang akan diprint

##### Contoh
```
'My Car':print('hello!')   // Output "hello!"
'my car':print('hello!')   // Output "hello!"
null:print('hello!')       // Output "hello!"
1203:print('hello!')       // Output "hello!"
```

##### Hasil
Semua mengembalikan string "hello!" yang ditentukan.


#### 6. :printJSON

##### Penjelasan Sintaks
Mengkonversi objek atau array menjadi output string format JSON.

##### Contoh
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Output "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Output ""my car""
```

##### Hasil
Output dalam contoh adalah string JSON setelah dikonversi.


#### 7. :unaccent

##### Penjelasan Sintaks
Menghapus tanda aksen dari teks, membuat teks menjadi format tanpa aksen.

##### Contoh
```
'crÃ¨me brulÃ©e':unaccent()   // Output "creme brulee"
'CRÃME BRULÃE':unaccent()   // Output "CREME BRULEE"
'Ãªtre':unaccent()           // Output "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Output "euieea"
```

##### Hasil
Setiap contoh output telah menghapus tanda aksen.


#### 8. :convCRLF

##### Penjelasan Sintaks
Mengkonversi carriage return line feed dalam teks menjadi tanda line break dalam dokumen, cocok untuk format DOCX, PPTX, ODT, ODP, dan ODS.  
Perhatian: Saat menggunakan `:html` sebelum formatter `:convCRLF`, akan dikonversi menjadi tag `<br>`.

##### Contoh
```
// Untuk format ODT:
'my blue 
 car':convCRLF()    // Output "my blue <text:line-break/> car"

// Untuk format DOCX:
'my blue 
 car':convCRLF()    // Output "my blue </w:t><w:br/><w:t> car"
```

##### Hasil
Output menampilkan tanda line break sesuai format dokumen yang berbeda.


#### 9. :substr(begin, end, wordMode)

##### Penjelasan Sintaks
Melakukan operasi cut pada string, dimulai dari indeks `begin` (berbasis 0), berakhir sebelum indeks `end`.  
Parameter opsional `wordMode` (boolean atau `last`) digunakan untuk mengontrol apakah menjaga kelengkapan kata, tidak memutus di tengah kata.

##### Contoh
```
'foobar':substr(0, 3)            // Output "foo"
'foobar':substr(1)               // Output "oobar"
'foobar':substr(-2)              // Output "ar"
'foobar':substr(2, -1)           // Output "oba"
'abcd efg hijklm':substr(0, 11, true)  // Output "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Output "abcd efg "
```

##### Hasil
Berdasarkan parameter yang berbeda, output potongan string yang sesuai.


#### 10. :split(delimiter)

##### Penjelasan Sintaks
Memisahkan string menjadi array dengan delimiter `delimiter` yang ditentukan.  
Parameter:
- delimiter: String pemisah

##### Contoh
```
'abcdefc12':split('c')    // Output ["ab", "def", "12"]
1222.1:split('.')         // Output ["1222", "1"]
'ab/cd/ef':split('/')      // Output ["ab", "cd", "ef"]
```

##### Hasil
Hasil contoh adalah array setelah dipisahkan.


#### 11. :padl(targetLength, padString)

##### Penjelasan Sintaks
Mengisi karakter dari sisi kiri string, sehingga panjang string akhir mencapai `targetLength`.  
Jika panjang target lebih kecil dari panjang string asli, mengembalikan string asli.  
Parameter:
- targetLength: Panjang total target
- padString: String yang digunakan untuk mengisi, default spasi

##### Contoh
```
'abc':padl(10)              // Output "       abc"
'abc':padl(10, 'foo')       // Output "foofoofabc"
'abc':padl(6, '123465')     // Output "123abc"
'abc':padl(8, '0')          // Output "00000abc"
'abc':padl(1)               // Output "abc"
```

##### Hasil
Output setiap contoh adalah string setelah pengisian.


#### 12. :padr(targetLength, padString)

##### Penjelasan Sintaks
Mengisi karakter dari sisi kanan string, sehingga panjang string akhir mencapai `targetLength`.  
Parameter sama seperti di atas.

##### Contoh
```
'abc':padr(10)              // Output "abc       "
'abc':padr(10, 'foo')       // Output "abcfoofoof"
'abc':padr(6, '123465')     // Output "abc123"
'abc':padr(8, '0')          // Output "abc00000"
'abc':padr(1)               // Output "abc"
```

##### Hasil
Output adalah string setelah pengisian sisi kanan.


#### 13. :ellipsis(maximum)

##### Penjelasan Sintaks
Jika teks melebihi jumlah karakter yang ditentukan, tambahkan tanda elipsis "..." di akhir.  
Parameter:
- maximum: Jumlah karakter maksimum yang diperbolehkan

##### Contoh
```
'abcdef':ellipsis(3)      // Output "abc..."
'abcdef':ellipsis(6)      // Output "abcdef"
'abcdef':ellipsis(10)     // Output "abcdef"
```

##### Hasil
Hasil contoh adalah teks yang dipotong dan ditambahkan elipsis.


#### 14. :prepend(textToPrepend)

##### Penjelasan Sintaks
Menambahkan prefix yang ditentukan sebelum teks.  
Parameter:
- textToPrepend: Teks prefix

##### Contoh
```
'abcdef':prepend('123')     // Output "123abcdef"
```

##### Hasil
Output adalah string setelah ditambahkan prefix.


#### 15. :append(textToAppend)

##### Penjelasan Sintaks
Menambahkan suffix yang ditentukan setelah teks.  
Parameter:
- textToAppend: Teks suffix

##### Contoh
```
'abcdef':append('123')      // Output "abcdef123"
```

##### Hasil
Output adalah string setelah ditambahkan suffix.


#### 16. :replace(oldText, newText)

##### Penjelasan Sintaks
Mengganti semua kemunculan `oldText` dalam teks dengan `newText`.  
Parameter:
- oldText: Teks lama yang akan diganti
- newText: Teks baru sebagai pengganti  
  Perhatian: Jika newText adalah null, berarti menghapus item yang cocok.

##### Contoh
```
'abcdef abcde':replace('cd', 'OK')    // Output "abOKef abOKe"
'abcdef abcde':replace('cd')          // Output "abef abe"
'abcdef abcde':replace('cd', null)      // Output "abef abe"
'abcdef abcde':replace('cd', 1000)      // Output "ab1000ef ab1000e"
```

##### Hasil
Hasil output adalah string setelah penggantian.


#### 17. :len

##### Penjelasan Sintaks
Mengembalikan panjang string atau array.

##### Contoh
```
'Hello World':len()     // Output 11
'':len()                // Output 0
[1,2,3,4,5]:len()       // Output 5
[1,'Hello']:len()       // Output 2
```

##### Hasil
Output adalah nilai panjang yang sesuai.


#### 18. :t

##### Penjelasan Sintaks
Menerjemahkan teks berdasarkan kamus terjemahan.  
Contoh dan hasil tergantung pada konfigurasi kamus terjemahan aktual.


#### 19. :preserveCharRef

##### Penjelasan Sintaks
Secara default, akan menghapus beberapa karakter ilegal dalam XML (seperti &, >, <, dll.), formatter ini dapat mempertahankan referensi karakter (contoh `&#xa7;` tetap), cocok untuk skenario generate XML tertentu.  
Contoh dan hasil tergantung pada skenario penggunaan spesifik.


