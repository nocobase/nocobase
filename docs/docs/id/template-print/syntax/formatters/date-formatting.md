---
title: "Template Print - Format Tanggal"
description: "Formatter Format Tanggal Template Print: formatD memformat tanggal berdasarkan patternOut/patternIn, mendukung format YYYY-MM-DD, HH:mm, dll."
keywords: "Template Print,Format Tanggal,formatD,NocoBase"
---

### Format Tanggal

#### 1. :formatD(patternOut, patternIn)

##### Penjelasan Sintaks
Memformat tanggal, menerima pola format output `patternOut`, pola format input `patternIn` (default ISO 8601).

##### Contoh Umum
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Output 2024-01-15
{d.createdAt:formatD(D MMMM YYYY)}          // Output 15 January 2024
{d.updatedAt:formatD(D MMMM YYYY HH:mm)}    // Output 15 January 2024 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Output 2024/01/15 14:30:25
{d.birthday:formatD(D MMMM)}                 // Output 15 January
{d.meetingTime:formatD(HH:mm)}              // Output 14:30
{d.deadline:formatD(D MMMM YYYY dddd)}      // Output 15 January 2024 Monday
```

##### Contoh Format Lainnya
```
'20160131':formatD(L)      // Output 01/31/2016
'20160131':formatD(LL)     // Output January 31, 2016
'20160131':formatD(LLLL)   // Output Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Output Sunday
```

##### Hasil
Output adalah string tanggal dengan format yang ditentukan.


#### 2. :addD(amount, unit, patternIn)

##### Penjelasan Sintaks
Menambahkan jumlah waktu yang ditentukan ke tanggal. Mendukung unit: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parameter:
- amount: Jumlah yang ditambahkan
- unit: Unit waktu (case-insensitive)
- patternIn: Opsional, format input, default ISO8601

##### Contoh
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Output "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Output "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Output "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Output "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Output "2016-04-30T00:00:00.000Z"
```

##### Hasil
Output adalah tanggal baru setelah ditambahkan waktu.


#### 3. :subD(amount, unit, patternIn)

##### Penjelasan Sintaks
Mengurangi jumlah waktu yang ditentukan dari tanggal. Parameter sama dengan `addD`.

##### Contoh
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Output "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Output "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Output "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Output "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Output "2015-10-31T00:00:00.000Z"
```

##### Hasil
Output adalah tanggal baru setelah dikurangi waktu.


#### 4. :startOfD(unit, patternIn)

##### Penjelasan Sintaks
Mengatur tanggal ke waktu awal dari unit waktu yang ditentukan.  
Parameter:
- unit: Unit waktu
- patternIn: Opsional, format input

##### Contoh
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Output "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Output "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Output "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Output "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Output "2016-01-01T00:00:00.000Z"
```

##### Hasil
Output adalah string tanggal pada waktu awal.


#### 5. :endOfD(unit, patternIn)

##### Penjelasan Sintaks
Mengatur tanggal ke waktu akhir dari unit waktu yang ditentukan.  
Parameter sama seperti di atas.

##### Contoh
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Output "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Output "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Output "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Output "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Output "2016-01-31T23:59:59.999Z"
```

##### Hasil
Output adalah string tanggal pada waktu akhir.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Penjelasan Sintaks
Menghitung selisih antara dua tanggal, dan output dalam unit yang ditentukan. Unit output yang didukung termasuk:
- `day(s)` atau `d`
- `week(s)` atau `w`
- `quarter(s)` atau `Q`
- `month(s)` atau `M`
- `year(s)` atau `y`
- `hour(s)` atau `h`
- `minute(s)` atau `m`
- `second(s)` atau `s`
- `millisecond(s)` atau `ms` (unit default)

Parameter:
- toDate: Tanggal target
- unit: Unit output
- patternFromDate: Opsional, format tanggal awal
- patternToDate: Opsional, format tanggal target

##### Contoh
```
'20101001':diffD('20101201')              // Output 5270400000
'20101001':diffD('20101201', 'second')      // Output 5270400
'20101001':diffD('20101201', 's')           // Output 5270400
'20101001':diffD('20101201', 'm')           // Output 87840
'20101001':diffD('20101201', 'h')           // Output 1464
'20101001':diffD('20101201', 'weeks')       // Output 8
'20101001':diffD('20101201', 'days')        // Output 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Output 5270400000
```

##### Hasil
Output adalah selisih waktu antara dua tanggal, dikonversi sesuai unit yang ditentukan.


#### 7. :convDate(patternIn, patternOut)

##### Penjelasan Sintaks
Mengkonversi tanggal dari satu format ke format lain. (Tidak direkomendasikan)  
Parameter:
- patternIn: Format tanggal input
- patternOut: Format tanggal output

##### Contoh
```
'20160131':convDate('YYYYMMDD', 'L')      // Output "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Output "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Output "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Output "Sunday"
1410715640:convDate('X', 'LLLL')          // Output "Sunday, September 14, 2014 7:27 PM"
```

##### Hasil
Output adalah string tanggal setelah dikonversi.


#### 8. Pola Format Tanggal
Penjelasan format tanggal umum (mengacu pada penjelasan DayJS):
- `X`: Unix timestamp (detik), seperti 1360013296
- `x`: Unix timestamp millisecond, seperti 1360013296123
- `YY`: Tahun 2 digit, seperti 18
- `YYYY`: Tahun 4 digit, seperti 2018
- `M`, `MM`, `MMM`, `MMMM`: Bulan (angka, 2 digit, singkatan, lengkap)
- `D`, `DD`: Tanggal (angka, 2 digit)
- `d`, `dd`, `ddd`, `dddd`: Hari (angka, paling sederhana, singkat, lengkap)
- `H`, `HH`, `h`, `hh`: Jam (24 jam atau 12 jam)
- `m`, `mm`: Menit
- `s`, `ss`: Detik
- `SSS`: Millisecond (3 digit)
- `Z`, `ZZ`: Offset UTC, seperti +05:00 atau +0500
- `A`, `a`: AM/PM
- `Q`: Kuartal (1-4)
- `Do`: Tanggal dengan urutan, seperti 1st, 2nd, ...
- Format lainnya lihat dokumentasi lengkap.  
  Selain itu, ada format localization berbasis bahasa: seperti `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, dll.


