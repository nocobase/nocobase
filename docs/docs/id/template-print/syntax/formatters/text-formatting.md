:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

### Pemformatan Teks

Bagian ini menyediakan berbagai pemformat untuk data teks. Sub-bagian berikut akan memperkenalkan sintaksis, contoh, dan hasil dari setiap pemformat secara berurutan.

#### 1. :lowerCase

##### Sintaksis
Mengubah semua huruf menjadi huruf kecil.

##### Contoh
```
'My Car':lowerCase()   // Output "my car"
'my car':lowerCase()   // Output "my car"
null:lowerCase()       // Output null
1203:lowerCase()       // Output 1203
```

##### Hasil
Setiap contoh menghasilkan output seperti yang ditunjukkan dalam komentar.

#### 2. :upperCase

##### Sintaksis
Mengubah semua huruf menjadi huruf kapital.

##### Contoh
```
'My Car':upperCase()   // Output "MY CAR"
'my car':upperCase()   // Output "MY CAR"
null:upperCase()       // Output null
1203:upperCase()       // Output 1203
```

##### Hasil
Setiap contoh menghasilkan output seperti yang ditunjukkan dalam komentar.

#### 3. :ucFirst

##### Sintaksis
Mengubah huruf pertama dari string menjadi huruf kapital, sedangkan sisanya tetap tidak berubah.

##### Contoh
```
'My Car':ucFirst()     // Output "My Car"
'my car':ucFirst()     // Output "My car"
null:ucFirst()         // Output null
undefined:ucFirst()    // Output undefined
1203:ucFirst()         // Output 1203
```

##### Hasil
Outputnya seperti yang dijelaskan dalam komentar.

#### 4. :ucWords

##### Sintaksis
Mengubah huruf pertama dari setiap kata dalam string menjadi huruf kapital.

##### Contoh
```
'my car':ucWords()     // Output "My Car"
'My cAR':ucWords()     // Output "My CAR"
null:ucWords()         // Output null
undefined:ucWords()    // Output undefined
1203:ucWords()         // Output 1203
```

##### Hasil
Outputnya seperti yang ditunjukkan dalam contoh.

#### 5. :print(message)

##### Sintaksis
Selalu mengembalikan pesan yang ditentukan, terlepas dari data aslinya, sehingga berguna sebagai pemformat cadangan.
Parameter:
- message: Teks yang akan dicetak.

##### Contoh
```
'My Car':print('hello!')   // Output "hello!"
'my car':print('hello!')   // Output "hello!"
null:print('hello!')       // Output "hello!"
1203:print('hello!')       // Output "hello!"
```

##### Hasil
Mengembalikan string "hello!" yang ditentukan dalam semua kasus.

#### 6. :printJSON

##### Sintaksis
Mengubah objek atau array menjadi string berformat JSON.

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
Outputnya adalah string berformat JSON dari data yang diberikan.

#### 7. :unaccent

##### Sintaksis
Menghapus tanda diakritik dari teks, mengubahnya menjadi format tanpa aksen.

##### Contoh
```
'crÃ¨me brulÃ©e':unaccent()   // Output "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Output "CREME BRULEE"
'Ãªtre':unaccent()           // Output "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Output "euieea"
```

##### Hasil
Semua contoh menghasilkan teks dengan tanda aksen yang telah dihapus.

#### 8. :convCRLF

##### Sintaksis
Mengubah karakter carriage return dan newline (`\r\n` atau `\n`) dalam teks menjadi tag pemisah baris khusus dokumen. Ini berguna untuk format seperti DOCX, PPTX, ODT, ODP, dan ODS.
**Catatan:** Saat menggunakan `:html` sebelum pemformat `:convCRLF`, `\r\n` diubah menjadi tag `<br>`.

##### Contoh
```
// Untuk format ODT:
'my blue 
 car':convCRLF()    // Output "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Output "my blue <text:line-break/> car"

// Untuk format DOCX:
'my blue 
 car':convCRLF()    // Output "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Output "my blue </w:t><w:br/><w:t> car"
```

##### Hasil
Outputnya menunjukkan penanda pemisah baris yang sesuai untuk format dokumen target.

#### 9. :substr(begin, end, wordMode)

##### Sintaksis
Melakukan operasi substring pada string, dimulai dari indeks `begin` (berbasis 0) dan berakhir tepat sebelum indeks `end`.
Parameter opsional `wordMode` (boolean atau `last`) mengontrol apakah akan menjaga keutuhan kata, agar tidak terpotong di tengah kata.

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
Outputnya adalah substring yang diekstrak sesuai dengan parameter.

#### 10. :split(delimiter)

##### Sintaksis
Memisahkan string menjadi array menggunakan delimiter yang ditentukan.
Parameter:
- delimiter: String delimiter.

##### Contoh
```
'abcdefc12':split('c')    // Output ["ab", "def", "12"]
1222.1:split('.')         // Output ["1222", "1"]
'ab/cd/ef':split('/')      // Output ["ab", "cd", "ef"]
```

##### Hasil
Contoh hasilnya adalah array yang dipisahkan oleh delimiter yang diberikan.

#### 11. :padl(targetLength, padString)

##### Sintaksis
Mengisi sisi kiri string dengan karakter yang ditentukan hingga panjang string akhir mencapai `targetLength`.
Jika panjang target kurang dari panjang string asli, string asli akan dikembalikan.
Parameter:
- targetLength: Panjang total yang diinginkan.
- padString: String yang digunakan untuk mengisi (default adalah spasi).

##### Contoh
```
'abc':padl(10)              // Output "       abc"
'abc':padl(10, 'foo')       // Output "foofoofabc"
'abc':padl(6, '123465')     // Output "123abc"
'abc':padl(8, '0')          // Output "00000abc"
'abc':padl(1)               // Output "abc"
```

##### Hasil
Setiap contoh menghasilkan string yang diisi di sisi kiri sesuai dengan parameter.

#### 12. :padr(targetLength, padString)

##### Sintaksis
Mengisi sisi kanan string dengan karakter yang ditentukan hingga panjang string akhir mencapai `targetLength`.
Parameternya sama dengan `:padl`.

##### Contoh
```
'abc':padr(10)              // Output "abc       "
'abc':padr(10, 'foo')       // Output "abcfoofoof"
'abc':padr(6, '123465')     // Output "abc123"
'abc':padr(8, '0')          // Output "abc00000"
'abc':padr(1)               // Output "abc"
```

##### Hasil
Outputnya menunjukkan string yang diisi di sisi kanan.

#### 13. :ellipsis(maximum)

##### Sintaksis
Jika teks melebihi jumlah karakter yang ditentukan, maka akan ditambahkan elipsis ("...") di akhir.
Parameter:
- maximum: Jumlah karakter maksimum yang diizinkan.

##### Contoh
```
'abcdef':ellipsis(3)      // Output "abc..."
'abcdef':ellipsis(6)      // Output "abcdef"
'abcdef':ellipsis(10)     // Output "abcdef"
```

##### Hasil
Contohnya menunjukkan teks yang dipotong dan ditambahkan elipsis jika diperlukan.

#### 14. :prepend(textToPrepend)

##### Sintaksis
Menambahkan teks yang ditentukan di awal string.
Parameter:
- textToPrepend: Teks awalan.

##### Contoh
```
'abcdef':prepend('123')     // Output "123abcdef"
```

##### Hasil
Outputnya menunjukkan teks dengan awalan yang ditentukan telah ditambahkan.

#### 15. :append(textToAppend)

##### Sintaksis
Menambahkan teks yang ditentukan di akhir string.
Parameter:
- textToAppend: Teks akhiran.

##### Contoh
```
'abcdef':append('123')      // Output "abcdef123"
```

##### Hasil
Outputnya menunjukkan teks dengan akhiran yang ditentukan telah ditambahkan.

#### 16. :replace(oldText, newText)

##### Sintaksis
Mengganti semua kemunculan `oldText` dalam teks dengan `newText`.
Parameter:
- oldText: Teks lama yang akan diganti.
- newText: Teks baru untuk mengganti.
**Catatan:** Jika `newText` adalah null, ini menunjukkan bahwa teks yang cocok harus dihapus.

##### Contoh
```
'abcdef abcde':replace('cd', 'OK')    // Output "abOKef abOKe"
'abcdef abcde':replace('cd')          // Output "abef abe"
'abcdef abcde':replace('cd', null)      // Output "abef abe"
'abcdef abcde':replace('cd', 1000)      // Output "ab1000ef ab1000e"
```

##### Hasil
Outputnya adalah teks setelah mengganti segmen yang ditentukan.

#### 17. :len

##### Sintaksis
Mengembalikan panjang string atau array.

##### Contoh
```
'Hello World':len()     // Output 11
'':len()                // Output 0
[1,2,3,4,5]:len()       // Output 5
[1,'Hello']:len()       // Output 2
```

##### Hasil
Mengeluarkan panjang yang sesuai sebagai angka.

#### 18. :t

##### Sintaksis
Menerjemahkan teks menggunakan kamus terjemahan.
Contoh dan hasilnya bergantung pada konfigurasi kamus terjemahan yang sebenarnya.

#### 19. :preserveCharRef

##### Sintaksis
Secara default, karakter ilegal tertentu dari XML (seperti `&`, `>`, `<`, dll.) akan dihapus. Pemformat ini dapat mempertahankan referensi karakter (misalnya, `&#xa7;` tetap tidak berubah) dan cocok untuk skenario pembuatan XML tertentu.
Contoh dan hasilnya bergantung pada kasus penggunaan spesifik.