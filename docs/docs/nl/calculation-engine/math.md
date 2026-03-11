:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/calculation-engine/math) voor nauwkeurige informatie.
:::

# Mathjs

[Math.js](https://mathjs.org/) is een functierijke wiskundebibliotheek voor JavaScript en Node.js.

## Functiereferentie

### Expressies

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **compile** | Een expressie ontleden en compileren (ontleedt alleen en geeft niet direct een resultaat terug). | `compile('2 + 3')` | expressie (tekenreeks) | `{}` |
| **evaluate** | Een expressie evalueren en het resultaat teruggeven. | `evaluate('2 + 3')` | expressie (tekenreeks), scope (optioneel) | `5` |
| **help** | Documentatie ophalen voor een functie of datatype. | `help('evaluate')` | zoekterm (tekenreeks) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Een parser maken voor aangepaste bewerkingen. | `parser()` | Geen | `{}` |

### Algebra

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **derivative** | Een expressie differentiëren naar een opgegeven variabele. | `derivative('x^2', 'x')` | expressie (tekenreeks of Node), variabele (tekenreeks) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Het aantal bladknoppen (symbolen of constanten) in een expressieboom tellen. | `leafCount('x^2 + y')` | expressie (tekenreeks of Node) | `3` |
| **lsolve** | Een lineair systeem oplossen met voorwaartse substitutie. | `lsolve([[1,2],[3,4]], [5,6])` | L (Array of Matrix), b (Array of Matrix) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Alle oplossingen van een lineair systeem vinden met voorwaartse substitutie. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Array of Matrix), b (Array of Matrix) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Een LU-decompositie uitvoeren met gedeeltelijke pivotering. | `lup([[1,2],[3,4]])` | A (Array of Matrix) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Een lineair systeem A*x = b oplossen waarbij A een n×n matrix is. | `lusolve([[1,2],[3,4]], [5,6])` | A (Array of Matrix), b (Array of Matrix) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | De QR-decompositie van een matrix berekenen. | `qr([[1,2],[3,4]])` | A (Array of Matrix) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Een rationaliseerbare expressie omzetten in een rationale breuk. | `rationalize('1/(x+1)')` | expressie (tekenreeks of Node) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Symbolen in een expressie vervangen door waarden uit de opgegeven scope. | `resolve('x + y', {x:2, y:3})` | expressie (tekenreeks of Node), scope (object) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Een expressieboom vereenvoudigen (gelijksoortige termen combineren, enz.). | `simplify('2x + 3x')` | expressie (tekenreeks of Node) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Een vereenvoudiging in één stap uitvoeren, vaak gebruikt in prestatiegevoelige scenario's. | `simplifyCore('x+x')` | expressie (tekenreeks of Node) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Een ijle (sparse) LU-decompositie berekenen met volledige pivotering. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Array of Matrix), volgorde (tekenreeks), drempelwaarde (getal) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Controleren of twee expressies symbolisch gelijk zijn. | `symbolicEqual('x+x', '2x')` | expressie1 (tekenreeks of Node), expressie2 (tekenreeks of Node) | `true` |
| **usolve** | Een lineair systeem oplossen met achterwaartse substitutie. | `usolve([[1,2],[0,1]], [3,4])` | U (Array of Matrix), b (Array of Matrix) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Alle oplossingen van een lineair systeem vinden met achterwaartse substitutie. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Array of Matrix), b (Array of Matrix) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Rekenkunde

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **abs** | De absolute waarde van een getal berekenen. | `abs(-3.2)` | x (getal, Complex, Array of Matrix) | `3.2` |
| **add** | Twee of meer waarden optellen (x + y). | `add(2, 3)` | x, y, ... (getal, Array of Matrix) | `5` |
| **cbrt** | De derdemachtswortel van een getal berekenen, optioneel alle derdemachtswortels teruggeven. | `cbrt(8)` | x (getal of Complex), allRoots (booleaanse waarde, optioneel) | `2` |
| **ceil** | Afronden naar positief oneindig (voor complexe getallen wordt elk deel afzonderlijk afgerond). | `ceil(3.2)` | x (getal, Complex, Array of Matrix) | `4` |
| **cube** | De derde macht van een waarde berekenen (x*x*x). | `cube(3)` | x (getal, Complex, Array of Matrix) | `27` |
| **divide** | Twee waarden delen (x / y). | `divide(6, 2)` | x (getal, Array of Matrix), y (getal, Array of Matrix) | `3` |
| **dotDivide** | Twee matrices of arrays elementsgewijs delen. | `dotDivide([6,8],[2,4])` | x (Array of Matrix), y (Array of Matrix) | `[  3,  2]` |
| **dotMultiply** | Twee matrices of arrays elementsgewijs vermenigvuldigen. | `dotMultiply([2,3],[4,5])` | x (Array of Matrix), y (Array of Matrix) | `[  8,  15]` |
| **dotPow** | x^y elementsgewijs berekenen. | `dotPow([2,3],[2,3])` | x (Array of Matrix), y (Array of Matrix) | `[  4,  27]` |
| **exp** | e^x berekenen. | `exp(1)` | x (getal, Complex, Array of Matrix) | `2.718281828459045` |
| **expm1** | e^x - 1 berekenen. | `expm1(1)` | x (getal of Complex) | `1.718281828459045` |
| **fix** | Afronden naar nul (afkappen). | `fix(3.7)` | x (getal, Complex, Array of Matrix) | `3` |
| **floor** | Afronden naar negatief oneindig. | `floor(3.7)` | x (getal, Complex, Array of Matrix) | `3` |
| **gcd** | De grootste gemene deler van twee of meer getallen berekenen. | `gcd(8, 12)` | a, b, ... (getal of BigNumber) | `4` |
| **hypot** | De wortel van de som van de kwadraten van de argumenten berekenen (Pythagoras). | `hypot(3, 4)` | a, b, ... (getal of BigNumber) | `5` |
| **invmod** | De modulaire multiplicatieve inverse van a modulo b berekenen. | `invmod(3, 11)` | a, b (getal of BigNumber) | `4` |
| **lcm** | Het kleinste gemene veelvoud van twee of meer getallen berekenen. | `lcm(4, 6)` | a, b, ... (getal of BigNumber) | `12` |
| **log** | Een logaritme berekenen met een optioneel grondtal. | `log(100, 10)` | x (getal of Complex), grondtal (getal of Complex, optioneel) | `2` |
| **log10** | De logaritme met grondtal 10 van een getal berekenen. | `log10(100)` | x (getal of Complex) | `2` |
| **log1p** | ln(1 + x) berekenen. | `log1p(1)` | x (getal of Complex) | `0.6931471805599453` |
| **log2** | De logaritme met grondtal 2 van een getal berekenen. | `log2(8)` | x (getal of Complex) | `3` |
| **mod** | De rest van x ÷ y berekenen (x mod y). | `mod(8,3)` | x, y (getal of BigNumber) | `2` |
| **multiply** | Twee of meer waarden vermenigvuldigen (x * y). | `multiply(2, 3)` | x, y, ... (getal, Array of Matrix) | `6` |
| **norm** | De norm van een getal, vector of matrix berekenen met optionele p. | `norm([3,4])` | x (Array of Matrix), p (getal of tekenreeks, optioneel) | `5` |
| **nthRoot** | De n-demachtswortel (hoofdwortel) van een getal berekenen. | `nthRoot(16, 4)` | a (getal, BigNumber of Complex), wortel (getal, optioneel) | `2` |
| **nthRoots** | Alle n-demachtswortels van een getal berekenen, mogelijk complex. | `nthRoots(1,3)` | x (getal of Complex), wortel (getal) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | x tot de macht y verheffen. | `pow(2, 3)` | x (getal, Complex, Array of Matrix), y (getal, Complex, Array of Matrix) | `8` |
| **round** | Afronden op een opgegeven aantal decimalen. | `round(3.14159, 2)` | x (getal, Complex, Array of Matrix), n (getal, optioneel) | `3.14` |
| **sign** | Het teken van een getal teruggeven (-1, 0 of 1). | `sign(-3)` | x (getal, BigNumber of Complex) | `-1` |
| **sqrt** | De vierkantswortel van een getal berekenen. | `sqrt(9)` | x (getal, Complex, Array of Matrix) | `3` |
| **square** | Het kwadraat van een waarde berekenen (x*x). | `square(3)` | x (getal, Complex, Array of Matrix) | `9` |
| **subtract** | De ene waarde van de andere aftrekken (x - y). | `subtract(8, 3)` | x, y (getal, Array of Matrix) | `5` |
| **unaryMinus** | Unaire negatie toepassen op een waarde. | `unaryMinus(3)` | x (getal, Complex, Array of Matrix) | `-3` |
| **unaryPlus** | Unaire plus toepassen (laat de waarde meestal ongewijzigd). | `unaryPlus(-3)` | x (getal, Complex, Array of Matrix) | `-3` |
| **xgcd** | De uitgebreide grootste gemene deler van twee getallen berekenen. | `xgcd(8, 12)` | a, b (getal of BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Bitsgewijs

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **bitAnd** | Bitsgewijze AND uitvoeren (x & y). | `bitAnd(5, 3)` | x, y (getal of BigNumber) | `1` |
| **bitNot** | Bitsgewijze NOT uitvoeren (~x). | `bitNot(5)` | x (getal of BigNumber) | `-6` |
| **bitOr** | Bitsgewijze OR uitvoeren (x \| y). | `bitOr(5, 3)` | x, y (getal of BigNumber) | `7` |
| **bitXor** | Bitsgewijze XOR uitvoeren (x ^ y). | `bitXor(5, 3)` | x, y (getal of BigNumber) | `6` |
| **leftShift** | x met y bits naar links verschuiven (x << y). | `leftShift(5, 1)` | x, y (getal of BigNumber) | `10` |
| **rightArithShift** | Een rekenkundige verschuiving naar rechts uitvoeren op x (x >> y). | `rightArithShift(5, 1)` | x, y (getal of BigNumber) | `2` |
| **rightLogShift** | Een logische verschuiving naar rechts uitvoeren op x (x >>> y). | `rightLogShift(5, 1)` | x, y (getal of BigNumber) | `2` |

### Combinatieleer

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Het aantal partities van n verschillende elementen tellen. | `bellNumbers(3)` | n (getal) | `5` |
| **catalan** | Het n-de Catalaans getal berekenen voor diverse combinatorische structuren. | `catalan(5)` | n (getal) | `42` |
| **composition** | Het aantal composities van n in k delen tellen. | `composition(5, 3)` | n, k (getal) | `6` |
| **stirlingS2** | Het aantal manieren berekenen om n gelabelde items te verdelen in k niet-lege deelverzamelingen (Stirling-getallen van de tweede soort). | `stirlingS2(5, 3)` | n, k (getal) | `25` |

### Complexe getallen

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **arg** | Het argument (fase) van een complex getal berekenen. | `arg(complex('2 + 2i'))` | x (Complex of getal) | `0.785398163` |
| **conj** | De complex geconjugeerde berekenen. | `conj(complex('2 + 2i'))` | x (Complex of getal) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Het imaginaire deel van een complex getal teruggeven. | `im(complex('2 + 3i'))` | x (Complex of getal) | `3` |
| **re** | Het reële deel van een complex getal teruggeven. | `re(complex('2 + 3i'))` | x (Complex of getal) | `2` |

### Geometrie

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **distance** | De Euclidische afstand tussen twee punten in een N-dimensionale ruimte berekenen. | `distance([0,0],[3,4])` | punt1 (Array), punt2 (Array) | `5` |
| **intersect** | Het snijpunt vinden van twee lijnen (2D/3D) of een lijn en een vlak (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | eindpunten van lijn 1, eindpunten van lijn 2, ... | `[  1,  1]` |

### Logica

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **and** | Een logische AND uitvoeren. | `and(true, false)` | x, y (booleaanse waarde of getal) | `false` |
| **not** | Een logische NOT uitvoeren. | `not(true)` | x (booleaanse waarde of getal) | `false` |
| **or** | Een logische OR uitvoeren. | `or(true, false)` | x, y (booleaanse waarde of getal) | `true` |
| **xor** | Een logische XOR uitvoeren. | `xor(1, 0)` | x, y (booleaanse waarde of getal) | `true` |

### Matrix

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **column** | De opgegeven kolom uit een matrix teruggeven. | `column([[1,2],[3,4]], 1)` | waarde (Matrix of Array), index (getal) | `[  [    1  ],  [    3  ]]` |
| **concat** | Meerdere matrices/arrays samenvoegen langs een dimensie. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Array of Matrix), dim (getal, optioneel) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Het aantal elementen in een matrix, array of tekenreeks tellen. | `count([1,2,3,'hello'])` | x (Array, Matrix of tekenreeks) | `4` |
| **cross** | Het kruisproduct van twee 3D-vectoren berekenen. | `cross([1,2,3], [4,5,6])` | x, y (Array of Matrix met lengte 3) | `[  -3,  6,  -3]` |
| **ctranspose** | De geconjugeerde getransponeerde van een matrix berekenen. | `ctranspose([[1,2],[3,4]])` | x (Matrix of Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | De determinant van een matrix berekenen. | `det([[1,2],[3,4]])` | x (Matrix of Array) | `-2` |
| **diag** | Een diagonaalmatrix maken of de diagonaal van een matrix extraheren. | `diag([1,2,3])` | X (Array of Matrix) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Het verschil tussen aangrenzende elementen langs een dimensie berekenen. | `diff([1,4,9,16])` | arr (Array of Matrix), dim (getal, optioneel) | `[  3,  5,  7]` |
| **dot** | Het inwendig product van twee vectoren berekenen. | `dot([1,2,3],[4,5,6])` | x, y (Array of Matrix) | `32` |
| **eigs** | Eigenwaarden en optioneel eigenvectoren van een vierkante matrix berekenen. | `eigs([[1,2],[3,4]])` | x (Matrix of Array), codec (getal, optioneel) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | De matrix-exponentiële e^A berekenen. | `expm([[1,0],[0,1]])` | x (Matrix of Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | De N-dimensionale snelle Fourier-transformatie berekenen. | `fft([1,2,3,4])` | arr (Array of Matrix) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Nog niet ondersteund) Een array of 1D-matrix filteren met een testfunctie. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Array of Matrix), test (functie) | `[  "23",  "100",  "55"]` |
| **flatten** | Een meerdimensionale matrix of array afvlakken tot 1D. | `flatten([[1,2],[3,4]])` | x (Array of Matrix) | `[  1,  2,  3,  4]` |
| **forEach** | (Nog niet ondersteund) Over elk element van een matrix/array itereren en een callback aanroepen. | `forEach([1,2,3], val => console.log(val))` | x (Array of Matrix), callback (functie) | `undefined` |
| **getMatrixDataType** | Het datatype van alle elementen in een matrix of array inspecteren (bijv. 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Array of Matrix) | `mixed` |
| **identity** | Een n x n (of m x n) eenheidsmatrix maken. | `identity(3)` | n (getal) of [m, n] (Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | De N-dimensionale inverse FFT berekenen. | `ifft([1,2,3,4])` | arr (Array of Matrix) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | De inverse van een vierkante matrix berekenen. | `inv([[1,2],[3,4]])` | x (Matrix of Array) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Het Kronecker-product van twee matrices of vectoren berekenen. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matrix of Array) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Een nieuwe array/matrix maken door een callback toe te passen op elk element. | `map([1,2,3], val => val * val)` | x (Array of Matrix), callback (functie) | `[  1,  4,  9]` |
| **matrixFromColumns** | Vectoren combineren als afzonderlijke kolommen van een dichte matrix. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Array of Matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Nog niet ondersteund) Een matrix opbouwen door een functie te evalueren voor elke index. | `matrixFromFunction([5], i => math.random())` | grootte (Array), fn (functie) | `een willekeurige vector` |
| **matrixFromRows** | Vectoren combineren als afzonderlijke rijen van een dichte matrix. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Array of Matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Een matrix maken met alleen enen voor de opgegeven dimensies. | `ones(2, 3)` | m, n, p... (getal) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Het k-de kleinste element teruggeven met behulp van partitieselectie. | `partitionSelect([3,1,4,2], 2)` | x (Array of Matrix), k (getal) | `3` |
| **pinv** | De Moore-Penrose-pseudoinverse van een matrix berekenen. | `pinv([[1,2],[2,4]])` | x (Matrix of Array) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Een array van getallen maken van start tot eind (optionele stap). | `range(1, 5, 2)` | start (getal), eind (getal), stap (getal, optioneel) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Een array/matrix omvormen naar de opgegeven dimensies. | `reshape([1,2,3,4,5,6], [2,3])` | x (Array of Matrix), groottes (Array) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Een matrix aanpassen naar nieuwe dimensies, eventueel opvullen met een standaardwaarde. | `resize([1,2,3], [5], 0)` | x (Array of Matrix), grootte (Array), standaardwaarde (optioneel) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Een 1x2 vector linksom draaien of een 1x3 vector rond een as draaien. | `rotate([1, 0], Math.PI / 2)` | w (Array of Matrix), theta (getal[, as]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Een 2x2 rotatiematrix maken voor een opgegeven hoek in radialen. | `rotationMatrix(Math.PI / 2)` | theta (getal) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | De opgegeven rij uit een matrix teruggeven. | `row([[1,2],[3,4]], 1)` | waarde (Matrix of Array), index (getal) | `[  [    3,    4  ]]` |
| **size** | De grootte (dimensies) van een matrix, array of scalar berekenen. | `size([[1,2,3],[4,5,6]])` | x (Array, Matrix of getal) | `[  2,  3]` |
| **sort** | Een matrix of array in oplopende volgorde sorteren. | `sort([3,1,2])` | x (Array of Matrix) | `[  1,  2,  3]` |
| **sqrtm** | De hoofdvierkantswortel van een vierkante matrix berekenen. | `sqrtm([[4,0],[0,4]])` | A (Matrix of Array) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Singleton-dimensies binnen of buiten een matrix verwijderen. | `squeeze([[[1],[2],[3]]])` | x (Matrix of Array) | `[  1,  2,  3]` |
| **subset** | Een deelverzameling van een matrix of tekenreeks ophalen of vervangen. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matrix, Array of tekenreeks), index (Index), vervanging (optioneel) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Het spoor (som van de diagonaalelementen) van een vierkante matrix berekenen. | `trace([[1,2],[3,4]])` | x (Matrix of Array) | `5` |
| **transpose** | Een matrix transponeren. | `transpose([[1,2],[3,4]])` | x (Matrix of Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Een nulmatrix maken voor de opgegeven dimensies. | `zeros(2, 3)` | m, n, p... (getal) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Waarschijnlijkheid

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **combinations** | Het aantal combinaties tellen bij het selecteren van k ongeordende items uit n. | `combinations(5, 2)` | n (getal), k (getal) | `10` |
| **combinationsWithRep** | Het aantal combinaties tellen wanneer selecties herhaald mogen worden. | `combinationsWithRep(5, 2)` | n (getal), k (getal) | `15` |
| **factorial** | n! berekenen voor een geheel getal n. | `factorial(5)` | n (geheel getal) | `120` |
| **gamma** | De gammafunctie benaderen. | `gamma(5)` | n (getal) | `24` |
| **kldivergence** | De KL-divergentie tussen twee verdelingen berekenen. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Array of Matrix), y (Array of Matrix) | `0.036690014034750584` |
| **lgamma** | De logaritme van de gammafunctie berekenen. | `lgamma(5)` | n (getal) | `3.178053830347945` |
| **multinomial** | Een multinomiale coëfficiënt berekenen uit een set tellingen. | `multinomial([1, 2, 3])` | a (Array) | `60` |
| **permutations** | Het aantal geordende permutaties tellen bij het selecteren van k items uit n. | `permutations(5, 2)` | n (getal), k (getal, optioneel) | `20` |
| **pickRandom** | Een of meer willekeurige waarden kiezen uit een 1D-array. | `pickRandom([10, 20, 30])` | array | `20` |
| **random** | Een uniform verdeeld willekeurig getal teruggeven. | `random(1, 10)` | min (optioneel), max (optioneel) | `3.6099423753668143` |
| **randomInt** | Een uniform verdeeld willekeurig geheel getal teruggeven. | `randomInt(1, 10)` | min (optioneel), max (optioneel) | `5` |

### Rationale getallen

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **compare** | Twee waarden vergelijken en -1, 0 of 1 teruggeven. | `compare(2, 3)` | x, y (elk type) | `-1` |
| **compareNatural** | Willekeurige waarden vergelijken in een natuurlijke, herhaalbare volgorde. | `compareNatural('2', '10')` | x, y (elk type) | `-1` |
| **compareText** | Twee tekenreeksen lexicografisch vergelijken. | `compareText('apple', 'banana')` | x (tekenreeks), y (tekenreeks) | `-1` |
| **deepEqual** | Twee matrices/arrays elementsgewijs vergelijken op gelijkheid. | `deepEqual([[1, 2]], [[1, 2]])` | x (Array/Matrix), y (Array/Matrix) | `true` |
| **equal** | Testen of twee waarden gelijk zijn. | `equal(2, 2)` | x, y (elk type) | `true` |
| **equalText** | Testen of twee tekenreeksen identiek zijn. | `equalText('hello', 'hello')` | x (tekenreeks), y (tekenreeks) | `true` |
| **larger** | Controleren of x groter is dan y. | `larger(3, 2)` | x, y (getal of BigNumber) | `true` |
| **largerEq** | Controleren of x groter dan of gelijk is aan y. | `largerEq(3, 3)` | x, y (getal of BigNumber) | `true` |
| **smaller** | Controleren of x kleiner is dan y. | `smaller(2, 3)` | x, y (getal of BigNumber) | `true` |
| **smallerEq** | Controleren of x kleiner dan of gelijk is aan y. | `smallerEq(2, 2)` | x, y (getal of BigNumber) | `true` |
| **unequal** | Controleren of twee waarden niet gelijk zijn. | `unequal(2, 3)` | x, y (elk type) | `true` |

### Verzamelingen

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **setCartesian** | Het Cartesisch product van twee (of meer) verzamelingen produceren. | `setCartesian([1, 2], [3, 4])` | set1 (Array), set2 (Array) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Het verschil van twee verzamelingen teruggeven (elementen in set1 maar niet in set2). | `setDifference([1, 2, 3], [2])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setDistinct** | De unieke elementen in een (multi)set teruggeven. | `setDistinct([1, 2, 2, 3])` | set (Array) | `[  1,  2,  3]` |
| **setIntersect** | De doorsnede van twee (of meer) verzamelingen teruggeven. | `setIntersect([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  2]` |
| **setIsSubset** | Controleren of set1 een deelverzameling is van set2. | `setIsSubset([1, 2], [1, 2, 3])` | set1 (Array), set2 (Array) | `true` |
| **setMultiplicity** | Tellen hoe vaak een element voorkomt in een multiset. | `setMultiplicity(2, [1, 2, 2, 3])` | element (elk type), set (Array) | `2` |
| **setPowerset** | De machtsverzameling (alle deelverzamelingen) van een (multi)set teruggeven. | `setPowerset([1, 2])` | set (Array) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Alle elementen in een (multi)set tellen. | `setSize([1, 2, 3])` | set (Array) | `3` |
| **setSymDifference** | Het symmetrisch verschil van twee (of meer) verzamelingen teruggeven. | `setSymDifference([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setUnion** | De vereniging van twee (of meer) verzamelingen teruggeven. | `setUnion([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3,  2]` |

### Speciaal

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **erf** | De foutfunctie berekenen met een rationale Chebyshev-benadering. | `erf(0.5)` | invoer x (getal) | `0.5204998778130465` |

### Statistiek

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **cumsum** | De cumulatieve som van een lijst of matrix berekenen. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | De mediaan van de absolute afwijkingen (MAD) berekenen. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | De maximumwaarde van een lijst of matrix teruggeven. | `max([1, 2, 3])` |  | `3` |
| **mean** | Het gemiddelde berekenen. | `mean([2, 4, 6])` |  | `4` |
| **median** | De mediaan berekenen. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | De minimumwaarde van een lijst of matrix teruggeven. | `min([1, 2, 3])` |  | `1` |
| **mode** | De modus (meest voorkomende waarde) berekenen. | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Het product van alle getallen in een lijst of matrix berekenen. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Het kwantiel berekenen bij waarschijnlijkheid `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | De standaarddeviatie van gegevens berekenen. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | De som van alle getallen in een lijst of matrix berekenen. | `sum([1, 2, 3])` |  | `6` |
| **variance** | De variantie van gegevens berekenen. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Strings

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **bin** | Een getal formatteren als binair. | `bin(13)` |  | `13` |
| **format** | Elke waarde formatteren als een tekenreeks met de opgegeven precisie. | `format(123.456, 2)` |  | `120` |
| **hex** | Een getal formatteren als hexadecimaal. | `hex(255)` |  | `255` |
| **oct** | Een getal formatteren als octaal. | `oct(64)` |  | `64` |
| **print** | Meerdere waarden interpoleren in een tekenreeks-sjabloon. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometrie

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **acos** | De boogcosinus berekenen. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | De inverse hyperbolische cosinus berekenen. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | De boogcotangens berekenen. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | De inverse hyperbolische cotangens berekenen. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | De boogcosecans berekenen. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | De inverse hyperbolische cosecans berekenen. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | De boogsecans berekenen. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | De inverse hyperbolische secans berekenen. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | De boogsinus berekenen. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | De inverse hyperbolische sinus berekenen. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | De boogtangens berekenen. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | De boogtangens berekenen met twee argumenten. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | De inverse hyperbolische tangens berekenen. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | De cosinus van x berekenen. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | De hyperbolische cosinus van x berekenen. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | De cotangens van x berekenen. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | De hyperbolische cotangens van x berekenen. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | De cosecans van x berekenen. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | De hyperbolische cosecans van x berekenen. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | De secans van x berekenen. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | De hyperbolische secans van x berekenen. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | De sinus van x berekenen. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | De hyperbolische sinus van x berekenen. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | De tangens van x berekenen. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | De hyperbolische tangens van x berekenen. | `tanh(0.5)` |  | `0.46211715726000974` |

### Eenheden

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **to** | Een numerieke waarde omzetten naar de opgegeven eenheid. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Hulpprogramma's

| Functie | Definitie | Voorbeeld aanroep | Parameters | Verwacht resultaat |
| --- | --- | --- | --- | --- |
| **clone** | De invoerwaarde diep kopiëren. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Controleren of de invoer een numerieke waarde bevat. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Controleren of de invoer een geheel getal is. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Controleren of de invoer NaN is. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Controleren of de invoer negatief is. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Controleren of de invoer numeriek is. | `isNumeric('123')` |  | `false` |
| **isPositive** | Controleren of de invoer positief is. | `isPositive(2)` |  | `true` |
| **isPrime** | Controleren of de invoer een priemgetal is. | `isPrime(7)` |  | `true` |
| **isZero** | Controleren of de invoer nul is. | `isZero(0)` |  | `true` |
| **numeric** | De invoer omzetten naar een numeriek type (number, BigNumber, enz.). | `numeric('123')` |  | `123` |
| **typeOf** | De typenaam van de invoerwaarde teruggeven. | `typeOf([1, 2, 3])` |  | `Array` |