:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/calculation-engine/math) bakın.
:::

# Mathjs

[Math.js](https://mathjs.org/), JavaScript ve Node.js için özellik bakımından zengin bir matematik kütüphanesidir.

## Fonksiyon Referansı

### İfadeler

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **compile** | Bir ifadeyi ayrıştırır ve derler (yalnızca ayrıştırır ve doğrudan bir sonuç döndürmez). | `compile('2 + 3')` | ifade (dize) | `{}` |
| **evaluate** | Bir ifadeyi hesaplar ve sonucu döndürür. | `evaluate('2 + 3')` | ifade (dize), kapsam (isteğe bağlı) | `5` |
| **help** | Bir fonksiyon veya veri tipi için dokümantasyonu getirir. | `help('evaluate')` | arama anahtar kelimesi (dize) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Özel işlemler için bir ayrıştırıcı (parser) oluşturur. | `parser()` | Yok | `{}` |

### Cebir

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **derivative** | Belirtilen bir değişkene göre bir ifadenin türevini alır. | `derivative('x^2', 'x')` | ifade (dize veya Düğüm), değişken (dize) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Bir ifade ağacındaki yaprak düğümlerini (semboller veya sabitler) sayar. | `leafCount('x^2 + y')` | ifade (dize veya Düğüm) | `3` |
| **lsolve** | İleri ikame (forward substitution) kullanarak doğrusal bir sistemi çözer. | `lsolve([[1,2],[3,4]], [5,6])` | L (Dizi veya Matris), b (Dizi veya Matris) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | İleri ikame kullanarak doğrusal bir sistemin tüm çözümlerini bulur. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Dizi veya Matris), b (Dizi veya Matris) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Kısmi pivotlama ile LU ayrıştırması gerçekleştirir. | `lup([[1,2],[3,4]])` | A (Dizi veya Matris) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | A'nın n×n matris olduğu A*x = b doğrusal sistemini çözer. | `lusolve([[1,2],[3,4]], [5,6])` | A (Dizi veya Matris), b (Dizi veya Matris) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Bir matrisin QR ayrıştırmasını hesaplar. | `qr([[1,2],[3,4]])` | A (Dizi veya Matris) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Rasyonelleştirilebilir bir ifadeyi rasyonel bir kesre dönüştürür. | `rationalize('1/(x+1)')` | ifade (dize veya Düğüm) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Bir ifadedeki sembolleri, sağlanan kapsamdaki değerlerle değiştirir. | `resolve('x + y', {x:2, y:3})` | ifade (dize veya Düğüm), kapsam (nesne) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Bir ifade ağacını basitleştirir (benzer terimleri birleştirme vb.). | `simplify('2x + 3x')` | ifade (dize veya Düğüm) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Genellikle performans hassasiyeti olan durumlarda kullanılan tek geçişli bir basitleştirme gerçekleştirir. | `simplifyCore('x+x')` | ifade (dize veya Düğüm) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Tam pivotlama ile seyrek (sparse) LU ayrıştırmasını hesaplar. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Dizi veya Matris), sıralama (dize), eşik (sayı) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | İki ifadenin sembolik olarak eşit olup olmadığını kontrol eder. | `symbolicEqual('x+x', '2x')` | ifade1 (dize veya Düğüm), ifade2 (dize veya Düğüm) | `true` |
| **usolve** | Geri ikame (back substitution) kullanarak doğrusal bir sistemi çözer. | `usolve([[1,2],[0,1]], [3,4])` | U (Dizi veya Matris), b (Dizi veya Matris) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Geri ikame kullanarak doğrusal bir sistemin tüm çözümlerini bulur. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Dizi veya Matris), b (Dizi veya Matris) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Aritmetik

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **abs** | Bir sayının mutlak değerini hesaplar. | `abs(-3.2)` | x (sayı, Karmaşık, Dizi veya Matris) | `3.2` |
| **add** | İki veya daha fazla değeri toplar (x + y). | `add(2, 3)` | x, y, ... (sayı, Dizi veya Matris) | `5` |
| **cbrt** | Bir sayının küp kökünü hesaplar, isteğe bağlı olarak tüm küp kökleri döndürür. | `cbrt(8)` | x (sayı veya Karmaşık), allRoots (boolean, isteğe bağlı) | `2` |
| **ceil** | Pozitif sonsuza doğru yuvarlar (Karmaşık sayılar için her parça ayrı ayrı yuvarlanır). | `ceil(3.2)` | x (sayı, Karmaşık, Dizi veya Matris) | `4` |
| **cube** | Bir değerin küpünü hesaplar (x*x*x). | `cube(3)` | x (sayı, Karmaşık, Dizi veya Matris) | `27` |
| **divide** | İki değeri böler (x / y). | `divide(6, 2)` | x (sayı, Dizi veya Matris), y (sayı, Dizi veya Matris) | `3` |
| **dotDivide** | İki matrisi veya diziyi eleman bazlı böler. | `dotDivide([6,8],[2,4])` | x (Dizi veya Matris), y (Dizi veya Matris) | `[  3,  2]` |
| **dotMultiply** | İki matrisi veya diziyi eleman bazlı çarpar. | `dotMultiply([2,3],[4,5])` | x (Dizi veya Matris), y (Dizi veya Matris) | `[  8,  15]` |
| **dotPow** | Eleman bazlı x^y hesaplar. | `dotPow([2,3],[2,3])` | x (Dizi veya Matris), y (Dizi veya Matris) | `[  4,  27]` |
| **exp** | e^x hesaplar. | `exp(1)` | x (sayı, Karmaşık, Dizi veya Matris) | `2.718281828459045` |
| **expm1** | e^x - 1 hesaplar. | `expm1(1)` | x (sayı veya Karmaşık) | `1.718281828459045` |
| **fix** | Sıfıra doğru yuvarlar (keser). | `fix(3.7)` | x (sayı, Karmaşık, Dizi veya Matris) | `3` |
| **floor** | Negatif sonsuza doğru yuvarlar. | `floor(3.7)` | x (sayı, Karmaşık, Dizi veya Matris) | `3` |
| **gcd** | İki veya daha fazla sayının en büyük ortak bölenini hesaplar. | `gcd(8, 12)` | a, b, ... (sayı veya BigNumber) | `4` |
| **hypot** | Argümanların karelerinin toplamının karekökünü hesaplar (Pisagor). | `hypot(3, 4)` | a, b, ... (sayı veya BigNumber) | `5` |
| **invmod** | a'nın b moduna göre modüler çarpımsal tersini hesaplar. | `invmod(3, 11)` | a, b (sayı veya BigNumber) | `4` |
| **lcm** | İki veya daha fazla sayının en küçük ortak katını hesaplar. | `lcm(4, 6)` | a, b, ... (sayı veya BigNumber) | `12` |
| **log** | İsteğe bağlı bir taban ile logaritma hesaplar. | `log(100, 10)` | x (sayı veya Karmaşık), base (sayı veya Karmaşık, isteğe bağlı) | `2` |
| **log10** | Bir sayının 10 tabanında logaritmasını hesaplar. | `log10(100)` | x (sayı veya Karmaşık) | `2` |
| **log1p** | ln(1 + x) hesaplar. | `log1p(1)` | x (sayı veya Karmaşık) | `0.6931471805599453` |
| **log2** | Bir sayının 2 tabanında logaritmasını hesaplar. | `log2(8)` | x (sayı veya Karmaşık) | `3` |
| **mod** | x ÷ y işleminin kalanını hesaplar (x mod y). | `mod(8,3)` | x, y (sayı veya BigNumber) | `2` |
| **multiply** | İki veya daha fazla değeri çarpar (x * y). | `multiply(2, 3)` | x, y, ... (sayı, Dizi veya Matris) | `6` |
| **norm** | İsteğe bağlı p ile bir sayının, vektörün veya matrisin normunu hesaplar. | `norm([3,4])` | x (Dizi veya Matris), p (sayı veya dize, isteğe bağlı) | `5` |
| **nthRoot** | Bir sayının n. dereceden kökünü (ana kök) hesaplar. | `nthRoot(16, 4)` | a (sayı, BigNumber veya Karmaşık), root (sayı, isteğe bağlı) | `2` |
| **nthRoots** | Bir sayının tüm n. dereceden köklerini (karmaşık olabilir) hesaplar. | `nthRoots(1,3)` | x (sayı veya Karmaşık), root (sayı) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | x'in y. kuvvetini hesaplar. | `pow(2, 3)` | x (sayı, Karmaşık, Dizi veya Matris), y (sayı, Karmaşık, Dizi veya Matris) | `8` |
| **round** | Belirtilen ondalık basamak sayısına yuvarlar. | `round(3.14159, 2)` | x (sayı, Karmaşık, Dizi veya Matris), n (sayı, isteğe bağlı) | `3.14` |
| **sign** | Bir sayının işaretini döndürür (-1, 0 veya 1). | `sign(-3)` | x (sayı, BigNumber veya Karmaşık) | `-1` |
| **sqrt** | Bir sayının karekökünü hesaplar. | `sqrt(9)` | x (sayı, Karmaşık, Dizi veya Matris) | `3` |
| **square** | Bir değerin karesini hesaplar (x*x). | `square(3)` | x (sayı, Karmaşık, Dizi veya Matris) | `9` |
| **subtract** | Bir değeri diğerinden çıkarır (x - y). | `subtract(8, 3)` | x, y (sayı, Dizi veya Matris) | `5` |
| **unaryMinus** | Bir değere tekli çıkarma (negatif yapma) uygular. | `unaryMinus(3)` | x (sayı, Karmaşık, Dizi veya Matris) | `-3` |
| **unaryPlus** | Tekli artı uygular (genellikle değeri değiştirmez). | `unaryPlus(-3)` | x (sayı, Karmaşık, Dizi veya Matris) | `-3` |
| **xgcd** | İki sayının genişletilmiş en büyük ortak bölenini hesaplar. | `xgcd(8, 12)` | a, b (sayı veya BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Bit Düzeyinde İşlemler

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **bitAnd** | Bit düzeyinde VE (AND) işlemi gerçekleştirir (x & y). | `bitAnd(5, 3)` | x, y (sayı veya BigNumber) | `1` |
| **bitNot** | Bit düzeyinde DEĞİL (NOT) işlemi gerçekleştirir (~x). | `bitNot(5)` | x (sayı veya BigNumber) | `-6` |
| **bitOr** | Bit düzeyinde VEYA (OR) işlemi gerçekleştirir (x \| y). | `bitOr(5, 3)` | x, y (sayı veya BigNumber) | `7` |
| **bitXor** | Bit düzeyinde ÖZEL VEYA (XOR) işlemi gerçekleştirir (x ^ y). | `bitXor(5, 3)` | x, y (sayı veya BigNumber) | `6` |
| **leftShift** | x'i y bit sola kaydırır (x << y). | `leftShift(5, 1)` | x, y (sayı veya BigNumber) | `10` |
| **rightArithShift** | x üzerinde aritmetik sağa kaydırma gerçekleştirir (x >> y). | `rightArithShift(5, 1)` | x, y (sayı veya BigNumber) | `2` |
| **rightLogShift** | x üzerinde mantıksal sağa kaydırma gerçekleştirir (x >>> y). | `rightLogShift(5, 1)` | x, y (sayı veya BigNumber) | `2` |

### Kombinasyon Hesapları

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **bellNumbers** | n adet farklı elemanın bölüntü sayısını (Bell sayıları) hesaplar. | `bellNumbers(3)` | n (sayı) | `5` |
| **catalan** | Birçok kombinatoryal yapı için n. Catalan sayısını hesaplar. | `catalan(5)` | n (sayı) | `42` |
| **composition** | n'in k parçaya kompozisyon sayısını hesaplar. | `composition(5, 3)` | n, k (sayı) | `6` |
| **stirlingS2** | n adet etiketli öğeyi k adet boş olmayan alt kümeye ayırma yollarının sayısını hesaplar (İkinci tür Stirling sayıları). | `stirlingS2(5, 3)` | n, k (sayı) | `25` |

### Karmaşık Sayılar

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **arg** | Karmaşık bir sayının argümanını (fazını) hesaplar. | `arg(complex('2 + 2i'))` | x (Karmaşık veya sayı) | `0.785398163` |
| **conj** | Karmaşık eşleniği hesaplar. | `conj(complex('2 + 2i'))` | x (Karmaşık veya sayı) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Karmaşık bir sayının sanal kısmını döndürür. | `im(complex('2 + 3i'))` | x (Karmaşık veya sayı) | `3` |
| **re** | Karmaşık bir sayının gerçek kısmını döndürür. | `re(complex('2 + 3i'))` | x (Karmaşık veya sayı) | `2` |

### Geometri

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **distance** | N boyutlu uzayda iki nokta arasındaki Öklid mesafesini hesaplar. | `distance([0,0],[3,4])` | nokta1 (Dizi), nokta2 (Dizi) | `5` |
| **intersect** | İki doğrunun (2D/3D) veya bir doğru ile bir düzlemin (3D) kesişimini bulur. | `intersect([0,0],[2,2],[0,2],[2,0])` | doğru 1'in uç noktaları, doğru 2'in uç noktaları, ... | `[  1,  1]` |

### Mantık

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **and** | Mantıksal VE (AND) işlemi gerçekleştirir. | `and(true, false)` | x, y (boolean veya sayı) | `false` |
| **not** | Mantıksal DEĞİL (NOT) işlemi gerçekleştirir. | `not(true)` | x (boolean veya sayı) | `false` |
| **or** | Mantıksal VEYA (OR) işlemi gerçekleştirir. | `or(true, false)` | x, y (boolean veya sayı) | `true` |
| **xor** | Mantıksal ÖZEL VEYA (XOR) işlemi gerçekleştirir. | `xor(1, 0)` | x, y (boolean veya sayı) | `true` |

### Matris

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **column** | Bir matristen belirtilen sütunu döndürür. | `column([[1,2],[3,4]], 1)` | değer (Matris veya Dizi), indeks (sayı) | `[  [    1  ],  [    3  ]]` |
| **concat** | Birden fazla matrisi/diziyi bir boyut boyunca birleştirir. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Dizi veya Matris), dim (sayı, isteğe bağlı) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Bir matris, dizi veya dizedeki eleman sayısını sayar. | `count([1,2,3,'hello'])` | x (Dizi, Matris veya dize) | `4` |
| **cross** | İki 3D vektörün vektörel çarpımını (cross product) hesaplar. | `cross([1,2,3], [4,5,6])` | x, y (3 uzunluğunda Dizi veya Matris) | `[  -3,  6,  -3]` |
| **ctranspose** | Bir matrisin eşlenik devriğini (conjugate transpose) hesaplar. | `ctranspose([[1,2],[3,4]])` | x (Matris veya Dizi) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Bir matrisin determinantını hesaplar. | `det([[1,2],[3,4]])` | x (Matris veya Dizi) | `-2` |
| **diag** | Köşegen bir matris oluşturur veya bir matrisin köşegenini çıkarır. | `diag([1,2,3])` | X (Dizi veya Matris) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Bir boyut boyunca bitişik elemanlar arasındaki farkı hesaplar. | `diff([1,4,9,16])` | arr (Dizi veya Matris), dim (sayı, isteğe bağlı) | `[  3,  5,  7]` |
| **dot** | İki vektörün skaler çarpımını (dot product) hesaplar. | `dot([1,2,3],[4,5,6])` | x, y (Dizi veya Matris) | `32` |
| **eigs** | Kare bir matrisin özdeğerlerini ve isteğe bağlı olarak özvektörlerini hesaplar. | `eigs([[1,2],[3,4]])` | x (Matris veya Dizi), codec (sayı, isteğe bağlı) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Matris üsteli e^A'yı hesaplar. | `expm([[1,0],[0,1]])` | x (Matris veya Dizi) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | N boyutlu hızlı Fourier dönüşümünü (FFT) hesaplar. | `fft([1,2,3,4])` | arr (Dizi veya Matris) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Henüz desteklenmiyor) Bir diziyi veya 1D matrisi bir test fonksiyonuyla filtreler. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Dizi veya Matris), test (fonksiyon) | `[  "23",  "100",  "55"]` |
| **flatten** | Çok boyutlu bir matrisi veya diziyi 1D'ye düzleştirir. | `flatten([[1,2],[3,4]])` | x (Dizi veya Matris) | `[  1,  2,  3,  4]` |
| **forEach** | (Henüz desteklenmiyor) Bir matrisin/dizinin her elemanı üzerinde yinelenir ve bir geri çağırma (callback) işlevini çağırır. | `forEach([1,2,3], val => console.log(val))` | x (Dizi veya Matris), callback (fonksiyon) | `undefined` |
| **getMatrixDataType** | Bir matris veya dizideki tüm elemanların veri tipini inceler (örneğin, 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Dizi veya Matris) | `mixed` |
| **identity** | n x n (veya m x n) boyutunda bir birim matris oluşturur. | `identity(3)` | n (sayı) veya [m, n] (Dizi) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | N boyutlu ters FFT'yi hesaplar. | `ifft([1,2,3,4])` | arr (Dizi veya Matris) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Kare bir matrisin tersini hesaplar. | `inv([[1,2],[3,4]])` | x (Matris veya Dizi) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | İki matrisin veya vektörün Kronecker çarpımını hesaplar. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matris veya Dizi) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Her elemana bir geri çağırma işlevi uygulayarak yeni bir dizi/matris oluşturur. | `map([1,2,3], val => val * val)` | x (Dizi veya Matris), callback (fonksiyon) | `[  1,  4,  9]` |
| **matrixFromColumns** | Vektörleri yoğun bir matrisin ayrı sütunları olarak birleştirir. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Dizi veya Matris) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Henüz desteklenmiyor) Her indeks için bir fonksiyonu değerlendirerek bir matris oluşturur. | `matrixFromFunction([5], i => math.random())` | boyut (Dizi), fn (fonksiyon) | `rastgele bir vektör` |
| **matrixFromRows** | Vektörleri yoğun bir matrisin ayrı satırları olarak birleştirir. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Dizi veya Matris) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Verilen boyutlar için tamamı birlerden oluşan bir matris oluşturur. | `ones(2, 3)` | m, n, p... (sayı) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Bölüm seçimi (partition selection) kullanarak k. en küçük elemanı döndürür. | `partitionSelect([3,1,4,2], 2)` | x (Dizi veya Matris), k (sayı) | `3` |
| **pinv** | Bir matrisin Moore–Penrose sözde tersini (pseudoinverse) hesaplar. | `pinv([[1,2],[2,4]])` | x (Matris veya Dizi) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Başlangıçtan bitişe kadar (isteğe bağlı adım ile) bir sayı dizisi oluşturur. | `range(1, 5, 2)` | start (sayı), end (sayı), step (sayı, isteğe bağlı) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Bir diziyi/matrisi verilen boyutlara göre yeniden şekillendirir. | `reshape([1,2,3,4,5,6], [2,3])` | x (Dizi veya Matris), boyutlar (Dizi) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Bir matrisi yeni boyutlara göre yeniden boyutlandırır, sağlanmışsa eksik kısımları varsayılan değerle doldurur. | `resize([1,2,3], [5], 0)` | x (Dizi veya Matris), boyut (Dizi), varsayılanDeğer (isteğe bağlı) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Bir 1x2 vektörü saat yönünün tersine döndürür veya bir 1x3 vektörü bir eksen etrafında döndürür. | `rotate([1, 0], Math.PI / 2)` | w (Dizi veya Matris), theta (sayı[, eksen]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Radyan cinsinden verilen bir açı için 2x2 rotasyon matrisi oluşturur. | `rotationMatrix(Math.PI / 2)` | theta (sayı) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Bir matristen belirtilen satırı döndürür. | `row([[1,2],[3,4]], 1)` | değer (Matris veya Dizi), indeks (sayı) | `[  [    3,    4  ]]` |
| **size** | Bir matrisin, dizinin veya skalerin boyutunu (ölçülerini) hesaplar. | `size([[1,2,3],[4,5,6]])` | x (Dizi, Matris veya sayı) | `[  2,  3]` |
| **sort** | Bir matrisi veya diziyi artan düzende sıralar. | `sort([3,1,2])` | x (Dizi veya Matris) | `[  1,  2,  3]` |
| **sqrtm** | Kare bir matrisin ana karekökünü hesaplar. | `sqrtm([[4,0],[0,4]])` | A (Matris veya Dizi) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Bir matrisin içindeki veya dışındaki tekil boyutları kaldırır. | `squeeze([[[1],[2],[3]]])` | x (Matris veya Dizi) | `[  1,  2,  3]` |
| **subset** | Bir matrisin veya dizenin bir alt kümesini alır veya değiştirir. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matris, Dizi veya dize), indeks (İndeks), değiştirme (isteğe bağlı) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Kare bir matrisin izini (köşegen elemanlarının toplamı) hesaplar. | `trace([[1,2],[3,4]])` | x (Matris veya Dizi) | `5` |
| **transpose** | Bir matrisin devriğini (transpozunu) alır. | `transpose([[1,2],[3,4]])` | x (Matris veya Dizi) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Verilen boyutlar için tamamı sıfırlardan oluşan bir matris oluşturur. | `zeros(2, 3)` | m, n, p... (sayı) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Olasılık

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **combinations** | n öğe arasından k adet sırasız öğe seçerken kombinasyon sayısını hesaplar. | `combinations(5, 2)` | n (sayı), k (sayı) | `10` |
| **combinationsWithRep** | Seçimlerin tekrarlanabildiği durumdaki kombinasyon sayısını hesaplar. | `combinationsWithRep(5, 2)` | n (sayı), k (sayı) | `15` |
| **factorial** | Bir n tam sayısı için n! değerini hesaplar. | `factorial(5)` | n (tam sayı) | `120` |
| **gamma** | Gamma fonksiyonunu yaklaşık olarak hesaplar. | `gamma(5)` | n (sayı) | `24` |
| **kldivergence** | İki dağılım arasındaki KL ıraksamasını (Kullback-Leibler divergence) hesaplar. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Dizi veya Matris), y (Dizi veya Matris) | `0.036690014034750584` |
| **lgamma** | Gamma fonksiyonunun logaritmasını hesaplar. | `lgamma(5)` | n (sayı) | `3.178053830347945` |
| **multinomial** | Bir dizi sayıdan multinom katsayısını hesaplar. | `multinomial([1, 2, 3])` | a (Dizi) | `60` |
| **permutations** | n öğe arasından k öğe seçerken sıralı permütasyon sayısını hesaplar. | `permutations(5, 2)` | n (sayı), k (sayı, isteğe bağlı) | `20` |
| **pickRandom** | 1D bir diziden bir veya daha fazla rastgele değer seçer. | `pickRandom([10, 20, 30])` | dizi | `20` |
| **random** | Düzgün dağılımlı rastgele bir sayı döndürür. | `random(1, 10)` | min (isteğe bağlı), max (isteğe bağlı) | `3.6099423753668143` |
| **randomInt** | Düzgün dağılımlı rastgele bir tam sayı döndürür. | `randomInt(1, 10)` | min (isteğe bağlı), max (isteğe bağlı) | `5` |

### Karşılaştırma ve Eşitlik

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **compare** | İki değeri karşılaştırır; -1, 0 veya 1 döndürür. | `compare(2, 3)` | x, y (herhangi bir tip) | `-1` |
| **compareNatural** | Rastgele değerleri doğal ve tekrarlanabilir bir sırayla karşılaştırır. | `compareNatural('2', '10')` | x, y (herhangi bir tip) | `-1` |
| **compareText** | İki dizeyi sözlüksel (lexicographical) olarak karşılaştırır. | `compareText('apple', 'banana')` | x (dize), y (dize) | `-1` |
| **deepEqual** | İki matrisi/diziyi eleman bazlı eşitlik için karşılaştırır. | `deepEqual([[1, 2]], [[1, 2]])` | x (Dizi/Matris), y (Dizi/Matris) | `true` |
| **equal** | İki değerin eşit olup olmadığını test eder. | `equal(2, 2)` | x, y (herhangi bir tip) | `true` |
| **equalText** | İki dizenin özdeş olup olmadığını test eder. | `equalText('hello', 'hello')` | x (dize), y (dize) | `true` |
| **larger** | x'in y'den büyük olup olmadığını kontrol eder. | `larger(3, 2)` | x, y (sayı veya BigNumber) | `true` |
| **largerEq** | x'in y'den büyük veya eşit olup olmadığını kontrol eder. | `largerEq(3, 3)` | x, y (sayı veya BigNumber) | `true` |
| **smaller** | x'in y'den küçük olup olmadığını kontrol eder. | `smaller(2, 3)` | x, y (sayı veya BigNumber) | `true` |
| **smallerEq** | x'in y'den küçük veya eşit olup olmadığını kontrol eder. | `smallerEq(2, 2)` | x, y (sayı veya BigNumber) | `true` |
| **unequal** | İki değerin eşit olmadığını kontrol eder. | `unequal(2, 3)` | x, y (herhangi bir tip) | `true` |

### Kümeler

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **setCartesian** | İki (veya daha fazla) kümenin kartezyen çarpımını üretir. | `setCartesian([1, 2], [3, 4])` | küme1 (Dizi), küme2 (Dizi) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | İki kümenin farkını döndürür (küme1'de olan ancak küme2'de olmayan elemanlar). | `setDifference([1, 2, 3], [2])` | küme1 (Dizi), küme2 (Dizi) | `[  1,  3]` |
| **setDistinct** | Bir (çoklu) küme içindeki benzersiz elemanları döndürür. | `setDistinct([1, 2, 2, 3])` | küme (Dizi) | `[  1,  2,  3]` |
| **setIntersect** | İki (veya daha fazla) kümenin kesişimini döndürür. | `setIntersect([1, 2], [2, 3])` | küme1 (Dizi), küme2 (Dizi) | `[  2]` |
| **setIsSubset** | küme1'in küme2'nin bir alt kümesi olup olmadığını kontrol eder. | `setIsSubset([1, 2], [1, 2, 3])` | küme1 (Dizi), küme2 (Dizi) | `true` |
| **setMultiplicity** | Bir elemanın bir çoklu kümede kaç kez göründüğünü sayar. | `setMultiplicity(2, [1, 2, 2, 3])` | eleman (herhangi bir tip), küme (Dizi) | `2` |
| **setPowerset** | Bir (çoklu) kümenin kuvvet kümesini (tüm alt kümelerini) döndürür. | `setPowerset([1, 2])` | küme (Dizi) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Bir (çoklu) kümedeki tüm elemanları sayar. | `setSize([1, 2, 3])` | küme (Dizi) | `3` |
| **setSymDifference** | İki (veya daha fazla) kümenin simetrik farkını döndürür. | `setSymDifference([1, 2], [2, 3])` | küme1 (Dizi), küme2 (Dizi) | `[  1,  3]` |
| **setUnion** | İki (veya daha fazla) kümenin birleşimini döndürür. | `setUnion([1, 2], [2, 3])` | küme1 (Dizi), küme2 (Dizi) | `[  1,  3,  2]` |

### Özel

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **erf** | Rasyonel bir Chebyshev yaklaşımı kullanarak hata fonksiyonunu (error function) hesaplar. | `erf(0.5)` | girdi x (sayı) | `0.5204998778130465` |

### İstatistik

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **cumsum** | Bir listenin veya matrisin kümülatif toplamını hesaplar. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Medyan mutlak sapmayı (median absolute deviation) hesaplar. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Bir listenin veya matrisin maksimum değerini döndürür. | `max([1, 2, 3])` |  | `3` |
| **mean** | Ortalama değeri hesaplar. | `mean([2, 4, 6])` |  | `4` |
| **median** | Medyanı hesaplar. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Bir listenin veya matrisin minimum değerini döndürür. | `min([1, 2, 3])` |  | `1` |
| **mode** | Modu (en sık rastlanan değer) hesaplar. | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Bir liste veya matristeki tüm sayıların çarpımını hesaplar. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | `prob` olasılığındaki kuantili hesaplar. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Verilerin standart sapmasını hesaplar. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Bir liste veya matristeki tüm sayıların toplamını hesaplar. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Verilerin varyansını hesaplar. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Metin İşlemleri

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **bin** | Bir sayıyı ikilik (binary) sistemde biçimlendirir. | `bin(13)` |  | `13` |
| **format** | Herhangi bir değeri belirtilen hassasiyetle bir dize olarak biçimlendirir. | `format(123.456, 2)` |  | `120` |
| **hex** | Bir sayıyı on altılık (hexadecimal) sistemde biçimlendirir. | `hex(255)` |  | `255` |
| **oct** | Bir sayıyı sekizlik (octal) sistemde biçimlendirir. | `oct(64)` |  | `64` |
| **print** | Bir dize şablonuna birden fazla değeri yerleştirir. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometri

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **acos** | Ark kosinüsü hesaplar. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Ters hiperbolik kosinüsü hesaplar. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Ark kotanjantı hesaplar. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Ters hiperbolik kotanjantı hesaplar. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Ark kosekantı hesaplar. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Ters hiperbolik kosekantı hesaplar. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Ark sekantı hesaplar. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Ters hiperbolik sekantı hesaplar. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Ark sinüsü hesaplar. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Ters hiperbolik sinüsü hesaplar. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Ark tanjantı hesaplar. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | İki argümanlı ark tanjantı hesaplar. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Ters hiperbolik tanjantı hesaplar. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | x'in kosinüsünü hesaplar. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | x'in hiperbolik kosinüsünü hesaplar. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | x'in kotanjantını hesaplar. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | x'in hiperbolik kotanjantını hesaplar. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | x'in kosekantını hesaplar. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | x'in hiperbolik kosekantını hesaplar. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | x'in sekantını hesaplar. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | x'in hiperbolik sekantını hesaplar. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | x'in sinüsünü hesaplar. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | x'in hiperbolik sinüsünü hesaplar. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | x'in tanjantını hesaplar. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | x'in hiperbolik tanjantını hesaplar. | `tanh(0.5)` |  | `0.46211715726000974` |

### Birimler

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **to** | Sayısal bir değeri belirtilen birime dönüştürür. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Yardımcı Araçlar

| Fonksiyon | Tanım | Örnek çağrı | Parametreler | Beklenen sonuç |
| --- | --- | --- | --- | --- |
| **clone** | Girdi değerini derinlemesine kopyalar (deep clone). | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Girdinin sayısal bir değer içerip içermediğini kontrol eder. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Girdinin bir tam sayı olup olmadığını kontrol eder. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Girdinin NaN (Not a Number) olup olmadığını kontrol eder. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Girdinin negatif olup olmadığını kontrol eder. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Girdinin sayısal olup olmadığını kontrol eder. | `isNumeric('123')` |  | `false` |
| **isPositive** | Girdinin pozitif olup olmadığını kontrol eder. | `isPositive(2)` |  | `true` |
| **isPrime** | Girdinin asal sayı olup olmadığını kontrol eder. | `isPrime(7)` |  | `true` |
| **isZero** | Girdinin sıfır olup olmadığını kontrol eder. | `isZero(0)` |  | `true` |
| **numeric** | Girdiyi sayısal bir tipe (sayı, BigNumber vb.) dönüştürür. | `numeric('123')` |  | `123` |
| **typeOf** | Girdi değerinin tip adını döndürür. | `typeOf([1, 2, 3])` |  | `Array` |