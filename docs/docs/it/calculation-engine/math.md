:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) è una libreria matematica ricca di funzionalità per JavaScript e Node.js.

## Riferimento delle funzioni

### Espressioni

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **compile** | Analizza e compila un'espressione (esegue solo l'analisi e non restituisce direttamente un risultato). | `compile('2 + 3')` | espressione (stringa) | `{}` |
| **evaluate** | Valuta un'espressione e restituisce il risultato. | `evaluate('2 + 3')` | espressione (stringa), scope (opzionale) | `5` |
| **help** | Recupera la documentazione per una funzione o un tipo di dato. | `help('evaluate')` | parola chiave di ricerca (stringa) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Crea un parser per operazioni personalizzate. | `parser()` | Nessuno | `{}` |

### Algebra

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **derivative** | Differenzia un'espressione rispetto a una variabile specificata. | `derivative('x^2', 'x')` | espressione (stringa o Nodo), variabile (stringa) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Conta i nodi foglia (simboli o costanti) in un albero di espressioni. | `leafCount('x^2 + y')` | espressione (stringa o Nodo) | `3` |
| **lsolve** | Risolve un sistema lineare utilizzando la sostituzione in avanti. | `lsolve([[1,2],[3,4]], [5,6])` | L (Array o Matrice), b (Array o Matrice) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Trova tutte le soluzioni di un sistema lineare utilizzando la sostituzione in avanti. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Array o Matrice), b (Array o Matrice) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Esegue una decomposizione LU con pivoting parziale. | `lup([[1,2],[3,4]])` | A (Array o Matrice) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Risolve un sistema lineare A*x = b dove A è una matrice n×n. | `lusolve([[1,2],[3,4]], [5,6])` | A (Array o Matrice), b (Array o Matrice) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Calcola la decomposizione QR di una matrice. | `qr([[1,2],[3,4]])` | A (Array o Matrice) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Converte un'espressione razionalizzabile in una frazione razionale. | `rationalize('1/(x+1)')` | espressione (stringa o Nodo) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Sostituisce i simboli in un'espressione con i valori dello scope fornito. | `resolve('x + y', {x:2, y:3})` | espressione (stringa o Nodo), scope (oggetto) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Semplifica un albero di espressioni (combina termini simili, ecc.). | `simplify('2x + 3x')` | espressione (stringa o Nodo) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Esegue una semplificazione a passaggio singolo, spesso utilizzata in casi sensibili alle prestazioni. | `simplifyCore('x+x')` | espressione (stringa o Nodo) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Calcola una decomposizione LU sparsa con pivoting completo. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Array o Matrice), ordine (stringa), soglia (numero) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Verifica se due espressioni sono simbolicamente uguali. | `symbolicEqual('x+x', '2x')` | espressione1 (stringa o Nodo), espressione2 (stringa o Nodo) | `true` |
| **usolve** | Risolve un sistema lineare utilizzando la sostituzione all'indietro. | `usolve([[1,2],[0,1]], [3,4])` | U (Array o Matrice), b (Array o Matrice) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Trova tutte le soluzioni di un sistema lineare utilizzando la sostituzione all'indietro. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Array o Matrice), b (Array o Matrice) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Aritmetica

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **abs** | Calcola il valore assoluto di un numero. | `abs(-3.2)` | x (numero, Complesso, Array o Matrice) | `3.2` |
| **add** | Somma due o più valori (x + y). | `add(2, 3)` | x, y, ... (numero, Array o Matrice) | `5` |
| **cbrt** | Calcola la radice cubica di un numero, restituendo opzionalmente tutte le radici cubiche. | `cbrt(8)` | x (numero o Complesso), allRoots (booleano, opzionale) | `2` |
| **ceil** | Arrotonda verso l'infinito positivo (per i numeri complessi, ogni parte viene arrotondata separatamente). | `ceil(3.2)` | x (numero, Complesso, Array o Matrice) | `4` |
| **cube** | Calcola il cubo di un valore (x*x*x). | `cube(3)` | x (numero, Complesso, Array o Matrice) | `27` |
| **divide** | Divide due valori (x / y). | `divide(6, 2)` | x (numero, Array o Matrice), y (numero, Array o Matrice) | `3` |
| **dotDivide** | Divide due matrici o array elemento per elemento. | `dotDivide([6,8],[2,4])` | x (Array o Matrice), y (Array o Matrice) | `[  3,  2]` |
| **dotMultiply** | Moltiplica due matrici o array elemento per elemento. | `dotMultiply([2,3],[4,5])` | x (Array o Matrice), y (Array o Matrice) | `[  8,  15]` |
| **dotPow** | Calcola x^y elemento per elemento. | `dotPow([2,3],[2,3])` | x (Array o Matrice), y (Array o Matrice) | `[  4,  27]` |
| **exp** | Calcola e^x. | `exp(1)` | x (numero, Complesso, Array o Matrice) | `2.718281828459045` |
| **expm1** | Calcola e^x - 1. | `expm1(1)` | x (numero o Complesso) | `1.718281828459045` |
| **fix** | Arrotonda verso lo zero (tronca). | `fix(3.7)` | x (numero, Complesso, Array o Matrice) | `3` |
| **floor** | Arrotonda verso l'infinito negativo. | `floor(3.7)` | x (numero, Complesso, Array o Matrice) | `3` |
| **gcd** | Calcola il massimo comune divisore di due o più numeri. | `gcd(8, 12)` | a, b, ... (numero o BigNumber) | `4` |
| **hypot** | Calcola la radice quadrata della somma dei quadrati degli argomenti (Pitagora). | `hypot(3, 4)` | a, b, ... (numero o BigNumber) | `5` |
| **invmod** | Calcola l'inverso moltiplicativo modulare di a modulo b. | `invmod(3, 11)` | a, b (numero o BigNumber) | `4` |
| **lcm** | Calcola il minimo comune multiplo di due o più numeri. | `lcm(4, 6)` | a, b, ... (numero o BigNumber) | `12` |
| **log** | Calcola un logaritmo con una base opzionale. | `log(100, 10)` | x (numero o Complesso), base (numero o Complesso, opzionale) | `2` |
| **log10** | Calcola il logaritmo in base 10 di un numero. | `log10(100)` | x (numero o Complesso) | `2` |
| **log1p** | Calcola ln(1 + x). | `log1p(1)` | x (numero o Complesso) | `0.6931471805599453` |
| **log2** | Calcola il logaritmo in base 2 di un numero. | `log2(8)` | x (numero o Complesso) | `3` |
| **mod** | Calcola il resto di x ÷ y (x mod y). | `mod(8,3)` | x, y (numero o BigNumber) | `2` |
| **multiply** | Moltiplica due o più valori (x * y). | `multiply(2, 3)` | x, y, ... (numero, Array o Matrice) | `6` |
| **norm** | Calcola la norma di un numero, vettore o matrice con p opzionale. | `norm([3,4])` | x (Array o Matrice), p (numero o stringa, opzionale) | `5` |
| **nthRoot** | Calcola la radice n-esima (radice principale) di un numero. | `nthRoot(16, 4)` | a (numero, BigNumber o Complesso), radice (numero, opzionale) | `2` |
| **nthRoots** | Calcola tutte le radici n-esime di un numero, potenzialmente complesse. | `nthRoots(1,3)` | x (numero o Complesso), radice (numero) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Eleva x alla potenza y. | `pow(2, 3)` | x (numero, Complesso, Array o Matrice), y (numero, Complesso, Array o Matrice) | `8` |
| **round** | Arrotonda a un numero specificato di decimali. | `round(3.14159, 2)` | x (numero, Complesso, Array o Matrice), n (numero, opzionale) | `3.14` |
| **sign** | Restituisce il segno di un numero (-1, 0 o 1). | `sign(-3)` | x (numero, BigNumber o Complesso) | `-1` |
| **sqrt** | Calcola la radice quadrata di un numero. | `sqrt(9)` | x (numero, Complesso, Array o Matrice) | `3` |
| **square** | Calcola il quadrato di un valore (x*x). | `square(3)` | x (numero, Complesso, Array o Matrice) | `9` |
| **subtract** | Sottrae un valore da un altro (x - y). | `subtract(8, 3)` | x, y (numero, Array o Matrice) | `5` |
| **unaryMinus** | Applica la negazione unaria a un valore. | `unaryMinus(3)` | x (numero, Complesso, Array o Matrice) | `-3` |
| **unaryPlus** | Applica il più unario (solitamente lascia il valore invariato). | `unaryPlus(-3)` | x (numero, Complesso, Array o Matrice) | `-3` |
| **xgcd** | Calcola il massimo comune divisore esteso di due numeri. | `xgcd(8, 12)` | a, b (numero o BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Operazioni sui bit

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **bitAnd** | Esegue l'AND bit a bit (x & y). | `bitAnd(5, 3)` | x, y (numero o BigNumber) | `1` |
| **bitNot** | Esegue il NOT bit a bit (~x). | `bitNot(5)` | x (numero o BigNumber) | `-6` |
| **bitOr** | Esegue l'OR bit a bit (x \| y). | `bitOr(5, 3)` | x, y (numero o BigNumber) | `7` |
| **bitXor** | Esegue lo XOR bit a bit (x ^ y). | `bitXor(5, 3)` | x, y (numero o BigNumber) | `6` |
| **leftShift** | Sposta x a sinistra di y bit (x << y). | `leftShift(5, 1)` | x, y (numero o BigNumber) | `10` |
| **rightArithShift** | Esegue uno spostamento a destra aritmetico su x (x >> y). | `rightArithShift(5, 1)` | x, y (numero o BigNumber) | `2` |
| **rightLogShift** | Esegue uno spostamento a destra logico su x (x >>> y). | `rightLogShift(5, 1)` | x, y (numero o BigNumber) | `2` |

### Combinatoria

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Conta le partizioni di n elementi distinti. | `bellNumbers(3)` | n (numero) | `5` |
| **catalan** | Calcola l'n-esimo numero di Catalan per molte strutture combinatorie. | `catalan(5)` | n (numero) | `42` |
| **composition** | Conta le composizioni di n in k parti. | `composition(5, 3)` | n, k (numero) | `6` |
| **stirlingS2** | Calcola il numero di modi per partizionare n elementi etichettati in k sottoinsiemi non vuoti (numeri di Stirling di seconda specie). | `stirlingS2(5, 3)` | n, k (numero) | `25` |

### Numeri complessi

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **arg** | Calcola l'argomento (fase) di un numero complesso. | `arg(complex('2 + 2i'))` | x (Complesso o numero) | `0.785398163` |
| **conj** | Calcola il coniugato complesso. | `conj(complex('2 + 2i'))` | x (Complesso o numero) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Restituisce la parte immaginaria di un numero complesso. | `im(complex('2 + 3i'))` | x (Complesso o numero) | `3` |
| **re** | Restituisce la parte reale di un numero complesso. | `re(complex('2 + 3i'))` | x (Complesso o numero) | `2` |

### Geometria

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **distance** | Calcola la distanza euclidea tra due punti in uno spazio N-dimensionale. | `distance([0,0],[3,4])` | punto1 (Array), punto2 (Array) | `5` |
| **intersect** | Trova l'intersezione di due linee (2D/3D) o di una linea e un piano (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | estremi della linea 1, estremi della linea 2, ... | `[  1,  1]` |

### Logica

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **and** | Esegue un AND logico. | `and(true, false)` | x, y (booleano o numero) | `false` |
| **not** | Esegue un NOT logico. | `not(true)` | x (booleano o numero) | `false` |
| **or** | Esegue un OR logico. | `or(true, false)` | x, y (booleano o numero) | `true` |
| **xor** | Esegue uno XOR logico. | `xor(1, 0)` | x, y (booleano o numero) | `true` |

### Matrici

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **column** | Restituisce la colonna specificata da una matrice. | `column([[1,2],[3,4]], 1)` | valore (Matrice o Array), indice (numero) | `[  [    1  ],  [    3  ]]` |
| **concat** | Concatena più matrici/array lungo una dimensione. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Array o Matrice), dim (numero, opzionale) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Conta il numero di elementi in una matrice, array o stringa. | `count([1,2,3,'hello'])` | x (Array, Matrice o stringa) | `4` |
| **cross** | Calcola il prodotto vettoriale di due vettori 3D. | `cross([1,2,3], [4,5,6])` | x, y (Array o Matrice di lunghezza 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Calcola la trasposta coniugata di una matrice. | `ctranspose([[1,2],[3,4]])` | x (Matrice o Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Calcola il determinante di una matrice. | `det([[1,2],[3,4]])` | x (Matrice o Array) | `-2` |
| **diag** | Crea una matrice diagonale o estrae la diagonale di una matrice. | `diag([1,2,3])` | X (Array o Matrice) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Calcola la differenza tra elementi adiacenti lungo una dimensione. | `diff([1,4,9,16])` | arr (Array o Matrice), dim (numero, opzionale) | `[  3,  5,  7]` |
| **dot** | Calcola il prodotto scalare di due vettori. | `dot([1,2,3],[4,5,6])` | x, y (Array o Matrice) | `32` |
| **eigs** | Calcola gli autovalori e opzionalmente gli autovettori di una matrice quadrata. | `eigs([[1,2],[3,4]])` | x (Matrice o Array), codec (numero, opzionale) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Calcola l'esponenziale della matrice e^A. | `expm([[1,0],[0,1]])` | x (Matrice o Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Calcola la trasformata di Fourier veloce N-dimensionale. | `fft([1,2,3,4])` | arr (Array o Matrice) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Non ancora supportato) Filtra un array o una matrice 1D con una funzione di test. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Array o Matrice), test (funzione) | `[  "23",  "100",  "55"]` |
| **flatten** | Appiattisce una matrice o un array multidimensionale in 1D. | `flatten([[1,2],[3,4]])` | x (Array o Matrice) | `[  1,  2,  3,  4]` |
| **forEach** | (Non ancora supportato) Itera su ogni elemento di una matrice/array e invoca una callback. | `forEach([1,2,3], val => console.log(val))` | x (Array o Matrice), callback (funzione) | `undefined` |
| **getMatrixDataType** | Ispeziona il tipo di dati di tutti gli elementi in una matrice o array (es. 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Array o Matrice) | `mixed` |
| **identity** | Crea una matrice identità n x n (o m x n). | `identity(3)` | n (numero) o [m, n] (Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Calcola la trasformata di Fourier veloce inversa N-dimensionale. | `ifft([1,2,3,4])` | arr (Array o Matrice) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Calcola l'inversa di una matrice quadrata. | `inv([[1,2],[3,4]])` | x (Matrice o Array) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Calcola il prodotto di Kronecker di due matrici o vettori. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matrice o Array) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Crea un nuovo array/matrice applicando una callback a ogni elemento. | `map([1,2,3], val => val * val)` | x (Array o Matrice), callback (funzione) | `[  1,  4,  9]` |
| **matrixFromColumns** | Combina i vettori come colonne separate di una matrice densa. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Array o Matrice) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Non ancora supportato) Costruisce una matrice valutando una funzione per ogni indice. | `matrixFromFunction([5], i => math.random())` | dimensione (Array), fn (funzione) | `a random vector` |
| **matrixFromRows** | Combina i vettori come righe separate di una matrice densa. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Array o Matrice) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Crea una matrice di soli uno per le dimensioni date. | `ones(2, 3)` | m, n, p... (numero) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Restituisce il k-esimo elemento più piccolo utilizzando la selezione per partizione. | `partitionSelect([3,1,4,2], 2)` | x (Array o Matrice), k (numero) | `3` |
| **pinv** | Calcola la pseudoinversa di Moore–Penrose di una matrice. | `pinv([[1,2],[2,4]])` | x (Matrice o Array) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Crea un array di numeri da start a end (passo opzionale). | `range(1, 5, 2)` | start (numero), end (numero), step (numero, opzionale) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Rimodella un array/matrice alle dimensioni date. | `reshape([1,2,3,4,5,6], [2,3])` | x (Array o Matrice), dimensioni (Array) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Ridimensiona una matrice a nuove dimensioni, riempiendo con un valore predefinito se fornito. | `resize([1,2,3], [5], 0)` | x (Array o Matrice), dimensione (Array), valorePredefinito (opzionale) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Ruota un vettore 1x2 in senso antiorario o ruota un vettore 1x3 attorno a un asse. | `rotate([1, 0], Math.PI / 2)` | w (Array o Matrice), theta (numero[, asse]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Crea una matrice di rotazione 2x2 per un dato angolo in radianti. | `rotationMatrix(Math.PI / 2)` | theta (numero) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Restituisce la riga specificata da una matrice. | `row([[1,2],[3,4]], 1)` | valore (Matrice o Array), indice (numero) | `[  [    3,    4  ]]` |
| **size** | Calcola la dimensione (dimensioni) di una matrice, array o scalare. | `size([[1,2,3],[4,5,6]])` | x (Array, Matrice o numero) | `[  2,  3]` |
| **sort** | Ordina una matrice o un array in ordine crescente. | `sort([3,1,2])` | x (Array o Matrice) | `[  1,  2,  3]` |
| **sqrtm** | Calcola la radice quadrata principale di una matrice quadrata. | `sqrtm([[4,0],[0,4]])` | A (Matrice o Array) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Rimuove le dimensioni singole dall'interno o dall'esterno di una matrice. | `squeeze([[[1],[2],[3]]])` | x (Matrice o Array) | `[  1,  2,  3]` |
| **subset** | Ottiene o sostituisce un sottoinsieme di una matrice o stringa. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matrice, Array o stringa), indice (Indice), sostituzione (opzionale) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Calcola la traccia (somma degli elementi diagonali) di una matrice quadrata. | `trace([[1,2],[3,4]])` | x (Matrice o Array) | `5` |
| **transpose** | Traspone una matrice. | `transpose([[1,2],[3,4]])` | x (Matrice o Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Crea una matrice di soli zeri per le dimensioni date. | `zeros(2, 3)` | m, n, p... (numero) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Probabilità

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **combinations** | Conta le combinazioni selezionando k elementi non ordinati da n. | `combinations(5, 2)` | n (numero), k (numero) | `10` |
| **combinationsWithRep** | Conta le combinazioni quando le selezioni possono ripetersi. | `combinationsWithRep(5, 2)` | n (numero), k (numero) | `15` |
| **factorial** | Calcola n! per un intero n. | `factorial(5)` | n (intero) | `120` |
| **gamma** | Approssima la funzione gamma. | `gamma(5)` | n (numero) | `24` |
| **kldivergence** | Calcola la divergenza KL tra due distribuzioni. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Array o Matrice), y (Array o Matrice) | `0.036690014034750584` |
| **lgamma** | Calcola il logaritmo della funzione gamma. | `lgamma(5)` | n (numero) | `3.178053830347945` |
| **multinomial** | Calcola un coefficiente multinomiale da un insieme di conteggi. | `multinomial([1, 2, 3])` | a (Array) | `60` |
| **permutations** | Conta le permutazioni ordinate selezionando k elementi da n. | `permutations(5, 2)` | n (numero), k (numero, opzionale) | `20` |
| **pickRandom** | Sceglie uno o più valori casuali da un array 1D. | `pickRandom([10, 20, 30])` | array | `20` |
| **random** | Restituisce un numero casuale distribuito uniformemente. | `random(1, 10)` | min (opzionale), max (opzionale) | `3.6099423753668143` |
| **randomInt** | Restituisce un numero intero casuale distribuito uniformemente. | `randomInt(1, 10)` | min (opzionale), max (opzionale) | `5` |

### Numeri razionali

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **compare** | Confronta due valori, restituendo -1, 0 o 1. | `compare(2, 3)` | x, y (qualsiasi tipo) | `-1` |
| **compareNatural** | Confronta valori arbitrari in ordine naturale e ripetibile. | `compareNatural('2', '10')` | x, y (qualsiasi tipo) | `-1` |
| **compareText** | Confronta due stringhe in ordine lessicografico. | `compareText('apple', 'banana')` | x (stringa), y (stringa) | `-1` |
| **deepEqual** | Confronta l'uguaglianza di due matrici/array elemento per elemento. | `deepEqual([[1, 2]], [[1, 2]])` | x (Array/Matrice), y (Array/Matrice) | `true` |
| **equal** | Verifica se due valori sono uguali. | `equal(2, 2)` | x, y (qualsiasi tipo) | `true` |
| **equalText** | Verifica se due stringhe sono identiche. | `equalText('hello', 'hello')` | x (stringa), y (stringa) | `true` |
| **larger** | Verifica se x è maggiore di y. | `larger(3, 2)` | x, y (numero o BigNumber) | `true` |
| **largerEq** | Verifica se x è maggiore o uguale a y. | `largerEq(3, 3)` | x, y (numero o BigNumber) | `true` |
| **smaller** | Verifica se x è minore di y. | `smaller(2, 3)` | x, y (numero o BigNumber) | `true` |
| **smallerEq** | Verifica se x è minore o uguale a y. | `smallerEq(2, 2)` | x, y (numero o BigNumber) | `true` |
| **unequal** | Verifica se due valori non sono uguali. | `unequal(2, 3)` | x, y (qualsiasi tipo) | `true` |

### Insiemi

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **setCartesian** | Produce il prodotto cartesiano di due (o più) insiemi. | `setCartesian([1, 2], [3, 4])` | set1 (Array), set2 (Array) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Restituisce la differenza di due insiemi (elementi in set1 ma non in set2). | `setDifference([1, 2, 3], [2])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setDistinct** | Restituisce gli elementi unici all'interno di un (multi)insieme. | `setDistinct([1, 2, 2, 3])` | set (Array) | `[  1,  2,  3]` |
| **setIntersect** | Restituisce l'intersezione di due (o più) insiemi. | `setIntersect([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  2]` |
| **setIsSubset** | Verifica se set1 è un sottoinsieme di set2. | `setIsSubset([1, 2], [1, 2, 3])` | set1 (Array), set2 (Array) | `true` |
| **setMultiplicity** | Conta quante volte un elemento appare in un multiinsieme. | `setMultiplicity(2, [1, 2, 2, 3])` | elemento (qualsiasi tipo), set (Array) | `2` |
| **setPowerset** | Restituisce l'insieme delle parti (tutti i sottoinsiemi) di un (multi)insieme. | `setPowerset([1, 2])` | set (Array) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Conta tutti gli elementi in un (multi)insieme. | `setSize([1, 2, 3])` | set (Array) | `3` |
| **setSymDifference** | Restituisce la differenza simmetrica di due (o più) insiemi. | `setSymDifference([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setUnion** | Restituisce l'unione di due (o più) insiemi. | `setUnion([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3,  2]` |

### Speciali

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **erf** | Calcola la funzione di errore utilizzando un'approssimazione razionale di Chebyshev. | `erf(0.5)` | input x (numero) | `0.5204998778130465` |

### Statistica

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **cumsum** | Calcola la somma cumulativa di una lista o matrice. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Calcola la deviazione mediana assoluta. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Restituisce il valore massimo di una lista o matrice. | `max([1, 2, 3])` |  | `3` |
| **mean** | Calcola il valore medio. | `mean([2, 4, 6])` |  | `4` |
| **median** | Calcola la mediana. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Restituisce il valore minimo di una lista o matrice. | `min([1, 2, 3])` |  | `1` |
| **mode** | Calcola la moda (valore più frequente). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Calcola il prodotto di tutti i numeri in una lista o matrice. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Calcola il quantile alla probabilità `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Calcola la deviazione standard dei dati. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Calcola la somma di tutti i numeri in una lista o matrice. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Calcola la varianza dei dati. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Stringhe

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **bin** | Formatta un numero come binario. | `bin(13)` |  | `13` |
| **format** | Formatta qualsiasi valore come stringa con la precisione specificata. | `format(123.456, 2)` |  | `120` |
| **hex** | Formatta un numero come esadecimale. | `hex(255)` |  | `255` |
| **oct** | Formatta un numero come ottale. | `oct(64)` |  | `64` |
| **print** | Interpola più valori in un template di stringa. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometria

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **acos** | Calcola l'arcocoseno. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Calcola il coseno iperbolico inverso. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Calcola l'arcocotangente. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Calcola la cotangente iperbolica inversa. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Calcola l'arcocosecante. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Calcola la cosecante iperbolica inversa. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Calcola l'arcosecante. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Calcola la secante iperbolica inversa. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Calcola l'arcoseno. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Calcola il seno iperbolico inverso. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Calcola l'arcotangente. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Calcola l'arcotangente con due argomenti. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Calcola la tangente iperbolica inversa. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Calcola il coseno di x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Calcola il coseno iperbolico di x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Calcola la cotangente di x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Calcola la cotangente iperbolica di x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Calcola la cosecante di x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Calcola la cosecante iperbolica di x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Calcola la secante di x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Calcola la secante iperbolica di x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Calcola il seno di x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Calcola il seno iperbolico di x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Calcola la tangente di x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Calcola la tangente iperbolica di x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Unità

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **to** | Converte un valore numerico nell'unità specificata. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Utilità

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| --- | --- | --- | --- | --- |
| **clone** | Clona profondamente il valore di input. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Verifica se l'input contiene un valore numerico. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Verifica se l'input è un intero. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Verifica se l'input è NaN. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Verifica se l'input è negativo. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Verifica se l'input è numerico. | `isNumeric('123')` |  | `false` |
| **isPositive** | Verifica se l'input è positivo. | `isPositive(2)` |  | `true` |
| **isPrime** | Verifica se l'input è un numero primo. | `isPrime(7)` |  | `true` |
| **isZero** | Verifica se l'input è zero. | `isZero(0)` |  | `true` |
| **numeric** | Converte l'input in un tipo numerico (numero, BigNumber, ecc.). | `numeric('123')` |  | `123` |
| **typeOf** | Restituisce il nome del tipo del valore di input. | `typeOf([1, 2, 3])` |  | `Array` |