:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

### Pemformatan Mata Uang

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Penjelasan Sintaks
Memformat angka mata uang dan memungkinkan Anda untuk menentukan jumlah desimal atau format keluaran tertentu.
Parameter:
- **precisionOrFormat:** Parameter opsional yang dapat berupa angka (menentukan jumlah desimal) atau penentu format:
  - Bilangan bulat: mengubah presisi desimal bawaan.
  - `'M'`: hanya menampilkan nama mata uang utama.
  - `'L'`: menampilkan angka beserta simbol mata uang (bawaan).
  - `'LL'`: menampilkan angka beserta nama mata uang utama.
- **targetCurrency:** Opsional; kode mata uang target (dalam huruf kapital, contoh: USD, EUR) yang akan menimpa pengaturan global.

##### Contoh
```
// Lingkungan contoh: Opsi API { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Menampilkan "$2,000.91"
'1000.456':formatC('M')    // Menampilkan "dollars"
'1':formatC('M')           // Menampilkan "dollar"
'1000':formatC('L')        // Menampilkan "$2,000.00"
'1000':formatC('LL')       // Menampilkan "2,000.00 dollars"

// Contoh bahasa Prancis (saat pengaturan lingkungan berbeda):
'1000.456':formatC()      // Menampilkan "2 000,91 ..."  
'1000.456':formatC()      // Saat mata uang sumber dan target sama, menampilkan "1 000,46 €"
```

##### Hasil
Hasil keluaran bergantung pada opsi API dan pengaturan nilai tukar.

#### 2. :convCurr(target, source)

##### Penjelasan Sintaks
Mengonversi angka dari satu mata uang ke mata uang lain. Nilai tukar dapat diteruskan melalui opsi API atau diatur secara global.
Jika tidak ada parameter yang ditentukan, konversi akan dilakukan secara otomatis dari `options.currencySource` ke `options.currencyTarget`.
Parameter:
- **target:** Opsional; kode mata uang target (bawaannya sama dengan `options.currencyTarget`).
- **source:** Opsional; kode mata uang sumber (bawaannya sama dengan `options.currencySource`).

##### Contoh
```
// Lingkungan contoh: Opsi API { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Menampilkan 20
1000:convCurr()            // Menampilkan 2000
1000:convCurr('EUR')        // Menampilkan 1000
1000:convCurr('USD')        // Menampilkan 2000
1000:convCurr('USD', 'USD') // Menampilkan 1000
```

##### Hasil
Hasil keluarannya adalah nilai mata uang yang telah dikonversi.