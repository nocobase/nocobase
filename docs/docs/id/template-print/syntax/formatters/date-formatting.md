:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

### Pemformatan Tanggal

#### 1. :formatD(patternOut, patternIn)

##### Penjelasan Sintaks
Memformat tanggal dengan menerima pola format keluaran (`patternOut`) dan pola format masukan opsional (`patternIn`) yang secara `default` adalah ISO 8601. Penyesuaian zona waktu (`timezone`) dan bahasa (`lang`) dapat dilakukan melalui `options.timezone` dan `options.lang`.

##### Contoh
```
// Contoh lingkungan: API options { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Menghasilkan 01/31/2016
'20160131':formatD(LL)     // Menghasilkan January 31, 2016
'20160131':formatD(LLLL)   // Menghasilkan Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Menghasilkan Sunday

// Contoh bahasa Prancis:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Menghasilkan mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Menghasilkan dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Menghasilkan dimanche 14 septembre 2014 19:27
```

##### Hasil
Keluaran adalah string tanggal yang diformat sesuai spesifikasi.

#### 2. :addD(amount, unit, patternIn)

##### Penjelasan Sintaks
Menambahkan jumlah waktu yang ditentukan ke suatu tanggal. Satuan yang didukung meliputi: day, week, month, quarter, year, hour, minute, second, millisecond.
Parameter:
- `amount`: Jumlah yang akan ditambahkan.
- `unit`: Satuan waktu (tidak peka huruf besar/kecil).
- `patternIn`: Opsional, format masukan (secara `default` adalah ISO8601).

##### Contoh
```
// Contoh lingkungan: API options { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Menghasilkan "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Menghasilkan "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Menghasilkan "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Menghasilkan "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Menghasilkan "2016-04-30T00:00:00.000Z"
```

##### Hasil
Keluaran adalah tanggal baru setelah waktu yang ditentukan ditambahkan.

#### 3. :subD(amount, unit, patternIn)

##### Penjelasan Sintaks
Mengurangi jumlah waktu yang ditentukan dari suatu tanggal. Parameternya sama dengan `addD`.

##### Contoh
```
// Contoh lingkungan: API options { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Menghasilkan "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Menghasilkan "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Menghasilkan "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Menghasilkan "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Menghasilkan "2015-10-31T00:00:00.000Z"
```

##### Hasil
Keluaran adalah tanggal baru setelah waktu yang ditentukan dikurangi.

#### 4. :startOfD(unit, patternIn)

##### Penjelasan Sintaks
Mengatur tanggal ke awal satuan waktu yang ditentukan.
Parameter:
- `unit`: Satuan waktu.
- `patternIn`: Opsional, format masukan.

##### Contoh
```
// Contoh lingkungan: API options { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Menghasilkan "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Menghasilkan "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Menghasilkan "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Menghasilkan "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Menghasilkan "2016-01-01T00:00:00.000Z"
```

##### Hasil
Keluaran adalah string tanggal yang diatur ke awal satuan waktu yang ditentukan.

#### 5. :endOfD(unit, patternIn)

##### Penjelasan Sintaks
Mengatur tanggal ke akhir satuan waktu yang ditentukan. Parameternya sama dengan `startOfD`.

##### Contoh
```
// Contoh lingkungan: API options { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Menghasilkan "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Menghasilkan "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Menghasilkan "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Menghasilkan "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Menghasilkan "2016-01-31T23:59:59.999Z"
```

##### Hasil
Keluaran adalah string tanggal yang diatur ke akhir satuan waktu yang ditentukan.

#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Penjelasan Sintaks
Menghitung selisih antara dua tanggal dan menampilkannya dalam satuan yang ditentukan. Satuan keluaran yang didukung meliputi:
- `day(s)` atau `d`
- `week(s)` atau `w`
- `quarter(s)` atau `Q`
- `month(s)` atau `M`
- `year(s)` atau `y`
- `hour(s)` atau `h`
- `minute(s)` atau `m`
- `second(s)` atau `s`
- `millisecond(s)` atau `ms` (satuan `default`)

Parameter:
- `toDate`: Tanggal tujuan.
- `unit`: Satuan untuk keluaran.
- `patternFromDate`: Opsional, format tanggal awal.
- `patternToDate`: Opsional, format tanggal tujuan.

##### Contoh
```
'20101001':diffD('20101201')              // Menghasilkan 5270400000
'20101001':diffD('20101201', 'second')      // Menghasilkan 5270400
'20101001':diffD('20101201', 's')           // Menghasilkan 5270400
'20101001':diffD('20101201', 'm')           // Menghasilkan 87840
'20101001':diffD('20101201', 'h')           // Menghasilkan 1464
'20101001':diffD('20101201', 'weeks')       // Menghasilkan 8
'20101001':diffD('20101201', 'days')        // Menghasilkan 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Menghasilkan 5270400000
```

##### Hasil
Keluaran adalah selisih waktu antara dua tanggal, yang dikonversi ke satuan yang ditentukan.

#### 7. :convDate(patternIn, patternOut)

##### Penjelasan Sintaks
Mengonversi tanggal dari satu format ke format lain (tidak direkomendasikan untuk digunakan).
Parameter:
- `patternIn`: Format tanggal masukan.
- `patternOut`: Format tanggal keluaran.

##### Contoh
```
// Contoh lingkungan: API options { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Menghasilkan "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Menghasilkan "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Menghasilkan "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Menghasilkan "Sunday"
1410715640:convDate('X', 'LLLL')          // Menghasilkan "Sunday, September 14, 2014 7:27 PM"
// Contoh bahasa Prancis:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Menghasilkan "dimanche 31 januari 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Menghasilkan "dimanche"
```

##### Hasil
Keluaran adalah string tanggal yang telah dikonversi ke format yang ditentukan.

#### 8. Pola Format Tanggal

Pola format tanggal umum (lihat dokumentasi DayJS):
- `X`: `Timestamp` Unix (dalam detik), contoh: 1360013296
- `x`: `Timestamp` Unix dalam milidetik, contoh: 1360013296123
- `YY`: Tahun dua digit, contoh: 18
- `YYYY`: Tahun empat digit, contoh: 2018
- `M`, `MM`, `MMM`, `MMMM`: Bulan (angka, dua digit, singkatan, nama lengkap)
- `D`, `DD`: Hari (angka, dua digit)
- `d`, `dd`, `ddd`, `dddd`: Hari dalam seminggu (angka, minimal, singkatan, nama lengkap)
- `H`, `HH`, `h`, `hh`: Jam (format 24 jam atau 12 jam)
- `m`, `mm`: Menit
- `s`, `ss`: Detik
- `SSS`: Milidetik (3 digit)
- `Z`, `ZZ`: `Offset` UTC, contoh: +05:00 atau +0500
- `A`, `a`: AM/PM
- `Q`: Kuartal (1-4)
- `Do`: Hari dalam bulan dengan urutan, contoh: 1st, 2nd, …
Untuk format lainnya, silakan lihat dokumentasi lengkap.
Selain itu, ada juga format yang dilokalkan berdasarkan bahasa seperti `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, dll.