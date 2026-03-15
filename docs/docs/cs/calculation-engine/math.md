:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) je matematická knihovna pro JavaScript a Node.js s bohatou nabídkou funkcí.

## Referenční příručka funkcí

### Výrazy

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **compile** | Analyzuje a zkompiluje výraz (provádí pouze analýzu a nevrací přímo výsledek). | `compile('2 + 3')` | výraz (řetězec) | `{}` |
| **evaluate** | Vyhodnotí výraz a vrátí výsledek. | `evaluate('2 + 3')` | výraz (řetězec), rozsah (volitelné) | `5` |
| **help** | Získá dokumentaci k funkci nebo datovému typu. | `help('evaluate')` | vyhledávací klíčové slovo (řetězec) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Vytvoří parser pro vlastní operace. | `parser()` | Žádné | `{}` |

### Algebra

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **derivative** | Derivuje výraz podle zadané proměnné. | `derivative('x^2', 'x')` | výraz (řetězec nebo uzel), proměnná (řetězec) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Spočítá listové uzly (symboly nebo konstanty) ve stromu výrazu. | `leafCount('x^2 + y')` | výraz (řetězec nebo uzel) | `3` |
| **lsolve** | Řeší lineární systém pomocí dopředné substituce. | `lsolve([[1,2],[3,4]], [5,6])` | L (pole nebo matice), b (pole nebo matice) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Najde všechna řešení lineárního systému pomocí dopředné substituce. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (pole nebo matice), b (pole nebo matice) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Provede LU dekompozici s částečným výběrem hlavního prvku (pivoting). | `lup([[1,2],[3,4]])` | A (pole nebo matice) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Řeší lineární systém A*x = b, kde A je matice n×n. | `lusolve([[1,2],[3,4]], [5,6])` | A (pole nebo matice), b (pole nebo matice) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Vypočítá QR dekompozici matice. | `qr([[1,2],[3,4]])` | A (pole nebo matice) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Převede racionalizovatelný výraz na racionální zlomek. | `rationalize('1/(x+1)')` | výraz (řetězec nebo uzel) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Nahradí symboly ve výrazu hodnotami z poskytnutého rozsahu (scope). | `resolve('x + y', {x:2, y:3})` | výraz (řetězec nebo uzel), rozsah (objekt) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Zjednoduší strom výrazu (sloučení podobných členů atd.). | `simplify('2x + 3x')` | výraz (řetězec nebo uzel) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Provede jednoprůchodové zjednodušení, často používané v případech citlivých na výkon. | `simplifyCore('x+x')` | výraz (řetězec nebo uzel) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Vypočítá řídkou LU dekompozici s úplným výběrem hlavního prvku. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (pole nebo matice), pořadí (řetězec), práh (číslo) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Zkontroluje, zda jsou dva výrazy symbolicky shodné. | `symbolicEqual('x+x', '2x')` | výraz1 (řetězec nebo uzel), výraz2 (řetězec nebo uzel) | `true` |
| **usolve** | Řeší lineární systém pomocí zpětné substituce. | `usolve([[1,2],[0,1]], [3,4])` | U (pole nebo matice), b (pole nebo matice) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Najde všechna řešení lineárního systému pomocí zpětné substituce. | `usolveAll([[1,2],[0,1]], [3,4])` | U (pole nebo matice), b (pole nebo matice) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Aritmetika

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **abs** | Vypočítá absolutní hodnotu čísla. | `abs(-3.2)` | x (číslo, komplexní číslo, pole nebo matice) | `3.2` |
| **add** | Sečte dvě nebo více hodnot (x + y). | `add(2, 3)` | x, y, ... (číslo, pole nebo matice) | `5` |
| **cbrt** | Vypočítá třetí odmocninu čísla, volitelně vrátí všechny odmocniny. | `cbrt(8)` | x (číslo nebo komplexní číslo), allRoots (boolean, volitelné) | `2` |
| **ceil** | Zaokrouhlí směrem k kladnému nekonečnu (u komplexních čísel se každá část zaokrouhluje zvlášť). | `ceil(3.2)` | x (číslo, komplexní číslo, pole nebo matice) | `4` |
| **cube** | Vypočítá třetí mocninu hodnoty (x*x*x). | `cube(3)` | x (číslo, komplexní číslo, pole nebo matice) | `27` |
| **divide** | Vydělí dvě hodnoty (x / y). | `divide(6, 2)` | x (číslo, pole nebo matice), y (číslo, pole nebo matice) | `3` |
| **dotDivide** | Vydělí dvě matice nebo pole po prvcích. | `dotDivide([6,8],[2,4])` | x (pole nebo matice), y (pole nebo matice) | `[  3,  2]` |
| **dotMultiply** | Vynásobí dvě matice nebo pole po prvcích. | `dotMultiply([2,3],[4,5])` | x (pole nebo matice), y (pole nebo matice) | `[  8,  15]` |
| **dotPow** | Vypočítá x^y po prvcích. | `dotPow([2,3],[2,3])` | x (pole nebo matice), y (pole nebo matice) | `[  4,  27]` |
| **exp** | Vypočítá e^x. | `exp(1)` | x (číslo, komplexní číslo, pole nebo matice) | `2.718281828459045` |
| **expm1** | Vypočítá e^x - 1. | `expm1(1)` | x (číslo nebo komplexní číslo) | `1.718281828459045` |
| **fix** | Zaokrouhlí směrem k nule (oříznutí). | `fix(3.7)` | x (číslo, komplexní číslo, pole nebo matice) | `3` |
| **floor** | Zaokrouhlí směrem k zápornému nekonečnu. | `floor(3.7)` | x (číslo, komplexní číslo, pole nebo matice) | `3` |
| **gcd** | Vypočítá největšího společného dělitele dvou nebo více čísel. | `gcd(8, 12)` | a, b, ... (číslo nebo BigNumber) | `4` |
| **hypot** | Vypočítá odmocninu součtu čtverců argumentů (Pythagorova věta). | `hypot(3, 4)` | a, b, ... (číslo nebo BigNumber) | `5` |
| **invmod** | Vypočítá modulární multiplikativní inverzi a modulo b. | `invmod(3, 11)` | a, b (číslo nebo BigNumber) | `4` |
| **lcm** | Vypočítá nejmenší společný násobek dvou nebo více čísel. | `lcm(4, 6)` | a, b, ... (číslo nebo BigNumber) | `12` |
| **log** | Vypočítá logaritmus s volitelným základem. | `log(100, 10)` | x (číslo nebo komplexní číslo), základ (číslo nebo komplexní číslo, volitelné) | `2` |
| **log10** | Vypočítá dekadický logaritmus čísla. | `log10(100)` | x (číslo nebo komplexní číslo) | `2` |
| **log1p** | Vypočítá ln(1 + x). | `log1p(1)` | x (číslo nebo komplexní číslo) | `0.6931471805599453` |
| **log2** | Vypočítá binární logaritmus čísla. | `log2(8)` | x (číslo nebo komplexní číslo) | `3` |
| **mod** | Vypočítá zbytek po dělení x ÷ y (x mod y). | `mod(8,3)` | x, y (číslo nebo BigNumber) | `2` |
| **multiply** | Vynásobí dvě nebo více hodnot (x * y). | `multiply(2, 3)` | x, y, ... (číslo, pole nebo matice) | `6` |
| **norm** | Vypočítá normu čísla, vektoru nebo matice s volitelným p. | `norm([3,4])` | x (pole nebo matice), p (číslo nebo řetězec, volitelné) | `5` |
| **nthRoot** | Vypočítá n-tou odmocninu (hlavní odmocninu) čísla. | `nthRoot(16, 4)` | a (číslo, BigNumber nebo komplexní číslo), odmocnina (číslo, volitelné) | `2` |
| **nthRoots** | Vypočítá všechny n-té odmocniny čísla, potenciálně komplexní. | `nthRoots(1,3)` | x (číslo nebo komplexní číslo), odmocnina (číslo) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Umocní x na y. | `pow(2, 3)` | x (číslo, komplexní číslo, pole nebo matice), y (číslo, komplexní číslo, pole nebo matice) | `8` |
| **round** | Zaokrouhlí na zadaný počet desetinných míst. | `round(3.14159, 2)` | x (číslo, komplexní číslo, pole nebo matice), n (číslo, volitelné) | `3.14` |
| **sign** | Vrátí znaménko čísla (-1, 0 nebo 1). | `sign(-3)` | x (číslo, BigNumber nebo komplexní číslo) | `-1` |
| **sqrt** | Vypočítá druhou odmocninu čísla. | `sqrt(9)` | x (číslo, komplexní číslo, pole nebo matice) | `3` |
| **square** | Vypočítá druhou mocninu hodnoty (x*x). | `square(3)` | x (číslo, komplexní číslo, pole nebo matice) | `9` |
| **subtract** | Odečte jednu hodnotu od druhé (x - y). | `subtract(8, 3)` | x, y (číslo, pole nebo matice) | `5` |
| **unaryMinus** | Použije unární negaci na hodnotu. | `unaryMinus(3)` | x (číslo, komplexní číslo, pole nebo matice) | `-3` |
| **unaryPlus** | Použije unární plus (obvykle ponechá hodnotu beze změny). | `unaryPlus(-3)` | x (číslo, komplexní číslo, pole nebo matice) | `-3` |
| **xgcd** | Vypočítá rozšířeného největšího společného dělitele dvou čísel. | `xgcd(8, 12)` | a, b (číslo nebo BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Bitové operace

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **bitAnd** | Provede bitový AND (x & y). | `bitAnd(5, 3)` | x, y (číslo nebo BigNumber) | `1` |
| **bitNot** | Provede bitový NOT (~x). | `bitNot(5)` | x (číslo nebo BigNumber) | `-6` |
| **bitOr** | Provede bitový OR (x \| y). | `bitOr(5, 3)` | x, y (číslo nebo BigNumber) | `7` |
| **bitXor** | Provede bitový XOR (x ^ y). | `bitXor(5, 3)` | x, y (číslo nebo BigNumber) | `6` |
| **leftShift** | Bitový posun x doleva o y bitů (x << y). | `leftShift(5, 1)` | x, y (číslo nebo BigNumber) | `10` |
| **rightArithShift** | Provede aritmetický bitový posun x doprava (x >> y). | `rightArithShift(5, 1)` | x, y (číslo nebo BigNumber) | `2` |
| **rightLogShift** | Provede logický bitový posun x doprava (x >>> y). | `rightLogShift(5, 1)` | x, y (číslo nebo BigNumber) | `2` |

### Kombinatorika

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Spočítá rozklady n rozlišitelných prvků. | `bellNumbers(3)` | n (číslo) | `5` |
| **catalan** | Vypočítá n-té Catalanovo číslo pro mnoho kombinatorických struktur. | `catalan(5)` | n (číslo) | `42` |
| **composition** | Spočítá rozklady n na k částí. | `composition(5, 3)` | n, k (číslo) | `6` |
| **stirlingS2** | Vypočítá počet způsobů rozkladu n označených položek do k neprázdných podmnožin (Stirlingova čísla druhého druhu). | `stirlingS2(5, 3)` | n, k (číslo) | `25` |

### Komplexní čísla

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **arg** | Vypočítá argument (fázi) komplexního čísla. | `arg(complex('2 + 2i'))` | x (komplexní číslo nebo číslo) | `0.785398163` |
| **conj** | Vypočítá komplexně sdružené číslo. | `conj(complex('2 + 2i'))` | x (komplexní číslo nebo číslo) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Vrátí imaginární část komplexního čísla. | `im(complex('2 + 3i'))` | x (komplexní číslo nebo číslo) | `3` |
| **re** | Vrátí reálnou část komplexního čísla. | `re(complex('2 + 3i'))` | x (komplexní číslo nebo číslo) | `2` |

### Geometrie

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **distance** | Vypočítá euklidovskou vzdálenost mezi dvěma body v N-rozměrném prostoru. | `distance([0,0],[3,4])` | bod1 (pole), bod2 (pole) | `5` |
| **intersect** | Najde průsečík dvou přímek (2D/3D) nebo přímky a roviny (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | koncové body přímky 1, koncové body přímky 2, ... | `[  1,  1]` |

### Logika

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **and** | Provede logický AND. | `and(true, false)` | x, y (boolean nebo číslo) | `false` |
| **not** | Provede logický NOT. | `not(true)` | x (boolean nebo číslo) | `false` |
| **or** | Provede logický OR. | `or(true, false)` | x, y (boolean nebo číslo) | `true` |
| **xor** | Provede logický XOR. | `xor(1, 0)` | x, y (boolean nebo číslo) | `true` |

### Matice

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **column** | Vrátí zadaný sloupec z matice. | `column([[1,2],[3,4]], 1)` | hodnota (matice nebo pole), index (číslo) | `[  [    1  ],  [    3  ]]` |
| **concat** | Spojí více matic/polí podél dimenze. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (pole nebo matice), dim (číslo, volitelné) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Spočítá počet prvků v matici, poli nebo řetězci. | `count([1,2,3,'hello'])` | x (pole, matice nebo řetězec) | `4` |
| **cross** | Vypočítá vektorový součin dvou 3D vektorů. | `cross([1,2,3], [4,5,6])` | x, y (pole nebo matice o délce 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Vypočítá hermitovsky sdruženou matici (transponovanou a komplexně sdruženou). | `ctranspose([[1,2],[3,4]])` | x (matice nebo pole) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Vypočítá determinant matice. | `det([[1,2],[3,4]])` | x (matice nebo pole) | `-2` |
| **diag** | Vytvoří diagonální matici nebo extrahuje diagonálu matice. | `diag([1,2,3])` | X (pole nebo matice) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Vypočítá rozdíl mezi sousedními prvky podél dimenze. | `diff([1,4,9,16])` | arr (pole nebo matice), dim (číslo, volitelné) | `[  3,  5,  7]` |
| **dot** | Vypočítá skalární součin dvou vektorů. | `dot([1,2,3],[4,5,6])` | x, y (pole nebo matice) | `32` |
| **eigs** | Vypočítá vlastní čísla a volitelně vlastní vektory čtvercové matice. | `eigs([[1,2],[3,4]])` | x (matice nebo pole), codec (číslo, volitelné) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Vypočítá maticovou exponenciálu e^A. | `expm([[1,0],[0,1]])` | x (matice nebo pole) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Vypočítá N-rozměrnou rychlou Fourierovu transformaci. | `fft([1,2,3,4])` | arr (pole nebo matice) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Zatím nepodporováno) Filtruje pole nebo 1D matici pomocí testovací funkce. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (pole nebo matice), test (funkce) | `[  "23",  "100",  "55"]` |
| **flatten** | Zploští vícerozměrnou matici nebo pole do 1D. | `flatten([[1,2],[3,4]])` | x (pole nebo matice) | `[  1,  2,  3,  4]` |
| **forEach** | (Zatím nepodporováno) Prochází každý prvek matice/pole a vyvolá callback. | `forEach([1,2,3], val => console.log(val))` | x (pole nebo matice), callback (funkce) | `undefined` |
| **getMatrixDataType** | Zjistí datový typ všech prvků v matici nebo poli (např. 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (pole nebo matice) | `mixed` |
| **identity** | Vytvoří jednotkovou matici n x n (nebo m x n). | `identity(3)` | n (číslo) nebo [m, n] (pole) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Vypočítá N-rozměrnou inverzní FFT. | `ifft([1,2,3,4])` | arr (pole nebo matice) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Vypočítá inverzní matici ke čtvercové matici. | `inv([[1,2],[3,4]])` | x (matice nebo pole) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Vypočítá Kroneckerův součin dvou matic nebo vektorů. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (matice nebo pole) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Vytvoří nové pole/matici aplikací callbacku na každý prvek. | `map([1,2,3], val => val * val)` | x (pole nebo matice), callback (funkce) | `[  1,  4,  9]` |
| **matrixFromColumns** | Kombinuje vektory jako samostatné sloupce husté matice. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (pole nebo matice) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Zatím nepodporováno) Sestaví matici vyhodnocením funkce pro každý index. | `matrixFromFunction([5], i => math.random())` | velikost (pole), fn (funkce) | `náhodný vektor` |
| **matrixFromRows** | Kombinuje vektory jako samostatné řádky husté matice. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (pole nebo matice) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Vytvoří matici samých jedniček pro dané rozměry. | `ones(2, 3)` | m, n, p... (číslo) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Vrátí k-tý nejmenší prvek pomocí algoritmu partition selection. | `partitionSelect([3,1,4,2], 2)` | x (pole nebo matice), k (číslo) | `3` |
| **pinv** | Vypočítá Mooreovu–Penroseovu pseudoinverzi matice. | `pinv([[1,2],[2,4]])` | x (matice nebo pole) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Vytvoří pole čísel od start do end (volitelný krok). | `range(1, 5, 2)` | start (číslo), end (číslo), krok (číslo, volitelné) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Změní tvar pole/matice na dané rozměry. | `reshape([1,2,3,4,5,6], [2,3])` | x (pole nebo matice), velikosti (pole) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Změní velikost matice na nové rozměry, chybějící místa vyplní výchozí hodnotou, pokud je zadána. | `resize([1,2,3], [5], 0)` | x (pole nebo matice), velikost (pole), defaultValue (volitelné) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Otočí 1x2 vektor proti směru hodinových ručiček nebo otočí 1x3 vektor kolem osy. | `rotate([1, 0], Math.PI / 2)` | w (pole nebo matice), theta (číslo[, osa]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Vytvoří 2x2 matici rotace pro daný úhel v radiánech. | `rotationMatrix(Math.PI / 2)` | theta (číslo) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Vrátí zadaný řádek z matice. | `row([[1,2],[3,4]], 1)` | hodnota (matice nebo pole), index (číslo) | `[  [    3,    4  ]]` |
| **size** | Vypočítá velikost (rozměry) matice, pole nebo skaláru. | `size([[1,2,3],[4,5,6]])` | x (pole, matice nebo číslo) | `[  2,  3]` |
| **sort** | Seřadí matici nebo pole vzestupně. | `sort([3,1,2])` | x (pole nebo matice) | `[  1,  2,  3]` |
| **sqrtm** | Vypočítá hlavní druhou odmocninu čtvercové matice. | `sqrtm([[4,0],[0,4]])` | A (matice nebo pole) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Odstraní jednotkové dimenze zevnitř nebo zvenčí matice. | `squeeze([[[1],[2],[3]]])` | x (matice nebo pole) | `[  1,  2,  3]` |
| **subset** | Získá nebo nahradí podmnožinu matice nebo řetězce. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (matice, pole nebo řetězec), index (Index), náhrada (volitelné) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Vypočítá stopu (součet prvků na hlavní diagonále) čtvercové matice. | `trace([[1,2],[3,4]])` | x (matice nebo pole) | `5` |
| **transpose** | Transponuje matici. | `transpose([[1,2],[3,4]])` | x (matice nebo pole) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Vytvoří matici samých nul pro dané rozměry. | `zeros(2, 3)` | m, n, p... (číslo) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Pravděpodobnost

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **combinations** | Spočítá kombinace při výběru k neuspořádaných prvků z n. | `combinations(5, 2)` | n (číslo), k (číslo) | `10` |
| **combinationsWithRep** | Spočítá kombinace s opakováním. | `combinationsWithRep(5, 2)` | n (číslo), k (číslo) | `15` |
| **factorial** | Vypočítá n! pro celé číslo n. | `factorial(5)` | n (celé číslo) | `120` |
| **gamma** | Aproximuje funkci gama. | `gamma(5)` | n (číslo) | `24` |
| **kldivergence** | Vypočítá KL divergenci mezi dvěma rozděleními. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (pole nebo matice), y (pole nebo matice) | `0.036690014034750584` |
| **lgamma** | Vypočítá logaritmus funkce gama. | `lgamma(5)` | n (číslo) | `3.178053830347945` |
| **multinomial** | Vypočítá multinomický koeficient ze sady počtů. | `multinomial([1, 2, 3])` | a (pole) | `60` |
| **permutations** | Spočítá uspořádané permutace při výběru k prvků z n. | `permutations(5, 2)` | n (číslo), k (číslo, volitelné) | `20` |
| **pickRandom** | Vybere jednu nebo více náhodných hodnot z 1D pole. | `pickRandom([10, 20, 30])` | pole | `20` |
| **random** | Vrátí rovnoměrně rozdělené náhodné číslo. | `random(1, 10)` | min (volitelné), max (volitelné) | `3.6099423753668143` |
| **randomInt** | Vrátí rovnoměrně rozdělené náhodné celé číslo. | `randomInt(1, 10)` | min (volitelné), max (volitelné) | `5` |

### Racionální čísla a porovnávání

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **compare** | Porovná dvě hodnoty, vrací -1, 0 nebo 1. | `compare(2, 3)` | x, y (libovolný typ) | `-1` |
| **compareNatural** | Porovná libovolné hodnoty v přirozeném, opakovatelném pořadí. | `compareNatural('2', '10')` | x, y (libovolný typ) | `-1` |
| **compareText** | Porovná dva řetězce lexikograficky. | `compareText('apple', 'banana')` | x (řetězec), y (řetězec) | `-1` |
| **deepEqual** | Porovná dvě matice/pole po prvcích na rovnost. | `deepEqual([[1, 2]], [[1, 2]])` | x (pole/matice), y (pole/matice) | `true` |
| **equal** | Testuje, zda jsou dvě hodnoty stejné. | `equal(2, 2)` | x, y (libovolný typ) | `true` |
| **equalText** | Testuje, zda jsou dva řetězce identické. | `equalText('hello', 'hello')` | x (řetězec), y (řetězec) | `true` |
| **larger** | Zkontroluje, zda je x větší než y. | `larger(3, 2)` | x, y (číslo nebo BigNumber) | `true` |
| **largerEq** | Zkontroluje, zda je x větší nebo rovno y. | `largerEq(3, 3)` | x, y (číslo nebo BigNumber) | `true` |
| **smaller** | Zkontroluje, zda je x menší než y. | `smaller(2, 3)` | x, y (číslo nebo BigNumber) | `true` |
| **smallerEq** | Zkontroluje, zda je x menší nebo rovno y. | `smallerEq(2, 2)` | x, y (číslo nebo BigNumber) | `true` |
| **unequal** | Zkontroluje, zda si dvě hodnoty nejsou rovny. | `unequal(2, 3)` | x, y (libovolný typ) | `true` |

### Množiny

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **setCartesian** | Vytvoří kartézský součin dvou (nebo více) množin. | `setCartesian([1, 2], [3, 4])` | set1 (pole), set2 (pole) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Vrátí rozdíl dvou množin (prvky v set1, které nejsou v set2). | `setDifference([1, 2, 3], [2])` | set1 (pole), set2 (pole) | `[  1,  3]` |
| **setDistinct** | Vrátí unikátní prvky uvnitř (multi)množiny. | `setDistinct([1, 2, 2, 3])` | set (pole) | `[  1,  2,  3]` |
| **setIntersect** | Vrátí průnik dvou (nebo více) množin. | `setIntersect([1, 2], [2, 3])` | set1 (pole), set2 (pole) | `[  2]` |
| **setIsSubset** | Zkontroluje, zda je set1 podmnožinou set2. | `setIsSubset([1, 2], [1, 2, 3])` | set1 (pole), set2 (pole) | `true` |
| **setMultiplicity** | Spočítá, kolikrát se prvek vyskytuje v multimnožině. | `setMultiplicity(2, [1, 2, 2, 3])` | prvek (libovolný typ), set (pole) | `2` |
| **setPowerset** | Vrátí potenční množinu (všechny podmnožiny) (multi)množiny. | `setPowerset([1, 2])` | set (pole) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Spočítá všechny prvky v (multi)množině. | `setSize([1, 2, 3])` | set (pole) | `3` |
| **setSymDifference** | Vrátí symetrický rozdíl dvou (nebo více) množin. | `setSymDifference([1, 2], [2, 3])` | set1 (pole), set2 (pole) | `[  1,  3]` |
| **setUnion** | Vrátí sjednocení dvou (nebo více) množin. | `setUnion([1, 2], [2, 3])` | set1 (pole), set2 (pole) | `[  1,  3,  2]` |

### Speciální

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **erf** | Vypočítá chybovou funkci pomocí racionální Čebyševovy aproximace. | `erf(0.5)` | vstup x (číslo) | `0.5204998778130465` |

### Statistika

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **cumsum** | Vypočítá kumulativní součet seznamu nebo matice. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Vypočítá mediánovou absolutní odchylku. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Vrátí maximální hodnotu seznamu nebo matice. | `max([1, 2, 3])` |  | `3` |
| **mean** | Vypočítá střední hodnotu (průměr). | `mean([2, 4, 6])` |  | `4` |
| **median** | Vypočítá medián. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Vrátí minimální hodnotu seznamu nebo matice. | `min([1, 2, 3])` |  | `1` |
| **mode** | Vypočítá modus (nejčastější hodnotu). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Vypočítá součin všech čísel v seznamu nebo matici. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Vypočítá kvantil v pravděpodobnosti `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Vypočítá směrodatnou odchylku dat. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Vypočítá součet všech čísel v seznamu nebo matici. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Vypočítá rozptyl dat. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Řetězce

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **bin** | Formátuje číslo jako binární. | `bin(13)` |  | `13` |
| **format** | Formátuje libovolnou hodnotu jako řetězec se zadanou přesností. | `format(123.456, 2)` |  | `120` |
| **hex** | Formátuje číslo jako hexadecimální. | `hex(255)` |  | `255` |
| **oct** | Formátuje číslo jako oktalové. | `oct(64)` |  | `64` |
| **print** | Vloží více hodnot do šablony řetězce. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometrie

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **acos** | Vypočítá arkus kosinus. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Vypočítá inverzní hyperbolický kosinus. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Vypočítá arkus kotangens. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Vypočítá inverzní hyperbolický kotangens. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Vypočítá arkus kosekans. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Vypočítá inverzní hyperbolický kosekans. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Vypočítá arkus sekans. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Vypočítá inverzní hyperbolický sekans. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Vypočítá arkus sinus. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Vypočítá inverzní hyperbolický sinus. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Vypočítá arkus tangens. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Vypočítá arkus tangens se dvěma argumenty. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Vypočítá inverzní hyperbolický tangens. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Vypočítá kosinus x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Vypočítá hyperbolický kosinus x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Vypočítá kotangens x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Vypočítá hyperbolický kotangens x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Vypočítá kosekans x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Vypočítá hyperbolický kosekans x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Vypočítá sekans x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Vypočítá hyperbolický sekans x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Vypočítá sinus x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Vypočítá hyperbolický sinus x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Vypočítá tangens x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Vypočítá hyperbolický tangens x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Jednotky

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **to** | Převede číselnou hodnotu na zadanou jednotku. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Nástroje

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| --- | --- | --- | --- | --- |
| **clone** | Vytvoří hlubokou kopii vstupní hodnoty. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Zkontroluje, zda vstup obsahuje číselnou hodnotu. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Zkontroluje, zda je vstup celé číslo. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Zkontroluje, zda je vstup NaN. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Zkontroluje, zda je vstup záporný. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Zkontroluje, zda je vstup číselný. | `isNumeric('123')` |  | `false` |
| **isPositive** | Zkontroluje, zda je vstup kladný. | `isPositive(2)` |  | `true` |
| **isPrime** | Zkontroluje, zda je vstup prvočíslo. | `isPrime(7)` |  | `true` |
| **isZero** | Zkontroluje, zda je vstup nula. | `isZero(0)` |  | `true` |
| **numeric** | Převede vstup na číselný typ (číslo, BigNumber atd.). | `numeric('123')` |  | `123` |
| **typeOf** | Vrátí název typu vstupní hodnoty. | `typeOf([1, 2, 3])` |  | `Array` |