:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) är ett funktionsrikt matematikbibliotek för JavaScript och Node.js.

## Funktionsreferens

### Uttryck

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **compile** | Analysera och kompilera ett uttryck (ansvarar för analys, returnerar inte resultatet direkt). | `compile('2 + 3')` | uttryck (sträng) | `{}` |
| **evaluate** | Beräkna ett uttryck och returnera resultatet. | `evaluate('2 + 3')` | uttryck (sträng), omfång (valfritt) | `5` |
| **help** | Hämta dokumentation för en funktion eller datatyp. | `help('evaluate')` | sökord (sträng) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Skapa en parser för anpassade operationer. | `parser()` | Inga | `{}` |

### Algebra

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **derivative** | Derivera ett uttryck med avseende på en angiven variabel. | `derivative('x^2', 'x')` | uttryck (sträng eller nod), variabel (sträng) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Räkna antalet lövnoder (symboler eller konstanter) i ett uttrycksträd. | `leafCount('x^2 + y')` | uttryck (sträng eller nod) | `3` |
| **lsolve** | Lösa ett linjärt ekvationssystem med framåtsubstitution. | `lsolve([[1,2],[3,4]], [5,6])` | L (array eller matris), b (array eller matris) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Hitta alla lösningar till ett linjärt ekvationssystem med framåtsubstitution. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (array eller matris), b (array eller matris) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Utföra en LU-faktorisering med partiell pivotering. | `lup([[1,2],[3,4]])` | A (array eller matris) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Lösa ett linjärt ekvationssystem A*x = b där A är en n×n-matris. | `lusolve([[1,2],[3,4]], [5,6])` | A (array eller matris), b (array eller matris) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Beräkna QR-faktoriseringen av en matris. | `qr([[1,2],[3,4]])` | A (array eller matris) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Omvandla ett rationaliserbart uttryck till ett rationellt bråk. | `rationalize('1/(x+1)')` | uttryck (sträng eller nod) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Ersätt symboler i ett uttryck med värden från det angivna omfånget. | `resolve('x + y', {x:2, y:3})` | uttryck (sträng eller nod), omfång (objekt) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Förenkla ett uttrycksträd (slå ihop liknande termer etc.). | `simplify('2x + 3x')` | uttryck (sträng eller nod) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Utföra en förenkling i ett enda steg (one-pass), används ofta i prestandakänsliga scenarier. | `simplifyCore('x+x')` | uttryck (sträng eller nod) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Beräkna en gles LU-faktorisering med fullständig pivotering. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (array eller matris), ordning (sträng), tröskelvärde (tal) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Kontrollera om två uttryck är symboliskt lika. | `symbolicEqual('x+x', '2x')` | uttryck1 (sträng eller nod), uttryck2 (sträng eller nod) | `true` |
| **usolve** | Lösa ett linjärt ekvationssystem med bakåtsubstitution. | `usolve([[1,2],[0,1]], [3,4])` | U (array eller matris), b (array eller matris) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Hitta alla lösningar till ett linjärt ekvationssystem med bakåtsubstitution. | `usolveAll([[1,2],[0,1]], [3,4])` | U (array eller matris), b (array eller matris) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Aritmetik

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **abs** | Beräkna det absoluta värdet av ett tal. | `abs(-3.2)` | x (tal, komplext tal, array eller matris) | `3.2` |
| **add** | Addera två eller flera värden (x + y). | `add(2, 3)` | x, y, ... (tal, array eller matris) | `5` |
| **cbrt** | Beräkna kubikroten ur ett tal, med möjlighet att returnera alla kubikrötter. | `cbrt(8)` | x (tal eller komplext tal), allRoots (boolesk, valfritt) | `2` |
| **ceil** | Avrunda mot positiv oändlighet (för komplexa tal avrundas varje del separat). | `ceil(3.2)` | x (tal, komplext tal, array eller matris) | `4` |
| **cube** | Beräkna kubiken av ett värde (x*x*x). | `cube(3)` | x (tal, komplext tal, array eller matris) | `27` |
| **divide** | Dividera två värden (x / y). | `divide(6, 2)` | x (tal, array eller matris), y (tal, array eller matris) | `3` |
| **dotDivide** | Dividera två matriser eller arrayer elementvis. | `dotDivide([6,8],[2,4])` | x (array eller matris), y (array eller matris) | `[  3,  2]` |
| **dotMultiply** | Multiplicera två matriser eller arrayer elementvis. | `dotMultiply([2,3],[4,5])` | x (array eller matris), y (array eller matris) | `[  8,  15]` |
| **dotPow** | Beräkna x^y elementvis. | `dotPow([2,3],[2,3])` | x (array eller matris), y (array eller matris) | `[  4,  27]` |
| **exp** | Beräkna e^x. | `exp(1)` | x (tal, komplext tal, array eller matris) | `2.718281828459045` |
| **expm1** | Beräkna e^x - 1. | `expm1(1)` | x (tal eller komplext tal) | `1.718281828459045` |
| **fix** | Avrunda mot noll (trunkera). | `fix(3.7)` | x (tal, komplext tal, array eller matris) | `3` |
| **floor** | Avrunda mot negativ oändlighet. | `floor(3.7)` | x (tal, komplext tal, array eller matris) | `3` |
| **gcd** | Beräkna den största gemensamma delaren för två eller flera tal. | `gcd(8, 12)` | a, b, ... (tal eller BigNumber) | `4` |
| **hypot** | Beräkna kvadratroten ur summan av kvadraterna av argumenten (Pythagoras). | `hypot(3, 4)` | a, b, ... (tal eller BigNumber) | `5` |
| **invmod** | Beräkna den modulära multiplikativa inversen av a modulo b. | `invmod(3, 11)` | a, b (tal eller BigNumber) | `4` |
| **lcm** | Beräkna den minsta gemensamma multipeln för två eller flera tal. | `lcm(4, 6)` | a, b, ... (tal eller BigNumber) | `12` |
| **log** | Beräkna logaritmen med en valfri bas. | `log(100, 10)` | x (tal eller komplext tal), bas (tal eller komplext tal, valfritt) | `2` |
| **log10** | Beräkna 10-logaritmen av ett tal. | `log10(100)` | x (tal eller komplext tal) | `2` |
| **log1p** | Beräkna ln(1 + x). | `log1p(1)` | x (tal eller komplext tal) | `0.6931471805599453` |
| **log2** | Beräkna 2-logaritmen av ett tal. | `log2(8)` | x (tal eller komplext tal) | `3` |
| **mod** | Beräkna resten av x ÷ y (x mod y). | `mod(8,3)` | x, y (tal eller BigNumber) | `2` |
| **multiply** | Multiplicera två eller flera värden (x * y). | `multiply(2, 3)` | x, y, ... (tal, array eller matris) | `6` |
| **norm** | Beräkna normen för ett tal, en vektor eller en matris med valfritt p. | `norm([3,4])` | x (array eller matris), p (tal eller sträng, valfritt) | `5` |
| **nthRoot** | Beräkna n-te roten (principalroten) ur ett tal. | `nthRoot(16, 4)` | a (tal, BigNumber eller komplext tal), rot (tal, valfritt) | `2` |
| **nthRoots** | Beräkna alla n-te rötter ur ett tal, kan inkludera komplexa lösningar. | `nthRoots(1,3)` | x (tal eller komplext tal), rot (tal) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Upphöj x till y (x^y). | `pow(2, 3)` | x (tal, komplext tal, array eller matris), y (tal, komplext tal, array eller matris) | `8` |
| **round** | Avrunda till ett angivet antal decimaler. | `round(3.14159, 2)` | x (tal, komplext tal, array eller matris), n (tal, valfritt) | `3.14` |
| **sign** | Returnera tecknet för ett tal (-1, 0 eller 1). | `sign(-3)` | x (tal, BigNumber eller komplext tal) | `-1` |
| **sqrt** | Beräkna kvadratroten ur ett tal. | `sqrt(9)` | x (tal, komplext tal, array eller matris) | `3` |
| **square** | Beräkna kvadraten av ett värde (x*x). | `square(3)` | x (tal, komplext tal, array eller matris) | `9` |
| **subtract** | Subtrahera ett värde från ett annat (x - y). | `subtract(8, 3)` | x, y (tal, array eller matris) | `5` |
| **unaryMinus** | Utföra unär negation på ett värde (teckenväxling). | `unaryMinus(3)` | x (tal, komplext tal, array eller matris) | `-3` |
| **unaryPlus** | Utföra unärt plus (lämnar vanligtvis värdet oförändrat). | `unaryPlus(-3)` | x (tal, komplext tal, array eller matris) | `-3` |
| **xgcd** | Beräkna den utökade största gemensamma delaren för två tal. | `xgcd(8, 12)` | a, b (tal eller BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Bitvisa operationer

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **bitAnd** | Utföra bitvis OCH (x & y). | `bitAnd(5, 3)` | x, y (tal eller BigNumber) | `1` |
| **bitNot** | Utföra bitvis ICKE (~x). | `bitNot(5)` | x (tal eller BigNumber) | `-6` |
| **bitOr** | Utföra bitvis ELLER (x \| y). | `bitOr(5, 3)` | x, y (tal eller BigNumber) | `7` |
| **bitXor** | Utföra bitvis XOR (x ^ y). | `bitXor(5, 3)` | x, y (tal eller BigNumber) | `6` |
| **leftShift** | Vänsterskifta x med y bitar (x << y). | `leftShift(5, 1)` | x, y (tal eller BigNumber) | `10` |
| **rightArithShift** | Utföra ett aritmetiskt högerskift på x (x >> y). | `rightArithShift(5, 1)` | x, y (tal eller BigNumber) | `2` |
| **rightLogShift** | Utföra ett logiskt högerskift på x (x >>> y). | `rightLogShift(5, 1)` | x, y (tal eller BigNumber) | `2` |

### Kombinatorik

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Beräkna antalet partitioner av n distinkta element. | `bellNumbers(3)` | n (tal) | `5` |
| **catalan** | Beräkna det n-te Catalantalet för olika kombinatoriska strukturer. | `catalan(5)` | n (tal) | `42` |
| **composition** | Beräkna antalet kompositioner av n i k delar. | `composition(5, 3)` | n, k (tal) | `6` |
| **stirlingS2** | Beräkna antalet sätt att partitionera n märkta objekt i k icke-tomma delmängder (Stirlingtal av andra slaget). | `stirlingS2(5, 3)` | n, k (tal) | `25` |

### Komplexa tal

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **arg** | Beräkna argumentet (fasen) för ett komplext tal. | `arg(complex('2 + 2i'))` | x (komplext tal eller tal) | `0.785398163` |
| **conj** | Beräkna det komplexkonjugerade värdet. | `conj(complex('2 + 2i'))` | x (komplext tal eller tal) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Returnera imaginärdelen av ett komplext tal. | `im(complex('2 + 3i'))` | x (komplext tal eller tal) | `3` |
| **re** | Returnera realdelen av ett komplext tal. | `re(complex('2 + 3i'))` | x (komplext tal eller tal) | `2` |

### Geometri

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **distance** | Beräkna det euklidiska avståndet mellan två punkter i en N-dimensionell rymd. | `distance([0,0],[3,4])` | punkt1 (array), punkt2 (array) | `5` |
| **intersect** | Hitta skärningspunkten mellan två linjer (2D/3D) eller en linje och ett plan (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | slutpunkter för linje 1, slutpunkter för linje 2, ... | `[  1,  1]` |

### Logik

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **and** | Utföra en logisk OCH-operation. | `and(true, false)` | x, y (boolesk eller tal) | `false` |
| **not** | Utföra en logisk ICKE-operation. | `not(true)` | x (boolesk eller tal) | `false` |
| **or** | Utföra en logisk ELLER-operation. | `or(true, false)` | x, y (boolesk eller tal) | `true` |
| **xor** | Utföra en logisk XOR-operation. | `xor(1, 0)` | x, y (boolesk eller tal) | `true` |

### Matriser

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **column** | Returnera den angivna kolumnen från en matris. | `column([[1,2],[3,4]], 1)` | värde (matris eller array), index (tal) | `[  [    1  ],  [    3  ]]` |
| **concat** | Sammanfoga flera matriser/arrayer längs en dimension. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (array eller matris), dim (tal, valfritt) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Räkna antalet element i en matris, array eller sträng. | `count([1,2,3,'hello'])` | x (array, matris eller sträng) | `4` |
| **cross** | Beräkna kryssprodukten av två 3D-vektorer. | `cross([1,2,3], [4,5,6])` | x, y (array eller matris med längd 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Beräkna det konjugerade transponatet av en matris. | `ctranspose([[1,2],[3,4]])` | x (matris eller array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Beräkna determinanten för en matris. | `det([[1,2],[3,4]])` | x (matris eller array) | `-2` |
| **diag** | Skapa en diagonalmatris eller extrahera diagonalen från en matris. | `diag([1,2,3])` | X (array eller matris) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Beräkna skillnaden mellan intilliggande element längs en dimension. | `diff([1,4,9,16])` | arr (array eller matris), dim (tal, valfritt) | `[  3,  5,  7]` |
| **dot** | Beräkna skalärprodukten av två vektorer. | `dot([1,2,3],[4,5,6])` | x, y (array eller matris) | `32` |
| **eigs** | Beräkna egenvärden och (valfritt) egenvektorer för en kvadratisk matris. | `eigs([[1,2],[3,4]])` | x (matris eller array), codec (tal, valfritt) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Beräkna matrisexponentialen e^A. | `expm([[1,0],[0,1]])` | x (matris eller array) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Beräkna den N-dimensionella snabba fouriertransformen (FFT). | `fft([1,2,3,4])` | arr (array eller matris) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Stöds inte ännu) Filtrera en array eller 1D-matris med en testfunktion. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (array eller matris), test (funktion) | `[  "23",  "100",  "55"]` |
| **flatten** | Platta ut en flerdimensionell matris eller array till 1D. | `flatten([[1,2],[3,4]])` | x (array eller matris) | `[  1,  2,  3,  4]` |
| **forEach** | (Stöds inte ännu) Iterera över varje element i en matris/array och anropa en callback. | `forEach([1,2,3], val => console.log(val))` | x (array eller matris), callback (funktion) | `undefined` |
| **getMatrixDataType** | Inspektera datatypen för alla element i en matris eller array (t.ex. 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (array eller matris) | `mixed` |
| **identity** | Skapa en n x n (eller m x n) enhetsmatris. | `identity(3)` | n (tal) eller [m, n] (array) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Beräkna den N-dimensionella inversa snabba fouriertransformen (IFFT). | `ifft([1,2,3,4])` | arr (array eller matris) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Beräkna inversen av en kvadratisk matris. | `inv([[1,2],[3,4]])` | x (matris eller array) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Beräkna Kronecker-produkten av två matriser eller vektorer. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (matris eller array) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Skapa en ny array/matris genom att tillämpa en callback på varje element. | `map([1,2,3], val => val * val)` | x (array eller matris), callback (funktion) | `[  1,  4,  9]` |
| **matrixFromColumns** | Kombinera vektorer som separata kolumner i en tät matris. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (array eller matris) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Stöds inte ännu) Bygg en matris genom att utvärdera en funktion för varje index. | `matrixFromFunction([5], i => math.random())` | storlek (array), fn (funktion) | `en slumpmässig vektor` |
| **matrixFromRows** | Kombinera vektorer som separata rader i en tät matris. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (array eller matris) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Skapa en matris med bara ettor för de givna dimensionerna. | `ones(2, 3)` | m, n, p... (tal) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Returnera det k-te minsta elementet med hjälp av partitionsval. | `partitionSelect([3,1,4,2], 2)` | x (array eller matris), k (tal) | `3` |
| **pinv** | Beräkna Moore–Penrose-pseudoinversen av en matris. | `pinv([[1,2],[2,4]])` | x (matris eller array) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Skapa en array med tal från start till slut (valfritt steg). | `range(1, 5, 2)` | start (tal), slut (tal), steg (tal, valfritt) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Omforma en array/matris till givna dimensioner. | `reshape([1,2,3,4,5,6], [2,3])` | x (array eller matris), storlekar (array) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Ändra storlek på en matris till nya dimensioner, fyll med ett standardvärde om det anges. | `resize([1,2,3], [5], 0)` | x (array eller matris), storlek (array), defaultValue (valfritt) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Rotera en 1x2-vektor moturs eller rotera en 1x3-vektor runt en axel. | `rotate([1, 0], Math.PI / 2)` | w (array eller matris), theta (tal[, axel]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Skapa en 2x2-rotationsmatris för en given vinkel i radianer. | `rotationMatrix(Math.PI / 2)` | theta (tal) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Returnera den angivna raden från en matris. | `row([[1,2],[3,4]], 1)` | värde (matris eller array), index (tal) | `[  [    3,    4  ]]` |
| **size** | Beräkna storleken (dimensionerna) för en matris, array eller skalär. | `size([[1,2,3],[4,5,6]])` | x (array, matris eller tal) | `[  2,  3]` |
| **sort** | Sortera en matris eller array i stigande ordning. | `sort([3,1,2])` | x (array eller matris) | `[  1,  2,  3]` |
| **sqrtm** | Beräkna kvadratroten ur en kvadratisk matris (principalroten). | `sqrtm([[4,0],[0,4]])` | A (matris eller array) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Ta bort dimensioner av storlek 1 inuti eller utanför en matris. | `squeeze([[[1],[2],[3]]])` | x (matris eller array) | `[  1,  2,  3]` |
| **subset** | Hämta eller ersätt en delmängd av en matris eller sträng. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (matris, array eller sträng), index (Index), ersättning (valfritt) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Beräkna spåret (summan av diagonalelementen) för en kvadratisk matris. | `trace([[1,2],[3,4]])` | x (matris eller array) | `5` |
| **transpose** | Transponera en matris. | `transpose([[1,2],[3,4]])` | x (matris eller array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Skapa en nollmatris för de givna dimensionerna. | `zeros(2, 3)` | m, n, p... (tal) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Sannolikhet

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **combinations** | Beräkna antalet kombinationer när man väljer k oordnade objekt från n. | `combinations(5, 2)` | n (tal), k (tal) | `10` |
| **combinationsWithRep** | Beräkna antalet kombinationer när val kan upprepas. | `combinationsWithRep(5, 2)` | n (tal), k (tal) | `15` |
| **factorial** | Beräkna n! för ett heltal n. | `factorial(5)` | n (heltal) | `120` |
| **gamma** | Approximera gammafunktionen. | `gamma(5)` | n (tal) | `24` |
| **kldivergence** | Beräkna KL-divergensen mellan två distributioner. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (array eller matris), y (array eller matris) | `0.036690014034750584` |
| **lgamma** | Beräkna logaritmen av gammafunktionen. | `lgamma(5)` | n (tal) | `3.178053830347945` |
| **multinomial** | Beräkna en multinomialkoefficient från en uppsättning antal. | `multinomial([1, 2, 3])` | a (array) | `60` |
| **permutations** | Beräkna antalet ordnade permutationer när man väljer k objekt från n. | `permutations(5, 2)` | n (tal), k (tal, valfritt) | `20` |
| **pickRandom** | Välj ett eller flera slumpmässiga värden från en 1D-array. | `pickRandom([10, 20, 30])` | array | `20` |
| **random** | Returnera ett likformigt fördelat slumptal. | `random(1, 10)` | min (valfritt), max (valfritt) | `3.6099423753668143` |
| **randomInt** | Returnera ett likformigt fördelat slumpmässigt heltal. | `randomInt(1, 10)` | min (valfritt), max (valfritt) | `5` |

### Rationella tal

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **compare** | Jämför två värden, returnerar -1, 0 eller 1. | `compare(2, 3)` | x, y (valfri typ) | `-1` |
| **compareNatural** | Jämför godtyckliga värden i naturlig, repeterbar ordning. | `compareNatural('2', '10')` | x, y (valfri typ) | `-1` |
| **compareText** | Jämför två strängar lexikografiskt. | `compareText('apple', 'banana')` | x (sträng), y (sträng) | `-1` |
| **deepEqual** | Jämför två matriser/arrayer elementvis för likhet. | `deepEqual([[1, 2]], [[1, 2]])` | x (array/matris), y (array/matris) | `true` |
| **equal** | Kontrollera om två värden är lika. | `equal(2, 2)` | x, y (valfri typ) | `true` |
| **equalText** | Kontrollera om två strängar är identiska. | `equalText('hello', 'hello')` | x (sträng), y (sträng) | `true` |
| **larger** | Kontrollera om x är större än y. | `larger(3, 2)` | x, y (tal eller BigNumber) | `true` |
| **largerEq** | Kontrollera om x är större än eller lika med y. | `largerEq(3, 3)` | x, y (tal eller BigNumber) | `true` |
| **smaller** | Kontrollera om x är mindre än y. | `smaller(2, 3)` | x, y (tal eller BigNumber) | `true` |
| **smallerEq** | Kontrollera om x är mindre än eller lika med y. | `smallerEq(2, 2)` | x, y (tal eller BigNumber) | `true` |
| **unequal** | Kontrollera om två värden inte är lika. | `unequal(2, 3)` | x, y (valfri typ) | `true` |

### Mängder

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **setCartesian** | Skapa den kartesiska produkten av två (eller flera) mängder. | `setCartesian([1, 2], [3, 4])` | set1 (array), set2 (array) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Returnera differensen mellan två mängder (element i set1 men inte i set2). | `setDifference([1, 2, 3], [2])` | set1 (array), set2 (array) | `[  1,  3]` |
| **setDistinct** | Returnera de unika elementen i en (multi)mängd. | `setDistinct([1, 2, 2, 3])` | set (array) | `[  1,  2,  3]` |
| **setIntersect** | Returnera snittet av två (eller flera) mängder. | `setIntersect([1, 2], [2, 3])` | set1 (array), set2 (array) | `[  2]` |
| **setIsSubset** | Kontrollera om set1 är en delmängd av set2. | `setIsSubset([1, 2], [1, 2, 3])` | set1 (array), set2 (array) | `true` |
| **setMultiplicity** | Räkna hur många gånger ett element förekommer i en multimängd. | `setMultiplicity(2, [1, 2, 2, 3])` | element (valfri typ), set (array) | `2` |
| **setPowerset** | Returnera potensmängden (alla delmängder) av en (multi)mängd. | `setPowerset([1, 2])` | set (array) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Räkna alla element i en (multi)mängd. | `setSize([1, 2, 3])` | set (array) | `3` |
| **setSymDifference** | Returnera den symmetriska differensen av två (eller flera) mängder. | `setSymDifference([1, 2], [2, 3])` | set1 (array), set2 (array) | `[  1,  3]` |
| **setUnion** | Returnera unionen av två (eller flera) mängder. | `setUnion([1, 2], [2, 3])` | set1 (array), set2 (array) | `[  1,  3,  2]` |

### Special

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **erf** | Beräkna felfunktionen med hjälp av en rationell Chebyshev-approximation. | `erf(0.5)` | indata x (tal) | `0.5204998778130465` |

### Statistik

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **cumsum** | Beräkna den kumulativa summan av en lista eller matris. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Beräkna medianabsolutavvikelsen (MAD). | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Returnera det största värdet i en lista eller matris. | `max([1, 2, 3])` |  | `3` |
| **mean** | Beräkna medelvärdet. | `mean([2, 4, 6])` |  | `4` |
| **median** | Beräkna medianen. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Returnera det minsta värdet i en lista eller matris. | `min([1, 2, 3])` |  | `1` |
| **mode** | Beräkna typvärdet (det mest frekventa värdet). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Beräkna produkten av alla tal i en lista eller matris. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Beräkna kvantilen vid sannolikheten `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Beräkna standardavvikelsen för data. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Beräkna summan av alla tal i en lista eller matris. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Beräkna variansen för data. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Strängar

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **bin** | Formatera ett tal som binärt. | `bin(13)` |  | `13` |
| **format** | Formatera ett godtyckligt värde som en sträng med angiven precision. | `format(123.456, 2)` |  | `120` |
| **hex** | Formatera ett tal som hexadecimalt. | `hex(255)` |  | `255` |
| **oct** | Formatera ett tal som oktalt. | `oct(64)` |  | `64` |
| **print** | Interpolera flera värden i en strängmall. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometri

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **acos** | Beräkna arcus cosinus. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Beräkna invers hyperbolisk cosinus. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Beräkna arcus cotangens. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Beräkna invers hyperbolisk cotangens. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Beräkna arcus cosekant. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Beräkna invers hyperbolisk cosekant. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Beräkna arcus sekant. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Beräkna invers hyperbolisk sekant. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Beräkna arcus sinus. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Beräkna invers hyperbolisk sinus. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Beräkna arcus tangens. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Beräkna arcus tangens med två argument. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Beräkna invers hyperbolisk tangens. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Beräkna cosinus för x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Beräkna hyperbolisk cosinus för x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Beräkna cotangens för x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Beräkna hyperbolisk cotangens för x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Beräkna cosekant för x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Beräkna hyperbolisk cosekant för x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Beräkna sekant för x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Beräkna hyperbolisk sekant för x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Beräkna sinus för x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Beräkna hyperbolisk sinus för x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Beräkna tangens för x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Beräkna hyperbolisk tangens för x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Enheter

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **to** | Konvertera ett numeriskt värde till den angivna enheten. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Verktyg

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| --- | --- | --- | --- | --- |
| **clone** | Skapa en djup kopia av indatavärdet. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Kontrollera om indata innehåller ett numeriskt värde. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Kontrollera om indata är ett heltal. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Kontrollera om indata är NaN. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Kontrollera om indata är negativt. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Kontrollera om indata är numeriskt. | `isNumeric('123')` |  | `false` |
| **isPositive** | Kontrollera om indata är positivt. | `isPositive(2)` |  | `true` |
| **isPrime** | Kontrollera om indata är ett primtal. | `isPrime(7)` |  | `true` |
| **isZero** | Kontrollera om indata är noll. | `isZero(0)` |  | `true` |
| **numeric** | Konvertera indata till en numerisk typ (number, BigNumber etc.). | `numeric('123')` |  | `123` |
| **typeOf** | Returnera typnamnet för indatavärdet. | `typeOf([1, 2, 3])` |  | `Array` |