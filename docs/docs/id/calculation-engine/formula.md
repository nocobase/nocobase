:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) menyediakan banyak koleksi fungsi yang kompatibel dengan Excel.

## Referensi Fungsi

### Tanggal

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Membuat tanggal berdasarkan tahun, bulan, dan hari yang diberikan. | `DATE(2008, 7, 8)` | Tahun (integer), bulan (1-12), hari (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Mengonversi tanggal dalam format teks menjadi nomor seri tanggal. | `DATEVALUE('8/22/2011')` | String teks yang mewakili tanggal. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Mengembalikan bagian hari dari suatu tanggal. | `DAY('15-Apr-11')` | Nilai tanggal atau string teks tanggal. | 15 |
| **DAYS** | Menghitung jumlah hari di antara dua tanggal. | `DAYS('3/15/11', '2/1/11')` | Tanggal akhir, tanggal mulai. | 42 |
| **DAYS360** | Menghitung jumlah hari di antara dua tanggal berdasarkan tahun 360 hari. | `DAYS360('1-Jan-11', '31-Dec-11')` | Tanggal mulai, tanggal akhir. | 360 |
| **EDATE** | Mengembalikan tanggal yang merupakan jumlah bulan tertentu sebelum atau sesudah suatu tanggal. | `EDATE('1/15/11', -1)` | Tanggal mulai, jumlah bulan (positif untuk masa depan, negatif untuk masa lalu). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Mengembalikan hari terakhir bulan sebelum atau sesudah jumlah bulan yang ditentukan. | `EOMONTH('1/1/11', -3)` | Tanggal mulai, jumlah bulan (positif untuk masa depan, negatif untuk masa lalu). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Mengembalikan bagian jam dari nilai waktu. | `HOUR('7/18/2011 7:45:00 AM')` | Nilai waktu atau string teks waktu. | 7 |
| **MINUTE** | Mengembalikan bagian menit dari nilai waktu. | `MINUTE('2/1/2011 12:45:00 PM')` | Nilai waktu atau string teks waktu. | 45 |
| **ISOWEEKNUM** | Mengembalikan nomor minggu ISO dalam setahun untuk tanggal tertentu. | `ISOWEEKNUM('3/9/2012')` | Nilai tanggal atau string teks tanggal. | 10 |
| **MONTH** | Mengembalikan bagian bulan dari suatu tanggal. | `MONTH('15-Apr-11')` | Nilai tanggal atau string teks tanggal. | 4 |
| **NETWORKDAYS** | Menghitung jumlah hari kerja di antara dua tanggal, tidak termasuk akhir pekan dan hari libur opsional. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Tanggal mulai, tanggal akhir, array hari libur opsional. | 109 |
| **NETWORKDAYSINTL** | Menghitung hari kerja di antara dua tanggal, memungkinkan penyesuaian akhir pekan dan hari libur opsional. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Tanggal mulai, tanggal akhir, mode akhir pekan, array hari libur opsional. | 23 |
| **NOW** | Mengembalikan tanggal dan waktu saat ini. | `NOW()` | Tanpa parameter. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Mengembalikan bagian detik dari nilai waktu. | `SECOND('2/1/2011 4:48:18 PM')` | Nilai waktu atau string teks waktu. | 18 |
| **TIME** | Membangun nilai waktu dari jam, menit, dan detik yang diberikan. | `TIME(16, 48, 10)` | Jam (0-23), menit (0-59), detik (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Mengonversi waktu dalam format teks menjadi nomor seri waktu. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | String teks yang mewakili waktu. | 0.2743055555555556 |
| **TODAY** | Mengembalikan tanggal saat ini. | `TODAY()` | Tanpa parameter. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Mengembalikan angka yang sesuai dengan hari dalam seminggu. | `WEEKDAY('2/14/2008', 3)` | Nilai tanggal atau string teks tanggal, tipe pengembalian (1-3). | 3 |
| **YEAR** | Mengembalikan bagian tahun dari suatu tanggal. | `YEAR('7/5/2008')` | Nilai tanggal atau string teks tanggal. | 2008 |
| **WEEKNUM** | Mengembalikan nomor minggu dalam setahun untuk tanggal tertentu. | `WEEKNUM('3/9/2012', 2)` | Nilai tanggal atau string teks tanggal, hari mulai minggu opsional (1=Minggu, 2=Senin). | 11 |
| **WORKDAY** | Mengembalikan tanggal sebelum atau sesudah jumlah hari kerja tertentu, tidak termasuk akhir pekan dan hari libur opsional. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Tanggal mulai, jumlah hari kerja, array hari libur opsional. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Mengembalikan tanggal sebelum atau sesudah jumlah hari kerja dengan akhir pekan khusus dan hari libur opsional. | `WORKDAYINTL('1/1/2012', 30, 17)` | Tanggal mulai, jumlah hari kerja, mode akhir pekan. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Menghitung jumlah pecahan tahun di antara dua tanggal. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Tanggal mulai, tanggal akhir, basis opsional (basis hitungan hari). | 0.5780821917808219 |

### Keuangan

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Menghitung bunga akrual untuk sekuritas yang membayar bunga berkala. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Tanggal penerbitan, tanggal bunga pertama, tanggal penyelesaian, tarif tahunan, nilai nominal, frekuensi, basis. | 350 |
| **CUMIPMT** | Menghitung bunga kumulatif yang dibayarkan pada serangkaian pembayaran. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Suku bunga, total periode, nilai saat ini, periode mulai, periode akhir, tipe pembayaran (0=akhir, 1=awal). | -9916.77251395708 |
| **CUMPRINC** | Menghitung pokok kumulatif yang dibayarkan pada serangkaian pembayaran. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Suku bunga, total periode, nilai saat ini, periode mulai, periode akhir, tipe pembayaran (0=akhir, 1=awal). | -614.0863271085149 |
| **DB** | Menghitung penyusutan menggunakan metode saldo menurun tetap. | `DB(1000000, 100000, 6, 1, 6)` | Biaya, nilai sisa, masa pakai, periode, bulan. | 159500 |
| **DDB** | Menghitung penyusutan menggunakan saldo menurun ganda atau metode lain yang ditentukan. | `DDB(1000000, 100000, 6, 1, 1.5)` | Biaya, nilai sisa, masa pakai, periode, faktor. | 250000 |
| **DOLLARDE** | Mengonversi harga yang dinyatakan sebagai pecahan menjadi desimal. | `DOLLARDE(1.1, 16)` | Harga sebagai dolar pecahan, penyebut. | 1.625 |
| **DOLLARFR** | Mengonversi harga yang dinyatakan sebagai desimal menjadi pecahan. | `DOLLARFR(1.625, 16)` | Harga sebagai dolar desimal, penyebut. | 1.1 |
| **EFFECT** | Menghitung suku bunga tahunan efektif. | `EFFECT(0.1, 4)` | Suku bunga nominal tahunan, jumlah periode pemajemukan per tahun. | 0.10381289062499977 |
| **FV** | Menghitung nilai masa depan dari suatu investasi. | `FV(0.1/12, 10, -100, -1000, 0)` | Suku bunga per periode, jumlah periode, pembayaran per periode, nilai saat ini, tipe pembayaran (0=akhir, 1=awal). | 2124.874409194097 |
| **FVSCHEDULE** | Menghitung nilai masa depan dari pokok menggunakan serangkaian suku bunga majemuk. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Pokok, array suku bunga. | 133.08900000000003 |
| **IPMT** | Menghitung pembayaran bunga untuk periode tertentu. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Suku bunga per periode, periode, total periode, nilai saat ini, nilai masa depan, tipe pembayaran (0=akhir, 1=awal). | 928.8235718400465 |
| **IRR** | Menghitung tingkat pengembalian internal (Internal Rate of Return). | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Array arus kas, perkiraan. | 0.05715142887178447 |
| **ISPMT** | Menghitung bunga yang dibayarkan selama periode tertentu (untuk pinjaman). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Suku bunga per periode, periode, total periode, jumlah pinjaman. | -625 |
| **MIRR** | Menghitung tingkat pengembalian internal yang dimodifikasi. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Array arus kas, suku bunga pendanaan, suku bunga reinvestasi. | 0.07971710360838036 |
| **NOMINAL** | Menghitung suku bunga tahunan nominal. | `NOMINAL(0.1, 4)` | Suku bunga tahunan efektif, jumlah periode pemajemukan per tahun. | 0.09645475633778045 |
| **NPER** | Menghitung jumlah periode yang diperlukan untuk mencapai nilai target. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Suku bunga per periode, pembayaran per periode, nilai saat ini, nilai masa depan, tipe pembayaran (0=akhir, 1=awal). | 63.39385422740764 |
| **NPV** | Menghitung nilai sekarang bersih (Net Present Value) dari serangkaian arus kas masa depan. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Suku bunga diskonto per periode, array arus kas. | 1031.3503176012546 |
| **PDURATION** | Menghitung waktu yang diperlukan untuk mencapai nilai yang diinginkan. | `PDURATION(0.1, 1000, 2000)` | Suku bunga per periode, nilai saat ini, nilai masa depan. | 7.272540897341714 |
| **PMT** | Menghitung pembayaran berkala untuk pinjaman. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Suku bunga per periode, total periode, nilai saat ini, nilai masa depan, tipe pembayaran (0=akhir, 1=awal). | -42426.08563793503 |
| **PPMT** | Menghitung pembayaran pokok untuk periode tertentu. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Suku bunga per periode, periode, total periode, nilai saat ini, nilai masa depan, tipe pembayaran (0=akhir, 1=awal). | -43354.909209775076 |
| **PV** | Menghitung nilai sekarang dari suatu investasi. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Suku bunga per periode, jumlah periode, pembayaran per periode, nilai masa depan, tipe pembayaran (0=akhir, 1=awal). | -29864.950264779152 |
| **RATE** | Menghitung suku bunga per periode. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Total periode, pembayaran per periode, nilai saat ini, nilai masa depan, tipe pembayaran (0=akhir, 1=awal), perkiraan. | 0.06517891177181533 |

### Teknik

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Mengonversi bilangan biner ke desimal. | `BIN2DEC(101010)` | Bilangan biner. | 42 |
| **BIN2HEX** | Mengonversi bilangan biner ke heksadesimal. | `BIN2HEX(101010)` | Bilangan biner. | 2a |
| **BIN2OCT** | Mengonversi bilangan biner ke oktal. | `BIN2OCT(101010)` | Bilangan biner. | 52 |
| **BITAND** | Mengembalikan hasil operasi bitwise AND dari dua angka. | `BITAND(42, 24)` | Integer, integer. | 8 |
| **BITLSHIFT** | Melakukan pergeseran bit ke kiri (bitwise left shift). | `BITLSHIFT(42, 24)` | Integer, jumlah bit yang digeser. | 704643072 |
| **BITOR** | Mengembalikan hasil operasi bitwise OR dari dua angka. | `BITOR(42, 24)` | Integer, integer. | 58 |
| **BITRSHIFT** | Melakukan pergeseran bit ke kanan (bitwise right shift). | `BITRSHIFT(42, 2)` | Integer, jumlah bit yang digeser. | 10 |
| **BITXOR** | Mengembalikan hasil operasi bitwise XOR dari dua angka. | `BITXOR(42, 24)` | Integer, integer. | 50 |
| **COMPLEX** | Membuat bilangan kompleks. | `COMPLEX(3, 4)` | Bagian riil, bagian imajiner. | 3+4i |
| **CONVERT** | Mengonversi angka dari satu unit pengukuran ke unit lainnya. | `CONVERT(64, 'kibyte', 'bit')` | Nilai, unit asal, unit tujuan. | 524288 |
| **DEC2BIN** | Mengonversi bilangan desimal ke biner. | `DEC2BIN(42)` | Bilangan desimal. | 101010 |
| **DEC2HEX** | Mengonversi bilangan desimal ke heksadesimal. | `DEC2HEX(42)` | Bilangan desimal. | 2a |
| **DEC2OCT** | Mengonversi bilangan desimal ke oktal. | `DEC2OCT(42)` | Bilangan desimal. | 52 |
| **DELTA** | Menguji apakah dua nilai sama. | `DELTA(42, 42)` | Angka, angka. | 1 |
| **ERF** | Mengembalikan fungsi kesalahan (error function). | `ERF(1)` | Batas atas. | 0.8427007929497149 |
| **ERFC** | Mengembalikan fungsi kesalahan komplementer. | `ERFC(1)` | Batas bawah. | 0.1572992070502851 |
| **GESTEP** | Menguji apakah suatu angka lebih besar dari atau sama dengan ambang batas. | `GESTEP(42, 24)` | Angka, ambang batas. | 1 |
| **HEX2BIN** | Mengonversi bilangan heksadesimal ke biner. | `HEX2BIN('2a')` | Bilangan heksadesimal. | 101010 |
| **HEX2DEC** | Mengonversi bilangan heksadesimal ke desimal. | `HEX2DEC('2a')` | Bilangan heksadesimal. | 42 |
| **HEX2OCT** | Mengonversi bilangan heksadesimal ke oktal. | `HEX2OCT('2a')` | Bilangan heksadesimal. | 52 |
| **IMABS** | Mengembalikan nilai absolut (magnitudo) dari bilangan kompleks. | `IMABS('3+4i')` | Bilangan kompleks. | 5 |
| **IMAGINARY** | Mengembalikan bagian imajiner dari bilangan kompleks. | `IMAGINARY('3+4i')` | Bilangan kompleks. | 4 |
| **IMARGUMENT** | Mengembalikan argumen dari bilangan kompleks. | `IMARGUMENT('3+4i')` | Bilangan kompleks. | 0.9272952180016122 |
| **IMCONJUGATE** | Mengembalikan konjugasi kompleks. | `IMCONJUGATE('3+4i')` | Bilangan kompleks. | 3-4i |
| **IMCOS** | Mengembalikan kosinus dari bilangan kompleks. | `IMCOS('1+i')` | Bilangan kompleks. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Mengembalikan kosinus hiperbolik dari bilangan kompleks. | `IMCOSH('1+i')` | Bilangan kompleks. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Mengembalikan kotangen dari bilangan kompleks. | `IMCOT('1+i')` | Bilangan kompleks. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Mengembalikan kosekan dari bilangan kompleks. | `IMCSC('1+i')` | Bilangan kompleks. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Mengembalikan kosekan hiperbolik dari bilangan kompleks. | `IMCSCH('1+i')` | Bilangan kompleks. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Mengembalikan hasil bagi dari dua bilangan kompleks. | `IMDIV('1+2i', '3+4i')` | Bilangan kompleks pembilang, bilangan kompleks penyebut. | 0.44+0.08i |
| **IMEXP** | Mengembalikan eksponensial dari bilangan kompleks. | `IMEXP('1+i')` | Bilangan kompleks. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Mengembalikan logaritma natural dari bilangan kompleks. | `IMLN('1+i')` | Bilangan kompleks. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Mengembalikan logaritma berbasis 10 dari bilangan kompleks. | `IMLOG10('1+i')` | Bilangan kompleks. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Mengembalikan logaritma berbasis 2 dari bilangan kompleks. | `IMLOG2('1+i')` | Bilangan kompleks. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Mengembalikan bilangan kompleks yang dipangkatkan. | `IMPOWER('1+i', 2)` | Bilangan kompleks, eksponen. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Mengembalikan hasil kali bilangan kompleks. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Array bilangan kompleks. | -85+20i |
| **IMREAL** | Mengembalikan bagian riil dari bilangan kompleks. | `IMREAL('3+4i')` | Bilangan kompleks. | 3 |
| **IMSEC** | Mengembalikan sekan dari bilangan kompleks. | `IMSEC('1+i')` | Bilangan kompleks. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Mengembalikan sekan hiperbolik dari bilangan kompleks. | `IMSECH('1+i')` | Bilangan kompleks. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Mengembalikan sinus dari bilangan kompleks. | `IMSIN('1+i')` | Bilangan kompleks. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Mengembalikan sinus hiperbolik dari bilangan kompleks. | `IMSINH('1+i')` | Bilangan kompleks. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Mengembalikan akar kuadrat dari bilangan kompleks. | `IMSQRT('1+i')` | Bilangan kompleks. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Mengembalikan selisih antara dua bilangan kompleks. | `IMSUB('3+4i', '1+2i')` | Bilangan kompleks yang dikurangi, bilangan kompleks pengurang. | 2+2i |
| **IMSUM** | Mengembalikan jumlah bilangan kompleks. | `IMSUM('1+2i', '3+4i', '5+6i')` | Array bilangan kompleks. | 9+12i |
| **IMTAN** | Mengembalikan tangen dari bilangan kompleks. | `IMTAN('1+i')` | Bilangan kompleks. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Mengonversi bilangan oktal ke biner. | `OCT2BIN('52')` | Bilangan oktal. | 101010 |
| **OCT2DEC** | Mengonversi bilangan oktal ke desimal. | `OCT2DEC('52')` | Bilangan oktal. | 42 |
| **OCT2HEX** | Mengonversi bilangan oktal ke heksadesimal. | `OCT2HEX('52')` | Bilangan oktal. | 2a |

### Logika

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Mengembalikan TRUE hanya jika semua argumen bernilai TRUE, jika tidak FALSE. | `AND(true, false, true)` | Satu atau lebih nilai logika (Boolean); fungsi mengembalikan TRUE hanya jika setiap argumen bernilai TRUE. | |
| **FALSE** | Mengembalikan nilai logika FALSE. | `FALSE()` | Tanpa parameter. | |
| **IF** | Mengembalikan nilai yang berbeda tergantung pada apakah suatu kondisi bernilai TRUE atau FALSE. | `IF(true, 'Hello!', 'Goodbye!')` | Kondisi, nilai jika TRUE, nilai jika FALSE. | Hello! |
| **IFS** | Mengevaluasi beberapa kondisi dan mengembalikan hasil dari kondisi TRUE pertama. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Beberapa pasangan kondisi dan nilai yang sesuai. | Goodbye! |
| **NOT** | Membalikkan nilai logika. TRUE menjadi FALSE dan sebaliknya. | `NOT(true)` | Satu nilai logika (Boolean). | |
| **OR** | Mengembalikan TRUE jika ada argumen yang bernilai TRUE, jika tidak FALSE. | `OR(true, false, true)` | Satu atau lebih nilai logika (Boolean); mengembalikan TRUE jika ada argumen yang bernilai TRUE. | |
| **SWITCH** | Mengembalikan nilai yang cocok dengan ekspresi; jika tidak ada yang cocok, mengembalikan nilai default. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Ekspresi, nilai kecocokan 1, hasil 1, ..., [default]. | Seven |
| **TRUE** | Mengembalikan nilai logika TRUE. | `TRUE()` | Tanpa parameter. | |
| **XOR** | Mengembalikan TRUE hanya jika jumlah ganjil argumen bernilai TRUE, jika tidak FALSE. | `XOR(true, false, true)` | Satu atau lebih nilai logika (Boolean); mengembalikan TRUE jika jumlah ganjil argumen bernilai TRUE. | |

### Matematika

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Mengembalikan nilai absolut dari suatu angka. | `ABS(-4)` | Angka. | 4 |
| **ACOS** | Mengembalikan arkosines (dalam radian). | `ACOS(-0.5)` | Angka antara -1 dan 1. | 2.0943951023931957 |
| **ACOSH** | Mengembalikan invers kosinus hiperbolik. | `ACOSH(10)` | Angka yang lebih besar dari atau sama dengan 1. | 2.993222846126381 |
| **ACOT** | Mengembalikan arkotangen (dalam radian). | `ACOT(2)` | Angka apa pun. | 0.46364760900080615 |
| **ACOTH** | Mengembalikan invers kotangen hiperbolik. | `ACOTH(6)` | Angka yang nilai absolutnya lebih besar dari 1. | 0.16823611831060645 |
| **AGGREGATE** | Melakukan perhitungan agregat sambil mengabaikan kesalahan atau baris yang tersembunyi. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Nomor fungsi, opsi, array1, ..., arrayN. | 10,32 |
| **ARABIC** | Mengonversi angka Romawi ke Arab. | `ARABIC('MCMXII')` | String angka Romawi. | 1912 |
| **ASIN** | Mengembalikan arksinus (dalam radian). | `ASIN(-0.5)` | Angka antara -1 dan 1. | -0.5235987755982988 |
| **ASINH** | Mengembalikan invers sinus hiperbolik. | `ASINH(-2.5)` | Angka apa pun. | -1.6472311463710965 |
| **ATAN** | Mengembalikan arktangen (dalam radian). | `ATAN(1)` | Angka apa pun. | 0.7853981633974483 |
| **ATAN2** | Mengembalikan arktangen (dalam radian) dari pasangan koordinat. | `ATAN2(-1, -1)` | Koordinat-y, koordinat-x. | -2.356194490192345 |
| **ATANH** | Mengembalikan invers tangen hiperbolik. | `ATANH(-0.1)` | Angka antara -1 dan 1. | -0.10033534773107562 |
| **BASE** | Mengonversi angka menjadi teks dalam basis yang ditentukan. | `BASE(15, 2, 10)` | Angka, radiks, [panjang minimum]. | 0000001111 |
| **CEILING** | Membulatkan angka ke atas ke kelipatan terdekat. | `CEILING(-5.5, 2, -1)` | Angka, signifikansi, [mode]. | -6 |
| **CEILINGMATH** | Membulatkan angka ke atas, menggunakan kelipatan dan arah yang diberikan. | `CEILINGMATH(-5.5, 2, -1)` | Angka, [signifikansi], [mode]. | -6 |
| **CEILINGPRECISE** | Membulatkan angka ke atas ke kelipatan terdekat, mengabaikan tanda. | `CEILINGPRECISE(-4.1, -2)` | Angka, [signifikansi]. | -4 |
| **COMBIN** | Mengembalikan jumlah kombinasi. | `COMBIN(8, 2)` | Total item, jumlah yang dipilih. | 28 |
| **COMBINA** | Mengembalikan jumlah kombinasi dengan pengulangan. | `COMBINA(4, 3)` | Total item, jumlah yang dipilih. | 20 |
| **COS** | Mengembalikan kosinus (dalam radian). | `COS(1)` | Sudut dalam radian. | 0.5403023058681398 |
| **COSH** | Mengembalikan kosinus hiperbolik. | `COSH(1)` | Angka apa pun. | 1.5430806348152437 |
| **COT** | Mengembalikan kotangen (dalam radian). | `COT(30)` | Sudut dalam radian. | -0.15611995216165922 |
| **COTH** | Mengembalikan kotangen hiperbolik. | `COTH(2)` | Angka apa pun. | 1.0373147207275482 |
| **CSC** | Mengembalikan kosekan (dalam radian). | `CSC(15)` | Sudut dalam radian. | 1.5377805615408537 |
| **CSCH** | Mengembalikan kosekan hiperbolik. | `CSCH(1.5)` | Angka apa pun. | 0.46964244059522464 |
| **DECIMAL** | Mengonversi angka dalam bentuk teks ke desimal. | `DECIMAL('FF', 16)` | Teks, basis. | 255 |
| **ERF** | Mengembalikan fungsi kesalahan. | `ERF(1)` | Batas atas. | 0.8427007929497149 |
| **ERFC** | Mengembalikan fungsi kesalahan komplementer. | `ERFC(1)` | Batas bawah. | 0.1572992070502851 |
| **EVEN** | Membulatkan angka ke atas ke integer genap terdekat. | `EVEN(-1)` | Angka. | -2 |
| **EXP** | Mengembalikan e yang dipangkatkan. | `EXP(1)` | Eksponen. | 2.718281828459045 |
| **FACT** | Mengembalikan faktorial. | `FACT(5)` | Integer non-negatif. | 120 |
| **FACTDOUBLE** | Mengembalikan faktorial ganda. | `FACTDOUBLE(7)` | Integer non-negatif. | 105 |
| **FLOOR** | Membulatkan angka ke bawah ke kelipatan terdekat. | `FLOOR(-3.1)` | Angka, signifikansi. | -4 |
| **FLOORMATH** | Membulatkan angka ke bawah menggunakan kelipatan dan arah yang diberikan. | `FLOORMATH(-4.1, -2, -1)` | Angka, [signifikansi], [mode]. | -4 |
| **FLOORPRECISE** | Membulatkan angka ke bawah ke kelipatan terdekat, mengabaikan tanda. | `FLOORPRECISE(-3.1, -2)` | Angka, [signifikansi]. | -4 |
| **GCD** | Mengembalikan pembagi persekutuan terbesar (Greatest Common Divisor). | `GCD(24, 36, 48)` | Dua atau lebih integer. | 12 |
| **INT** | Membulatkan angka ke bawah ke integer terdekat. | `INT(-8.9)` | Angka. | -9 |
| **ISEVEN** | Menguji apakah suatu angka genap. | `ISEVEN(-2.5)` | Angka. | |
| **ISOCEILING** | Membulatkan angka ke atas ke kelipatan terdekat mengikuti aturan ISO. | `ISOCEILING(-4.1, -2)` | Angka, [signifikansi]. | -4 |
| **ISODD** | Menguji apakah suatu angka ganjil. | `ISODD(-2.5)` | Angka. | |
| **LCM** | Mengembalikan kelipatan persekutuan terkecil (Least Common Multiple). | `LCM(24, 36, 48)` | Dua atau lebih integer. | 144 |
| **LN** | Mengembalikan logaritma natural. | `LN(86)` | Angka positif. | 4.454347296253507 |
| **LOG** | Mengembalikan logaritma dalam basis yang ditentukan. | `LOG(8, 2)` | Angka, basis. | 3 |
| **LOG10** | Mengembalikan logaritma berbasis 10. | `LOG10(100000)` | Angka positif. | 5 |
| **MOD** | Mengembalikan sisa pembagian. | `MOD(3, -2)` | Pembilang, penyebut. | -1 |
| **MROUND** | Membulatkan angka ke kelipatan terdekat. | `MROUND(-10, -3)` | Angka, kelipatan. | -9 |
| **MULTINOMIAL** | Mengembalikan koefisien multinomial. | `MULTINOMIAL(2, 3, 4)` | Dua atau lebih integer non-negatif. | 1260 |
| **ODD** | Membulatkan angka ke atas ke integer ganjil terdekat. | `ODD(-1.5)` | Angka. | -3 |
| **POWER** | Memangkatkan angka. | `POWER(5, 2)` | Basis, eksponen. | 25 |
| **PRODUCT** | Mengembalikan hasil kali angka-angka. | `PRODUCT(5, 15, 30)` | Satu atau lebih angka. | 2250 |
| **QUOTIENT** | Mengembalikan bagian integer dari suatu pembagian. | `QUOTIENT(-10, 3)` | Pembilang, penyebut. | -3 |
| **RADIANS** | Mengonversi derajat ke radian. | `RADIANS(180)` | Derajat. | 3.141592653589793 |
| **RAND** | Mengembalikan angka riil acak antara 0 dan 1. | `RAND()` | Tanpa parameter. | [Angka riil acak antara 0 dan 1] |
| **RANDBETWEEN** | Mengembalikan integer acak dalam rentang yang ditentukan. | `RANDBETWEEN(-1, 1)` | Bawah, atas. | [Integer acak antara bawah dan atas] |
| **ROUND** | Membulatkan angka ke jumlah digit yang ditentukan. | `ROUND(626.3, -3)` | Angka, digit. | 1000 |
| **ROUNDDOWN** | Membulatkan angka ke bawah mendekati nol. | `ROUNDDOWN(-3.14159, 2)` | Angka, digit. | -3.14 |
| **ROUNDUP** | Membulatkan angka ke atas menjauhi nol. | `ROUNDUP(-3.14159, 2)` | Angka, digit. | -3.15 |
| **SEC** | Mengembalikan sekan (dalam radian). | `SEC(45)` | Sudut dalam radian. | 1.9035944074044246 |
| **SECH** | Mengembalikan sekan hiperbolik. | `SECH(45)` | Angka apa pun. | 5.725037161098787e-20 |
| **SIGN** | Mengembalikan tanda dari suatu angka. | `SIGN(-0.00001)` | Angka. | -1 |
| **SIN** | Mengembalikan sinus (dalam radian). | `SIN(1)` | Sudut dalam radian. | 0.8414709848078965 |
| **SINH** | Mengembalikan sinus hiperbolik. | `SINH(1)` | Angka apa pun. | 1.1752011936438014 |
| **SQRT** | Mengembalikan akar kuadrat. | `SQRT(16)` | Angka non-negatif. | 4 |
| **SQRTPI** | Mengembalikan akar kuadrat dari (angka * π). | `SQRTPI(2)` | Angka non-negatif. | 2.5066282746310002 |
| **SUBTOTAL** | Mengembalikan subtotal untuk sekumpulan data, mengabaikan baris yang tersembunyi. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Nomor fungsi, array1, ..., arrayN. | 10,32 |
| **SUM** | Mengembalikan jumlah angka, mengabaikan teks. | `SUM(-5, 15, 32, 'Hello World!')` | Satu atau lebih angka. | 42 |
| **SUMIF** | Menjumlahkan nilai yang memenuhi satu kondisi. | `SUMIF([2,4,8,16], '>5')` | Rentang, kriteria. | 24 |
| **SUMIFS** | Menjumlahkan nilai yang memenuhi beberapa kondisi. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Rentang jumlah, rentang kriteria 1, kriteria 1, ..., rentang kriteria N, kriteria N. | 12 |
| **SUMPRODUCT** | Mengembalikan jumlah hasil kali elemen array. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Dua atau lebih array. | 5 |
| **SUMSQ** | Mengembalikan jumlah kuadrat. | `SUMSQ(3, 4)` | Satu atau lebih angka. | 25 |
| **SUMX2MY2** | Mengembalikan jumlah selisih kuadrat elemen array yang sesuai. | `SUMX2MY2([1,2], [3,4])` | Array1, array2. | -20 |
| **SUMX2PY2** | Mengembalikan jumlah dari jumlah kuadrat elemen array yang sesuai. | `SUMX2PY2([1,2], [3,4])` | Array1, array2. | 30 |
| **SUMXMY2** | Mengembalikan jumlah kuadrat dari selisih elemen array yang sesuai. | `SUMXMY2([1,2], [3,4])` | Array1, array2. | 8 |
| **TAN** | Mengembalikan tangen (dalam radian). | `TAN(1)` | Sudut dalam radian. | 1.5574077246549023 |
| **TANH** | Mengembalikan tangen hiperbolik. | `TANH(-2)` | Angka apa pun. | -0.9640275800758168 |
| **TRUNC** | Memotong angka menjadi integer tanpa pembulatan. | `TRUNC(-8.9)` | Angka, [digit]. | -8 |

### Statistik

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Mengembalikan rata-rata deviasi absolut. | `AVEDEV([2,4], [8,16])` | Array angka yang mewakili titik data. | 4.5 |
| **AVERAGE** | Mengembalikan rata-rata aritmetika. | `AVERAGE([2,4], [8,16])` | Array angka yang mewakili titik data. | 7.5 |
| **AVERAGEA** | Mengembalikan rata-rata nilai, termasuk teks dan nilai logika. | `AVERAGEA([2,4], [8,16])` | Array angka, teks, atau nilai logika; semua nilai yang tidak kosong disertakan. | 7.5 |
| **AVERAGEIF** | Menghitung rata-rata berdasarkan satu kondisi. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | Parameter pertama adalah rentang yang akan diperiksa, kedua adalah kondisi, ketiga rentang opsional yang digunakan untuk perata-rataan. | 3.5 |
| **AVERAGEIFS** | Menghitung rata-rata berdasarkan beberapa kondisi. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Parameter pertama adalah nilai yang akan dirata-ratakan, diikuti oleh pasangan rentang kriteria dan ekspresi kriteria. | 6 |
| **BETADIST** | Mengembalikan kepadatan probabilitas beta kumulatif. | `BETADIST(2, 8, 10, true, 1, 3)` | Nilai, alfa, beta, bendera kumulatif, A (opsional), B (opsional). | 0.6854705810117458 |
| **BETAINV** | Mengembalikan invers dari distribusi beta kumulatif. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Probabilitas, alfa, beta, A (opsional), B (opsional). | 1.9999999999999998 |
| **BINOMDIST** | Mengembalikan probabilitas distribusi binomial. | `BINOMDIST(6, 10, 0.5, false)` | Jumlah keberhasilan, percobaan, probabilitas keberhasilan, bendera kumulatif. | 0.205078125 |
| **CORREL** | Mengembalikan koefisien korelasi antara dua kumpulan data. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Dua array angka. | 0.9970544855015815 |
| **COUNT** | Menghitung sel numerik. | `COUNT([1,2], [3,4])` | Array atau rentang angka. | 4 |
| **COUNTA** | Menghitung sel yang tidak kosong. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Array atau rentang tipe apa pun. | 4 |
| **COUNTBLANK** | Menghitung sel kosong. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Array atau rentang tipe apa pun. | 2 |
| **COUNTIF** | Menghitung sel yang cocok dengan suatu kondisi. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Rentang angka atau teks, dan kondisi. | 3 |
| **COUNTIFS** | Menghitung sel yang cocok dengan beberapa kondisi. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Pasangan rentang kriteria dan ekspresi kriteria. | 2 |
| **COVARIANCEP** | Mengembalikan kovarians populasi. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Dua array angka. | 5.2 |
| **COVARIANCES** | Mengembalikan kovarians sampel. | `COVARIANCES([2,4,8], [5,11,12])` | Dua array angka. | 9.666666666666668 |
| **DEVSQ** | Mengembalikan jumlah kuadrat deviasi. | `DEVSQ([2,4,8,16])` | Array angka yang mewakili titik data. | 115 |
| **EXPONDIST** | Mengembalikan distribusi eksponensial. | `EXPONDIST(0.2, 10, true)` | Nilai, lambda, bendera kumulatif. | 0.8646647167633873 |
| **FDIST** | Mengembalikan distribusi probabilitas F. | `FDIST(15.2069, 6, 4, false)` | Nilai, derajat kebebasan 1, derajat kebebasan 2, bendera kumulatif. | 0.0012237917087831735 |
| **FINV** | Mengembalikan invers dari distribusi F. | `FINV(0.01, 6, 4)` | Probabilitas, derajat kebebasan 1, derajat kebebasan 2. | 0.10930991412457851 |
| **FISHER** | Mengembalikan transformasi Fisher. | `FISHER(0.75)` | Angka yang mewakili koefisien korelasi. | 0.9729550745276566 |
| **FISHERINV** | Mengembalikan invers transformasi Fisher. | `FISHERINV(0.9729550745276566)` | Angka yang mewakili hasil transformasi Fisher. | 0.75 |
| **FORECAST** | Memprediksi nilai-y untuk x yang diberikan menggunakan nilai x dan y yang diketahui. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Nilai x baru, array nilai y yang diketahui, array nilai x yang diketahui. | 10.607253086419755 |
| **FREQUENCY** | Mengembalikan distribusi frekuensi. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Array data, array bin. | 1,2,4,2 |
| **GAMMA** | Mengembalikan fungsi gamma. | `GAMMA(2.5)` | Angka positif. | 1.3293403919101043 |
| **GAMMALN** | Mengembalikan logaritma natural dari fungsi gamma. | `GAMMALN(10)` | Angka positif. | 12.801827480081961 |
| **GAUSS** | Mengembalikan probabilitas berdasarkan distribusi normal standar. | `GAUSS(2)` | Angka yang mewakili skor-z. | 0.4772498680518208 |
| **GEOMEAN** | Mengembalikan rata-rata geometris. | `GEOMEAN([2,4], [8,16])` | Array angka. | 5.656854249492381 |
| **GROWTH** | Memprediksi nilai pertumbuhan eksponensial berdasarkan data yang diketahui. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Array nilai y yang diketahui, array nilai x yang diketahui, nilai x baru. | 32.00000000000003 |
| **HARMEAN** | Mengembalikan rata-rata harmonik. | `HARMEAN([2,4], [8,16])` | Array angka. | 4.266666666666667 |
| **HYPGEOMDIST** | Mengembalikan distribusi hipergeometrik. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Keberhasilan sampel, ukuran sampel, keberhasilan populasi, ukuran populasi, bendera kumulatif. | 0.3632610939112487 |
| **INTERCEPT** | Mengembalikan titik potong (intercept) dari garis regresi linier. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Array nilai y yang diketahui, array nilai x yang diketahui. | 0.04838709677419217 |
| **KURT** | Mengembalikan kurtosis. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Array angka. | -0.15179963720841627 |
| **LARGE** | Mengembalikan nilai terbesar ke-k. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Array angka, k. | 5 |
| **LINEST** | Melakukan analisis regresi linier. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Array nilai y yang diketahui, array nilai x yang diketahui, kembalikan statistik tambahan, kembalikan lebih banyak statistik. | 2,1 |
| **LOGNORMDIST** | Mengembalikan distribusi lognormal. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Nilai, rata-rata, standar deviasi, bendera kumulatif. | 0.0390835557068005 |
| **LOGNORMINV** | Mengembalikan invers dari distribusi lognormal. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Probabilitas, rata-rata, standar deviasi, bendera kumulatif. | 4.000000000000001 |
| **MAX** | Mengembalikan nilai maksimum. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Array angka. | 0.8 |
| **MAXA** | Mengembalikan nilai maksimum termasuk teks dan nilai logika. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Array angka, teks, atau nilai logika. | 1 |
| **MEDIAN** | Mengembalikan median. | `MEDIAN([1,2,3], [4,5,6])` | Array angka. | 3.5 |
| **MIN** | Mengembalikan nilai minimum. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Array angka. | 0.1 |
| **MINA** | Mengembalikan nilai minimum termasuk teks dan nilai logika. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Array angka, teks, atau nilai logika. | 0 |
| **MODEMULT** | Mengembalikan array dari nilai yang paling sering muncul. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Array angka. | 2,3 |
| **MODESNGL** | Mengembalikan nilai tunggal yang paling sering muncul. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Array angka. | 2 |
| **NORMDIST** | Mengembalikan distribusi normal. | `NORMDIST(42, 40, 1.5, true)` | Nilai, rata-rata, standar deviasi, bendera kumulatif. | 0.9087887802741321 |
| **NORMINV** | Mengembalikan invers dari distribusi normal. | `NORMINV(0.9087887802741321, 40, 1.5)` | Probabilitas, rata-rata, standar deviasi. | 42 |
| **NORMSDIST** | Mengembalikan distribusi normal standar. | `NORMSDIST(1, true)` | Angka yang mewakili skor-z. | 0.8413447460685429 |
| **NORMSINV** | Mengembalikan invers dari distribusi normal standar. | `NORMSINV(0.8413447460685429)` | Probabilitas. | 1.0000000000000002 |
| **PEARSON** | Mengembalikan koefisien korelasi momen-produk Pearson. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Dua array angka. | 0.6993786061802354 |
| **PERCENTILEEXC** | Mengembalikan persentil ke-k, eksklusif. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Array angka, k. | 1.5 |
| **PERCENTILEINC** | Mengembalikan persentil ke-k, inklusif. | `PERCENTILEINC([1,2,3,4], 0.3)` | Array angka, k. | 1.9 |
| **PERCENTRANKEXC** | Mengembalikan peringkat suatu nilai dalam kumpulan data sebagai persentase (eksklusif). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Array angka, nilai x, signifikansi (opsional). | 0.4 |
| **PERCENTRANKINC** | Mengembalikan peringkat suatu nilai dalam kumpulan data sebagai persentase (inklusif). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Array angka, nilai x, signifikansi (opsional). | 0.33 |
| **PERMUT** | Mengembalikan jumlah permutasi. | `PERMUT(100, 3)` | Jumlah total n, jumlah yang dipilih k. | 970200 |
| **PERMUTATIONA** | Mengembalikan jumlah permutasi dengan pengulangan. | `PERMUTATIONA(4, 3)` | Jumlah total n, jumlah yang dipilih k. | 64 |
| **PHI** | Mengembalikan fungsi kepadatan dari distribusi normal standar. | `PHI(0.75)` | Angka yang mewakili skor-z. | 0.30113743215480443 |
| **POISSONDIST** | Mengembalikan distribusi Poisson. | `POISSONDIST(2, 5, true)` | Jumlah kejadian, rata-rata, bendera kumulatif. | 0.12465201948308113 |
| **PROB** | Mengembalikan jumlah probabilitas. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Array nilai, array probabilitas, batas bawah, batas atas. | 0.4 |
| **QUARTILEEXC** | Mengembalikan kuartil dari kumpulan data, eksklusif. | `QUARTILEEXC([1,2,3,4], 1)` | Array angka, kuartil. | 1.25 |
| **QUARTILEINC** | Mengembalikan kuartil dari kumpulan data, inklusif. | `QUARTILEINC([1,2,3,4], 1)` | Array angka, kuartil. | 1.75 |
| **RANKAVG** | Mengembalikan peringkat rata-rata. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Angka, array angka, urutan (naik/turun). | 4.5 |
| **RANKEQ** | Mengembalikan peringkat suatu angka. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Angka, array angka, urutan (naik/turun). | 4 |
| **RSQ** | Mengembalikan koefisien determinasi. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Dua array angka. | 0.4891304347826088 |
| **SKEW** | Mengembalikan kemiringan (skewness). | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Array angka. | 0.3595430714067974 |
| **SKEWP** | Mengembalikan kemiringan populasi. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Array angka. | 0.303193339354144 |
| **SLOPE** | Mengembalikan kemiringan (slope) dari garis regresi linier. | `SLOPE([1,9,5,7], [0,4,2,3])` | Array nilai y yang diketahui, array nilai x yang diketahui. | 2 |
| **SMALL** | Mengembalikan nilai terkecil ke-k. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Array angka, k. | 3 |
| **STANDARDIZE** | Mengembalikan nilai yang dinormalisasi sebagai skor-z. | `STANDARDIZE(42, 40, 1.5)` | Nilai, rata-rata, standar deviasi. | 1.3333333333333333 |
| **STDEVA** | Mengembalikan standar deviasi, termasuk teks dan nilai logika. | `STDEVA([2,4], [8,16], [true, false])` | Array angka, teks, atau nilai logika. | 6.013872850889572 |
| **STDEVP** | Mengembalikan standar deviasi populasi. | `STDEVP([2,4], [8,16], [true, false])` | Array angka. | 5.361902647381804 |
| **STDEVPA** | Mengembalikan standar deviasi populasi, termasuk teks dan nilai logika. | `STDEVPA([2,4], [8,16], [true, false])` | Array angka, teks, atau nilai logika. | 5.489889697333535 |
| **STDEVS** | Mengembalikan standar deviasi sampel. | `VARS([2,4], [8,16], [true, false])` | Array angka. | 6.191391873668904 |
| **STEYX** | Mengembalikan kesalahan standar dari nilai-y yang diprediksi. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Array nilai y yang diketahui, array nilai x yang diketahui. | 3.305718950210041 |
| **TINV** | Mengembalikan invers dari distribusi-t. | `TINV(0.9946953263673741, 1)` | Probabilitas, derajat kebebasan. | 59.99999999996535 |
| **TRIMMEAN** | Mengembalikan rata-rata dari bagian dalam kumpulan data. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Array angka, proporsi pemotongan. | 3.7777777777777777 |
| **VARA** | Mengembalikan varians termasuk teks dan nilai logika. | `VARA([2,4], [8,16], [true, false])` | Array angka, teks, atau nilai logika. | 36.16666666666667 |
| **VARP** | Mengembalikan varians populasi. | `VARP([2,4], [8,16], [true, false])` | Array angka. | 28.75 |
| **VARPA** | Mengembalikan varians populasi termasuk teks dan nilai logika. | `VARPA([2,4], [8,16], [true, false])` | Array angka, teks, atau nilai logika. | 30.13888888888889 |
| **VARS** | Mengembalikan varians sampel. | `VARS([2,4], [8,16], [true, false])` | Array angka. | 38.333333333333336 |
| **WEIBULLDIST** | Mengembalikan distribusi Weibull. | `WEIBULLDIST(105, 20, 100, true)` | Nilai, alfa, beta, bendera kumulatif. | 0.9295813900692769 |
| **ZTEST** | Mengembalikan probabilitas satu arah dari uji-z. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Array angka, rata-rata hipotesis. | 0.09057419685136381 |

### Teks

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Mengonversi kode angka ke karakter yang sesuai. | `CHAR(65)` | Angka yang mewakili kode karakter. | A |
| **CLEAN** | Menghapus semua karakter yang tidak dapat dicetak dari teks. | `CLEAN('Monthly report')` | String teks yang akan dibersihkan. | Monthly report |
| **CODE** | Mengembalikan kode numerik dari karakter pertama dalam string teks. | `CODE('A')` | String teks yang berisi satu karakter. | 65 |
| **CONCATENATE** | Menggabungkan beberapa string teks menjadi satu string. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Satu atau lebih string teks yang akan digabungkan. | Andreas Hauser |
| **EXACT** | Memeriksa apakah dua string sama persis, peka terhadap huruf besar/kecil (case-sensitive). | `EXACT('Word', 'word')` | Dua string teks yang akan dibandingkan. | |
| **FIND** | Menemukan posisi substring mulai dari posisi tertentu. | `FIND('M', 'Miriam McGovern', 3)` | Teks yang akan dicari, teks sumber, posisi mulai opsional. | 8 |
| **LEFT** | Mengembalikan jumlah karakter tertentu dari sisi kiri string. | `LEFT('Sale Price', 4)` | String teks dan jumlah karakter. | Sale |
| **LEN** | Mengembalikan jumlah karakter dalam string teks. | `LEN('Phoenix, AZ')` | String teks yang akan dihitung. | 11 |
| **LOWER** | Mengonversi semua karakter menjadi huruf kecil. | `LOWER('E. E. Cummings')` | String teks yang akan dikonversi. | e. e. cummings |
| **MID** | Mengembalikan jumlah karakter tertentu dari tengah string. | `MID('Fluid Flow', 7, 20)` | String teks, posisi mulai, jumlah karakter. | Flow |
| **NUMBERVALUE** | Mengonversi teks menjadi angka menggunakan pemisah yang ditentukan. | `NUMBERVALUE('2.500,27', ',', '.')` | String teks, pemisah desimal, pemisah grup. | 2500.27 |
| **PROPER** | Mengubah huruf pertama setiap kata menjadi huruf besar. | `PROPER('this is a TITLE')` | String teks yang akan diformat. | This Is A Title |
| **REPLACE** | Mengganti bagian dari string teks dengan teks baru. | `REPLACE('abcdefghijk', 6, 5, '*')` | Teks asli, posisi mulai, jumlah karakter, teks baru. | abcde*k |
| **REPT** | Mengulang teks sebanyak jumlah yang ditentukan. | `REPT('*-', 3)` | String teks dan jumlah pengulangan. | *-*-*- |
| **RIGHT** | Mengembalikan jumlah karakter tertentu dari sisi kanan string. | `RIGHT('Sale Price', 5)` | String teks dan jumlah karakter. | Price |
| **ROMAN** | Mengonversi angka Arab ke angka Romawi. | `ROMAN(499)` | Angka Arab yang akan dikonversi. | CDXCIX |
| **SEARCH** | Menemukan posisi substring, tidak peka terhadap huruf besar/kecil. | `SEARCH('margin', 'Profit Margin')` | Teks yang akan dicari, teks sumber. | 8 |
| **SUBSTITUTE** | Mengganti instans tertentu dari teks lama dengan teks baru. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Teks asli, teks lama, teks baru, nomor instans opsional. | Quarter 1, 2012 |
| **T** | Mengembalikan teks jika nilainya adalah teks; jika tidak, mengembalikan string kosong. | `T('Rainfall')` | Argumen dapat berupa tipe data apa pun. | Rainfall |
| **TRIM** | Menghapus spasi dari teks kecuali spasi tunggal di antara kata-kata. | `TRIM(' First Quarter Earnings ')` | String teks yang akan dipangkas. | First Quarter Earnings |
| **TEXTJOIN** | Menggabungkan beberapa item teks menjadi satu string menggunakan pembatas. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Pembatas, bendera abaikan-kosong, item teks yang akan digabungkan. | The sun will come up tomorrow. |
| **UNICHAR** | Mengembalikan karakter untuk nomor Unicode yang diberikan. | `UNICHAR(66)` | Titik kode Unicode. | B |
| **UNICODE** | Mengembalikan nomor Unicode dari karakter pertama teks. | `UNICODE('B')` | String teks yang berisi satu karakter. | 66 |
| **UPPER** | Mengonversi semua karakter menjadi huruf besar. | `UPPER('total')` | String teks yang akan dikonversi. | TOTAL |