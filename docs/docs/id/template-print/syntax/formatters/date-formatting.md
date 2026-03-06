:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/template-print/syntax/formatters/date-formatting).
:::

### 日期格式化

#### 1. :formatD(patternOut, patternIn)

##### Penjelasan Sintaks
Memformat tanggal, menerima pola format keluaran `patternOut`, pola format masukan `patternIn` (default adalah ISO 8601).

##### Contoh Umum
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Output 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Output 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Output 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Output 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Output 1月15日
{d.meetingTime:formatD(HH:mm)}              // Output 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Output 2024年1月15日 星期一
```

##### Contoh Format Lainnya
```
'20160131':formatD(L)      // Output 01/31/2016
'20160131':formatD(LL)     // Output January 31, 2016
'20160131':formatD(LLLL)   // Output Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Output Sunday
```

##### Hasil
Output berupa string tanggal dalam format yang ditentukan.


#### 2. :addD(amount, unit, patternIn)

##### Penjelasan Sintaks
Menambahkan jumlah waktu yang ditentukan ke tanggal. Satuan yang didukung: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parameter:
- amount: Jumlah yang ditambahkan
- unit: Satuan waktu (tidak peka huruf besar/kecil)
- patternIn: Opsional, format masukan, default adalah ISO8601

##### Contoh
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Output "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Output "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Output "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Output "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Output "2016-04-30T00:00:00.000Z"
```

##### Hasil
Output berupa tanggal baru setelah waktu ditambahkan.


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
Output berupa tanggal baru setelah waktu dikurangi.


#### 4. :startOfD(unit, patternIn)

##### Penjelasan Sintaks
Mengatur tanggal ke awal satuan waktu yang ditentukan.  
Parameter:
- unit: Satuan waktu
- patternIn: Opsional, format masukan

##### Contoh
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Output "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Output "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Output "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Output "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Output "2016-01-01T00:00:00.000Z"
```

##### Hasil
Output berupa string tanggal pada waktu awal.


#### 5. :endOfD(unit, patternIn)

##### Penjelasan Sintaks
Mengatur tanggal ke akhir satuan waktu yang ditentukan.  
Parameter sama dengan di atas.

##### Contoh
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Output "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Output "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Output "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Output "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Output "2016-01-31T23:59:59.999Z"
```

##### Hasil
Output berupa string tanggal pada waktu akhir.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Penjelasan Sintaks
Menghitung selisih antara dua tanggal dan mengeluarkannya dalam satuan yang ditentukan. Satuan output yang didukung meliputi:
- `day(s)` atau `d`
- `week(s)` atau `w`
- `quarter(s)` atau `Q`
- `month(s)` atau `M`
- `year(s)` atau `y`
- `hour(s)` atau `h`
- `minute(s)` atau `m`
- `second(s)` atau `s`
- `millisecond(s)` atau `ms` (satuan default)

Parameter:
- toDate: Tanggal tujuan
- unit: Satuan output
- patternFromDate: Opsional, format tanggal awal
- patternToDate: Opsional, format tanggal tujuan

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
Output berupa selisih waktu antara dua tanggal, dengan satuan yang dikonversi sesuai ketentuan.


#### 7. :convDate(patternIn, patternOut)

##### Penjelasan Sintaks
Mengonversi tanggal dari satu format ke format lainnya. (Tidak direkomendasikan untuk digunakan)  
Parameter:
- patternIn: Format tanggal masukan
- patternOut: Format tanggal keluaran

##### Contoh
```
'20160131':convDate('YYYYMMDD', 'L')      // Output "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Output "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Output "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Output "Sunday"
1410715640:convDate('X', 'LLLL')          // Output "Sunday, September 14, 2014 7:27 PM"
```

##### Hasil
Output berupa string tanggal hasil konversi.


#### 8. Pola Format Tanggal
Penjelasan pola format tanggal yang umum digunakan (merujuk pada penjelasan DayJS):
- `X`: Unix timestamp (detik), seperti 1360013296
- `x`: Unix timestamp milidetik, seperti 1360013296123
- `YY`: Tahun dua digit, seperti 18
- `YYYY`: Tahun empat digit, seperti 2018
- `M`, `MM`, `MMM`, `MMMM`: Bulan (angka, dua digit, singkatan, nama lengkap)
- `D`, `DD`: Hari (angka, dua digit)
- `d`, `dd`, `ddd`, `dddd`: Hari dalam seminggu (angka, paling sederhana, singkatan, nama lengkap)
- `H`, `HH`, `h`, `hh`: Jam (format 24 jam atau 12 jam)
- `m`, `mm`: Menit
- `s`, `ss`: Detik
- `SSS`: Milidetik (3 digit)
- `Z`, `ZZ`: Offset UTC, seperti +05:00 atau +0500
- `A`, `a`: AM/PM
- `Q`: Kuartal (1-4)
- `Do`: Tanggal dengan urutan, seperti 1st, 2nd, …
- Format lainnya silakan merujuk pada dokumentasi lengkap.  
  Selain itu, terdapat format lokalisasi berbasis bahasa: seperti `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, dll.