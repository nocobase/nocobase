:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/template-print/syntax/formatters/currency-formatting).
:::

### Format Mata Uang

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Penjelasan Sintaks
Memformat angka mata uang, dapat menentukan jumlah desimal atau format keluaran tertentu.  
Parameter:
- precisionOrFormat: Parameter opsional, dapat berupa angka (menentukan jumlah desimal) atau identitas format tertentu:
  - Bilangan bulat: Mengubah presisi desimal default
  - `'M'`: Hanya mengeluarkan nama mata uang utama
  - `'L'`: Mengeluarkan angka beserta simbol mata uang (default)
  - `'LL'`: Mengeluarkan angka beserta nama mata uang utama
- targetCurrency: Opsional, kode mata uang target (huruf besar, seperti USD, EUR), akan menimpa pengaturan global

##### Contoh
```
'1000.456':formatC()      // Output "$2,000.91"
'1000.456':formatC('M')    // Output "dollars"
'1':formatC('M')           // Output "dollar"
'1000':formatC('L')        // Output "$2,000.00"
'1000':formatC('LL')       // Output "2,000.00 dollars"
```

##### Hasil
Hasil output bergantung pada opsi API dan pengaturan nilai tukar.


#### 2. :convCurr(target, source)

##### Penjelasan Sintaks
Mengonversi angka dari satu mata uang ke mata uang lainnya. Nilai tukar dapat dimasukkan melalui opsi API atau pengaturan global.  
Jika parameter tidak ditentukan, konversi akan dilakukan secara otomatis dari `options.currencySource` ke `options.currencyTarget`。  
Parameter:
- target: Opsional, kode mata uang target (default sama dengan `options.currencyTarget`)
- source: Opsional, kode mata uang sumber (default sama dengan `options.currencySource`)

##### Contoh
```
10:convCurr()              // Output 20
1000:convCurr()            // Output 2000
1000:convCurr('EUR')        // Output 1000
1000:convCurr('USD')        // Output 2000
1000:convCurr('USD', 'USD') // Output 1000
```

##### Hasil
Output adalah nilai mata uang yang telah dikonversi.