---
title: "Formula.js"
description: "Formula.js kompatibel dengan formula Excel: fungsi tanggal, keuangan, engineering, logika, matematika, statistik, teks, untuk formula field, linkage rules, dan perhitungan workflow."
keywords: "Formula.js,formula Excel,fungsi tanggal,fungsi matematika,fungsi statistik,fungsi keuangan,NocoBase"
---

# Formula.js

[Formula.js](http://formulajs.info/) menyediakan banyak fungsi yang kompatibel dengan Excel.

## Referensi Fungsi

### Tanggal

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Membuat tanggal berdasarkan tahun, bulan, dan hari yang diberikan. | `DATE(2008, 7, 8)` | Tahun (integer), bulan (1-12), hari (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Mengkonversi tanggal format teks menjadi serial number tanggal. | `DATEVALUE('8/22/2011')` | String teks yang merepresentasikan tanggal. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Mengembalikan bagian hari dari tanggal yang ditentukan. | `DAY('15-Apr-11')` | Nilai tanggal atau string teks tanggal. | 15 |
| **DAYS** | Menghitung jumlah hari antara dua tanggal. | `DAYS('3/15/11', '2/1/11')` | Tanggal akhir, tanggal awal. | 42 |
| **DAYS360** | Menghitung jumlah hari antara dua tanggal berdasarkan satu tahun 360 hari. | `DAYS360('1-Jan-11', '31-Dec-11')` | Tanggal awal, tanggal akhir. | 360 |
| **EDATE** | Mengembalikan tanggal sebelum atau sesudah jumlah bulan yang ditentukan. | `EDATE('1/15/11', -1)` | Tanggal awal, jumlah bulan (positif untuk masa depan, negatif untuk masa lalu). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Mengembalikan tanggal akhir bulan sebelum atau sesudah jumlah bulan yang ditentukan. | `EOMONTH('1/1/11', -3)` | Tanggal awal, jumlah bulan (positif untuk masa depan, negatif untuk masa lalu). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Mengembalikan bagian jam dari waktu. | `HOUR('7/18/2011 7:45:00 AM')` | Nilai waktu atau string teks waktu. | 7 |
| **MINUTE** | Mengembalikan bagian menit dari waktu. | `MINUTE('2/1/2011 12:45:00 PM')` | Nilai waktu atau string teks waktu. | 45 |
| **ISOWEEKNUM** | Mengembalikan nomor minggu ISO dari tanggal yang diberikan dalam setahun. | `ISOWEEKNUM('3/9/2012')` | Nilai tanggal atau string teks tanggal. | 10 |
| **MONTH** | Mengembalikan bagian bulan dari tanggal yang ditentukan. | `MONTH('15-Apr-11')` | Nilai tanggal atau string teks tanggal. | 4 |
| **NETWORKDAYS** | Menghitung jumlah hari kerja antara dua tanggal, tidak termasuk akhir pekan dan hari libur yang ditentukan. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Tanggal awal, tanggal akhir, array hari libur opsional. | 109 |
| **NETWORKDAYSINTL** | Menghitung jumlah hari kerja antara dua tanggal, mengizinkan akhir pekan kustom dan mengecualikan hari libur yang ditentukan. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Tanggal awal, tanggal akhir, mode akhir pekan, array hari libur opsional. | 23 |
| **NOW** | Mengembalikan tanggal dan waktu saat ini. | `NOW()` | Tanpa parameter. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Mengembalikan bagian detik dari waktu. | `SECOND('2/1/2011 4:48:18 PM')` | Nilai waktu atau string teks waktu. | 18 |
| **TIME** | Membuat waktu berdasarkan jam, menit, dan detik yang diberikan. | `TIME(16, 48, 10)` | Jam (0-23), menit (0-59), detik (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Mengkonversi waktu format teks menjadi serial number waktu. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | String teks yang merepresentasikan waktu. | 0.2743055555555556 |
| **TODAY** | Mengembalikan tanggal hari ini. | `TODAY()` | Tanpa parameter. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Mengembalikan nomor hari dalam seminggu. | `WEEKDAY('2/14/2008', 3)` | Nilai tanggal atau string teks tanggal, tipe pengembalian (1-3). | 3 |
| **YEAR** | Mengembalikan bagian tahun dari tanggal yang ditentukan. | `YEAR('7/5/2008')` | Nilai tanggal atau string teks tanggal. | 2008 |
| **WEEKNUM** | Mengembalikan nomor minggu dari tanggal yang diberikan dalam setahun. | `WEEKNUM('3/9/2012', 2)` | Nilai tanggal atau string teks tanggal, hari awal minggu opsional (1=Minggu, 2=Senin). | 11 |
| **WORKDAY** | Mengembalikan tanggal sebelum atau sesudah jumlah hari kerja yang ditentukan dari tanggal awal, tidak termasuk akhir pekan dan hari libur yang ditentukan. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Tanggal awal, jumlah hari kerja, array hari libur opsional. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Mengembalikan tanggal sebelum atau sesudah jumlah hari kerja yang ditentukan dari tanggal awal, mengizinkan akhir pekan kustom dan mengecualikan hari libur yang ditentukan. | `WORKDAYINTL('1/1/2012', 30, 17)` | Tanggal awal, jumlah hari kerja, mode akhir pekan. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Menghitung pecahan tahun antara dua tanggal. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Tanggal awal, tanggal akhir, basis opsional (basis hitungan hari). | 0.5780821917808219 |

### Keuangan

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Menghitung bunga akrual untuk sekuritas yang membayar bunga berkala. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Tanggal awal, tanggal pembayaran bunga pertama, tanggal penyelesaian, suku bunga tahunan, nilai nominal, jumlah periode, basis. | 350 |
| **CUMIPMT** | Menghitung pembayaran bunga kumulatif dalam serangkaian pembayaran. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Suku bunga, total periode, nilai sekarang, periode awal, periode akhir, tipe pembayaran (0=akhir periode, 1=awal periode). | -9916.77251395708 |
| **CUMPRINC** | Menghitung pembayaran pokok kumulatif dalam serangkaian pembayaran. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Suku bunga, total periode, nilai sekarang, periode awal, periode akhir, tipe pembayaran (0=akhir periode, 1=awal periode). | -614.0863271085149 |
| **DB** | Menghitung depresiasi menggunakan metode saldo menurun tetap. | `DB(1000000, 100000, 6, 1, 6)` | Biaya, nilai sisa, masa pakai, periode, bulan. | 159500 |
| **DDB** | Menghitung depresiasi menggunakan metode saldo menurun ganda atau metode lain yang ditentukan. | `DDB(1000000, 100000, 6, 1, 1.5)` | Biaya, nilai sisa, masa pakai, periode, faktor. | 250000 |
| **DOLLARDE** | Mengkonversi harga yang direpresentasikan sebagai pecahan menjadi desimal. | `DOLLARDE(1.1, 16)` | Harga dolar dalam bentuk pecahan, penyebut. | 1.625 |
| **DOLLARFR** | Mengkonversi harga yang direpresentasikan sebagai desimal menjadi pecahan. | `DOLLARFR(1.625, 16)` | Harga dolar dalam bentuk desimal, penyebut. | 1.1 |
| **EFFECT** | Menghitung suku bunga tahunan efektif. | `EFFECT(0.1, 4)` | Suku bunga tahunan nominal, jumlah compounding per tahun. | 0.10381289062499977 |
| **FV** | Menghitung nilai masa depan dari sebuah investasi. | `FV(0.1/12, 10, -100, -1000, 0)` | Suku bunga per periode, jumlah periode, pembayaran per periode, nilai sekarang, tipe pembayaran (0=akhir periode, 1=awal periode). | 2124.874409194097 |
| **FVSCHEDULE** | Menghitung nilai masa depan dari pokok berdasarkan serangkaian suku bunga compounding. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Pokok, array suku bunga. | 133.08900000000003 |
| **IPMT** | Menghitung pembayaran bunga untuk periode tertentu. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Suku bunga per periode, periode, total periode, nilai sekarang, nilai masa depan, tipe pembayaran (0=akhir periode, 1=awal periode). | 928.8235718400465 |
| **IRR** | Menghitung internal rate of return. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Array arus kas, nilai estimasi. | 0.05715142887178447 |
| **ISPMT** | Menghitung pembayaran bunga untuk periode tertentu (untuk pinjaman). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Suku bunga per periode, periode, total periode, jumlah pinjaman. | -625 |
| **MIRR** | Menghitung modified internal rate of return. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Array arus kas, suku bunga pembiayaan, suku bunga reinvestasi. | 0.07971710360838036 |
| **NOMINAL** | Menghitung suku bunga tahunan nominal. | `NOMINAL(0.1, 4)` | Suku bunga tahunan efektif, jumlah compounding per tahun. | 0.09645475633778045 |
| **NPER** | Menghitung jumlah periode yang dibutuhkan untuk mencapai nilai target. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Suku bunga per periode, pembayaran per periode, nilai sekarang, nilai masa depan, tipe pembayaran (0=akhir periode, 1=awal periode). | 63.39385422740764 |
| **NPV** | Menghitung net present value dari serangkaian arus kas masa depan. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Tingkat diskonto per periode, array arus kas. | 1031.3503176012546 |
| **PDURATION** | Menghitung waktu yang dibutuhkan untuk mencapai nilai tertentu. | `PDURATION(0.1, 1000, 2000)` | Suku bunga per periode, nilai sekarang, nilai masa depan. | 7.272540897341714 |
| **PMT** | Menghitung pembayaran per periode untuk pinjaman. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Suku bunga per periode, total periode, nilai sekarang, nilai masa depan, tipe pembayaran (0=akhir periode, 1=awal periode). | -42426.08563793503 |
| **PPMT** | Menghitung pembayaran pokok untuk periode tertentu. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Suku bunga per periode, periode, total periode, nilai sekarang, nilai masa depan, tipe pembayaran (0=akhir periode, 1=awal periode). | -43354.909209775076 |
| **PV** | Menghitung nilai sekarang dari sebuah investasi. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Suku bunga per periode, jumlah periode, pembayaran per periode, nilai masa depan, tipe pembayaran (0=akhir periode, 1=awal periode). | -29864.950264779152 |
| **RATE** | Menghitung suku bunga per periode. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Total periode, pembayaran per periode, nilai sekarang, nilai masa depan, tipe pembayaran (0=akhir periode, 1=awal periode), nilai estimasi. | 0.06517891177181533 |

### Engineering

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Mengkonversi bilangan biner menjadi desimal. | `BIN2DEC(101010)` | Nilai biner. | 42 |
| **BIN2HEX** | Mengkonversi bilangan biner menjadi heksadesimal. | `BIN2HEX(101010)` | Nilai biner. | 2a |
| **BIN2OCT** | Mengkonversi bilangan biner menjadi oktal. | `BIN2OCT(101010)` | Nilai biner. | 52 |
| **BITAND** | Melakukan operasi AND bitwise pada dua angka. | `BITAND(42, 24)` | Integer, integer. | 8 |
| **BITLSHIFT** | Melakukan operasi left shift pada angka. | `BITLSHIFT(42, 24)` | Integer, jumlah shift. | 704643072 |
| **BITOR** | Melakukan operasi OR bitwise pada dua angka. | `BITOR(42, 24)` | Integer, integer. | 58 |
| **BITRSHIFT** | Melakukan operasi right shift pada angka. | `BITRSHIFT(42, 2)` | Integer, jumlah shift. | 10 |
| **BITXOR** | Melakukan operasi XOR bitwise pada dua angka. | `BITXOR(42, 24)` | Integer, integer. | 50 |
| **COMPLEX** | Membuat bilangan kompleks. | `COMPLEX(3, 4)` | Bagian real, bagian imajiner. | 3+4i |
| **CONVERT** | Mengkonversi nilai antara unit yang berbeda. | `CONVERT(64, 'kibyte', 'bit')` | Nilai, unit asal, unit tujuan. | 524288 |
| **DEC2BIN** | Mengkonversi bilangan desimal menjadi biner. | `DEC2BIN(42)` | Nilai desimal. | 101010 |
| **DEC2HEX** | Mengkonversi bilangan desimal menjadi heksadesimal. | `DEC2HEX(42)` | Nilai desimal. | 2a |
| **DEC2OCT** | Mengkonversi bilangan desimal menjadi oktal. | `DEC2OCT(42)` | Nilai desimal. | 52 |
| **DELTA** | Menguji apakah dua nilai sama. | `DELTA(42, 42)` | Nilai, nilai. | 1 |
| **ERF** | Menghitung error function. | `ERF(1)` | Batas atas. | 0.8427007929497149 |
| **ERFC** | Menghitung complementary error function. | `ERFC(1)` | Batas bawah. | 0.1572992070502851 |
| **GESTEP** | Menguji apakah suatu angka lebih besar atau sama dengan angka lain. | `GESTEP(42, 24)` | Nilai, threshold. | 1 |
| **HEX2BIN** | Mengkonversi bilangan heksadesimal menjadi biner. | `HEX2BIN('2a')` | Nilai heksadesimal. | 101010 |
| **HEX2DEC** | Mengkonversi bilangan heksadesimal menjadi desimal. | `HEX2DEC('2a')` | Nilai heksadesimal. | 42 |
| **HEX2OCT** | Mengkonversi bilangan heksadesimal menjadi oktal. | `HEX2OCT('2a')` | Nilai heksadesimal. | 52 |
| **IMABS** | Menghitung nilai absolut (modulus) bilangan kompleks. | `IMABS('3+4i')` | Bilangan kompleks. | 5 |
| **IMAGINARY** | Mengembalikan bagian imajiner dari bilangan kompleks. | `IMAGINARY('3+4i')` | Bilangan kompleks. | 4 |
| **IMARGUMENT** | Menghitung argumen (sudut) bilangan kompleks. | `IMARGUMENT('3+4i')` | Bilangan kompleks. | 0.9272952180016122 |
| **IMCONJUGATE** | Menghitung konjugat bilangan kompleks. | `IMCONJUGATE('3+4i')` | Bilangan kompleks. | 3-4i |
| **IMCOS** | Menghitung cosine bilangan kompleks. | `IMCOS('1+i')` | Bilangan kompleks. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Menghitung hyperbolic cosine bilangan kompleks. | `IMCOSH('1+i')` | Bilangan kompleks. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Menghitung cotangent bilangan kompleks. | `IMCOT('1+i')` | Bilangan kompleks. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Menghitung cosecant bilangan kompleks. | `IMCSC('1+i')` | Bilangan kompleks. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Menghitung hyperbolic cosecant bilangan kompleks. | `IMCSCH('1+i')` | Bilangan kompleks. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Menghitung pembagian dua bilangan kompleks. | `IMDIV('1+2i', '3+4i')` | Bilangan kompleks yang dibagi, bilangan kompleks pembagi. | 0.44+0.08i |
| **IMEXP** | Menghitung eksponen bilangan kompleks. | `IMEXP('1+i')` | Bilangan kompleks. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Menghitung logaritma natural bilangan kompleks. | `IMLN('1+i')` | Bilangan kompleks. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Menghitung logaritma berbasis 10 bilangan kompleks. | `IMLOG10('1+i')` | Bilangan kompleks. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Menghitung logaritma berbasis 2 bilangan kompleks. | `IMLOG2('1+i')` | Bilangan kompleks. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Menghitung pangkat bilangan kompleks. | `IMPOWER('1+i', 2)` | Bilangan kompleks, pangkat. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Menghitung perkalian beberapa bilangan kompleks. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Array bilangan kompleks. | -85+20i |
| **IMREAL** | Mengembalikan bagian real dari bilangan kompleks. | `IMREAL('3+4i')` | Bilangan kompleks. | 3 |
| **IMSEC** | Menghitung secant bilangan kompleks. | `IMSEC('1+i')` | Bilangan kompleks. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Menghitung hyperbolic secant bilangan kompleks. | `IMSECH('1+i')` | Bilangan kompleks. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Menghitung sine bilangan kompleks. | `IMSIN('1+i')` | Bilangan kompleks. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Menghitung hyperbolic sine bilangan kompleks. | `IMSINH('1+i')` | Bilangan kompleks. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Menghitung akar kuadrat bilangan kompleks. | `IMSQRT('1+i')` | Bilangan kompleks. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Menghitung pengurangan dua bilangan kompleks. | `IMSUB('3+4i', '1+2i')` | Bilangan kompleks yang dikurangi, bilangan kompleks pengurang. | 2+2i |
| **IMSUM** | Menghitung penjumlahan beberapa bilangan kompleks. | `IMSUM('1+2i', '3+4i', '5+6i')` | Array bilangan kompleks. | 9+12i |
| **IMTAN** | Menghitung tangent bilangan kompleks. | `IMTAN('1+i')` | Bilangan kompleks. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Mengkonversi bilangan oktal menjadi biner. | `OCT2BIN('52')` | Nilai oktal. | 101010 |
| **OCT2DEC** | Mengkonversi bilangan oktal menjadi desimal. | `OCT2DEC('52')` | Nilai oktal. | 42 |
| **OCT2HEX** | Mengkonversi bilangan oktal menjadi heksadesimal. | `OCT2HEX('52')` | Nilai oktal. | 2a |

### Logika

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Mengembalikan true jika semua argumen bernilai true, jika tidak false. | `AND(true, false, true)` | Argumen adalah satu atau lebih nilai logika (boolean), fungsi mengembalikan true hanya jika semua argumen true. | |
| **FALSE** | Mengembalikan nilai logika false. | `FALSE()` | Tanpa parameter. | |
| **IF** | Mengembalikan nilai berbeda berdasarkan true/false dari kondisi. | `IF(true, 'Hello!', 'Goodbye!')` | Kondisi, nilai jika kondisi true, nilai jika kondisi false. | Hello! |
| **IFS** | Memeriksa beberapa kondisi dan mengembalikan nilai hasil pertama yang true. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Beberapa pasangan kondisi dan nilai yang sesuai, muncul berpasangan. | Goodbye! |
| **NOT** | Membalikkan nilai logika, true menjadi false, false menjadi true. | `NOT(true)` | Sebuah nilai logika (boolean). | |
| **OR** | Mengembalikan true jika salah satu argumen bernilai true, jika tidak false. | `OR(true, false, true)` | Argumen adalah satu atau lebih nilai logika (boolean), fungsi mengembalikan true jika ada satu argumen yang true. | |
| **SWITCH** | Mengembalikan nilai hasil yang cocok berdasarkan nilai ekspresi, mengembalikan nilai default jika tidak ada yang cocok. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Ekspresi, nilai cocok 1, nilai hasil 1, ..., [nilai default]. | Seven |
| **TRUE** | Mengembalikan nilai logika true. | `TRUE()` | Tanpa parameter. | |
| **XOR** | Mengembalikan true jika dan hanya jika ada jumlah ganjil argumen yang true, jika tidak false. | `XOR(true, false, true)` | Argumen adalah satu atau lebih nilai logika (boolean), mengembalikan true jika ada jumlah ganjil argumen yang true. | |

### Matematika

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Mengembalikan nilai absolut dari sebuah angka. | `ABS(-4)` | Nilai numerik. | 4 |
| **ACOS** | Menghitung nilai arc cosine (radian). | `ACOS(-0.5)` | Nilai antara -1 dan 1. | 2.0943951023931957 |
| **ACOSH** | Menghitung nilai arc hyperbolic cosine. | `ACOSH(10)` | Nilai lebih besar atau sama dengan 1. | 2.993222846126381 |
| **ACOT** | Menghitung nilai arc cotangent (radian). | `ACOT(2)` | Nilai apa pun. | 0.46364760900080615 |
| **ACOTH** | Menghitung nilai arc hyperbolic cotangent. | `ACOTH(6)` | Nilai dengan absolut lebih besar dari 1. | 0.16823611831060645 |
| **AGGREGATE** | Melakukan operasi agregasi, mengabaikan error atau baris tersembunyi. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Nomor fungsi, opsi, array 1, ..., array N. | 10,32 |
| **ARABIC** | Mengkonversi angka Romawi menjadi angka Arab. | `ARABIC('MCMXII')` | String angka Romawi. | 1912 |
| **ASIN** | Menghitung nilai arc sine (radian). | `ASIN(-0.5)` | Nilai antara -1 dan 1. | -0.5235987755982988 |
| **ASINH** | Menghitung nilai arc hyperbolic sine. | `ASINH(-2.5)` | Nilai apa pun. | -1.6472311463710965 |
| **ATAN** | Menghitung nilai arc tangent (radian). | `ATAN(1)` | Nilai apa pun. | 0.7853981633974483 |
| **ATAN2** | Menghitung nilai arc tangent berdasarkan koordinat (radian). | `ATAN2(-1, -1)` | Koordinat y, koordinat x. | -2.356194490192345 |
| **ATANH** | Menghitung nilai arc hyperbolic tangent. | `ATANH(-0.1)` | Nilai antara -1 dan 1. | -0.10033534773107562 |
| **BASE** | Mengkonversi nilai menjadi representasi teks dengan basis tertentu. | `BASE(15, 2, 10)` | Nilai, basis, [panjang minimum]. | 0000001111 |
| **CEILING** | Membulatkan nilai ke atas ke kelipatan terdekat. | `CEILING(-5.5, 2, -1)` | Nilai, kelipatan, [mode]. | -6 |
| **CEILINGMATH** | Membulatkan nilai ke atas, menggunakan kelipatan dan arah yang ditentukan. | `CEILINGMATH(-5.5, 2, -1)` | Nilai, [kelipatan], [mode]. | -6 |
| **CEILINGPRECISE** | Membulatkan nilai ke atas ke kelipatan terdekat, tanpa mempertimbangkan tanda. | `CEILINGPRECISE(-4.1, -2)` | Nilai, [kelipatan]. | -4 |
| **COMBIN** | Menghitung jumlah kombinasi. | `COMBIN(8, 2)` | Total, jumlah yang dipilih. | 28 |
| **COMBINA** | Menghitung jumlah kombinasi dengan pengulangan. | `COMBINA(4, 3)` | Total, jumlah yang dipilih. | 20 |
| **COS** | Menghitung nilai cosine (radian). | `COS(1)` | Sudut (radian). | 0.5403023058681398 |
| **COSH** | Menghitung nilai hyperbolic cosine. | `COSH(1)` | Nilai apa pun. | 1.5430806348152437 |
| **COT** | Menghitung nilai cotangent (radian). | `COT(30)` | Sudut (radian). | -0.15611995216165922 |
| **COTH** | Menghitung nilai hyperbolic cotangent. | `COTH(2)` | Nilai apa pun. | 1.0373147207275482 |
| **CSC** | Menghitung nilai cosecant (radian). | `CSC(15)` | Sudut (radian). | 1.5377805615408537 |
| **CSCH** | Menghitung nilai hyperbolic cosecant. | `CSCH(1.5)` | Nilai apa pun. | 0.46964244059522464 |
| **DECIMAL** | Mengkonversi angka berbentuk teks menjadi desimal. | `DECIMAL('FF', 16)` | Teks, basis. | 255 |
| **ERF** | Menghitung error function. | `ERF(1)` | Batas atas. | 0.8427007929497149 |
| **ERFC** | Menghitung complementary error function. | `ERFC(1)` | Batas bawah. | 0.1572992070502851 |
| **EVEN** | Membulatkan nilai ke atas ke bilangan genap terdekat. | `EVEN(-1)` | Nilai. | -2 |
| **EXP** | Menghitung pangkat e. | `EXP(1)` | Eksponen. | 2.718281828459045 |
| **FACT** | Menghitung faktorial. | `FACT(5)` | Integer non-negatif. | 120 |
| **FACTDOUBLE** | Menghitung faktorial ganda. | `FACTDOUBLE(7)` | Integer non-negatif. | 105 |
| **FLOOR** | Membulatkan nilai ke bawah ke kelipatan terdekat. | `FLOOR(-3.1)` | Nilai, kelipatan. | -4 |
| **FLOORMATH** | Membulatkan nilai ke bawah, menggunakan kelipatan dan arah yang ditentukan. | `FLOORMATH(-4.1, -2, -1)` | Nilai, [kelipatan], [mode]. | -4 |
| **FLOORPRECISE** | Membulatkan nilai ke bawah ke kelipatan terdekat, tanpa mempertimbangkan tanda. | `FLOORPRECISE(-3.1, -2)` | Nilai, [kelipatan]. | -4 |
| **GCD** | Menghitung greatest common divisor. | `GCD(24, 36, 48)` | Dua atau lebih integer. | 12 |
| **INT** | Membulatkan nilai ke bawah ke integer terdekat. | `INT(-8.9)` | Nilai. | -9 |
| **ISEVEN** | Menguji apakah nilai adalah bilangan genap. | `ISEVEN(-2.5)` | Nilai. | |
| **ISOCEILING** | Membulatkan nilai ke atas ke kelipatan terdekat, mengikuti standar ISO. | `ISOCEILING(-4.1, -2)` | Nilai, [kelipatan]. | -4 |
| **ISODD** | Menguji apakah nilai adalah bilangan ganjil. | `ISODD(-2.5)` | Nilai. | |
| **LCM** | Menghitung least common multiple. | `LCM(24, 36, 48)` | Dua atau lebih integer. | 144 |
| **LN** | Menghitung logaritma natural. | `LN(86)` | Nilai positif. | 4.454347296253507 |
| **LOG** | Menghitung logaritma dengan basis tertentu. | `LOG(8, 2)` | Nilai, basis. | 3 |
| **LOG10** | Menghitung logaritma berbasis 10. | `LOG10(100000)` | Nilai positif. | 5 |
| **MOD** | Menghitung sisa pembagian dua angka. | `MOD(3, -2)` | Pembagian, pembagi. | -1 |
| **MROUND** | Membulatkan nilai ke kelipatan terdekat. | `MROUND(-10, -3)` | Nilai, kelipatan. | -9 |
| **MULTINOMIAL** | Menghitung koefisien multinomial. | `MULTINOMIAL(2, 3, 4)` | Dua atau lebih integer non-negatif. | 1260 |
| **ODD** | Membulatkan nilai ke atas ke bilangan ganjil terdekat. | `ODD(-1.5)` | Nilai. | -3 |
| **POWER** | Menghitung pangkat. | `POWER(5, 2)` | Basis, eksponen. | 25 |
| **PRODUCT** | Menghitung perkalian beberapa nilai. | `PRODUCT(5, 15, 30)` | Satu atau lebih nilai. | 2250 |
| **QUOTIENT** | Menghitung hasil bagi dua angka, tanpa sisa. | `QUOTIENT(-10, 3)` | Pembagian, pembagi. | -3 |
| **RADIANS** | Mengkonversi sudut menjadi radian. | `RADIANS(180)` | Sudut. | 3.141592653589793 |
| **RAND** | Menghasilkan bilangan real acak antara 0 dan 1. | `RAND()` | Tanpa parameter. | [Random real number between 0 and 1] |
| **RANDBETWEEN** | Menghasilkan integer acak dalam rentang tertentu. | `RANDBETWEEN(-1, 1)` | Batas bawah, batas atas. | [Random integer between bottom and top] |
| **ROUND** | Membulatkan nilai ke jumlah digit yang ditentukan. | `ROUND(626.3, -3)` | Nilai, digit. | 1000 |
| **ROUNDDOWN** | Membulatkan nilai ke bawah ke jumlah digit yang ditentukan. | `ROUNDDOWN(-3.14159, 2)` | Nilai, digit. | -3.14 |
| **ROUNDUP** | Membulatkan nilai ke atas ke jumlah digit yang ditentukan. | `ROUNDUP(-3.14159, 2)` | Nilai, digit. | -3.15 |
| **SEC** | Menghitung nilai secant (radian). | `SEC(45)` | Sudut (radian). | 1.9035944074044246 |
| **SECH** | Menghitung nilai hyperbolic secant. | `SECH(45)` | Nilai apa pun. | 5.725037161098787e-20 |
| **SIGN** | Mengembalikan tanda dari nilai. | `SIGN(-0.00001)` | Nilai. | -1 |
| **SIN** | Menghitung nilai sine (radian). | `SIN(1)` | Sudut (radian). | 0.8414709848078965 |
| **SINH** | Menghitung nilai hyperbolic sine. | `SINH(1)` | Nilai apa pun. | 1.1752011936438014 |
| **SQRT** | Menghitung akar kuadrat. | `SQRT(16)` | Nilai non-negatif. | 4 |
| **SQRTPI** | Menghitung akar kuadrat dari nilai dikalikan π. | `SQRTPI(2)` | Nilai non-negatif. | 2.5066282746310002 |
| **SUBTOTAL** | Menghitung nilai ringkasan subset, mengabaikan baris tersembunyi. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Nomor fungsi, array 1, ..., array N. | 10,32 |
| **SUM** | Menghitung total nilai, mengabaikan teks. | `SUM(-5, 15, 32, 'Hello World!')` | Satu atau lebih nilai. | 42 |
| **SUMIF** | Menjumlahkan berdasarkan kondisi. | `SUMIF([2,4,8,16], '>5')` | Array, kondisi. | 24 |
| **SUMIFS** | Menjumlahkan berdasarkan beberapa kondisi. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Array sum, array kondisi 1, kondisi 1, ..., array kondisi N, kondisi N. | 12 |
| **SUMPRODUCT** | Menghitung jumlah perkalian elemen array. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Dua atau lebih array. | 5 |
| **SUMSQ** | Menghitung jumlah kuadrat dari nilai. | `SUMSQ(3, 4)` | Satu atau lebih nilai. | 25 |
| **SUMX2MY2** | Menghitung jumlah selisih kuadrat elemen yang bersesuaian dari dua array. | `SUMX2MY2([1,2], [3,4])` | Array 1, array 2. | -20 |
| **SUMX2PY2** | Menghitung jumlah jumlah kuadrat elemen yang bersesuaian dari dua array. | `SUMX2PY2([1,2], [3,4])` | Array 1, array 2. | 30 |
| **SUMXMY2** | Menghitung jumlah kuadrat selisih elemen yang bersesuaian dari dua array. | `SUMXMY2([1,2], [3,4])` | Array 1, array 2. | 8 |
| **TAN** | Menghitung nilai tangent (radian). | `TAN(1)` | Sudut (radian). | 1.5574077246549023 |
| **TANH** | Menghitung nilai hyperbolic tangent. | `TANH(-2)` | Nilai apa pun. | -0.9640275800758168 |
| **TRUNC** | Memotong nilai, tanpa pembulatan. | `TRUNC(-8.9)` | Nilai, [digit]. | -8 |

### Statistik

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Menghitung mean absolute deviation. | `AVEDEV([2,4], [8,16])` | Argumen adalah array nilai numerik yang merepresentasikan data point. | 4.5 |
| **AVERAGE** | Menghitung rata-rata aritmetika. | `AVERAGE([2,4], [8,16])` | Argumen adalah array nilai numerik yang merepresentasikan data point untuk dirata-ratakan. | 7.5 |
| **AVERAGEA** | Menghitung rata-rata termasuk teks dan nilai logika. | `AVERAGEA([2,4], [8,16])` | Argumen adalah array nilai numerik, teks, atau logika, semua nilai non-kosong akan dihitung. | 7.5 |
| **AVERAGEIF** | Menghitung rata-rata berdasarkan kondisi tunggal. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | Argumen pertama adalah array nilai numerik, argumen kedua adalah kondisi, argumen ketiga adalah array nilai numerik opsional untuk dirata-ratakan. | 3.5 |
| **AVERAGEIFS** | Menghitung rata-rata berdasarkan beberapa kondisi. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Argumen pertama adalah array nilai numerik, diikuti pasangan array kondisi dan ekspresi kondisi. | 6 |
| **BETADIST** | Menghitung cumulative beta probability density function. | `BETADIST(2, 8, 10, true, 1, 3)` | Argumen secara berurutan adalah nilai, α, β, flag kumulatif, A (opsional), dan B (opsional). | 0.6854705810117458 |
| **BETAINV** | Menghitung inverse cumulative beta probability density function. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Argumen secara berurutan adalah probabilitas, α, β, A (opsional), dan B (opsional). | 1.9999999999999998 |
| **BINOMDIST** | Menghitung probabilitas binomial distribution. | `BINOMDIST(6, 10, 0.5, false)` | Argumen secara berurutan adalah jumlah trial, jumlah sukses, probabilitas sukses, flag kumulatif. | 0.205078125 |
| **CORREL** | Menghitung correlation coefficient dari dua dataset. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Argumen adalah dua array numerik yang merepresentasikan dua dataset. | 0.9970544855015815 |
| **COUNT** | Menghitung jumlah cell numerik. | `COUNT([1,2], [3,4])` | Argumen adalah array atau range numerik. | 4 |
| **COUNTA** | Menghitung jumlah cell non-kosong. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Argumen adalah array atau range tipe apa pun. | 4 |
| **COUNTBLANK** | Menghitung jumlah cell kosong. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Argumen adalah array atau range tipe apa pun. | 2 |
| **COUNTIF** | Menghitung jumlah cell berdasarkan kondisi. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Argumen adalah array numerik atau teks dan kondisi. | 3 |
| **COUNTIFS** | Menghitung jumlah cell berdasarkan beberapa kondisi. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Argumen adalah pasangan array kondisi dan ekspresi kondisi. | 2 |
| **COVARIANCEP** | Menghitung population covariance. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Argumen adalah dua array numerik yang merepresentasikan dua dataset. | 5.2 |
| **COVARIANCES** | Menghitung sample covariance. | `COVARIANCES([2,4,8], [5,11,12])` | Argumen adalah dua array numerik yang merepresentasikan dua dataset. | 9.666666666666668 |
| **DEVSQ** | Menghitung jumlah kuadrat deviasi. | `DEVSQ([2,4,8,16])` | Argumen adalah array nilai numerik yang merepresentasikan data point. | 115 |
| **EXPONDIST** | Menghitung exponential distribution. | `EXPONDIST(0.2, 10, true)` | Argumen secara berurutan adalah nilai, λ, flag kumulatif. | 0.8646647167633873 |
| **FDIST** | Menghitung F probability distribution. | `FDIST(15.2069, 6, 4, false)` | Argumen secara berurutan adalah nilai, derajat kebebasan 1, derajat kebebasan 2, flag kumulatif. | 0.0012237917087831735 |
| **FINV** | Menghitung inverse F probability distribution. | `FINV(0.01, 6, 4)` | Argumen secara berurutan adalah probabilitas, derajat kebebasan 1, derajat kebebasan 2. | 0.10930991412457851 |
| **FISHER** | Menghitung Fisher transformation. | `FISHER(0.75)` | Argumen adalah nilai yang merepresentasikan correlation coefficient. | 0.9729550745276566 |
| **FISHERINV** | Menghitung inverse Fisher transformation. | `FISHERINV(0.9729550745276566)` | Argumen adalah nilai yang merepresentasikan hasil Fisher transformation. | 0.75 |
| **FORECAST** | Memprediksi nilai y untuk nilai x baru berdasarkan nilai x dan y yang diketahui. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Argumen secara berurutan adalah nilai x baru, array nilai y yang diketahui, array nilai x yang diketahui. | 10.607253086419755 |
| **FREQUENCY** | Menghitung distribusi frekuensi. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Argumen secara berurutan adalah array data, array batas grup. | 1,2,4,2 |
| **GAMMA** | Menghitung nilai gamma function. | `GAMMA(2.5)` | Argumen adalah angka positif. | 1.3293403919101043 |
| **GAMMALN** | Menghitung logaritma natural dari gamma function. | `GAMMALN(10)` | Argumen adalah angka positif. | 12.801827480081961 |
| **GAUSS** | Menghitung probabilitas di bawah standard normal distribution. | `GAUSS(2)` | Argumen adalah nilai yang merepresentasikan z-score. | 0.4772498680518208 |
| **GEOMEAN** | Menghitung geometric mean. | `GEOMEAN([2,4], [8,16])` | Argumen adalah array nilai numerik yang merepresentasikan data point. | 5.656854249492381 |
| **GROWTH** | Memprediksi pertumbuhan eksponensial berdasarkan data yang diketahui. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Argumen secara berurutan adalah array nilai y yang diketahui, array nilai x yang diketahui, array nilai x baru. | 32.00000000000003 |
| **HARMEAN** | Menghitung harmonic mean. | `HARMEAN([2,4], [8,16])` | Argumen adalah array nilai numerik yang merepresentasikan data point. | 4.266666666666667 |
| **HYPGEOMDIST** | Menghitung hypergeometric distribution. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Argumen secara berurutan adalah jumlah sukses dalam sampel, ukuran sampel, jumlah sukses dalam populasi, ukuran populasi, flag kumulatif. | 0.3632610939112487 |
| **INTERCEPT** | Menghitung intercept regresi linear. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Argumen secara berurutan adalah array nilai y yang diketahui, array nilai x yang diketahui. | 0.04838709677419217 |
| **KURT** | Menghitung kurtosis. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Argumen adalah array nilai numerik yang merepresentasikan data point. | -0.15179963720841627 |
| **LARGE** | Mengembalikan nilai terbesar ke-k. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Argumen secara berurutan adalah array numerik, nilai k. | 5 |
| **LINEST** | Melakukan analisis regresi linear. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Argumen secara berurutan adalah array nilai y yang diketahui, array nilai x yang diketahui, apakah mengembalikan statistik tambahan, apakah mengembalikan statistik lebih lanjut. | 2,1 |
| **LOGNORMDIST** | Menghitung lognormal distribution. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Argumen secara berurutan adalah nilai, mean, standard deviation, flag kumulatif. | 0.0390835557068005 |
| **LOGNORMINV** | Menghitung inverse lognormal distribution. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Argumen secara berurutan adalah probabilitas, mean, standard deviation, flag kumulatif. | 4.000000000000001 |
| **MAX** | Mengembalikan nilai maksimum. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Argumen adalah array numerik. | 0.8 |
| **MAXA** | Mengembalikan nilai maksimum termasuk teks dan nilai logika. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Argumen adalah array numerik, teks, atau logika. | 1 |
| **MEDIAN** | Mengembalikan median. | `MEDIAN([1,2,3], [4,5,6])` | Argumen adalah array numerik. | 3.5 |
| **MIN** | Mengembalikan nilai minimum. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Argumen adalah array numerik. | 0.1 |
| **MINA** | Mengembalikan nilai minimum termasuk teks dan nilai logika. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Argumen adalah array numerik, teks, atau logika. | 0 |
| **MODEMULT** | Mengembalikan array nilai dengan frekuensi tertinggi. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Argumen adalah array numerik. | 2,3 |
| **MODESNGL** | Mengembalikan satu nilai yang paling sering muncul. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Argumen adalah array numerik. | 2 |
| **NORMDIST** | Menghitung normal distribution. | `NORMDIST(42, 40, 1.5, true)` | Argumen secara berurutan adalah nilai, mean, standard deviation, flag kumulatif. | 0.9087887802741321 |
| **NORMINV** | Menghitung inverse normal distribution. | `NORMINV(0.9087887802741321, 40, 1.5)` | Argumen secara berurutan adalah probabilitas, mean, standard deviation. | 42 |
| **NORMSDIST** | Menghitung standard normal distribution. | `NORMSDIST(1, true)` | Argumen adalah nilai yang merepresentasikan z-score. | 0.8413447460685429 |
| **NORMSINV** | Menghitung inverse standard normal distribution. | `NORMSINV(0.8413447460685429)` | Argumen adalah nilai probabilitas. | 1.0000000000000002 |
| **PEARSON** | Menghitung Pearson product-moment correlation coefficient. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Argumen adalah dua array numerik yang merepresentasikan dua dataset. | 0.6993786061802354 |
| **PERCENTILEEXC** | Menghitung exclusive percentile. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Argumen secara berurutan adalah array numerik, nilai k. | 1.5 |
| **PERCENTILEINC** | Menghitung inclusive percentile. | `PERCENTILEINC([1,2,3,4], 0.3)` | Argumen secara berurutan adalah array numerik, nilai k. | 1.9 |
| **PERCENTRANKEXC** | Menghitung exclusive percent rank. | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Argumen secara berurutan adalah array numerik, nilai x, signifikansi (opsional). | 0.4 |
| **PERCENTRANKINC** | Menghitung inclusive percent rank. | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Argumen secara berurutan adalah array numerik, nilai x, signifikansi (opsional). | 0.33 |
| **PERMUT** | Menghitung jumlah permutasi. | `PERMUT(100, 3)` | Argumen secara berurutan adalah total n, jumlah pilihan k. | 970200 |
| **PERMUTATIONA** | Menghitung jumlah permutasi dengan pengulangan. | `PERMUTATIONA(4, 3)` | Argumen secara berurutan adalah total n, jumlah pilihan k. | 64 |
| **PHI** | Menghitung density function dari standard normal distribution. | `PHI(0.75)` | Argumen adalah nilai yang merepresentasikan z-score. | 0.30113743215480443 |
| **POISSONDIST** | Menghitung Poisson distribution. | `POISSONDIST(2, 5, true)` | Argumen secara berurutan adalah jumlah event, mean, flag kumulatif. | 0.12465201948308113 |
| **PROB** | Menghitung jumlah probabilitas. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Argumen secara berurutan adalah array numerik, array probabilitas, batas bawah, batas atas. | 0.4 |
| **QUARTILEEXC** | Menghitung exclusive quartile. | `QUARTILEEXC([1,2,3,4], 1)` | Argumen secara berurutan adalah array numerik, nilai quart. | 1.25 |
| **QUARTILEINC** | Menghitung inclusive quartile. | `QUARTILEINC([1,2,3,4], 1)` | Argumen secara berurutan adalah array numerik, nilai quart. | 1.75 |
| **RANKAVG** | Menghitung average rank. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Argumen secara berurutan adalah nilai, array numerik, mode pengurutan (ascending/descending). | 4.5 |
| **RANKEQ** | Menghitung rank yang sama dengan nilai tertentu. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Argumen secara berurutan adalah nilai, array numerik, mode pengurutan (ascending/descending). | 4 |
| **RSQ** | Menghitung coefficient of determination. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Argumen adalah dua array numerik yang merepresentasikan dua dataset. | 0.4891304347826088 |
| **SKEW** | Menghitung skewness. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Argumen adalah array nilai numerik yang merepresentasikan data point. | 0.3595430714067974 |
| **SKEWP** | Menghitung skewness berdasarkan populasi. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Argumen adalah array nilai numerik yang merepresentasikan data point. | 0.303193339354144 |
| **SLOPE** | Menghitung slope regresi linear. | `SLOPE([1,9,5,7], [0,4,2,3])` | Argumen secara berurutan adalah array nilai y yang diketahui, array nilai x yang diketahui. | 2 |
| **SMALL** | Mengembalikan nilai terkecil ke-k. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Argumen secara berurutan adalah array numerik, nilai k. | 3 |
| **STANDARDIZE** | Menstandarisasi nilai menjadi z-score. | `STANDARDIZE(42, 40, 1.5)` | Argumen secara berurutan adalah nilai, mean, standard deviation. | 1.3333333333333333 |
| **STDEVA** | Menghitung standard deviation termasuk teks dan nilai logika. | `STDEVA([2,4], [8,16], [true, false])` | Argumen adalah array numerik, teks, atau logika. | 6.013872850889572 |
| **STDEVP** | Menghitung population standard deviation. | `STDEVP([2,4], [8,16], [true, false])` | Argumen adalah array numerik. | 5.361902647381804 |
| **STDEVPA** | Menghitung population standard deviation termasuk teks dan nilai logika. | `STDEVPA([2,4], [8,16], [true, false])` | Argumen adalah array numerik, teks, atau logika. | 5.489889697333535 |
| **STDEVS** | Menghitung sample standard deviation. | `VARS([2,4], [8,16], [true, false])` | Argumen adalah array numerik. | 6.191391873668904 |
| **STEYX** | Menghitung standard error dari nilai prediksi. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Argumen secara berurutan adalah array nilai y yang diketahui, array nilai x yang diketahui. | 3.305718950210041 |
| **TINV** | Menghitung inverse t-distribution. | `TINV(0.9946953263673741, 1)` | Argumen secara berurutan adalah probabilitas, derajat kebebasan. | 59.99999999996535 |
| **TRIMMEAN** | Menghitung trimmed mean. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Argumen secara berurutan adalah array numerik, rasio trim. | 3.7777777777777777 |
| **VARA** | Menghitung variance termasuk teks dan nilai logika. | `VARA([2,4], [8,16], [true, false])` | Argumen adalah array numerik, teks, atau logika. | 36.16666666666667 |
| **VARP** | Menghitung population variance. | `VARP([2,4], [8,16], [true, false])` | Argumen adalah array numerik. | 28.75 |
| **VARPA** | Menghitung population variance termasuk teks dan nilai logika. | `VARPA([2,4], [8,16], [true, false])` | Argumen adalah array numerik, teks, atau logika. | 30.13888888888889 |
| **VARS** | Menghitung sample variance. | `VARS([2,4], [8,16], [true, false])` | Argumen adalah array numerik. | 38.333333333333336 |
| **WEIBULLDIST** | Menghitung Weibull distribution. | `WEIBULLDIST(105, 20, 100, true)` | Argumen secara berurutan adalah nilai, α, β, flag kumulatif. | 0.9295813900692769 |
| **ZTEST** | Menghitung one-tailed probability dari z-test. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Argumen secara berurutan adalah array numerik, hipotesis mean. | 0.09057419685136381 |

### Teks

| Function | Definition | Example call | Parameters | Expected result |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Mengkonversi kode angka menjadi karakter yang sesuai. | `CHAR(65)` | Argumen adalah angka yang merepresentasikan encoding karakter. | A |
| **CLEAN** | Menghapus semua karakter non-printing dari teks. | `CLEAN('Monthly report')` | Argumen adalah string teks yang berisi teks untuk dibersihkan. | Monthly report |
| **CODE** | Mengembalikan kode angka dari karakter pertama dalam string teks. | `CODE('A')` | Argumen adalah string teks yang berisi satu karakter. | 65 |
| **CONCATENATE** | Menggabungkan beberapa string teks menjadi satu string. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Argumen adalah satu atau lebih string teks untuk digabungkan. | Andreas Hauser |
| **EXACT** | Memeriksa apakah dua string sama persis, case sensitive. | `EXACT('Word', 'word')` | Argumen adalah dua string teks untuk dibandingkan. | |
| **FIND** | Mencari posisi substring dimulai dari posisi awal. | `FIND('M', 'Miriam McGovern', 3)` | Argumen meliputi teks yang dicari, teks sumber, dan posisi awal opsional. | 8 |
| **LEFT** | Mengekstrak sejumlah karakter tertentu dari sisi kiri string. | `LEFT('Sale Price', 4)` | Argumen adalah string teks dan jumlah karakter yang akan diekstrak. | Sale |
| **LEN** | Mengembalikan jumlah karakter dalam string teks. | `LEN('Phoenix, AZ')` | Argumen adalah string teks yang berisi teks untuk dihitung. | 11 |
| **LOWER** | Mengkonversi semua karakter menjadi huruf kecil. | `LOWER('E. E. Cummings')` | Argumen adalah string teks yang akan dikonversi. | e. e. cummings |
| **MID** | Mengekstrak sejumlah karakter tertentu dari tengah string. | `MID('Fluid Flow', 7, 20)` | Argumen adalah string teks, posisi awal, dan jumlah karakter yang akan diekstrak. | Flow |
| **NUMBERVALUE** | Mengkonversi teks menjadi angka berdasarkan separator yang ditentukan. | `NUMBERVALUE('2.500,27', ',', '.')` | Argumen adalah string teks, decimal separator, dan group separator. | 2500.27 |
| **PROPER** | Mengubah huruf pertama setiap kata menjadi huruf besar. | `PROPER('this is a TITLE')` | Argumen adalah string teks yang akan diformat. | This Is A Title |
| **REPLACE** | Mengganti bagian teks lama dengan teks baru. | `REPLACE('abcdefghijk', 6, 5, '*')` | Argumen adalah teks asli, posisi awal, jumlah karakter yang diganti, dan teks baru. | abcde*k |
| **REPT** | Mengulang teks berdasarkan jumlah yang ditentukan. | `REPT('*-', 3)` | Argumen adalah string teks dan jumlah pengulangan. | *-*-*- |
| **RIGHT** | Mengekstrak sejumlah karakter tertentu dari sisi kanan string. | `RIGHT('Sale Price', 5)` | Argumen adalah string teks dan jumlah karakter yang akan diekstrak. | Price |
| **ROMAN** | Mengkonversi angka Arab menjadi angka Romawi. | `ROMAN(499)` | Argumen adalah angka Arab yang akan dikonversi. | CDXCIX |
| **SEARCH** | Mencari substring dalam teks, tidak case sensitive. | `SEARCH('margin', 'Profit Margin')` | Argumen meliputi teks yang dicari dan teks sumber. | 8 |
| **SUBSTITUTE** | Mengganti instance tertentu dari teks lama dengan teks baru. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Argumen adalah teks asli, teks lama, teks baru, dan instance penggantian opsional. | Quarter 1, 2012 |
| **T** | Mengembalikan teks jika argumen adalah teks; jika tidak, mengembalikan string kosong. | `T('Rainfall')` | Argumen dapat berupa data tipe apa pun. | Rainfall |
| **TRIM** | Menghapus spasi sebelum dan sesudah teks, spasi internal lebih dari satu disisakan menjadi satu. | `TRIM(' First Quarter Earnings ')` | Argumen adalah string teks yang akan di-trim. | First Quarter Earnings |
| **TEXTJOIN** | Menggabungkan beberapa item teks menjadi satu string menggunakan separator yang ditentukan. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Argumen adalah separator, flag abaikan nilai kosong, dan item teks yang akan digabungkan. | The sun will come up tomorrow. |
| **UNICHAR** | Mengembalikan karakter yang sesuai dengan angka Unicode yang diberikan. | `UNICHAR(66)` | Argumen adalah kode karakter Unicode. | B |
| **UNICODE** | Mengembalikan angka Unicode dari karakter pertama teks. | `UNICODE('B')` | Argumen adalah string teks yang berisi satu karakter. | 66 |
| **UPPER** | Mengkonversi semua karakter menjadi huruf besar. | `UPPER('total')` | Argumen adalah string teks yang akan dikonversi. | TOTAL |
