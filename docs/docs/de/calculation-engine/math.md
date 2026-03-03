:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) ist eine funktionsreiche Mathematik-Bibliothek für JavaScript und Node.js.

## Funktionsreferenz

### Ausdrücke

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **compile** | Analysieren und Kompilieren eines Ausdrucks (verantwortlich für die Analyse, gibt kein direktes Ergebnis zurück). | `compile('2 + 3')` | Ausdruck (Zeichenfolge) | `{}` |
| **evaluate** | Berechnen eines Ausdrucks und Rückgabe des Ergebnisses. | `evaluate('2 + 3')` | Ausdruck (Zeichenfolge), Geltungsbereich (optional) | `5` |
| **help** | Abrufen der Dokumentation für eine Funktion oder einen Datentyp. | `help('evaluate')` | Suchbegriff (Zeichenfolge) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Erstellen eines Parsers für benutzerdefinierte Operationen. | `parser()` | Keine | `{}` |

### Algebra

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **derivative** | Ableiten eines Ausdrucks nach einer angegebenen Variablen. | `derivative('x^2', 'x')` | Ausdruck (Zeichenfolge oder Knoten), Variable (Zeichenfolge) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Zählen der Blattknoten (Symbole oder Konstanten) in einem Ausdrucksbaum. | `leafCount('x^2 + y')` | Ausdruck (Zeichenfolge oder Knoten) | `3` |
| **lsolve** | Lösen eines linearen Gleichungssystems mittels Vorwärtssubstitution. | `lsolve([[1,2],[3,4]], [5,6])` | L (Array oder Matrix), b (Array oder Matrix) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Finden aller Lösungen eines linearen Gleichungssystems mittels Vorwärtssubstitution. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Array oder Matrix), b (Array oder Matrix) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Durchführung einer LU-Zerlegung mit teilweiser Pivotisierung. | `lup([[1,2],[3,4]])` | A (Array oder Matrix) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Lösen eines linearen Gleichungssystems A*x = b, wobei A eine n×n-Matrix ist. | `lusolve([[1,2],[3,4]], [5,6])` | A (Array oder Matrix), b (Array oder Matrix) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Berechnung der QR-Zerlegung einer Matrix. | `qr([[1,2],[3,4]])` | A (Array oder Matrix) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Umwandeln eines rationalisierbaren Ausdrucks in einen rationalen Bruch. | `rationalize('1/(x+1)')` | Ausdruck (Zeichenfolge oder Knoten) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Ersetzen von Symbolen in einem Ausdruck durch Werte aus dem bereitgestellten Geltungsbereich. | `resolve('x + y', {x:2, y:3})` | Ausdruck (Zeichenfolge oder Knoten), Geltungsbereich (Objekt) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Vereinfachen eines Ausdrucksbaums (Zusammenfassen ähnlicher Terme usw.). | `simplify('2x + 3x')` | Ausdruck (Zeichenfolge oder Knoten) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Durchführung einer One-Pass-Vereinfachung, oft in leistungskritischen Szenarien verwendet. | `simplifyCore('x+x')` | Ausdruck (Zeichenfolge oder Knoten) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Berechnung einer dünnbesetzten LU-Zerlegung mit vollständiger Pivotisierung. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Array oder Matrix), Zerlegungsreihenfolge (Zeichenfolge), Schwellenwert (Zahl) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Prüfen, ob zwei Ausdrücke im symbolischen Sinne gleich sind. | `symbolicEqual('x+x', '2x')` | Ausdruck 1 (Zeichenfolge oder Knoten), Ausdruck 2 (Zeichenfolge oder Knoten) | `true` |
| **usolve** | Lösen eines linearen Gleichungssystems mittels Rückwärtssubstitution. | `usolve([[1,2],[0,1]], [3,4])` | U (Array oder Matrix), b (Array oder Matrix) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Finden aller Lösungen eines linearen Gleichungssystems mittels Rückwärtssubstitution. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Array oder Matrix), b (Array oder Matrix) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Arithmetik

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **abs** | Berechnung des Absolutwerts einer Zahl. | `abs(-3.2)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `3.2` |
| **add** | Addieren von zwei oder mehr Werten (x + y). | `add(2, 3)` | x, y, ... (Zahl, Array oder Matrix) | `5` |
| **cbrt** | Berechnung der Kubikwurzel einer Zahl, optional Rückgabe aller Kubikwurzeln. | `cbrt(8)` | x (Zahl oder komplexe Zahl), allRoots (Boolean, optional) | `2` |
| **ceil** | Aufrunden in Richtung positiv unendlich (bei komplexen Zahlen werden Real- und Imaginärteil separat gerundet). | `ceil(3.2)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `4` |
| **cube** | Berechnung des Kubikwerts eines Wertes (x*x*x). | `cube(3)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `27` |
| **divide** | Dividieren zweier Werte (x / y). | `divide(6, 2)` | x (Zahl, Array oder Matrix), y (Zahl, Array oder Matrix) | `3` |
| **dotDivide** | Elementweise Division zweier Matrizen oder Arrays. | `dotDivide([6,8],[2,4])` | x (Array oder Matrix), y (Array oder Matrix) | `[  3,  2]` |
| **dotMultiply** | Elementweise Multiplikation zweier Matrizen oder Arrays. | `dotMultiply([2,3],[4,5])` | x (Array oder Matrix), y (Array oder Matrix) | `[  8,  15]` |
| **dotPow** | Elementweise Potenzierung x^y. | `dotPow([2,3],[2,3])` | x (Array oder Matrix), y (Array oder Matrix) | `[  4,  27]` |
| **exp** | Berechnung von e^x. | `exp(1)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `2.718281828459045` |
| **expm1** | Berechnung von e^x - 1. | `expm1(1)` | x (Zahl oder komplexe Zahl) | `1.718281828459045` |
| **fix** | Runden in Richtung Null (Abschneiden). | `fix(3.7)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `3` |
| **floor** | Runden in Richtung negativ unendlich. | `floor(3.7)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `3` |
| **gcd** | Berechnung des größten gemeinsamen Teilers von zwei oder mehr Zahlen. | `gcd(8, 12)` | a, b, ... (Zahl oder BigNumber) | `4` |
| **hypot** | Berechnung der Quadratwurzel der Summe der Quadrate der Argumente (Satz des Pythagoras). | `hypot(3, 4)` | a, b, ... (Zahl oder BigNumber) | `5` |
| **invmod** | Berechnung des modularen multiplikativen Inversen von a modulo b. | `invmod(3, 11)` | a, b (Zahl oder BigNumber) | `4` |
| **lcm** | Berechnung des kleinsten gemeinsamen Vielfachen von zwei oder mehr Zahlen. | `lcm(4, 6)` | a, b, ... (Zahl oder BigNumber) | `12` |
| **log** | Berechnung des Logarithmus mit optionaler Basis. | `log(100, 10)` | x (Zahl oder komplexe Zahl), base (optional, Zahl oder komplexe Zahl) | `2` |
| **log10** | Berechnung des Logarithmus zur Basis 10 einer Zahl. | `log10(100)` | x (Zahl oder komplexe Zahl) | `2` |
| **log1p** | Berechnung von ln(1 + x). | `log1p(1)` | x (Zahl oder komplexe Zahl) | `0.6931471805599453` |
| **log2** | Berechnung des Logarithmus zur Basis 2 einer Zahl. | `log2(8)` | x (Zahl oder komplexe Zahl) | `3` |
| **mod** | Berechnung des Rests von x ÷ y (x mod y). | `mod(8,3)` | x, y (Zahl oder BigNumber) | `2` |
| **multiply** | Multiplizieren von zwei oder mehr Werten (x * y). | `multiply(2, 3)` | x, y, ... (Zahl, Array oder Matrix) | `6` |
| **norm** | Berechnung der Norm einer Zahl, eines Vektors oder einer Matrix mit optionalem p. | `norm([3,4])` | x (Array oder Matrix), p (Zahl oder Zeichenfolge, optional) | `5` |
| **nthRoot** | Berechnung der n-ten Wurzel (Hauptwurzel) einer Zahl. | `nthRoot(16, 4)` | a (Zahl, BigNumber oder komplexe Zahl), root (optional, Zahl) | `2` |
| **nthRoots** | Berechnung aller n-ten Wurzeln einer Zahl, potenziell inklusive komplexer Lösungen. | `nthRoots(1,3)` | x (Zahl oder komplexe Zahl), root (Zahl) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Berechnung von x^y. | `pow(2, 3)` | x (Zahl, komplexe Zahl, Array oder Matrix), y (Zahl, komplexe Zahl, Array oder Matrix) | `8` |
| **round** | Runden auf eine angegebene Anzahl von Dezimalstellen. | `round(3.14159, 2)` | x (Zahl, komplexe Zahl, Array oder Matrix), n (optional, Zahl) | `3.14` |
| **sign** | Berechnung des Vorzeichens eines Wertes (-1, 0 oder 1). | `sign(-3)` | x (Zahl, BigNumber oder komplexe Zahl) | `-1` |
| **sqrt** | Berechnung der Quadratwurzel einer Zahl. | `sqrt(9)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `3` |
| **square** | Berechnung des Quadrats einer Zahl (x*x). | `square(3)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `9` |
| **subtract** | Subtrahieren zweier Zahlen (x - y). | `subtract(8, 3)` | x, y (Zahl, Array oder Matrix) | `5` |
| **unaryMinus** | Durchführung einer unären Negation (Vorzeichenumkehr). | `unaryMinus(3)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `-3` |
| **unaryPlus** | Durchführung einer unären Plus-Operation (normalerweise keine Änderung). | `unaryPlus(-3)` | x (Zahl, komplexe Zahl, Array oder Matrix) | `-3` |
| **xgcd** | Berechnung des erweiterten größten gemeinsamen Teilers zweier Zahlen. | `xgcd(8, 12)` | a, b (Zahl oder BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Bitweise Operationen

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **bitAnd** | Bitweises UND für zwei Werte (x & y). | `bitAnd(5, 3)` | x, y (Zahl oder BigNumber) | `1` |
| **bitNot** | Bitweise Negation eines Wertes (~x). | `bitNot(5)` | x (Zahl oder BigNumber) | `-6` |
| **bitOr** | Bitweises ODER für zwei Werte (x \| y). | `bitOr(5, 3)` | x, y (Zahl oder BigNumber) | `7` |
| **bitXor** | Bitweises EXKLUSIV-ODER für zwei Werte (x ^ y). | `bitXor(5, 3)` | x, y (Zahl oder BigNumber) | `6` |
| **leftShift** | Linksschieben der Binärbits von x um y Stellen (x << y). | `leftShift(5, 1)` | x, y (Zahl oder BigNumber) | `10` |
| **rightArithShift** | Arithmetisches Rechtsschieben der Binärbits von x (x >> y). | `rightArithShift(5, 1)` | x, y (Zahl oder BigNumber) | `2` |
| **rightLogShift** | Logisches Rechtsschieben der Binärbits von x (x >>> y). | `rightLogShift(5, 1)` | x, y (Zahl oder BigNumber) | `2` |

### Kombinatorik

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Berechnung der Anzahl aller Partitionen von n unterscheidbaren Elementen. | `bellNumbers(3)` | n (Zahl) | `5` |
| **catalan** | Berechnung der n-ten Catalan-Zahl für verschiedene kombinatorische Strukturen. | `catalan(5)` | n (Zahl) | `42` |
| **composition** | Berechnung der Anzahl der Möglichkeiten, n in k Teile zu zerlegen. | `composition(5, 3)` | n, k (Zahl) | `6` |
| **stirlingS2** | Berechnung der Anzahl der Möglichkeiten, n markierte Elemente in k nicht-leere Teilmengen zu partitionieren (Stirling-Zahlen zweiter Art). | `stirlingS2(5, 3)` | n, k (Zahl) | `25` |

### Komplexe Zahlen

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **arg** | Berechnung des Arguments (Phase) einer komplexen Zahl. | `arg(complex('2 + 2i'))` | x (komplexe Zahl oder Zahl) | `0.785398163` |
| **conj** | Berechnung der konjugiert komplexen Zahl. | `conj(complex('2 + 2i'))` | x (komplexe Zahl oder Zahl) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Abrufen des Imaginärteils einer komplexen Zahl. | `im(complex('2 + 3i'))` | x (komplexe Zahl oder Zahl) | `3` |
| **re** | Abrufen des Realteils einer komplexen Zahl. | `re(complex('2 + 3i'))` | x (komplexe Zahl oder Zahl) | `2` |

### Geometrie

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **distance** | Berechnung des euklidischen Abstands zwischen zwei Punkten im N-dimensionalen Raum. | `distance([0,0],[3,4])` | point1 (Array), point2 (Array) | `5` |
| **intersect** | Finden des Schnittpunkts zweier Linien (2D/3D) oder einer Linie und einer Ebene (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | Start- und Endpunkte der Linie 1, Start- und Endpunkte der Linie 2, ... | `[  1,  1]` |

### Logik

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **and** | Durchführung einer logischen UND-Verknüpfung. | `and(true, false)` | x, y (Boole'sche Werte oder Zahlen) | `false` |
| **not** | Durchführung einer logischen NICHT-Operation. | `not(true)` | x (Boole'scher Wert oder Zahl) | `false` |
| **or** | Durchführung einer logischen ODER-Verknüpfung. | `or(true, false)` | x, y (Boole'sche Werte oder Zahlen) | `true` |
| **xor** | Durchführung einer logischen EXKLUSIV-ODER-Verknüpfung. | `xor(1, 0)` | x, y (Boole'sche Werte oder Zahlen) | `true` |

### Matrix

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **column** | Rückgabe einer angegebenen Spalte aus einer Matrix. | `column([[1,2],[3,4]], 1)` | value (Matrix oder Array), index (Zahl) | `[  [    1  ],  [    3  ]]` |
| **concat** | Verketten mehrerer Matrizen/Arrays entlang einer angegebenen Dimension. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Array oder Matrix), dim (Zahl, optional) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Zählen der Anzahl der Elemente in einer Matrix, einem Array oder einer Zeichenfolge. | `count([1,2,3,'hello'])` | x (Array, Matrix oder Zeichenfolge) | `4` |
| **cross** | Berechnung des Kreuzprodukts zweier 3D-Vektoren. | `cross([1,2,3], [4,5,6])` | x, y (Array oder Matrix der Länge 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Berechnung der konjugiert transponierten Matrix. | `ctranspose([[1,2],[3,4]])` | x (Matrix oder Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Berechnung der Determinante einer Matrix. | `det([[1,2],[3,4]])` | x (Matrix oder Array) | `-2` |
| **diag** | Erstellen einer Diagonalmatrix oder Extrahieren der Diagonale einer Matrix. | `diag([1,2,3])` | X (Array oder Matrix) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Berechnung der Differenz zwischen benachbarten Elementen entlang einer Dimension. | `diff([1,4,9,16])` | arr (Array oder Matrix), dim (Zahl, optional) | `[  3,  5,  7]` |
| **dot** | Berechnung des Skalarprodukts zweier Vektoren. | `dot([1,2,3],[4,5,6])` | x, y (Array oder Matrix) | `32` |
| **eigs** | Berechnung der Eigenwerte und (optional) Eigenvektoren einer quadratischen Matrix. | `eigs([[1,2],[3,4]])` | x (Matrix oder Array), codec (numerisch, optional) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Berechnung der Matrix-Exponentialfunktion e^A. | `expm([[1,0],[0,1]])` | x (Matrix oder Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Berechnung der N-dimensionalen schnellen Fourier-Transformation. | `fft([1,2,3,4])` | arr (Array oder Matrix) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Noch nicht unterstützt) Filtern eines Arrays oder einer 1D-Matrix mit einer Testfunktion. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Array oder Matrix), test (Funktion) | `[  "23",  "100",  "55"]` |
| **flatten** | Flachdrücken einer mehrdimensionalen Matrix oder eines Arrays in eine Dimension. | `flatten([[1,2],[3,4]])` | x (Array oder Matrix) | `[  1,  2,  3,  4]` |
| **forEach** | (Noch nicht unterstützt) Iterieren über jedes Element einer Matrix/eines Arrays und Ausführen eines Callbacks. | `forEach([1,2,3], val => console.log(val))` | x (Array oder Matrix), callback (Funktion) | `undefined` |
| **getMatrixDataType** | Überprüfen des Datentyps aller Elemente einer Matrix oder eines Arrays, z. B. 'number' oder 'Complex'. | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Array oder Matrix) | `mixed` |
| **identity** | Erstellen einer n x n (oder m x n) Einheitsmatrix. | `identity(3)` | n (Zahl) oder [m, n] (Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Berechnung der N-dimensionalen inversen schnellen Fourier-Transformation. | `ifft([1,2,3,4])` | arr (Array oder Matrix) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Berechnung der Inversen einer quadratischen Matrix. | `inv([[1,2],[3,4]])` | x (Matrix oder Array) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Berechnung des Kronecker-Produkts zweier Matrizen oder Vektoren. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matrix oder Array) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Erstellen eines neuen Arrays/einer neuen Matrix durch Anwenden eines Callbacks auf jedes Element. | `map([1,2,3], val => val * val)` | x (Array oder Matrix), callback (Funktion) | `[  1,  4,  9]` |
| **matrixFromColumns** | Kombinieren mehrerer Vektoren als separate Spalten zu einer dichten Matrix. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Array oder Matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Noch nicht unterstützt) Erzeugen einer Matrix durch Auswertung einer Funktion für jeden Index. | `matrixFromFunction([5], i => math.random())` | size (Array), fn (Funktion) | `ein Zufallsvektor` |
| **matrixFromRows** | Kombinieren mehrerer Vektoren als separate Zeilen zu einer dichten Matrix. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Array oder Matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Erstellen einer Matrix mit Einsen für die angegebenen Dimensionen. | `ones(2, 3)` | m, n, p... (Zahlen) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Rückgabe des k-ten kleinsten Elements aus einem Array oder einer 1D-Matrix basierend auf der Partition-Selection-Methode. | `partitionSelect([3,1,4,2], 2)` | x (Array oder Matrix), k (Zahl) | `3` |
| **pinv** | Berechnung der Moore-Penrose-Pseudoinversen einer Matrix. | `pinv([[1,2],[2,4]])` | x (Matrix oder Array) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Erzeugen eines Zahlen-Arrays von Start bis Ende (Schrittweite optional). | `range(1, 5, 2)` | start (Zahl), end (Zahl), step (Zahl, optional) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Umformen eines Arrays/einer Matrix in die angegebenen Dimensionen. | `reshape([1,2,3,4,5,6], [2,3])` | x (Array oder Matrix), sizes (Array) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Ändern der Größe einer Matrix auf neue Dimensionen, fehlende Elemente können mit einem Standardwert gefüllt werden. | `resize([1,2,3], [5], 0)` | x (Array oder Matrix), size (Array), defaultValue (optional) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Drehen eines 1x2-Vektors gegen den Uhrzeigersinn um einen Winkel oder Drehen eines 1x3-Vektors um eine Achse. | `rotate([1, 0], Math.PI / 2)` | w (Array oder Matrix), theta (Zahl[, Achse]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Erstellen einer 2x2-Rotationsmatrix für einen gegebenen Winkel in Radiant. | `rotationMatrix(Math.PI / 2)` | theta (Zahl) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Rückgabe einer angegebenen Zeile aus einer Matrix. | `row([[1,2],[3,4]], 1)` | value (Matrix oder Array), index (Zahl) | `[  [    3,    4  ]]` |
| **size** | Berechnung der Größe (Dimensionen) einer Matrix, eines Arrays oder eines Skalars. | `size([[1,2,3],[4,5,6]])` | x (Array, Matrix oder Zahl) | `[  2,  3]` |
| **sort** | Sortieren einer Matrix oder eines Arrays in aufsteigender Reihenfolge. | `sort([3,1,2])` | x (Array oder Matrix) | `[  1,  2,  3]` |
| **sqrtm** | Berechnung der Hauptquadratwurzel einer quadratischen Matrix. | `sqrtm([[4,0],[0,4]])` | A (Matrix oder Array) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Entfernen von inneren und äußeren Singleton-Dimensionen aus einer Matrix. | `squeeze([[[1],[2],[3]]])` | x (Matrix oder Array) | `[  1,  2,  3]` |
| **subset** | Abrufen oder Ersetzen einer Teilmenge einer Matrix oder einer Zeichenfolge. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matrix, Array oder Zeichenfolge), index (Index), replacement (optional) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Berechnung der Spur (Summe der Diagonalelemente) einer quadratischen Matrix. | `trace([[1,2],[3,4]])` | x (Matrix oder Array) | `5` |
| **transpose** | Transponieren einer Matrix. | `transpose([[1,2],[3,4]])` | x (Matrix oder Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Erstellen einer Matrix mit Nullen für die angegebenen Dimensionen. | `zeros(2, 3)` | m, n, p... (Zahlen) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Wahrscheinlichkeit

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **combinations** | Berechnung der Anzahl ungeordneter Kombinationen von k Elementen aus n. | `combinations(5, 2)` | n (Zahl), k (Zahl) | `10` |
| **combinationsWithRep** | Berechnung der Anzahl der Kombinationen mit Wiederholung. | `combinationsWithRep(5, 2)` | n (Zahl), k (Zahl) | `15` |
| **factorial** | Berechnung der Fakultät einer Ganzzahl n. | `factorial(5)` | n (Ganzzahl) | `120` |
| **gamma** | Approximation der Gamma-Funktion. | `gamma(5)` | n (Zahl) | `24` |
| **kldivergence** | Berechnung der KL-Divergenz zwischen zwei Verteilungen. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Array oder Matrix), y (Array oder Matrix) | `0.036690014034750584` |
| **lgamma** | Berechnung des Logarithmus der Gamma-Funktion (erweiterte Approximation). | `lgamma(5)` | n (Zahl) | `3.178053830347945` |
| **multinomial** | Berechnung des Multinomialkoeffizienten basierend auf einer Menge von Zählungen. | `multinomial([1, 2, 3])` | a (Array) | `60` |
| **permutations** | Berechnung der Anzahl geordneter Permutationen von k Elementen aus n. | `permutations(5, 2)` | n (Zahl), k (Zahl, optional) | `20` |
| **pickRandom** | Zufällige Auswahl eines oder mehrerer Werte aus einem 1D-Array. | `pickRandom([10, 20, 30])` | Array | `20` |
| **random** | Abrufen einer gleichmäßig verteilten Zufallszahl. | `random(1, 10)` | Minimum (optional), Maximum (optional) | `3.6099423753668143` |
| **randomInt** | Abrufen einer gleichmäßig verteilten Zufallsganszahl. | `randomInt(1, 10)` | Minimum (optional), Maximum (optional) | `5` |

### Vergleiche

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **compare** | Vergleichen zweier Werte, gibt -1, 0 oder 1 zurück. | `compare(2, 3)` | x, y (beliebiger Typ) | `-1` |
| **compareNatural** | Vergleichen beliebiger Werte in natürlicher, wiederholbarer Reihenfolge. | `compareNatural('2', '10')` | x, y (beliebiger Typ) | `-1` |
| **compareText** | Lexikographischer Vergleich zweier Zeichenfolgen. | `compareText('apple', 'banana')` | x (Zeichenfolge), y (Zeichenfolge) | `-1` |
| **deepEqual** | Elementweiser Vergleich zweier Matrizen/Arrays auf Gleichheit. | `deepEqual([[1, 2]], [[1, 2]])` | x (Array/Matrix), y (Array/Matrix) | `true` |
| **equal** | Prüfen, ob zwei Werte gleich sind. | `equal(2, 2)` | x, y (beliebiger Typ) | `true` |
| **equalText** | Prüfen, ob zwei Zeichenfolgen identisch sind. | `equalText('hello', 'hello')` | x (Zeichenfolge), y (Zeichenfolge) | `true` |
| **larger** | Prüfen, ob x größer als y ist. | `larger(3, 2)` | x, y (Zahl oder BigNumber) | `true` |
| **largerEq** | Prüfen, ob x größer oder gleich y ist. | `largerEq(3, 3)` | x, y (Zahl oder BigNumber) | `true` |
| **smaller** | Prüfen, ob x kleiner als y ist. | `smaller(2, 3)` | x, y (Zahl oder BigNumber) | `true` |
| **smallerEq** | Prüfen, ob x kleiner oder gleich y ist. | `smallerEq(2, 2)` | x, y (Zahl oder BigNumber) | `true` |
| **unequal** | Prüfen, ob zwei Werte ungleich sind. | `unequal(2, 3)` | x, y (beliebiger Typ) | `true` |

### Mengen

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **setCartesian** | Erzeugen des kartesischen Produkts zweier (oder mehrerer) Mengen. | `setCartesian([1, 2], [3, 4])` | Erste Menge (Array), zweite Menge (Array) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Erzeugen der Differenzmenge zweier Mengen (Elemente in Menge 1, aber nicht in Menge 2). | `setDifference([1, 2, 3], [2])` | Erste Menge (Array), zweite Menge (Array) | `[  1,  3]` |
| **setDistinct** | Abrufen der eindeutigen Elemente einer (Multi-)Menge. | `setDistinct([1, 2, 2, 3])` | Menge (Array) | `[  1,  2,  3]` |
| **setIntersect** | Erzeugen der Schnittmenge zweier (oder mehrerer) Mengen. | `setIntersect([1, 2], [2, 3])` | Erste Menge (Array), zweite Menge (Array) | `[  2]` |
| **setIsSubset** | Prüfen, ob Menge 1 eine Teilmenge von Menge 2 ist. | `setIsSubset([1, 2], [1, 2, 3])` | Erste Menge (Array), zweite Menge (Array) | `true` |
| **setMultiplicity** | Zählen, wie oft ein Element in einer Multimenge vorkommt. | `setMultiplicity(2, [1, 2, 2, 3])` | Element (beliebiger Typ), Menge (Array) | `2` |
| **setPowerset** | Erzeugen der Potenzmenge (alle Teilmengen) einer (Multi-)Menge. | `setPowerset([1, 2])` | Menge (Array) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Zählen aller Elemente in einer (Multi-)Menge. | `setSize([1, 2, 3])` | Menge (Array) | `3` |
| **setSymDifference** | Erzeugen der symmetrischen Differenz zweier (oder mehrerer) Mengen (Elemente, die nur in einer der Mengen vorkommen). | `setSymDifference([1, 2], [2, 3])` | Erste Menge (Array), zweite Menge (Array) | `[  1,  3]` |
| **setUnion** | Erzeugen der Vereinigungsmenge zweier (oder mehrerer) Mengen. | `setUnion([1, 2], [2, 3])` | Erste Menge (Array), zweite Menge (Array) | `[  1,  3,  2]` |

### Spezial

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **erf** | Berechnung der Fehlerfunktion mittels einer rationalen Tschebyscheff-Approximation. | `erf(0.5)` | Eingabewert x (Zahl) | `0.5204998778130465` |

### Statistik

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **cumsum** | Berechnung der kumulativen Summe einer Liste oder Matrix. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Berechnung der mittleren absoluten Abweichung (Median Absolute Deviation). | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Rückgabe des Maximalwerts einer Liste oder Matrix. | `max([1, 2, 3])` |  | `3` |
| **mean** | Berechnung des Mittelwerts. | `mean([2, 4, 6])` |  | `4` |
| **median** | Berechnung des Medians. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Rückgabe des Minimalwerts einer Liste oder Matrix. | `min([1, 2, 3])` |  | `1` |
| **mode** | Berechnung des Modalwerts (häufigster Wert). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Berechnung des Produkts aller Zahlen in einer Liste oder Matrix. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Berechnung des Quantils an der Position `prob` in einer Liste oder Matrix. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Berechnung der Standardabweichung der Daten. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Berechnung der Summe aller Zahlen in einer Liste oder Matrix. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Berechnung der Varianz der Daten. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Zeichenfolgen

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **bin** | Formatieren einer Zahl als Binärwert. | `bin(13)` |  | `13` |
| **format** | Umwandeln eines beliebigen Typs in eine Zeichenfolge mit angegebener Präzision. | `format(123.456, 2)` |  | `120` |
| **hex** | Formatieren einer Zahl als Hexadezimalwert. | `hex(255)` |  | `255` |
| **oct** | Formatieren einer Zahl als Oktalwert. | `oct(64)` |  | `64` |
| **print** | Einfügen mehrerer Werte in eine Zeichenfolgen-Vorlage. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometrie

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **acos** | Berechnung des Arkuskosinus. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Berechnung des Areakosinus Hyperbolicus. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Berechnung des Arkuskotangens. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Berechnung des Areakotangens Hyperbolicus. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Berechnung des Arkuskosekans. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Berechnung des Areakosekans Hyperbolicus. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Berechnung des Arkussekans. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Berechnung des Areasekans Hyperbolicus. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Berechnung des Arkussinus. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Berechnung des Areasinus Hyperbolicus. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Berechnung des Arkustangens. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Berechnung des Arkustangens mit zwei Argumenten. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Berechnung des Areatangens Hyperbolicus. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Berechnung des Kosinus von x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Berechnung des Kosinus Hyperbolicus von x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Berechnung des Kotangens von x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Berechnung des Kotangens Hyperbolicus von x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Berechnung des Kosekans von x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Berechnung des Kosekans Hyperbolicus von x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Berechnung des Sekans von x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Berechnung des Sekans Hyperbolicus von x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Berechnung des Sinus von x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Berechnung des Sinus Hyperbolicus von x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Berechnung des Tangens von x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Berechnung des Tangens Hyperbolicus von x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Einheiten

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **to** | Umrechnen eines numerischen Wertes in eine angegebene Einheit. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Allgemein

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| --- | --- | --- | --- | --- |
| **clone** | Erstellen einer tiefen Kopie des Eingabewerts. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Prüfen, ob die Eingabe einen numerischen Wert enthält. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Prüfen, ob die Eingabe eine Ganzzahl ist. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Prüfen, ob die Eingabe NaN (Not a Number) ist. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Prüfen, ob die Eingabe eine negative Zahl ist. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Prüfen, ob die Eingabe ein numerischer Typ ist. | `isNumeric('123')` |  | `false` |
| **isPositive** | Prüfen, ob die Eingabe eine positive Zahl ist. | `isPositive(2)` |  | `true` |
| **isPrime** | Prüfen, ob die Eingabe eine Primzahl ist. | `isPrime(7)` |  | `true` |
| **isZero** | Prüfen, ob die Eingabe 0 ist. | `isZero(0)` |  | `true` |
| **numeric** | Umwandeln des Eingabewerts in einen spezifischen numerischen Typ (z. B. number, BigNumber usw.). | `numeric('123')` |  | `123` |
| **typeOf** | Rückgabe des Typnamens des Eingabewerts. | `typeOf([1, 2, 3])` |  | `Array` |