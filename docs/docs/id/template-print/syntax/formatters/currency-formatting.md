---
title: "Template Print - Format Mata Uang"
description: "Formatter Format Mata Uang Template Print: formatC memformat angka mata uang, mendukung jumlah desimal, mata uang target, berbagai format output."
keywords: "Template Print,Format Mata Uang,formatC,NocoBase"
---

### Format Mata Uang

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Penjelasan Sintaks
Memformat angka mata uang, dapat menentukan jumlah desimal atau format output spesifik.  
Parameter:
- precisionOrFormat: Parameter opsional, dapat berupa angka (menentukan jumlah desimal), atau identifier format spesifik:
  - Integer: Mengubah presisi desimal default
  - `'M'`: Hanya output nama mata uang utama
  - `'L'`: Output angka dengan simbol mata uang (default)
  - `'LL'`: Output angka dengan nama mata uang utama
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
Hasil output tergantung pada opsi API dan pengaturan nilai tukar.


#### 2. :convCurr(target, source)

##### Penjelasan Sintaks
Mengkonversi angka dari satu mata uang ke mata uang lainnya. Nilai tukar dapat diteruskan melalui opsi API atau pengaturan global.  
Jika tidak menentukan parameter, akan otomatis dikonversi dari `options.currencySource` ke `options.currencyTarget`.  
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
Output adalah nilai mata uang setelah konversi.


