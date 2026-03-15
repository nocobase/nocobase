:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) adalah pustaka matematika yang kaya fitur untuk JavaScript dan Node.js.

## Referensi Fungsi

### Ekspresi

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **compile** | Mengurai dan mengompilasi ekspresi (hanya mengurai dan tidak mengembalikan hasil secara langsung). | `compile('2 + 3')` | ekspresi (string) | `{}` |
| **evaluate** | Menghitung ekspresi dan mengembalikan hasilnya. | `evaluate('2 + 3')` | ekspresi (string), cakupan (opsional) | `5` |
| **help** | Mengambil dokumentasi untuk fungsi atau tipe data. | `help('evaluate')` | kata kunci pencarian (string) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Membuat parser untuk operasi kustom. | `parser()` | Tidak ada | `{}` |

### Aljabar

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **derivative** | Menurunkan (diferensiasi) ekspresi terhadap variabel tertentu. | `derivative('x^2', 'x')` | ekspresi (string atau Node), variabel (string) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Menghitung jumlah simpul daun (simbol atau konstanta) dalam pohon ekspresi. | `leafCount('x^2 + y')` | ekspresi (string atau Node) | `3` |
| **lsolve** | Menyelesaikan sistem linear menggunakan substitusi maju. | `lsolve([[1,2],[3,4]], [5,6])` | L (Array atau Matriks), b (Array atau Matriks) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Menemukan semua solusi dari sistem linear menggunakan substitusi maju. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Array atau Matriks), b (Array atau Matriks) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Melakukan dekomposisi LU dengan pivoting parsial. | `lup([[1,2],[3,4]])` | A (Array atau Matriks) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Menyelesaikan sistem linear A*x = b di mana A adalah matriks n×n. | `lusolve([[1,2],[3,4]], [5,6])` | A (Array atau Matriks), b (Array atau Matriks) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Menghitung dekomposisi QR dari sebuah matriks. | `qr([[1,2],[3,4]])` | A (Array atau Matriks) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Mengubah ekspresi yang dapat dirasionalkan menjadi pecahan rasional. | `rationalize('1/(x+1)')` | ekspresi (string atau Node) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Mengganti simbol dalam ekspresi dengan nilai dari cakupan (scope) yang disediakan. | `resolve('x + y', {x:2, y:3})` | ekspresi (string atau Node), cakupan (objek) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Menyederhanakan pohon ekspresi (menggabungkan suku-suku sejenis, dll.). | `simplify('2x + 3x')` | ekspresi (string atau Node) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Melakukan penyederhanaan satu langkah (one-pass), sering digunakan dalam kasus yang sensitif terhadap performa. | `simplifyCore('x+x')` | ekspresi (string atau Node) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Menghitung dekomposisi LU jarang (sparse) dengan pivoting penuh. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Array atau Matriks), urutan (string), ambang batas (angka) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Memeriksa apakah dua ekspresi sama secara simbolis. | `symbolicEqual('x+x', '2x')` | ekspresi1 (string atau Node), ekspresi2 (string atau Node) | `true` |
| **usolve** | Menyelesaikan sistem linear menggunakan substitusi balik. | `usolve([[1,2],[0,1]], [3,4])` | U (Array atau Matriks), b (Array atau Matriks) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Menemukan semua solusi dari sistem linear menggunakan substitusi balik. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Array atau Matriks), b (Array atau Matriks) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Aritmetika

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **abs** | Menghitung nilai absolut dari sebuah angka. | `abs(-3.2)` | x (angka, Kompleks, Array, atau Matriks) | `3.2` |
| **add** | Menambahkan dua atau lebih nilai (x + y). | `add(2, 3)` | x, y, ... (angka, Array, atau Matriks) | `5` |
| **cbrt** | Menghitung akar pangkat tiga dari sebuah angka, secara opsional mengembalikan semua akar pangkat tiga. | `cbrt(8)` | x (angka atau Kompleks), allRoots (boolean, opsional) | `2` |
| **ceil** | Membulatkan ke arah tak terhingga positif (untuk bilangan kompleks, setiap bagian dibulatkan secara terpisah). | `ceil(3.2)` | x (angka, Kompleks, Array, atau Matriks) | `4` |
| **cube** | Menghitung pangkat tiga dari sebuah nilai (x*x*x). | `cube(3)` | x (angka, Kompleks, Array, atau Matriks) | `27` |
| **divide** | Membagi dua nilai (x / y). | `divide(6, 2)` | x (angka, Array, atau Matriks), y (angka, Array, atau Matriks) | `3` |
| **dotDivide** | Membagi dua matriks atau array elemen demi elemen. | `dotDivide([6,8],[2,4])` | x (Array atau Matriks), y (Array atau Matriks) | `[  3,  2]` |
| **dotMultiply** | Mengalikan dua matriks atau array elemen demi elemen. | `dotMultiply([2,3],[4,5])` | x (Array atau Matriks), y (Array atau Matriks) | `[  8,  15]` |
| **dotPow** | Menghitung x^y elemen demi elemen. | `dotPow([2,3],[2,3])` | x (Array atau Matriks), y (Array atau Matriks) | `[  4,  27]` |
| **exp** | Menghitung e^x. | `exp(1)` | x (angka, Kompleks, Array, atau Matriks) | `2.718281828459045` |
| **expm1** | Menghitung e^x - 1. | `expm1(1)` | x (angka atau Kompleks) | `1.718281828459045` |
| **fix** | Membulatkan ke arah nol (pemotongan/truncation). | `fix(3.7)` | x (angka, Kompleks, Array, atau Matriks) | `3` |
| **floor** | Membulatkan ke arah tak terhingga negatif. | `floor(3.7)` | x (angka, Kompleks, Array, atau Matriks) | `3` |
| **gcd** | Menghitung pembagi persekutuan terbesar (FPB) dari dua atau lebih angka. | `gcd(8, 12)` | a, b, ... (angka atau BigNumber) | `4` |
| **hypot** | Menghitung akar kuadrat dari jumlah kuadrat argumen (Pythagoras). | `hypot(3, 4)` | a, b, ... (angka atau BigNumber) | `5` |
| **invmod** | Menghitung invers perkalian modular dari a modulo b. | `invmod(3, 11)` | a, b (angka atau BigNumber) | `4` |
| **lcm** | Menghitung kelipatan persekutuan terkecil (KPK) dari dua atau lebih angka. | `lcm(4, 6)` | a, b, ... (angka atau BigNumber) | `12` |
| **log** | Menghitung logaritma dengan basis opsional. | `log(100, 10)` | x (angka atau Kompleks), basis (angka atau Kompleks, opsional) | `2` |
| **log10** | Menghitung logaritma basis 10 dari sebuah angka. | `log10(100)` | x (angka atau Kompleks) | `2` |
| **log1p** | Menghitung ln(1 + x). | `log1p(1)` | x (angka atau Kompleks) | `0.6931471805599453` |
| **log2** | Menghitung logaritma basis 2 dari sebuah angka. | `log2(8)` | x (angka atau Kompleks) | `3` |
| **mod** | Menghitung sisa pembagian x ÷ y (x mod y). | `mod(8,3)` | x, y (angka atau BigNumber) | `2` |
| **multiply** | Mengalikan dua atau lebih nilai (x * y). | `multiply(2, 3)` | x, y, ... (angka, Array, atau Matriks) | `6` |
| **norm** | Menghitung norma dari angka, vektor, atau matriks dengan p opsional. | `norm([3,4])` | x (Array atau Matriks), p (angka atau string, opsional) | `5` |
| **nthRoot** | Menghitung akar ke-n (akar utama) dari sebuah angka. | `nthRoot(16, 4)` | a (angka, BigNumber, atau Kompleks), akar (angka, opsional) | `2` |
| **nthRoots** | Menghitung semua akar ke-n dari sebuah angka, yang mungkin berupa bilangan kompleks. | `nthRoots(1,3)` | x (angka atau Kompleks), akar (angka) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Memangkatkan x dengan y. | `pow(2, 3)` | x (angka, Kompleks, Array, atau Matriks), y (angka, Kompleks, Array, atau Matriks) | `8` |
| **round** | Membulatkan ke jumlah desimal yang ditentukan. | `round(3.14159, 2)` | x (angka, Kompleks, Array, atau Matriks), n (angka, opsional) | `3.14` |
| **sign** | Mengembalikan tanda dari sebuah angka (-1, 0, atau 1). | `sign(-3)` | x (angka, BigNumber, atau Kompleks) | `-1` |
| **sqrt** | Menghitung akar kuadrat dari sebuah angka. | `sqrt(9)` | x (angka, Kompleks, Array, atau Matriks) | `3` |
| **square** | Menghitung kuadrat dari sebuah nilai (x*x). | `square(3)` | x (angka, Kompleks, Array, atau Matriks) | `9` |
| **subtract** | Mengurangi satu nilai dari nilai lainnya (x - y). | `subtract(8, 3)` | x, y (angka, Array, atau Matriks) | `5` |
| **unaryMinus** | Menerapkan negasi uner pada sebuah nilai. | `unaryMinus(3)` | x (angka, Kompleks, Array, atau Matriks) | `-3` |
| **unaryPlus** | Menerapkan plus uner (biasanya membiarkan nilai tidak berubah). | `unaryPlus(-3)` | x (angka, Kompleks, Array, atau Matriks) | `-3` |
| **xgcd** | Menghitung pembagi persekutuan terbesar yang diperluas dari dua angka. | `xgcd(8, 12)` | a, b (angka atau BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Operasi Bit

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **bitAnd** | Melakukan operasi AND bitwise (x & y). | `bitAnd(5, 3)` | x, y (angka atau BigNumber) | `1` |
| **bitNot** | Melakukan operasi NOT bitwise (~x). | `bitNot(5)` | x (angka atau BigNumber) | `-6` |
| **bitOr** | Melakukan operasi OR bitwise (x \| y). | `bitOr(5, 3)` | x, y (angka atau BigNumber) | `7` |
| **bitXor** | Melakukan operasi XOR bitwise (x ^ y). | `bitXor(5, 3)` | x, y (angka atau BigNumber) | `6` |
| **leftShift** | Menggeser bit x ke kiri sebanyak y bit (x << y). | `leftShift(5, 1)` | x, y (angka atau BigNumber) | `10` |
| **rightArithShift** | Melakukan pergeseran aritmetika ke kanan pada x (x >> y). | `rightArithShift(5, 1)` | x, y (angka atau BigNumber) | `2` |
| **rightLogShift** | Melakukan pergeseran logika ke kanan pada x (x >>> y). | `rightLogShift(5, 1)` | x, y (angka atau BigNumber) | `2` |

### Kombinatorika

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Menghitung jumlah partisi dari n elemen yang berbeda. | `bellNumbers(3)` | n (angka) | `5` |
| **catalan** | Menghitung angka Catalan ke-n untuk berbagai struktur kombinatorial. | `catalan(5)` | n (angka) | `42` |
| **composition** | Menghitung jumlah komposisi n ke dalam k bagian. | `composition(5, 3)` | n, k (angka) | `6` |
| **stirlingS2** | Menghitung jumlah cara untuk mempartisi n item berlabel ke dalam k subset tidak kosong (angka Stirling jenis kedua). | `stirlingS2(5, 3)` | n, k (angka) | `25` |

### Bilangan Kompleks

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **arg** | Menghitung argumen (fase) dari bilangan kompleks. | `arg(complex('2 + 2i'))` | x (Kompleks atau angka) | `0.785398163` |
| **conj** | Menghitung konjugat kompleks. | `conj(complex('2 + 2i'))` | x (Kompleks atau angka) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Mengembalikan bagian imajiner dari bilangan kompleks. | `im(complex('2 + 3i'))` | x (Kompleks atau angka) | `3` |
| **re** | Mengembalikan bagian riil dari bilangan kompleks. | `re(complex('2 + 3i'))` | x (Kompleks atau angka) | `2` |

### Geometri

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **distance** | Menghitung jarak Euclidean antara dua titik dalam ruang N-dimensi. | `distance([0,0],[3,4])` | titik1 (Array), titik2 (Array) | `5` |
| **intersect** | Menemukan titik potong dari dua garis (2D/3D) atau garis dan bidang (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | titik akhir garis 1, titik akhir garis 2, ... | `[  1,  1]` |

### Logika

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **and** | Melakukan operasi AND logika. | `and(true, false)` | x, y (boolean atau angka) | `false` |
| **not** | Melakukan operasi NOT logika. | `not(true)` | x (boolean atau angka) | `false` |
| **or** | Melakukan operasi OR logika. | `or(true, false)` | x, y (boolean atau angka) | `true` |
| **xor** | Melakukan operasi XOR logika. | `xor(1, 0)` | x, y (boolean atau angka) | `true` |

### Matriks

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **column** | Mengembalikan kolom yang ditentukan dari sebuah matriks. | `column([[1,2],[3,4]], 1)` | nilai (Matriks atau Array), indeks (angka) | `[  [    1  ],  [    3  ]]` |
| **concat** | Menggabungkan beberapa matriks/array sepanjang dimensi tertentu. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Array atau Matriks), dim (angka, opsional) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Menghitung jumlah elemen dalam matriks, array, atau string. | `count([1,2,3,'hello'])` | x (Array, Matriks, atau string) | `4` |
| **cross** | Menghitung perkalian silang (cross product) dari dua vektor 3D. | `cross([1,2,3], [4,5,6])` | x, y (Array atau Matriks dengan panjang 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Menghitung transpose konjugat dari sebuah matriks. | `ctranspose([[1,2],[3,4]])` | x (Matriks atau Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Menghitung determinan matriks. | `det([[1,2],[3,4]])` | x (Matriks atau Array) | `-2` |
| **diag** | Membuat matriks diagonal atau mengekstrak diagonal dari sebuah matriks. | `diag([1,2,3])` | X (Array atau Matriks) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Menghitung selisih antara elemen yang berdekatan sepanjang dimensi tertentu. | `diff([1,4,9,16])` | arr (Array atau Matriks), dim (angka, opsional) | `[  3,  5,  7]` |
| **dot** | Menghitung perkalian titik (dot product) dari dua vektor. | `dot([1,2,3],[4,5,6])` | x, y (Array atau Matriks) | `32` |
| **eigs** | Menghitung nilai eigen dan secara opsional vektor eigen dari matriks persegi. | `eigs([[1,2],[3,4]])` | x (Matriks atau Array), codec (angka, opsional) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Menghitung eksponensial matriks e^A. | `expm([[1,0],[0,1]])` | x (Matriks atau Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Menghitung transformasi Fourier cepat (FFT) N-dimensi. | `fft([1,2,3,4])` | arr (Array atau Matriks) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Belum didukung) Memfilter array atau matriks 1D dengan fungsi pengujian. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Array atau Matriks), test (fungsi) | `[  "23",  "100",  "55"]` |
| **flatten** | Meratakan matriks atau array multi-dimensi menjadi 1D. | `flatten([[1,2],[3,4]])` | x (Array atau Matriks) | `[  1,  2,  3,  4]` |
| **forEach** | (Belum didukung) Melakukan iterasi pada setiap elemen matriks/array dan memanggil callback. | `forEach([1,2,3], val => console.log(val))` | x (Array atau Matriks), callback (fungsi) | `undefined` |
| **getMatrixDataType** | Memeriksa tipe data dari semua elemen dalam matriks atau array (misalnya, 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Array atau Matriks) | `mixed` |
| **identity** | Membuat matriks identitas n x n (atau m x n). | `identity(3)` | n (angka) atau [m, n] (Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Menghitung invers FFT N-dimensi. | `ifft([1,2,3,4])` | arr (Array atau Matriks) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Menghitung invers dari matriks persegi. | `inv([[1,2],[3,4]])` | x (Matriks atau Array) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Menghitung perkalian Kronecker dari dua matriks atau vektor. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matriks atau Array) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Membuat array/matriks baru dengan menerapkan callback ke setiap elemen. | `map([1,2,3], val => val * val)` | x (Array atau Matriks), callback (fungsi) | `[  1,  4,  9]` |
| **matrixFromColumns** | Menggabungkan vektor sebagai kolom terpisah dari matriks padat (dense matrix). | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Array atau Matriks) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Belum didukung) Membangun matriks dengan mengevaluasi fungsi untuk setiap indeks. | `matrixFromFunction([5], i => math.random())` | ukuran (Array), fn (fungsi) | `vektor acak` |
| **matrixFromRows** | Menggabungkan vektor sebagai baris terpisah dari matriks padat. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Array atau Matriks) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Membuat matriks yang berisi angka satu untuk dimensi yang diberikan. | `ones(2, 3)` | m, n, p... (angka) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Mengembalikan elemen terkecil ke-k menggunakan seleksi partisi. | `partitionSelect([3,1,4,2], 2)` | x (Array atau Matriks), k (angka) | `3` |
| **pinv** | Menghitung pseudoinverse Moore–Penrose dari sebuah matriks. | `pinv([[1,2],[2,4]])` | x (Matriks atau Array) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Membuat array angka dari awal hingga akhir (langkah opsional). | `range(1, 5, 2)` | awal (angka), akhir (angka), langkah (angka, opsional) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Mengubah bentuk array/matriks ke dimensi yang diberikan. | `reshape([1,2,3,4,5,6], [2,3])` | x (Array atau Matriks), ukuran (Array) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Mengubah ukuran matriks ke dimensi baru, mengisi dengan nilai default jika disediakan. | `resize([1,2,3], [5], 0)` | x (Array atau Matriks), ukuran (Array), nilaiDefault (opsional) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Memutar vektor 1x2 berlawanan arah jarum jam atau memutar vektor 1x3 di sekitar sumbu. | `rotate([1, 0], Math.PI / 2)` | w (Array atau Matriks), theta (angka[, sumbu]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Membuat matriks rotasi 2x2 untuk sudut tertentu dalam radian. | `rotationMatrix(Math.PI / 2)` | theta (angka) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Mengembalikan baris yang ditentukan dari sebuah matriks. | `row([[1,2],[3,4]], 1)` | nilai (Matriks atau Array), indeks (angka) | `[  [    3,    4  ]]` |
| **size** | Menghitung ukuran (dimensi) dari matriks, array, atau skalar. | `size([[1,2,3],[4,5,6]])` | x (Array, Matriks, atau angka) | `[  2,  3]` |
| **sort** | Mengurutkan matriks atau array dalam urutan menaik. | `sort([3,1,2])` | x (Array atau Matriks) | `[  1,  2,  3]` |
| **sqrtm** | Menghitung akar kuadrat utama dari matriks persegi. | `sqrtm([[4,0],[0,4]])` | A (Matriks atau Array) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Menghapus dimensi tunggal (singleton) dari dalam atau luar matriks. | `squeeze([[[1],[2],[3]]])` | x (Matriks atau Array) | `[  1,  2,  3]` |
| **subset** | Mendapatkan atau mengganti subset dari matriks atau string. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matriks, Array, atau string), indeks (Indeks), pengganti (opsional) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Menghitung trace (jumlah elemen diagonal) dari matriks persegi. | `trace([[1,2],[3,4]])` | x (Matriks atau Array) | `5` |
| **transpose** | Melakukan transpose pada matriks. | `transpose([[1,2],[3,4]])` | x (Matriks atau Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Membuat matriks yang berisi angka nol untuk dimensi yang diberikan. | `zeros(2, 3)` | m, n, p... (angka) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Probabilitas

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **combinations** | Menghitung kombinasi saat memilih k item yang tidak berurutan dari n. | `combinations(5, 2)` | n (angka), k (angka) | `10` |
| **combinationsWithRep** | Menghitung kombinasi saat pemilihan dapat berulang. | `combinationsWithRep(5, 2)` | n (angka), k (angka) | `15` |
| **factorial** | Menghitung n! untuk bilangan bulat n. | `factorial(5)` | n (bilangan bulat) | `120` |
| **gamma** | Mendekati fungsi gamma. | `gamma(5)` | n (angka) | `24` |
| **kldivergence** | Menghitung divergensi KL antara dua distribusi. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Array atau Matriks), y (Array atau Matriks) | `0.036690014034750584` |
| **lgamma** | Menghitung logaritma dari fungsi gamma. | `lgamma(5)` | n (angka) | `3.178053830347945` |
| **multinomial** | Menghitung koefisien multinomial dari sekumpulan hitungan. | `multinomial([1, 2, 3])` | a (Array) | `60` |
| **permutations** | Menghitung permutasi berurutan dari pemilihan k item dari n. | `permutations(5, 2)` | n (angka), k (angka, opsional) | `20` |
| **pickRandom** | Memilih satu atau lebih nilai acak dari array 1D. | `pickRandom([10, 20, 30])` | array | `20` |
| **random** | Mengembalikan angka acak yang terdistribusi secara seragam. | `random(1, 10)` | min (opsional), max (opsional) | `3.6099423753668143` |
| **randomInt** | Mengembalikan bilangan bulat acak yang terdistribusi secara seragam. | `randomInt(1, 10)` | min (opsional), max (opsional) | `5` |

### Bilangan Rasional

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **compare** | Membandingkan dua nilai, mengembalikan -1, 0, atau 1. | `compare(2, 3)` | x, y (tipe apa pun) | `-1` |
| **compareNatural** | Membandingkan nilai arbitrer dalam urutan alami yang dapat diulang. | `compareNatural('2', '10')` | x, y (tipe apa pun) | `-1` |
| **compareText** | Membandingkan dua string secara leksikografis. | `compareText('apple', 'banana')` | x (string), y (string) | `-1` |
| **deepEqual** | Membandingkan dua matriks/array elemen demi elemen untuk kesamaan. | `deepEqual([[1, 2]], [[1, 2]])` | x (Array/Matriks), y (Array/Matriks) | `true` |
| **equal** | Menguji apakah dua nilai sama. | `equal(2, 2)` | x, y (tipe apa pun) | `true` |
| **equalText** | Menguji apakah dua string identik. | `equalText('hello', 'hello')` | x (string), y (string) | `true` |
| **larger** | Memeriksa apakah x lebih besar dari y. | `larger(3, 2)` | x, y (angka atau BigNumber) | `true` |
| **largerEq** | Memeriksa apakah x lebih besar dari atau sama dengan y. | `largerEq(3, 3)` | x, y (angka atau BigNumber) | `true` |
| **smaller** | Memeriksa apakah x lebih kecil dari y. | `smaller(2, 3)` | x, y (angka atau BigNumber) | `true` |
| **smallerEq** | Memeriksa apakah x lebih kecil dari atau sama dengan y. | `smallerEq(2, 2)` | x, y (angka atau BigNumber) | `true` |
| **unequal** | Memeriksa apakah dua nilai tidak sama. | `unequal(2, 3)` | x, y (tipe apa pun) | `true` |

### Himpunan

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **setCartesian** | Menghasilkan perkalian Kartesius dari dua (atau lebih) himpunan. | `setCartesian([1, 2], [3, 4])` | set1 (Array), set2 (Array) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Mengembalikan selisih dari dua himpunan (elemen di set1 tetapi tidak di set2). | `setDifference([1, 2, 3], [2])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setDistinct** | Mengembalikan elemen unik di dalam sebuah (multi)set. | `setDistinct([1, 2, 2, 3])` | set (Array) | `[  1,  2,  3]` |
| **setIntersect** | Mengembalikan irisan dari dua (atau lebih) himpunan. | `setIntersect([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  2]` |
| **setIsSubset** | Memeriksa apakah set1 adalah subset dari set2. | `setIsSubset([1, 2], [1, 2, 3])` | set1 (Array), set2 (Array) | `true` |
| **setMultiplicity** | Menghitung berapa kali sebuah elemen muncul dalam multiset. | `setMultiplicity(2, [1, 2, 2, 3])` | elemen (tipe apa pun), set (Array) | `2` |
| **setPowerset** | Mengembalikan powerset (semua subset) dari sebuah (multi)set. | `setPowerset([1, 2])` | set (Array) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Menghitung semua elemen dalam sebuah (multi)set. | `setSize([1, 2, 3])` | set (Array) | `3` |
| **setSymDifference** | Mengembalikan selisih simetris dari dua (atau lebih) himpunan. | `setSymDifference([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setUnion** | Mengembalikan gabungan dari dua (atau lebih) himpunan. | `setUnion([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3,  2]` |

### Spesial

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **erf** | Menghitung fungsi kesalahan menggunakan pendekatan Chebyshev rasional. | `erf(0.5)` | input x (angka) | `0.5204998778130465` |

### Statistik

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **cumsum** | Menghitung jumlah kumulatif dari daftar atau matriks. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Menghitung deviasi absolut median. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Mengembalikan nilai maksimum dari daftar atau matriks. | `max([1, 2, 3])` |  | `3` |
| **mean** | Menghitung nilai rata-rata (mean). | `mean([2, 4, 6])` |  | `4` |
| **median** | Menghitung median. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Mengembalikan nilai minimum dari daftar atau matriks. | `min([1, 2, 3])` |  | `1` |
| **mode** | Menghitung modus (nilai yang paling sering muncul). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Menghitung hasil kali semua angka dalam daftar atau matriks. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Menghitung kuantil pada probabilitas `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Menghitung standar deviasi data. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Menghitung jumlah semua angka dalam daftar atau matriks. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Menghitung varians data. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### String

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **bin** | Memformat angka sebagai biner. | `bin(13)` |  | `13` |
| **format** | Memformat nilai apa pun sebagai string dengan presisi yang ditentukan. | `format(123.456, 2)` |  | `120` |
| **hex** | Memformat angka sebagai heksadesimal. | `hex(255)` |  | `255` |
| **oct** | Memformat angka sebagai oktal. | `oct(64)` |  | `64` |
| **print** | Menyisipkan beberapa nilai ke dalam templat string. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometri

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **acos** | Menghitung arccosine. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Menghitung invers cosinus hiperbolik. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Menghitung arccotangent. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Menghitung invers cotangen hiperbolik. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Menghitung arccosecant. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Menghitung invers cosecan hiperbolik. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Menghitung arcsecant. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Menghitung invers secan hiperbolik. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Menghitung arcsine. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Menghitung invers sinus hiperbolik. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Menghitung arctangent. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Menghitung arctangent dengan dua argumen. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Menghitung invers tangen hiperbolik. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Menghitung cosinus dari x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Menghitung cosinus hiperbolik dari x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Menghitung cotangen dari x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Menghitung cotangen hiperbolik dari x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Menghitung cosecan dari x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Menghitung cosecan hiperbolik dari x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Menghitung secan dari x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Menghitung secan hiperbolik dari x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Menghitung sinus dari x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Menghitung sinus hiperbolik dari x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Menghitung tangen dari x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Menghitung tangen hiperbolik dari x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Satuan

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **to** | Mengonversi nilai numerik ke satuan yang ditentukan. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Utilitas

| Fungsi | Definisi | Contoh panggilan | Parameter | Hasil yang diharapkan |
| --- | --- | --- | --- | --- |
| **clone** | Melakukan kloning mendalam (deep clone) pada nilai input. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Memeriksa apakah input mengandung nilai numerik. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Memeriksa apakah input adalah bilangan bulat. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Memeriksa apakah input adalah NaN. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Memeriksa apakah input bernilai negatif. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Memeriksa apakah input bersifat numerik. | `isNumeric('123')` |  | `false` |
| **isPositive** | Memeriksa apakah input bernilai positif. | `isPositive(2)` |  | `true` |
| **isPrime** | Memeriksa apakah input adalah bilangan prima. | `isPrime(7)` |  | `true` |
| **isZero** | Memeriksa apakah input adalah nol. | `isZero(0)` |  | `true` |
| **numeric** | Mengonversi input ke tipe numerik (number, BigNumber, dll.). | `numeric('123')` |  | `123` |
| **typeOf** | Mengembalikan nama tipe dari nilai input. | `typeOf([1, 2, 3])` |  | `Array` |