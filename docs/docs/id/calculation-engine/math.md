---
title: "Math.js"
description: "Math.js library matematika: parsing ekspresi, aljabar, aritmetika, matrix, bilangan kompleks, fungsi trigonometri, statistik, konversi unit, untuk formula field dan perhitungan workflow."
keywords: "Math.js,parsing ekspresi,operasi matrix,perhitungan aljabar,fungsi statistik,konversi unit,NocoBase"
---

# Mathjs

[Math.js](https://mathjs.org/) adalah library matematika JavaScript dan Node.js yang kaya fitur.

## Referensi Fungsi

### Ekspresi

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **compile** | Mem-parse dan meng-compile ekspresi (bertanggung jawab untuk parsing, tidak langsung mengembalikan hasil). | `compile('2 + 3')` | Ekspresi (string) | `{}` |
| **evaluate** | Mengevaluasi ekspresi dan mengembalikan hasilnya. | `evaluate('2 + 3')` | Ekspresi (string), scope (opsional) | `5` |
| **help** | Mengambil instruksi penggunaan dari fungsi atau tipe data. | `help('evaluate')` | Kata kunci pencarian (string) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Membuat parser untuk operasi kustom. | `parser()` | Tidak ada | `{}` |

### Perhitungan Aljabar

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **derivative** | Melakukan derivasi pada ekspresi, dengan menentukan variable. | `derivative('x^2', 'x')` | Ekspresi (string atau node), variable (string) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Menghitung jumlah leaf node dalam parse tree ekspresi (simbol atau konstanta). | `leafCount('x^2 + y')` | Ekspresi (string atau node) | `3` |
| **lsolve** | Menyelesaikan satu solusi dari sistem persamaan linear menggunakan forward substitution. | `lsolve([[1,2],[3,4]], [5,6])` | L (array atau matrix), b (array atau matrix) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Menyelesaikan semua solusi dari sistem persamaan linear menggunakan forward substitution. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (array atau matrix), b (array atau matrix) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Melakukan dekomposisi LU dengan partial pivoting pada matrix. | `lup([[1,2],[3,4]])` | A (array atau matrix) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Menyelesaikan persamaan linear A*x=b (A adalah matrix n×n). | `lusolve([[1,2],[3,4]], [5,6])` | A (array atau matrix), b (array atau matrix) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Melakukan dekomposisi QR pada matrix. | `qr([[1,2],[3,4]])` | A (array atau matrix) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Mengubah ekspresi yang dapat dirasionalisasi menjadi pecahan rasional. | `rationalize('1/(x+1)')` | Ekspresi (string atau node) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Mengganti variable dalam ekspresi dengan nilai dari scope yang diberikan. | `resolve('x + y', {x:2, y:3})` | Ekspresi (string atau node), scope (object) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Menyederhanakan parse tree ekspresi (menggabungkan term sejenis, dll). | `simplify('2x + 3x')` | Ekspresi (string atau node) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Penyederhanaan ekspresi single-pass (one-pass), umumnya digunakan untuk skenario yang sensitif terhadap performa. | `simplifyCore('x+x')` | Ekspresi (string atau node) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Menghitung dekomposisi LU sparse dengan full pivoting. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (array atau matrix), urutan dekomposisi (string), threshold (angka) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Mendeteksi apakah dua ekspresi sama secara simbolik. | `symbolicEqual('x+x', '2x')` | Ekspresi 1 (string atau node), ekspresi 2 (string atau node) | `true` |
| **usolve** | Menyelesaikan satu solusi dari sistem persamaan linear menggunakan back substitution. | `usolve([[1,2],[0,1]], [3,4])` | U (array atau matrix), b (array atau matrix) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Menyelesaikan semua solusi dari sistem persamaan linear menggunakan back substitution. | `usolveAll([[1,2],[0,1]], [3,4])` | U (array atau matrix), b (array atau matrix) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Perhitungan Aritmetika

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **abs** | Menghitung nilai absolut dari sebuah angka. | `abs(-3.2)` | x (angka, kompleks, array, atau matrix) | `3.2` |
| **add** | Menjumlahkan dua atau lebih nilai (x + y). | `add(2, 3)` | x, y, ... (angka, array, atau matrix) | `5` |
| **cbrt** | Menghitung akar pangkat tiga dari sebuah angka, opsional menghitung semua akar pangkat tiga. | `cbrt(8)` | x (angka atau kompleks), allRoots (boolean, opsional) | `2` |
| **ceil** | Membulatkan ke arah positif tak hingga (untuk bilangan kompleks, bagian real dan imajiner dibulatkan terpisah). | `ceil(3.2)` | x (angka, kompleks, array, atau matrix) | `4` |
| **cube** | Menghitung pangkat tiga dari sebuah angka (x*x*x). | `cube(3)` | x (angka, kompleks, array, atau matrix) | `27` |
| **divide** | Pembagian dua nilai (x / y). | `divide(6, 2)` | x (angka, array, atau matrix), y (angka, array, atau matrix) | `3` |
| **dotDivide** | Melakukan pembagian element-wise pada dua matrix atau array. | `dotDivide([6,8],[2,4])` | x (array atau matrix), y (array atau matrix) | `[  3,  2]` |
| **dotMultiply** | Melakukan perkalian element-wise pada dua matrix atau array. | `dotMultiply([2,3],[4,5])` | x (array atau matrix), y (array atau matrix) | `[  8,  15]` |
| **dotPow** | Mempangkatkan x^y secara element-wise. | `dotPow([2,3],[2,3])` | x (array atau matrix), y (array atau matrix) | `[  4,  27]` |
| **exp** | Menghitung e^x. | `exp(1)` | x (angka, kompleks, array, atau matrix) | `2.718281828459045` |
| **expm1** | Menghitung e^x - 1. | `expm1(1)` | x (angka atau kompleks) | `1.718281828459045` |
| **fix** | Membulatkan ke arah nol (truncate). | `fix(3.7)` | x (angka, kompleks, array, atau matrix) | `3` |
| **floor** | Membulatkan ke arah negatif tak hingga. | `floor(3.7)` | x (angka, kompleks, array, atau matrix) | `3` |
| **gcd** | Mencari greatest common divisor dari dua atau lebih angka. | `gcd(8, 12)` | a, b, ... (angka atau big number) | `4` |
| **hypot** | Menghitung akar kuadrat dari jumlah kuadrat beberapa angka (seperti teorema Pythagoras). | `hypot(3, 4)` | a, b, ... (angka atau big number) | `5` |
| **invmod** | Menghitung multiplicative inverse dari a modulo b. | `invmod(3, 11)` | a, b (angka atau big number) | `4` |
| **lcm** | Mencari least common multiple dari dua atau lebih angka. | `lcm(4, 6)` | a, b, ... (angka atau big number) | `12` |
| **log** | Menghitung logaritma (basis dapat ditentukan). | `log(100, 10)` | x (angka atau kompleks), base (opsional, angka atau kompleks) | `2` |
| **log10** | Menghitung logaritma berbasis 10 dari sebuah angka. | `log10(100)` | x (angka atau kompleks) | `2` |
| **log1p** | Menghitung ln(1 + x). | `log1p(1)` | x (angka atau kompleks) | `0.6931471805599453` |
| **log2** | Menghitung logaritma berbasis 2 dari sebuah angka. | `log2(8)` | x (angka atau kompleks) | `3` |
| **mod** | Menghitung sisa pembagian x ÷ y (x mod y). | `mod(8,3)` | x, y (angka atau big number) | `2` |
| **multiply** | Mengalikan dua atau lebih nilai (x * y). | `multiply(2, 3)` | x, y, ... (angka, array, atau matrix) | `6` |
| **norm** | Menghitung norm dari angka, vektor, atau matrix, dengan opsional p. | `norm([3,4])` | x (array atau matrix), p (angka atau string, opsional) | `5` |
| **nthRoot** | Menghitung akar pangkat n dari sebuah angka (akar utama). | `nthRoot(16, 4)` | a (angka, big number, atau kompleks), root (opsional, angka) | `2` |
| **nthRoots** | Menghitung semua akar pangkat n dari sebuah angka, mungkin termasuk solusi kompleks. | `nthRoots(1,3)` | x (angka atau kompleks), root (angka) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Menghitung x^y. | `pow(2, 3)` | x (angka, kompleks, array, atau matrix), y (angka, kompleks, array, atau matrix) | `8` |
| **round** | Membulatkan ke jumlah desimal yang ditentukan. | `round(3.14159, 2)` | x (angka, kompleks, array, atau matrix), n (opsional, angka) | `3.14` |
| **sign** | Menghitung tanda nilai (-1, 0, atau 1). | `sign(-3)` | x (angka, big number, atau kompleks) | `-1` |
| **sqrt** | Menghitung akar kuadrat dari sebuah angka. | `sqrt(9)` | x (angka, kompleks, array, atau matrix) | `3` |
| **square** | Menghitung kuadrat dari sebuah angka (x*x). | `square(3)` | x (angka, kompleks, array, atau matrix) | `9` |
| **subtract** | Pengurangan dua angka (x - y). | `subtract(8, 3)` | x, y (angka, array, atau matrix) | `5` |
| **unaryMinus** | Melakukan operasi unary minus (negasi) pada nilai. | `unaryMinus(3)` | x (angka, kompleks, array, atau matrix) | `-3` |
| **unaryPlus** | Melakukan operasi unary plus pada nilai (umumnya tidak ada perubahan). | `unaryPlus(-3)` | x (angka, kompleks, array, atau matrix) | `-3` |
| **xgcd** | Menghitung extended greatest common divisor dari dua angka. | `xgcd(8, 12)` | a, b (angka atau big number) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Operasi Bit

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bitAnd** | Melakukan bitwise AND pada dua nilai (x & y). | `bitAnd(5, 3)` | x, y (angka atau big number) | `1` |
| **bitNot** | Melakukan bitwise NOT pada nilai (~x). | `bitNot(5)` | x (angka atau big number) | `-6` |
| **bitOr** | Melakukan bitwise OR pada dua nilai (x \ | `y).` | bitOr(5, 3) | `x, y (angka atau big number)` |
| **bitXor** | Melakukan bitwise XOR pada dua nilai (x ^ y). | `bitXor(5, 3)` | x, y (angka atau big number) | `6` |
| **leftShift** | Menggeser bit biner x ke kiri sebanyak y bit (x << y). | `leftShift(5, 1)` | x, y (angka atau big number) | `10` |
| **rightArithShift** | Melakukan arithmetic right shift pada bit biner x (x >> y). | `rightArithShift(5, 1)` | x, y (angka atau big number) | `2` |
| **rightLogShift** | Melakukan logical right shift pada bit biner x (x >>> y). | `rightLogShift(5, 1)` | x, y (angka atau big number) | `2` |

### Kombinatorik

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Menghitung jumlah semua cara partisi dari n elemen yang berbeda. | `bellNumbers(3)` | n (angka) | `5` |
| **catalan** | Menghitung Catalan number ke-n, sesuai dengan berbagai struktur kombinatorial. | `catalan(5)` | n (angka) | `42` |
| **composition** | Menghitung jumlah komposisi dari n menjadi k bagian. | `composition(5, 3)` | n, k (angka) | `6` |
| **stirlingS2** | Menghitung jumlah cara mempartisi n elemen berlabel menjadi k subset non-kosong (Stirling number of the second kind). | `stirlingS2(5, 3)` | n, k (angka) | `25` |

### Bilangan Kompleks

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **arg** | Menghitung argumen (fase) dari bilangan kompleks. | `arg(complex('2 + 2i'))` | x (kompleks atau angka) | `0.785398163` |
| **conj** | Menghitung konjugat dari bilangan kompleks. | `conj(complex('2 + 2i'))` | x (kompleks atau angka) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Mendapatkan bagian imajiner dari bilangan kompleks. | `im(complex('2 + 3i'))` | x (kompleks atau angka) | `3` |
| **re** | Mendapatkan bagian real dari bilangan kompleks. | `re(complex('2 + 3i'))` | x (kompleks atau angka) | `2` |

### Geometri

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **distance** | Menghitung Euclidean distance antara dua titik dalam ruang N-dimensi. | `distance([0,0],[3,4])` | point1 (array), point2 (array) | `5` |
| **intersect** | Mencari titik perpotongan antara dua garis (2D/3D), atau garis dengan bidang (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | Titik awal dan akhir garis 1, titik awal dan akhir garis 2, ... | `[  1,  1]` |

### Logika

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **and** | Melakukan operasi logika AND. | `and(true, false)` | x, y (boolean atau angka) | `false` |
| **not** | Melakukan operasi logika NOT. | `not(true)` | x (boolean atau angka) | `false` |
| **or** | Melakukan operasi logika OR. | `or(true, false)` | x, y (boolean atau angka) | `true` |
| **xor** | Melakukan operasi logika XOR. | `xor(1, 0)` | x, y (boolean atau angka) | `true` |

### Matrix

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **column** | Mengembalikan kolom yang ditentukan dari matrix. | `column([[1,2],[3,4]], 1)` | value (matrix atau array), index (angka) | `[  [    1  ],  [    3  ]]` |
| **concat** | Menggabungkan beberapa matrix/array sepanjang dimensi tertentu. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (array atau matrix), dim (angka, opsional) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Menghitung jumlah elemen dari matrix, array, atau string. | `count([1,2,3,'hello'])` | x (array, matrix, atau string) | `4` |
| **cross** | Menghitung cross product dari dua vektor 3D. | `cross([1,2,3], [4,5,6])` | x, y (array atau matrix dengan panjang 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Melakukan transpose pada matrix dan mengambil konjugat. | `ctranspose([[1,2],[3,4]])` | x (matrix atau array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Menghitung determinan matrix. | `det([[1,2],[3,4]])` | x (matrix atau array) | `-2` |
| **diag** | Membuat matrix diagonal atau mengekstrak diagonal matrix. | `diag([1,2,3])` | X (array atau matrix) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Menghitung selisih antara elemen-elemen yang berdekatan pada dimensi tertentu. | `diff([1,4,9,16])` | arr (array atau matrix), dim (angka, opsional) | `[  3,  5,  7]` |
| **dot** | Menghitung dot product dari dua vektor. | `dot([1,2,3],[4,5,6])` | x, y (array atau matrix) | `32` |
| **eigs** | Menghitung eigenvalue dan (opsional) eigenvector dari matrix persegi. | `eigs([[1,2],[3,4]])` | x (matrix atau array), codec (numerik, opsional) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Menghitung eksponen matrix e^A. | `expm([[1,0],[0,1]])` | x (matrix atau array) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Menghitung Fast Fourier Transform N-dimensi. | `fft([1,2,3,4])` | arr (array atau matrix) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Belum didukung) Memfilter array atau matrix 1D menggunakan fungsi test. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (array atau matrix), test (fungsi) | `[  "23",  "100",  "55"]` |
| **flatten** | Mengembangkan matrix atau array multi-dimensi menjadi 1D. | `flatten([[1,2],[3,4]])` | x (array atau matrix) | `[  1,  2,  3,  4]` |
| **forEach** | (Belum didukung) Mengiterasi setiap elemen matrix/array dan mengeksekusi callback. | `forEach([1,2,3], val => console.log(val))` | x (array atau matrix), callback (fungsi) | `undefined` |
| **getMatrixDataType** | Memeriksa tipe data semua elemen matrix atau array, contohnya 'number' atau 'Complex'. | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (array atau matrix) | `mixed` |
| **identity** | Membuat matrix identitas n x n (atau m x n). | `identity(3)` | n (angka) atau [m, n] (array) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Menghitung Inverse Fast Fourier Transform N-dimensi. | `ifft([1,2,3,4])` | arr (array atau matrix) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Menghitung invers dari matrix persegi. | `inv([[1,2],[3,4]])` | x (matrix atau array) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Menghitung Kronecker product dari dua matrix atau vektor. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (matrix atau array) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Membuat array/matrix baru dengan menerapkan callback pada setiap elemen. | `map([1,2,3], val => val * val)` | x (array atau matrix), callback (fungsi) | `[  1,  4,  9]` |
| **matrixFromColumns** | Menggabungkan beberapa vektor sebagai kolom terpisah menjadi matrix dense. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (array atau matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Belum didukung) Menghasilkan matrix dengan mengevaluasi fungsi pada setiap index matrix. | `matrixFromFunction([5], i => math.random())` | size (array), fn (fungsi) | `a random vector` |
| **matrixFromRows** | Menggabungkan beberapa vektor sebagai baris terpisah menjadi matrix dense. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (array atau matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Membuat matrix 1 dengan dimensi yang diberikan. | `ones(2, 3)` | m, n, p... (angka) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Mengembalikan elemen terkecil ke-k dari array atau matrix 1D berdasarkan partition selection. | `partitionSelect([3,1,4,2], 2)` | x (array atau matrix), k (angka) | `3` |
| **pinv** | Menghitung Moore-Penrose pseudoinverse dari matrix. | `pinv([[1,2],[2,4]])` | x (matrix atau array) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Menghasilkan array angka dari start hingga end (step opsional). | `range(1, 5, 2)` | start (angka), end (angka), step (angka, opsional) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Membentuk ulang array/matrix ke dimensi yang ditentukan. | `reshape([1,2,3,4,5,6], [2,3])` | x (array atau matrix), sizes (array) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Mengubah ukuran matrix ke dimensi baru, dapat mengisi elemen yang hilang dengan nilai default. | `resize([1,2,3], [5], 0)` | x (array atau matrix), size (array), defaultValue (opsional) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Memutar vektor 1x2 berlawanan arah jarum jam dengan sudut tertentu, atau memutar vektor 1x3 mengelilingi sumbu yang diberikan. | `rotate([1, 0], Math.PI / 2)` | w (array atau matrix), theta (angka[, sumbu]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Membuat matrix rotasi 2x2 dengan radian yang diberikan. | `rotationMatrix(Math.PI / 2)` | theta (angka) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Mengembalikan baris yang ditentukan dari matrix. | `row([[1,2],[3,4]], 1)` | value (matrix atau array), index (angka) | `[  [    3,    4  ]]` |
| **size** | Menghitung ukuran (dimensi) matrix, array, atau skalar. | `size([[1,2,3],[4,5,6]])` | x (array, matrix, atau angka) | `[  2,  3]` |
| **sort** | Mengurutkan matrix atau array secara ascending. | `sort([3,1,2])` | x (array atau matrix) | `[  1,  2,  3]` |
| **sqrtm** | Menghitung principal square root dari matrix persegi. | `sqrtm([[4,0],[0,4]])` | A (matrix atau array) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Menghapus dimensi tunggal di dalam dan di luar matrix. | `squeeze([[[1],[2],[3]]])` | x (matrix atau array) | `[  1,  2,  3]` |
| **subset** | Mendapatkan atau mengganti subset dari matrix atau string. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (matrix, array, atau string), index (index), replacement (opsional) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Menghitung trace matrix persegi (jumlah elemen diagonal). | `trace([[1,2],[3,4]])` | x (matrix atau array) | `5` |
| **transpose** | Melakukan transpose pada matrix. | `transpose([[1,2],[3,4]])` | x (matrix atau array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Membuat matrix 0 dengan dimensi yang diberikan. | `zeros(2, 3)` | m, n, p... (angka) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Probabilitas

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **combinations** | Menghitung jumlah kombinasi tidak terurut dari n elemen yang diambil k. | `combinations(5, 2)` | n (numerik), k (numerik) | `10` |
| **combinationsWithRep** | Menghitung jumlah kombinasi dari elemen yang dapat diulang. | `combinationsWithRep(5, 2)` | n (numerik), k (numerik) | `15` |
| **factorial** | Menghitung faktorial dari integer n. | `factorial(5)` | n (integer) | `120` |
| **gamma** | Menghitung nilai gamma function menggunakan algoritma aproksimasi. | `gamma(5)` | n (numerik) | `24` |
| **kldivergence** | Menghitung KL divergence dari dua distribusi. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (array atau matrix), y (array atau matrix) | `0.036690014034750584` |
| **lgamma** | Menghitung logaritma dari gamma function (extended approximation). | `lgamma(5)` | n (numerik) | `3.178053830347945` |
| **multinomial** | Menghitung koefisien multinomial berdasarkan kumpulan hitungan. | `multinomial([1, 2, 3])` | a (array) | `60` |
| **permutations** | Menghitung jumlah permutasi terurut dari n elemen yang diambil k. | `permutations(5, 2)` | n (numerik), k (numerik, opsional) | `20` |
| **pickRandom** | Mengambil satu atau lebih nilai secara acak dari array 1D. | `pickRandom([10, 20, 30])` | array | `20` |
| **random** | Mendapatkan angka acak yang terdistribusi seragam. | `random(1, 10)` | nilai minimum (opsional), nilai maksimum (opsional) | `3.6099423753668143` |
| **randomInt** | Mendapatkan integer acak yang terdistribusi seragam. | `randomInt(1, 10)` | nilai minimum (opsional), nilai maksimum (opsional) | `5` |

### Bilangan Rasional

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **compare** | Membandingkan dua nilai, dapat mengembalikan -1, 0, atau 1. | `compare(2, 3)` | x, y (tipe apa pun) | `-1` |
| **compareNatural** | Membandingkan nilai tipe apa pun dengan cara natural dan dapat direproduksi. | `compareNatural('2', '10')` | x, y (tipe apa pun) | `-1` |
| **compareText** | Membandingkan dua string secara lexikografis. | `compareText('apple', 'banana')` | x (string), y (string) | `-1` |
| **deepEqual** | Membandingkan apakah dua matrix/array sama secara element-wise. | `deepEqual([[1, 2]], [[1, 2]])` | x (array/matrix), y (array/matrix) | `true` |
| **equal** | Memeriksa apakah dua nilai sama. | `equal(2, 2)` | x, y (tipe apa pun) | `true` |
| **equalText** | Memeriksa apakah dua string sama. | `equalText('hello', 'hello')` | x (string), y (string) | `true` |
| **larger** | Memeriksa apakah x lebih besar dari y. | `larger(3, 2)` | x, y (angka atau big number) | `true` |
| **largerEq** | Memeriksa apakah x lebih besar atau sama dengan y. | `largerEq(3, 3)` | x, y (angka atau big number) | `true` |
| **smaller** | Memeriksa apakah x lebih kecil dari y. | `smaller(2, 3)` | x, y (angka atau big number) | `true` |
| **smallerEq** | Memeriksa apakah x lebih kecil atau sama dengan y. | `smallerEq(2, 2)` | x, y (angka atau big number) | `true` |
| **unequal** | Memeriksa apakah dua nilai tidak sama. | `unequal(2, 3)` | x, y (tipe apa pun) | `true` |

### Himpunan

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **setCartesian** | Menghasilkan Cartesian product dari dua (banyak) himpunan. | `setCartesian([1, 2], [3, 4])` | Himpunan pertama (array), himpunan kedua (array) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Menghasilkan difference dari dua (banyak) himpunan (elemen yang ada di set1 tetapi tidak di set2). | `setDifference([1, 2, 3], [2])` | Himpunan pertama (array), himpunan kedua (array) | `[  1,  3]` |
| **setDistinct** | Mendapatkan elemen unik dari (banyak) himpunan. | `setDistinct([1, 2, 2, 3])` | Himpunan (array) | `[  1,  2,  3]` |
| **setIntersect** | Menghasilkan intersection dari dua (banyak) himpunan. | `setIntersect([1, 2], [2, 3])` | Himpunan pertama (array), himpunan kedua (array) | `[  2]` |
| **setIsSubset** | Memeriksa apakah set1 adalah subset dari set2. | `setIsSubset([1, 2], [1, 2, 3])` | Himpunan pertama (array), himpunan kedua (array) | `true` |
| **setMultiplicity** | Menghitung jumlah kemunculan elemen tertentu dalam multiset. | `setMultiplicity(2, [1, 2, 2, 3])` | Elemen (tipe apa pun), himpunan (array) | `2` |
| **setPowerset** | Menghasilkan semua subset dari (banyak) himpunan, yaitu power set. | `setPowerset([1, 2])` | Himpunan (array) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Menghitung jumlah semua elemen dalam (banyak) himpunan. | `setSize([1, 2, 3])` | Himpunan (array) | `3` |
| **setSymDifference** | Menghasilkan symmetric difference dari dua (banyak) himpunan (elemen yang hanya ada di salah satu himpunan). | `setSymDifference([1, 2], [2, 3])` | Himpunan pertama (array), himpunan kedua (array) | `[  1,  3]` |
| **setUnion** | Menghasilkan union dari dua (banyak) himpunan. | `setUnion([1, 2], [2, 3])` | Himpunan pertama (array), himpunan kedua (array) | `[  1,  3,  2]` |

### Khusus

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **erf** | Menghitung error function menggunakan rational Chebyshev approximation. | `erf(0.5)` | Nilai input x (angka) | `0.5204998778130465` |

### Statistik

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **cumsum** | Menghitung cumulative sum dari list atau matrix. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Menghitung median absolute deviation dari data. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Mengembalikan nilai maksimum dari list atau matrix. | `max([1, 2, 3])` |  | `3` |
| **mean** | Menghitung rata-rata. | `mean([2, 4, 6])` |  | `4` |
| **median** | Menghitung median. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Mengembalikan nilai minimum dari list atau matrix. | `min([1, 2, 3])` |  | `1` |
| **mode** | Menghitung mode (nilai yang paling sering muncul). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Menghitung perkalian semua angka dalam list atau matrix. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Menghitung quantile pada posisi prob dari list atau matrix. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Menghitung standard deviation dari data. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Menghitung jumlah semua angka dalam list atau matrix. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Menghitung variance dari data. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### String

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bin** | Memformat angka menjadi biner. | `bin(13)` |  | `13` |
| **format** | Mengkonversi nilai tipe apa pun menjadi string dengan presisi yang ditentukan. | `format(123.456, 2)` |  | `120` |
| **hex** | Memformat angka menjadi heksadesimal. | `hex(255)` |  | `255` |
| **oct** | Memformat angka menjadi oktal. | `oct(64)` |  | `64` |
| **print** | Memasukkan beberapa nilai numerik ke dalam string template. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Fungsi Trigonometri

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **acos** | Menghitung nilai arc cosine. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Menghitung nilai hyperbolic arc cosine. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Menghitung nilai arc cotangent. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Menghitung nilai hyperbolic arc cotangent. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Menghitung nilai arc cosecant. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Menghitung nilai hyperbolic arc cosecant. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Menghitung nilai arc secant. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Menghitung nilai hyperbolic arc secant. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Menghitung nilai arc sine. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Menghitung nilai hyperbolic arc sine. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Menghitung nilai arc tangent. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Menghitung nilai arc tangent dengan dua argumen. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Menghitung nilai hyperbolic arc tangent. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Menghitung nilai cosine x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Menghitung nilai hyperbolic cosine x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Menghitung nilai cotangent x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Menghitung nilai hyperbolic cotangent x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Menghitung nilai cosecant x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Menghitung nilai hyperbolic cosecant x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Menghitung nilai secant x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Menghitung nilai hyperbolic secant x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Menghitung nilai sine x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Menghitung nilai hyperbolic sine x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Menghitung nilai tangent x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Menghitung nilai hyperbolic tangent x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Unit

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **to** | Mengkonversi nilai numerik ke unit yang ditentukan. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Umum

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **clone** | Melakukan deep copy pada nilai input. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Memeriksa apakah input mengandung nilai numerik. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Memeriksa apakah input adalah integer. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Memeriksa apakah input adalah NaN. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Memeriksa apakah input adalah angka negatif. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Memeriksa apakah input adalah nilai numerik. | `isNumeric('123')` |  | `false` |
| **isPositive** | Memeriksa apakah input adalah angka positif. | `isPositive(2)` |  | `true` |
| **isPrime** | Memeriksa apakah input adalah bilangan prima. | `isPrime(7)` |  | `true` |
| **isZero** | Memeriksa apakah input adalah 0. | `isZero(0)` |  | `true` |
| **numeric** | Mengkonversi nilai input ke tipe numerik tertentu (seperti number, BigNumber, dll). | `numeric('123')` |  | `123` |
| **typeOf** | Mengembalikan nama tipe dari nilai input. | `typeOf([1, 2, 3])` |  | `Array` |
