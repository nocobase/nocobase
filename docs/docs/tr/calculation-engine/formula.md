:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/calculation-engine/formula) bakın.
:::

# Formula.js

[Formula.js](http://formulajs.info/), Excel ile uyumlu geniş bir fonksiyon koleksiyonu sunar.

## Fonksiyon Referansı

### Tarihler

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Belirtilen yıl, ay ve güne göre bir tarih oluşturur. | `DATE(2008, 7, 8)` | Yıl (tam sayı), ay (1-12), gün (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Metin biçimindeki bir tarihi, tarih seri numarasına dönüştürür. | `DATEVALUE('8/22/2011')` | Bir tarihi temsil eden metin dizesi. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Bir tarihin gün kısmını döndürür. | `DAY('15-Apr-11')` | Tarih değeri veya tarih metin dizesi. | 15 |
| **DAYS** | İki tarih arasındaki gün sayısını hesaplar. | `DAYS('3/15/11', '2/1/11')` | Bitiş tarihi, başlangıç tarihi. | 42 |
| **DAYS360** | 360 günlük bir yılı temel alarak iki tarih arasındaki gün sayısını hesaplar. | `DAYS360('1-Jan-11', '31-Dec-11')` | Başlangıç tarihi, bitiş tarihi. | 360 |
| **EDATE** | Bir tarihten belirli bir ay sayısı öncesindeki veya sonrasındaki tarihi döndürür. | `EDATE('1/15/11', -1)` | Başlangıç tarihi, ay sayısı (gelecek için pozitif, geçmiş için negatif). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Belirtilen ay sayısı öncesindeki veya sonrasındaki ayın son gününü döndürür. | `EOMONTH('1/1/11', -3)` | Başlangıç tarihi, ay sayısı (gelecek için pozitif, geçmiş için negatif). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Bir zaman değerinin saat kısmını döndürür. | `HOUR('7/18/2011 7:45:00 AM')` | Zaman değeri veya zaman metin dizesi. | 7 |
| **MINUTE** | Bir zaman değerinin dakika kısmını döndürür. | `MINUTE('2/1/2011 12:45:00 PM')` | Zaman değeri veya zaman metin dizesi. | 45 |
| **ISOWEEKNUM** | Belirli bir tarihin yıl içindeki ISO hafta numarasını döndürür. | `ISOWEEKNUM('3/9/2012')` | Tarih değeri veya tarih metin dizesi. | 10 |
| **MONTH** | Bir tarihin ay kısmını döndürür. | `MONTH('15-Apr-11')` | Tarih değeri veya tarih metin dizesi. | 4 |
| **NETWORKDAYS** | Hafta sonlarını ve isteğe bağlı tatilleri hariç tutarak iki tarih arasındaki iş günü sayısını hesaplar. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Başlangıç tarihi, bitiş tarihi, isteğe bağlı tatil dizisi. | 109 |
| **NETWORKDAYSINTL** | Özel hafta sonları ve isteğe bağlı tatillerle iki tarih arasındaki iş günü sayısını hesaplar. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Başlangıç tarihi, bitiş tarihi, hafta sonu modu, isteğe bağlı tatil dizisi. | 23 |
| **NOW** | Mevcut tarih ve saati döndürür. | `NOW()` | Parametre yok. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Bir zaman değerinin saniye kısmını döndürür. | `SECOND('2/1/2011 4:48:18 PM')` | Zaman değeri veya zaman metin dizesi. | 18 |
| **TIME** | Belirtilen saat, dakika ve saniyeden bir zaman değeri oluşturur. | `TIME(16, 48, 10)` | Saat (0-23), dakika (0-59), saniye (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Metin biçimindeki bir zamanı, zaman seri numarasına dönüştürür. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Bir zamanı temsil eden metin dizesi. | 0.2743055555555556 |
| **TODAY** | Mevcut tarihi döndürür. | `TODAY()` | Parametre yok. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Haftanın gününe karşılık gelen sayıyı döndürür. | `WEEKDAY('2/14/2008', 3)` | Tarih değeri veya tarih metin dizesi, dönüş türü (1-3). | 3 |
| **YEAR** | Bir tarihin yıl kısmını döndürür. | `YEAR('7/5/2008')` | Tarih değeri veya tarih metin dizesi. | 2008 |
| **WEEKNUM** | Belirli bir tarihin yıl içindeki hafta numarasını döndürür. | `WEEKNUM('3/9/2012', 2)` | Tarih değeri veya tarih metin dizesi, isteğe bağlı hafta başlangıç günü (1=Pazar, 2=Pazartesi). | 11 |
| **WORKDAY** | Hafta sonlarını ve isteğe bağlı tatilleri hariç tutarak, belirli bir iş günü sayısı öncesindeki veya sonrasındaki tarihi döndürür. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Başlangıç tarihi, iş günü sayısı, isteğe bağlı tatil dizisi. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Özel hafta sonları ve isteğe bağlı tatillerle, belirli bir iş günü sayısı öncesindeki veya sonrasındaki tarihi döndürür. | `WORKDAYINTL('1/1/2012', 30, 17)` | Başlangıç tarihi, iş günü sayısı, hafta sonu modu. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | İki tarih arasındaki yıl kesrini hesaplar. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Başlangıç tarihi, bitiş tarihi, isteğe bağlı temel (gün sayım temeli). | 0.5780821917808219 |

### Finansal

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Periyodik faiz ödeyen bir menkul kıymetin tahakkuk etmiş faizini hesaplar. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | İhraç tarihi, ilk faiz tarihi, takas tarihi, yıllık oran, nominal değer, sıklık, temel. | 350 |
| **CUMIPMT** | Bir dizi ödemede ödenen kümülatif faizi hesaplar. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Oran, toplam dönem sayısı, bugünkü değer, başlangıç dönemi, bitiş dönemi, ödeme türü (0=dönem sonu, 1=dönem başı). | -9916.77251395708 |
| **CUMPRINC** | Bir dizi ödemede ödenen kümülatif anaparayı hesaplar. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Oran, toplam dönem sayısı, bugünkü değer, başlangıç dönemi, bitiş dönemi, ödeme türü (0=dönem sonu, 1=dönem başı). | -614.0863271085149 |
| **DB** | Sabit azalan bakiye yöntemini kullanarak amortismanı hesaplar. | `DB(1000000, 100000, 6, 1, 6)` | Maliyet, hurda değer, ömür, dönem, ay. | 159500 |
| **DDB** | Çift azalan bakiye veya belirtilen başka bir yöntemi kullanarak amortismanı hesaplar. | `DDB(1000000, 100000, 6, 1, 1.5)` | Maliyet, hurda değer, ömür, dönem, faktör. | 250000 |
| **DOLLARDE** | Kesir olarak ifade edilen bir fiyatı ondalık sayıya dönüştürür. | `DOLLARDE(1.1, 16)` | Kesirli dolar olarak fiyat, payda. | 1.625 |
| **DOLLARFR** | Ondalık sayı olarak ifade edilen bir fiyatı kesre dönüştürür. | `DOLLARFR(1.625, 16)` | Ondalık dolar olarak fiyat, payda. | 1.1 |
| **EFFECT** | Efektif yıllık faiz oranını hesaplar. | `EFFECT(0.1, 4)` | Nominal yıllık oran, yıllık bileşik faiz dönemi sayısı. | 0.10381289062499977 |
| **FV** | Bir yatırımın gelecek değerini hesaplar. | `FV(0.1/12, 10, -100, -1000, 0)` | Dönem başına oran, dönem sayısı, dönem başına ödeme, bugünkü değer, ödeme türü (0=dönem sonu, 1=dönem başı). | 2124.874409194097 |
| **FVSCHEDULE** | Bir dizi bileşik faiz oranı kullanarak anaparanın gelecek değerini hesaplar. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Anapara, oranlar dizisi. | 133.08900000000003 |
| **IPMT** | Belirli bir dönem için faiz ödemesini hesaplar. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Dönem başına oran, dönem, toplam dönem sayısı, bugünkü değer, gelecek değer, ödeme türü (0=dönem sonu, 1=dönem başı). | 928.8235718400465 |
| **IRR** | İç verim oranını hesaplar. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Nakit akışları dizisi, tahmin. | 0.05715142887178447 |
| **ISPMT** | Belirli bir dönemde ödenen faizi hesaplar (krediler için). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Dönem başına oran, dönem, toplam dönem sayısı, kredi tutarı. | -625 |
| **MIRR** | Değiştirilmiş iç verim oranını hesaplar. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Nakit akışları dizisi, finansman oranı, yeniden yatırım oranı. | 0.07971710360838036 |
| **NOMINAL** | Nominal yıllık faiz oranını hesaplar. | `NOMINAL(0.1, 4)` | Efektif yıllık oran, yıllık bileşik faiz dönemi sayısı. | 0.09645475633778045 |
| **NPER** | Hedef değere ulaşmak için gereken dönem sayısını hesaplar. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Dönem başına oran, dönem başına ödeme, bugünkü değer, gelecek değer, ödeme türü (0=dönem sonu, 1=dönem başı). | 63.39385422740764 |
| **NPV** | Bir dizi gelecekteki nakit akışının net bugünkü değerini hesaplar. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Dönem başına iskonto oranı, nakit akışları dizisi. | 1031.3503176012546 |
| **PDURATION** | İstenen bir değere ulaşmak için gereken süreyi hesaplar. | `PDURATION(0.1, 1000, 2000)` | Dönem başına oran, bugünkü değer, gelecek değer. | 7.272540897341714 |
| **PMT** | Bir kredinin periyodik ödemesini hesaplar. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Dönem başına oran, toplam dönem sayısı, bugünkü değer, gelecek değer, ödeme türü (0=dönem sonu, 1=dönem başı). | -42426.08563793503 |
| **PPMT** | Belirli bir dönem için anapara ödemesini hesaplar. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Dönem başına oran, dönem, toplam dönem sayısı, bugünkü değer, gelecek değer, ödeme türü (0=dönem sonu, 1=dönem başı). | -43354.909209775076 |
| **PV** | Bir yatırımın bugünkü değerini hesaplar. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Dönem başına oran, dönem sayısı, dönem başına ödeme, gelecek değer, ödeme türü (0=dönem sonu, 1=dönem başı). | -29864.950264779152 |
| **RATE** | Dönem başına faiz oranını hesaplar. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Toplam dönem sayısı, dönem başına ödeme, bugünkü değer, gelecek değer, ödeme türü (0=dönem sonu, 1=dönem başı), tahmin. | 0.06517891177181533 |

### Mühendislik

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | İkilik (binary) bir sayıyı onluk (decimal) sayıya dönüştürür. | `BIN2DEC(101010)` | İkilik sayı. | 42 |
| **BIN2HEX** | İkilik bir sayıyı onaltılık (hexadecimal) sayıya dönüştürür. | `BIN2HEX(101010)` | İkilik sayı. | 2a |
| **BIN2OCT** | İkilik bir sayıyı sekizlik (octal) sayıya dönüştürür. | `BIN2OCT(101010)` | İkilik sayı. | 52 |
| **BITAND** | İki sayının bit düzeyinde VE (AND) sonucunu döndürür. | `BITAND(42, 24)` | Tam sayı, tam sayı. | 8 |
| **BITLSHIFT** | Bit düzeyinde sola kaydırma işlemi gerçekleştirir. | `BITLSHIFT(42, 24)` | Tam sayı, kaydırılacak bit sayısı. | 704643072 |
| **BITOR** | İki sayının bit düzeyinde VEYA (OR) sonucunu döndürür. | `BITOR(42, 24)` | Tam sayı, tam sayı. | 58 |
| **BITRSHIFT** | Bit düzeyinde sağa kaydırma işlemi gerçekleştirir. | `BITRSHIFT(42, 2)` | Tam sayı, kaydırılacak bit sayısı. | 10 |
| **BITXOR** | İki sayının bit düzeyinde ÖZEL VEYA (XOR) sonucunu döndürür. | `BITXOR(42, 24)` | Tam sayı, tam sayı. | 50 |
| **COMPLEX** | Karmaşık bir sayı oluşturur. | `COMPLEX(3, 4)` | Gerçek kısım, sanal kısım. | 3+4i |
| **CONVERT** | Bir sayıyı bir ölçü biriminden diğerine dönüştürür. | `CONVERT(64, 'kibyte', 'bit')` | Değer, kaynak birim, hedef birim. | 524288 |
| **DEC2BIN** | Onluk bir sayıyı ikilik sayıya dönüştürür. | `DEC2BIN(42)` | Onluk sayı. | 101010 |
| **DEC2HEX** | Onluk bir sayıyı onaltılık sayıya dönüştürür. | `DEC2HEX(42)` | Onluk sayı. | 2a |
| **DEC2OCT** | Onluk bir sayıyı sekizlik sayıya dönüştürür. | `DEC2OCT(42)` | Onluk sayı. | 52 |
| **DELTA** | İki değerin eşit olup olmadığını test eder. | `DELTA(42, 42)` | Sayı, sayı. | 1 |
| **ERF** | Hata fonksiyonunu döndürür. | `ERF(1)` | Üst sınır. | 0.8427007929497149 |
| **ERFC** | Tamamlayıcı hata fonksiyonunu döndürür. | `ERFC(1)` | Alt sınır. | 0.1572992070502851 |
| **GESTEP** | Bir sayının bir eşik değerinden büyük veya eşit olup olmadığını test eder. | `GESTEP(42, 24)` | Sayı, eşik değer. | 1 |
| **HEX2BIN** | Onaltılık bir sayıyı ikilik sayıya dönüştürür. | `HEX2BIN('2a')` | Onaltılık sayı. | 101010 |
| **HEX2DEC** | Onaltılık bir sayıyı onluk sayıya dönüştürür. | `HEX2DEC('2a')` | Onaltılık sayı. | 42 |
| **HEX2OCT** | Onaltılık bir sayıyı sekizlik sayıya dönüştürür. | `HEX2OCT('2a')` | Onaltılık sayı. | 52 |
| **IMABS** | Karmaşık bir sayının mutlak değerini (büyüklüğünü) döndürür. | `IMABS('3+4i')` | Karmaşık sayı. | 5 |
| **IMAGINARY** | Karmaşık bir sayının sanal kısmını döndürür. | `IMAGINARY('3+4i')` | Karmaşık sayı. | 4 |
| **IMARGUMENT** | Karmaşık bir sayının argümanını döndürür. | `IMARGUMENT('3+4i')` | Karmaşık sayı. | 0.9272952180016122 |
| **IMCONJUGATE** | Karmaşık eşleniği döndürür. | `IMCONJUGATE('3+4i')` | Karmaşık sayı. | 3-4i |
| **IMCOS** | Karmaşık bir sayının kosinüsünü döndürür. | `IMCOS('1+i')` | Karmaşık sayı. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Karmaşık bir sayının hiperbolik kosinüsünü döndürür. | `IMCOSH('1+i')` | Karmaşık sayı. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Karmaşık bir sayının kotanjantını döndürür. | `IMCOT('1+i')` | Karmaşık sayı. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Karmaşık bir sayının kosekantını döndürür. | `IMCSC('1+i')` | Karmaşık sayı. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Karmaşık bir sayının hiperbolik kosekantını döndürür. | `IMCSCH('1+i')` | Karmaşık sayı. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | İki karmaşık sayının bölümünü döndürür. | `IMDIV('1+2i', '3+4i')` | Bölünen karmaşık sayı, bölen karmaşık sayı. | 0.44+0.08i |
| **IMEXP** | Karmaşık bir sayının üstelini döndürür. | `IMEXP('1+i')` | Karmaşık sayı. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Karmaşık bir sayının doğal logaritmasını döndürür. | `IMLN('1+i')` | Karmaşık sayı. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Karmaşık bir sayının 10 tabanında logaritmasını döndürür. | `IMLOG10('1+i')` | Karmaşık sayı. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Karmaşık bir sayının 2 tabanında logaritmasını döndürür. | `IMLOG2('1+i')` | Karmaşık sayı. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Karmaşık bir sayının kuvvetini döndürür. | `IMPOWER('1+i', 2)` | Karmaşık sayı, üs. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Karmaşık sayıların çarpımını döndürür. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Karmaşık sayılar dizisi. | -85+20i |
| **IMREAL** | Karmaşık bir sayının gerçek kısmını döndürür. | `IMREAL('3+4i')` | Karmaşık sayı. | 3 |
| **IMSEC** | Karmaşık bir sayının sekantını döndürür. | `IMSEC('1+i')` | Karmaşık sayı. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Karmaşık bir sayının hiperbolik sekantını döndürür. | `IMSECH('1+i')` | Karmaşık sayı. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Karmaşık bir sayının sinüsünü döndürür. | `IMSIN('1+i')` | Karmaşık sayı. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Karmaşık bir sayının hiperbolik sinüsünü döndürür. | `IMSINH('1+i')` | Karmaşık sayı. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Karmaşık bir sayının karekökünü döndürür. | `IMSQRT('1+i')` | Karmaşık sayı. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | İki karmaşık sayı arasındaki farkı döndürür. | `IMSUB('3+4i', '1+2i')` | Eksilen karmaşık sayı, çıkan karmaşık sayı. | 2+2i |
| **IMSUM** | Karmaşık sayıların toplamını döndürür. | `IMSUM('1+2i', '3+4i', '5+6i')` | Karmaşık sayılar dizisi. | 9+12i |
| **IMTAN** | Karmaşık bir sayının tanjantını döndürür. | `IMTAN('1+i')` | Karmaşık sayı. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Sekizlik bir sayıyı ikilik sayıya dönüştürür. | `OCT2BIN('52')` | Sekizlik sayı. | 101010 |
| **OCT2DEC** | Sekizlik bir sayıyı onluk sayıya dönüştürür. | `OCT2DEC('52')` | Sekizlik sayı. | 42 |
| **OCT2HEX** | Sekizlik bir sayıyı onaltılık sayıya dönüştürür. | `OCT2HEX('52')` | Sekizlik sayı. | 2a |

### Mantıksal

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Sadece tüm bağımsız değişkenler DOĞRU olduğunda DOĞRU, aksi takdirde YANLIŞ döndürür. | `AND(true, false, true)` | Bir veya daha fazla mantıksal değer (Boolean); fonksiyon sadece her bağımsız değişken DOĞRU olduğunda DOĞRU döndürür. | |
| **FALSE** | Mantıksal YANLIŞ değerini döndürür. | `FALSE()` | Parametre yok. | |
| **IF** | Bir koşulun DOĞRU veya YANLIŞ olmasına bağlı olarak farklı değerler döndürür. | `IF(true, 'Hello!', 'Goodbye!')` | Koşul, DOĞRU ise değer, YANLIŞ ise değer. | Hello! |
| **IFS** | Birden fazla koşulu değerlendirir ve ilk DOĞRU koşulun sonucunu döndürür. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Birden fazla koşul ve karşılık gelen değer çifti. | Goodbye! |
| **NOT** | Mantıksal bir değeri tersine çevirir. DOĞRU, YANLIŞ olur ve tersi de geçerlidir. | `NOT(true)` | Bir mantıksal değer (Boolean). | |
| **OR** | Herhangi bir bağımsız değişken DOĞRU ise DOĞRU, aksi takdirde YANLIŞ döndürür. | `OR(true, false, true)` | Bir veya daha fazla mantıksal değer (Boolean); herhangi bir bağımsız değişken DOĞRU olduğunda DOĞRU döndürür. | |
| **SWITCH** | Bir ifadeyle eşleşen değeri döndürür; eşleşme yoksa varsayılanı döndürür. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | İfade, eşleşme değeri 1, sonuç 1, ..., [varsayılan]. | Seven |
| **TRUE** | Mantıksal DOĞRU değerini döndürür. | `TRUE()` | Parametre yok. | |
| **XOR** | Sadece tek sayıda bağımsız değişken DOĞRU olduğunda DOĞRU, aksi takdirde YANLIŞ döndürür. | `XOR(true, false, true)` | Bir veya daha fazla mantıksal değer (Boolean); tek sayıda DOĞRU olduğunda DOĞRU döndürür. | |

### Matematik

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Bir sayının mutlak değerini döndürür. | `ABS(-4)` | Sayı. | 4 |
| **ACOS** | Ark kosinüsü (radyan cinsinden) döndürür. | `ACOS(-0.5)` | -1 ile 1 arasında sayı. | 2.0943951023931957 |
| **ACOSH** | Ters hiperbolik kosinüsü döndürür. | `ACOSH(10)` | 1'e eşit veya 1'den büyük sayı. | 2.993222846126381 |
| **ACOT** | Ark kotanjantı (radyan cinsinden) döndürür. | `ACOT(2)` | Herhangi bir sayı. | 0.46364760900080615 |
| **ACOTH** | Ters hiperbolik kotanjantı döndürür. | `ACOTH(6)` | Mutlak değeri 1'den büyük olan sayı. | 0.16823611831060645 |
| **AGGREGATE** | Hataları veya gizli satırları yoksayarak bir toplama hesaplaması yapar. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Fonksiyon numarası, seçenekler, dizi1, ..., diziN. | 10,32 |
| **ARABIC** | Bir Roma rakamını Arap rakamına dönüştürür. | `ARABIC('MCMXII')` | Roma rakamı dizesi. | 1912 |
| **ASIN** | Ark sinüsü (radyan cinsinden) döndürür. | `ASIN(-0.5)` | -1 ile 1 arasında sayı. | -0.5235987755982988 |
| **ASINH** | Ters hiperbolik sinüsü döndürür. | `ASINH(-2.5)` | Herhangi bir sayı. | -1.6472311463710965 |
| **ATAN** | Ark tanjantı (radyan cinsinden) döndürür. | `ATAN(1)` | Herhangi bir sayı. | 0.7853981633974483 |
| **ATAN2** | Bir koordinat çiftinin ark tanjantını (radyan cinsinden) döndürür. | `ATAN2(-1, -1)` | y-koordinatı, x-koordinatı. | -2.356194490192345 |
| **ATANH** | Ters hiperbolik tanjantı döndürür. | `ATANH(-0.1)` | -1 ile 1 arasında sayı. | -0.10033534773107562 |
| **BASE** | Bir sayıyı belirtilen tabanda metne dönüştürür. | `BASE(15, 2, 10)` | Sayı, taban (radix), [minimum uzunluk]. | 0000001111 |
| **CEILING** | Bir sayıyı en yakın kata yukarı yuvarlar. | `CEILING(-5.5, 2, -1)` | Sayı, anlamlılık, [mod]. | -6 |
| **CEILINGMATH** | Belirtilen katı ve yönü kullanarak bir sayıyı yukarı yuvarlar. | `CEILINGMATH(-5.5, 2, -1)` | Sayı, [anlamlılık], [mod]. | -6 |
| **CEILINGPRECISE** | İşareti yoksayarak bir sayıyı en yakın kata yukarı yuvarlar. | `CEILINGPRECISE(-4.1, -2)` | Sayı, [anlamlılık]. | -4 |
| **COMBIN** | Kombinasyon sayısını döndürür. | `COMBIN(8, 2)` | Toplam öğe sayısı, seçilen öğe sayısı. | 28 |
| **COMBINA** | Tekrarlı kombinasyon sayısını döndürür. | `COMBINA(4, 3)` | Toplam öğe sayısı, seçilen öğe sayısı. | 20 |
| **COS** | Kosinüsü (radyan cinsinden) döndürür. | `COS(1)` | Radyan cinsinden açı. | 0.5403023058681398 |
| **COSH** | Hiperbolik kosinüsü döndürür. | `COSH(1)` | Herhangi bir sayı. | 1.5430806348152437 |
| **COT** | Kotanjantı (radyan cinsinden) döndürür. | `COT(30)` | Radyan cinsinden açı. | -0.15611995216165922 |
| **COTH** | Hiperbolik kotanjantı döndürür. | `COTH(2)` | Herhangi bir sayı. | 1.0373147207275482 |
| **CSC** | Kosekantı (radyan cinsinden) döndürür. | `CSC(15)` | Radyan cinsinden açı. | 1.5377805615408537 |
| **CSCH** | Hiperbolik kosekantı döndürür. | `CSCH(1.5)` | Herhangi bir sayı. | 0.46964244059522464 |
| **DECIMAL** | Metin biçimindeki bir sayıyı onluk sayıya dönüştürür. | `DECIMAL('FF', 16)` | Metin, taban. | 255 |
| **ERF** | Hata fonksiyonunu döndürür. | `ERF(1)` | Üst sınır. | 0.8427007929497149 |
| **ERFC** | Tamamlayıcı hata fonksiyonunu döndürür. | `ERFC(1)` | Alt sınır. | 0.1572992070502851 |
| **EVEN** | Bir sayıyı en yakın çift tam sayıya yukarı yuvarlar. | `EVEN(-1)` | Sayı. | -2 |
| **EXP** | e sayısının kuvvetini döndürür. | `EXP(1)` | Üs. | 2.718281828459045 |
| **FACT** | Faktöriyeli döndürür. | `FACT(5)` | Negatif olmayan tam sayı. | 120 |
| **FACTDOUBLE** | Çift faktöriyeli döndürür. | `FACTDOUBLE(7)` | Negatif olmayan tam sayı. | 105 |
| **FLOOR** | Bir sayıyı en yakın kata aşağı yuvarlar. | `FLOOR(-3.1)` | Sayı, anlamlılık. | -4 |
| **FLOORMATH** | Belirtilen katı ve yönü kullanarak bir sayıyı aşağı yuvarlar. | `FLOORMATH(-4.1, -2, -1)` | Sayı, [anlamlılık], [mod]. | -4 |
| **FLOORPRECISE** | İşareti yoksayarak bir sayıyı en yakın kata aşağı yuvarlar. | `FLOORPRECISE(-3.1, -2)` | Sayı, [anlamlılık]. | -4 |
| **GCD** | En büyük ortak böleni döndürür. | `GCD(24, 36, 48)` | İki veya daha fazla tam sayı. | 12 |
| **INT** | Bir sayıyı en yakın tam sayıya aşağı yuvarlar. | `INT(-8.9)` | Sayı. | -9 |
| **ISEVEN** | Bir sayının çift olup olmadığını test eder. | `ISEVEN(-2.5)` | Sayı. | |
| **ISOCEILING** | ISO kurallarına göre bir sayıyı en yakın kata yukarı yuvarlar. | `ISOCEILING(-4.1, -2)` | Sayı, [anlamlılık]. | -4 |
| **ISODD** | Bir sayının tek olup olmadığını test eder. | `ISODD(-2.5)` | Sayı. | |
| **LCM** | En küçük ortak katı döndürür. | `LCM(24, 36, 48)` | İki veya daha fazla tam sayı. | 144 |
| **LN** | Doğal logaritmayı döndürür. | `LN(86)` | Pozitif sayı. | 4.454347296253507 |
| **LOG** | Belirtilen tabandaki logaritmayı döndürür. | `LOG(8, 2)` | Sayı, taban. | 3 |
| **LOG10** | 10 tabanında logaritmayı döndürür. | `LOG10(100000)` | Pozitif sayı. | 5 |
| **MOD** | Bir bölme işleminin kalanını döndürür. | `MOD(3, -2)` | Bölünen, bölen. | -1 |
| **MROUND** | Bir sayıyı en yakın kata yuvarlar. | `MROUND(-10, -3)` | Sayı, kat. | -9 |
| **MULTINOMIAL** | Multinom katsayısını döndürür. | `MULTINOMIAL(2, 3, 4)` | İki veya daha fazla negatif olmayan tam sayı. | 1260 |
| **ODD** | Bir sayıyı en yakın tek tam sayıya yukarı yuvarlar. | `ODD(-1.5)` | Sayı. | -3 |
| **POWER** | Bir sayının kuvvetini alır. | `POWER(5, 2)` | Taban, üs. | 25 |
| **PRODUCT** | Sayıların çarpımını döndürür. | `PRODUCT(5, 15, 30)` | Bir veya daha fazla sayı. | 2250 |
| **QUOTIENT** | Bir bölme işleminin tam sayı kısmını döndürür. | `QUOTIENT(-10, 3)` | Bölünen, bölen. | -3 |
| **RADIANS** | Dereceyi radyana dönüştürür. | `RADIANS(180)` | Derece. | 3.141592653589793 |
| **RAND** | 0 ile 1 arasında rastgele bir reel sayı döndürür. | `RAND()` | Parametre yok. | [0 ile 1 arasında rastgele reel sayı] |
| **RANDBETWEEN** | Belirtilen aralıkta rastgele bir tam sayı döndürür. | `RANDBETWEEN(-1, 1)` | Alt sınır, üst sınır. | [Alt ve üst sınır arasında rastgele tam sayı] |
| **ROUND** | Bir sayıyı belirtilen basamak sayısına yuvarlar. | `ROUND(626.3, -3)` | Sayı, basamak sayısı. | 1000 |
| **ROUNDDOWN** | Bir sayıyı sıfıra doğru aşağı yuvarlar. | `ROUNDDOWN(-3.14159, 2)` | Sayı, basamak sayısı. | -3.14 |
| **ROUNDUP** | Bir sayıyı sıfırdan uzağa yukarı yuvarlar. | `ROUNDUP(-3.14159, 2)` | Sayı, basamak sayısı. | -3.15 |
| **SEC** | Sekantı (radyan cinsinden) döndürür. | `SEC(45)` | Radyan cinsinden açı. | 1.9035944074044246 |
| **SECH** | Hiperbolik sekantı döndürür. | `SECH(45)` | Herhangi bir sayı. | 5.725037161098787e-20 |
| **SIGN** | Bir sayının işaretini döndürür. | `SIGN(-0.00001)` | Sayı. | -1 |
| **SIN** | Sinüsü (radyan cinsinden) döndürür. | `SIN(1)` | Radyan cinsinden açı. | 0.8414709848078965 |
| **SINH** | Hiperbolik sinüsü döndürür. | `SINH(1)` | Herhangi bir sayı. | 1.1752011936438014 |
| **SQRT** | Karekökü döndürür. | `SQRT(16)` | Negatif olmayan sayı. | 4 |
| **SQRTPI** | (sayı * π) işleminin karekökünü döndürür. | `SQRTPI(2)` | Negatif olmayan sayı. | 2.5066282746310002 |
| **SUBTOTAL** | Gizli satırları yoksayarak bir veri kümesi için alt toplam döndürür. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Fonksiyon numarası, dizi1, ..., diziN. | 10,32 |
| **SUM** | Metinleri yoksayarak sayıların toplamını döndürür. | `SUM(-5, 15, 32, 'Hello World!')` | Bir veya daha fazla sayı. | 42 |
| **SUMIF** | Tek bir koşulu karşılayan değerleri toplar. | `SUMIF([2,4,8,16], '>5')` | Aralık, kriter. | 24 |
| **SUMIFS** | Birden fazla koşulu karşılayan değerleri toplar. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Toplam aralığı, kriter aralığı 1, kriter 1, ..., kriter aralığı N, kriter N. | 12 |
| **SUMPRODUCT** | Dizi öğelerinin çarpımlarının toplamını döndürür. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | İki veya daha fazla dizi. | 5 |
| **SUMSQ** | Karelerin toplamını döndürür. | `SUMSQ(3, 4)` | Bir veya daha fazla sayı. | 25 |
| **SUMX2MY2** | Karşılık gelen dizi öğelerinin karelerinin farklarının toplamını döndürür. | `SUMX2MY2([1,2], [3,4])` | Dizi1, dizi2. | -20 |
| **SUMX2PY2** | Karşılık gelen dizi öğelerinin karelerinin toplamlarının toplamını döndürür. | `SUMX2PY2([1,2], [3,4])` | Dizi1, dizi2. | 30 |
| **SUMXMY2** | Karşılık gelen dizi öğelerinin farklarının karelerinin toplamını döndürür. | `SUMXMY2([1,2], [3,4])` | Dizi1, dizi2. | 8 |
| **TAN** | Tanjantı (radyan cinsinden) döndürür. | `TAN(1)` | Radyan cinsinden açı. | 1.5574077246549023 |
| **TANH** | Hiperbolik tanjantı döndürür. | `TANH(-2)` | Herhangi bir sayı. | -0.9640275800758168 |
| **TRUNC** | Bir sayıyı yuvarlamadan tam sayıya indirger. | `TRUNC(-8.9)` | Sayı, [basamak sayısı]. | -8 |

### İstatistik

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Ortalama mutlak sapmayı döndürür. | `AVEDEV([2,4], [8,16])` | Veri noktalarını temsil eden sayı dizileri. | 4.5 |
| **AVERAGE** | Aritmetik ortalamayı döndürür. | `AVERAGE([2,4], [8,16])` | Veri noktalarını temsil eden sayı dizileri. | 7.5 |
| **AVERAGEA** | Metin ve mantıksal değerler dahil olmak üzere değerlerin ortalamasını döndürür. | `AVERAGEA([2,4], [8,16])` | Sayı, metin veya mantıksal değer dizileri; tüm boş olmayan değerler dahil edilir. | 7.5 |
| **AVERAGEIF** | Tek bir koşula dayalı ortalamayı hesaplar. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | İlk parametre kontrol edilecek aralık, ikincisi koşul, üçüncüsü ortalama için kullanılan isteğe bağlı aralık. | 3.5 |
| **AVERAGEIFS** | Birden fazla koşula dayalı ortalamayı hesaplar. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | İlk parametre ortalaması alınacak değerler, ardından kriter aralıkları ve kriter ifadeleri çiftleri. | 6 |
| **BETADIST** | Kümülatif beta olasılık yoğunluğunu döndürür. | `BETADIST(2, 8, 10, true, 1, 3)` | Değer, alfa, beta, kümülatif bayrağı, A (isteğe bağlı), B (isteğe bağlı). | 0.6854705810117458 |
| **BETAINV** | Kümülatif beta dağılımının tersini döndürür. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Olasılık, alfa, beta, A (isteğe bağlı), B (isteğe bağlı). | 1.9999999999999998 |
| **BINOMDIST** | Binom dağılımı olasılığını döndürür. | `BINOMDIST(6, 10, 0.5, false)` | Başarı sayısı, deneme sayısı, başarı olasılığı, kümülatif bayrağı. | 0.205078125 |
| **CORREL** | İki veri kümesi arasındaki korelasyon katsayısını döndürür. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | İki sayı dizisi. | 0.9970544855015815 |
| **COUNT** | Sayısal hücreleri sayar. | `COUNT([1,2], [3,4])` | Sayı dizileri veya aralıkları. | 4 |
| **COUNTA** | Boş olmayan hücreleri sayar. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Herhangi bir türdeki diziler veya aralıklar. | 4 |
| **COUNTBLANK** | Boş hücreleri sayar. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Herhangi bir türdeki diziler veya aralıklar. | 2 |
| **COUNTIF** | Bir koşulla eşleşen hücreleri sayar. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Sayı veya metin aralığı ve koşul. | 3 |
| **COUNTIFS** | Birden fazla koşulla eşleşen hücreleri sayar. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Kriter aralıkları ve kriter ifadeleri çiftleri. | 2 |
| **COVARIANCEP** | Popülasyon kovaryansını döndürür. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | İki sayı dizisi. | 5.2 |
| **COVARIANCES** | Örneklem kovaryansını döndürür. | `COVARIANCES([2,4,8], [5,11,12])` | İki sayı dizisi. | 9.666666666666668 |
| **DEVSQ** | Sapmaların karelerinin toplamını döndürür. | `DEVSQ([2,4,8,16])` | Veri noktalarını temsil eden sayı dizisi. | 115 |
| **EXPONDIST** | Üstel dağılımı döndürür. | `EXPONDIST(0.2, 10, true)` | Değer, lambda, kümülatif bayrağı. | 0.8646647167633873 |
| **FDIST** | F olasılık dağılımını döndürür. | `FDIST(15.2069, 6, 4, false)` | Değer, serbestlik derecesi 1, serbestlik derecesi 2, kümülatif bayrağı. | 0.0012237917087831735 |
| **FINV** | F dağılımının tersini döndürür. | `FINV(0.01, 6, 4)` | Olasılık, serbestlik derecesi 1, serbestlik derecesi 2. | 0.10930991412457851 |
| **FISHER** | Fisher dönüşümünü döndürür. | `FISHER(0.75)` | Korelasyon katsayısını temsil eden sayı. | 0.9729550745276566 |
| **FISHERINV** | Ters Fisher dönüşümünü döndürür. | `FISHERINV(0.9729550745276566)` | Fisher dönüşümü sonucunu temsil eden sayı. | 0.75 |
| **FORECAST** | Bilinen x ve y değerlerini kullanarak belirli bir x için y değerini tahmin eder. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Yeni x değeri, bilinen y değerleri dizisi, bilinen x değerleri dizisi. | 10.607253086419755 |
| **FREQUENCY** | Sıklık dağılımını döndürür. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Veri dizisi, gruplar (bins) dizisi. | 1,2,4,2 |
| **GAMMA** | Gama fonksiyonunu döndürür. | `GAMMA(2.5)` | Pozitif sayı. | 1.3293403919101043 |
| **GAMMALN** | Gama fonksiyonunun doğal logaritmasını döndürür. | `GAMMALN(10)` | Pozitif sayı. | 12.801827480081961 |
| **GAUSS** | Standart normal dağılıma dayalı olasılığı döndürür. | `GAUSS(2)` | z-skorunu temsil eden sayı. | 0.4772498680518208 |
| **GEOMEAN** | Geometrik ortalamayı döndürür. | `GEOMEAN([2,4], [8,16])` | Sayı dizileri. | 5.656854249492381 |
| **GROWTH** | Bilinen verilere dayalı üstel büyüme değerlerini tahmin eder. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Bilinen y değerleri dizisi, bilinen x değerleri dizisi, yeni x değerleri. | 32.00000000000003 |
| **HARMEAN** | Harmonik ortalamayı döndürür. | `HARMEAN([2,4], [8,16])` | Sayı dizileri. | 4.266666666666667 |
| **HYPGEOMDIST** | Hipergeometrik dağılımı döndürür. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Örneklem başarıları, örneklem boyutu, popülasyon başarıları, popülasyon boyutu, kümülatif bayrağı. | 0.3632610939112487 |
| **INTERCEPT** | Doğrusal regresyon doğrusunun kesim noktasını döndürür. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Bilinen y değerleri dizisi, bilinen x değerleri dizisi. | 0.04838709677419217 |
| **KURT** | Basıklığı (kurtosis) döndürür. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Sayı dizisi. | -0.15179963720841627 |
| **LARGE** | k. en büyük değeri döndürür. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Sayı dizisi, k. | 5 |
| **LINEST** | Doğrusal regresyon analizi yapar. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Bilinen y değerleri dizisi, bilinen x değerleri dizisi, ek istatistikleri döndür, daha fazla istatistik döndür. | 2,1 |
| **LOGNORMDIST** | Lognormal dağılımı döndürür. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Değer, ortalama, standart sapma, kümülatif bayrağı. | 0.0390835557068005 |
| **LOGNORMINV** | Lognormal dağılımın tersini döndürür. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Olasılık, ortalama, standart sapma, kümülatif bayrağı. | 4.000000000000001 |
| **MAX** | En büyük değeri döndürür. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Sayı dizileri. | 0.8 |
| **MAXA** | Metin ve mantıksal değerler dahil en büyük değeri döndürür. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Sayı, metin veya mantıksal değer dizileri. | 1 |
| **MEDIAN** | Medyanı (ortanca) döndürür. | `MEDIAN([1,2,3], [4,5,6])` | Sayı dizileri. | 3.5 |
| **MIN** | En küçük değeri döndürür. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Sayı dizileri. | 0.1 |
| **MINA** | Metin ve mantıksal değerler dahil en küçük değeri döndürür. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Sayı, metin veya mantıksal değer dizileri. | 0 |
| **MODEMULT** | En sık gerçekleşen değerlerin dizisini döndürür. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Sayı dizisi. | 2,3 |
| **MODESNGL** | En sık gerçekleşen tek değeri döndürür. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Sayı dizisi. | 2 |
| **NORMDIST** | Normal dağılımı döndürür. | `NORMDIST(42, 40, 1.5, true)` | Değer, ortalama, standart sapma, kümülatif bayrağı. | 0.9087887802741321 |
| **NORMINV** | Normal dağılımın tersini döndürür. | `NORMINV(0.9087887802741321, 40, 1.5)` | Olasılık, ortalama, standart sapma. | 42 |
| **NORMSDIST** | Standart normal dağılımı döndürür. | `NORMSDIST(1, true)` | z-skorunu temsil eden sayı. | 0.8413447460685429 |
| **NORMSINV** | Standart normal dağılımın tersini döndürür. | `NORMSINV(0.8413447460685429)` | Olasılık. | 1.0000000000000002 |
| **PEARSON** | Pearson çarpım-moment korelasyon katsayısını döndürür. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | İki sayı dizisi. | 0.6993786061802354 |
| **PERCENTILEEXC** | k. yüzdeliği döndürür (hariç tutan). | `PERCENTILEEXC([1,2,3,4], 0.3)` | Sayı dizisi, k. | 1.5 |
| **PERCENTILEINC** | k. yüzdeliği döndürür (dahil eden). | `PERCENTILEINC([1,2,3,4], 0.3)` | Sayı dizisi, k. | 1.9 |
| **PERCENTRANKEXC** | Bir veri kümesindeki bir değerin yüzde olarak sıralamasını döndürür (hariç tutan). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Sayı dizisi, x değeri, anlamlılık (isteğe bağlı). | 0.4 |
| **PERCENTRANKINC** | Bir veri kümesindeki bir değerin yüzde olarak sıralamasını döndürür (dahil eden). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Sayı dizisi, x değeri, anlamlılık (isteğe bağlı). | 0.33 |
| **PERMUT** | Permütasyon sayısını döndürür. | `PERMUT(100, 3)` | Toplam sayı n, seçilen sayı k. | 970200 |
| **PERMUTATIONA** | Tekrarlı permütasyon sayısını döndürür. | `PERMUTATIONA(4, 3)` | Toplam sayı n, seçilen sayı k. | 64 |
| **PHI** | Standart normal dağılımın yoğunluk fonksiyonunu döndürür. | `PHI(0.75)` | z-skorunu temsil eden sayı. | 0.30113743215480443 |
| **POISSONDIST** | Poisson dağılımını döndürür. | `POISSONDIST(2, 5, true)` | Olay sayısı, ortalama, kümülatif bayrağı. | 0.12465201948308113 |
| **PROB** | Olasılıkların toplamını döndürür. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Değerler dizisi, olasılıklar dizisi, alt sınır, üst sınır. | 0.4 |
| **QUARTILEEXC** | Veri kümesinin çeyrekliğini döndürür (hariç tutan). | `QUARTILEEXC([1,2,3,4], 1)` | Sayı dizisi, çeyrek (quart). | 1.25 |
| **QUARTILEINC** | Veri kümesinin çeyrekliğini döndürür (dahil eden). | `QUARTILEINC([1,2,3,4], 1)` | Sayı dizisi, çeyrek (quart). | 1.75 |
| **RANKAVG** | Ortalama sıralamayı döndürür. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Sayı, sayı dizisi, düzen (artan/azalan). | 4.5 |
| **RANKEQ** | Bir sayının sıralamasını döndürür. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Sayı, sayı dizisi, düzen (artan/azalan). | 4 |
| **RSQ** | Belirleme katsayısını (R-kare) döndürür. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | İki sayı dizisi. | 0.4891304347826088 |
| **SKEW** | Çarpıklığı döndürür. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Sayı dizisi. | 0.3595430714067974 |
| **SKEWP** | Popülasyon çarpıklığını döndürür. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Sayı dizisi. | 0.303193339354144 |
| **SLOPE** | Doğrusal regresyon doğrusunun eğimini döndürür. | `SLOPE([1,9,5,7], [0,4,2,3])` | Bilinen y değerleri dizisi, bilinen x değerleri dizisi. | 2 |
| **SMALL** | k. en küçük değeri döndürür. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Sayı dizisi, k. | 3 |
| **STANDARDIZE** | Normalize edilmiş bir değeri z-skoru olarak döndürür. | `STANDARDIZE(42, 40, 1.5)` | Değer, ortalama, standart sapma. | 1.3333333333333333 |
| **STDEVA** | Metin ve mantıksal değerler dahil standart sapmayı döndürür. | `STDEVA([2,4], [8,16], [true, false])` | Sayı, metin veya mantıksal değer dizileri. | 6.013872850889572 |
| **STDEVP** | Popülasyon standart sapmasını döndürür. | `STDEVP([2,4], [8,16], [true, false])` | Sayı dizileri. | 5.361902647381804 |
| **STDEVPA** | Metin ve mantıksal değerler dahil popülasyon standart sapmasını döndürür. | `STDEVPA([2,4], [8,16], [true, false])` | Sayı, metin veya mantıksal değer dizileri. | 5.489889697333535 |
| **STDEVS** | Örneklem standart sapmasını döndürür. | `VARS([2,4], [8,16], [true, false])` | Sayı dizileri. | 6.191391873668904 |
| **STEYX** | Tahmin edilen y değerinin standart hatasını döndürür. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Bilinen y değerleri dizisi, bilinen x değerleri dizisi. | 3.305718950210041 |
| **TINV** | t-dağılımının tersini döndürür. | `TINV(0.9946953263673741, 1)` | Olasılık, serbestlik derecesi. | 59.99999999996535 |
| **TRIMMEAN** | Bir veri kümesinin iç kısmının ortalamasını döndürür. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Sayı dizisi, kırpma oranı. | 3.7777777777777777 |
| **VARA** | Metin ve mantıksal değerler dahil varyansı döndürür. | `VARA([2,4], [8,16], [true, false])` | Sayı, metin veya mantıksal değer dizileri. | 36.16666666666667 |
| **VARP** | Popülasyon varyansını döndürür. | `VARP([2,4], [8,16], [true, false])` | Sayı dizileri. | 28.75 |
| **VARPA** | Metin ve mantıksal değerler dahil popülasyon varyansını döndürür. | `VARPA([2,4], [8,16], [true, false])` | Sayı, metin veya mantıksal değer dizileri. | 30.13888888888889 |
| **VARS** | Örneklem varyansını döndürür. | `VARS([2,4], [8,16], [true, false])` | Sayı dizileri. | 38.333333333333336 |
| **WEIBULLDIST** | Weibull dağılımını döndürür. | `WEIBULLDIST(105, 20, 100, true)` | Değer, alfa, beta, kümülatif bayrağı. | 0.9295813900692769 |
| **ZTEST** | Bir z-testinin tek kuyruklu olasılığını döndürür. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Sayı dizisi, varsayılan ortalama. | 0.09057419685136381 |

### Metin

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Bir sayı kodunu karşılık gelen karaktere dönüştürür. | `CHAR(65)` | Karakter kodunu temsil eden sayı. | A |
| **CLEAN** | Metindeki tüm yazdırılamayan karakterleri kaldırır. | `CLEAN('Monthly report')` | Temizlenecek metin dizesi. | Monthly report |
| **CODE** | Bir metin dizesindeki ilk karakterin sayısal kodunu döndürür. | `CODE('A')` | Tek bir karakter içeren metin dizesi. | 65 |
| **CONCATENATE** | Birden fazla metin dizesini tek bir dizede birleştirir. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Birleştirilecek bir veya daha fazla metin dizesi. | Andreas Hauser |
| **EXACT** | İki dizenin tam olarak aynı olup olmadığını kontrol eder (büyük/küçük harf duyarlı). | `EXACT('Word', 'word')` | Karşılaştırılacak iki metin dizesi. | |
| **FIND** | Belirli bir konumdan başlayarak bir alt dizenin konumunu bulur. | `FIND('M', 'Miriam McGovern', 3)` | Bulunacak metin, kaynak metin, isteğe bağlı başlangıç konumu. | 8 |
| **LEFT** | Bir dizenin sol tarafından belirtilen sayıda karakteri döndürür. | `LEFT('Sale Price', 4)` | Metin dizesi ve karakter sayısı. | Sale |
| **LEN** | Bir metin dizesindeki karakter sayısını döndürür. | `LEN('Phoenix, AZ')` | Sayılacak metin dizesi. | 11 |
| **LOWER** | Tüm karakterleri küçük harfe dönüştürür. | `LOWER('E. E. Cummings')` | Dönüştürülecek metin dizesi. | e. e. cummings |
| **MID** | Bir dizenin ortasından belirtilen sayıda karakteri döndürür. | `MID('Fluid Flow', 7, 20)` | Metin dizesi, başlangıç konumu, karakter sayısı. | Flow |
| **NUMBERVALUE** | Belirtilen ayırıcıları kullanarak metni sayıya dönüştürür. | `NUMBERVALUE('2.500,27', ',', '.')` | Metin dizesi, ondalık ayırıcı, grup ayırıcı. | 2500.27 |
| **PROPER** | Her kelimenin ilk harfini büyük harfe dönüştürür. | `PROPER('this is a TITLE')` | Formatlanacak metin dizesi. | This Is A Title |
| **REPLACE** | Bir metin dizesinin bir kısmını yeni metinle değiştirir. | `REPLACE('abcdefghijk', 6, 5, '*')` | Orijinal metin, başlangıç konumu, karakter sayısı, yeni metin. | abcde*k |
| **REPT** | Metni belirtilen sayıda tekrarlar. | `REPT('*-', 3)` | Metin dizesi ve tekrar sayısı. | *-*-*- |
| **RIGHT** | Bir dizenin sağ tarafından belirtilen sayıda karakteri döndürür. | `RIGHT('Sale Price', 5)` | Metin dizesi ve karakter sayısı. | Price |
| **ROMAN** | Bir Arap rakamını Roma rakamına dönüştürür. | `ROMAN(499)` | Dönüştürülecek Arap rakamı. | CDXCIX |
| **SEARCH** | Bir alt dizenin konumunu bulur (büyük/küçük harf duyarsız). | `SEARCH('margin', 'Profit Margin')` | Bulunacak metin, kaynak metin. | 8 |
| **SUBSTITUTE** | Eski metnin belirli bir örneğini yeni metinle değiştirir. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Orijinal metin, eski metin, yeni metin, isteğe bağlı örnek numarası. | Quarter 1, 2012 |
| **T** | Değer metin ise metni döndürür; aksi takdirde boş bir dize döndürür. | `T('Rainfall')` | Bağımsız değişken her türlü veri olabilir. | Rainfall |
| **TRIM** | Kelimeler arasındaki tek boşluklar hariç metindeki boşlukları kaldırır. | `TRIM(' First Quarter Earnings ')` | Kırpılacak metin dizesi. | First Quarter Earnings |
| **TEXTJOIN** | Bir sınırlayıcı kullanarak birden fazla metin öğesini tek bir dizede birleştirir. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Sınırlayıcı, boşları yoksay bayrağı, birleştirilecek metin öğeleri. | The sun will come up tomorrow. |
| **UNICHAR** | Belirli bir Unicode numarasına karşılık gelen karakteri döndürür. | `UNICHAR(66)` | Unicode kod noktası. | B |
| **UNICODE** | Metnin ilk karakterinin Unicode numarasını döndürür. | `UNICODE('B')` | Tek bir karakter içeren metin dizesi. | 66 |
| **UPPER** | Tüm karakterleri büyük harfe dönüştürür. | `UPPER('total')` | Dönüştürülecek metin dizesi. | TOTAL |