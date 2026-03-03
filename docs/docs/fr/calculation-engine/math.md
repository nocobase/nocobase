:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) est une bibliothèque mathématique riche en fonctionnalités pour JavaScript et Node.js.

## Référence des fonctions

### Expressions

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **compile** | Analyse et compile une expression (analyse uniquement et ne retourne pas directement de résultat). | `compile('2 + 3')` | expression (chaîne) | `{}` |
| **evaluate** | Évalue une expression et retourne le résultat. | `evaluate('2 + 3')` | expression (chaîne), portée (optionnel) | `5` |
| **help** | Récupère la documentation d'une fonction ou d'un type de données. | `help('evaluate')` | mot-clé de recherche (chaîne) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Crée un analyseur (parser) pour des opérations personnalisées. | `parser()` | Aucun | `{}` |

### Algèbre

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **derivative** | Calcule la dérivée d'une expression par rapport à une variable spécifiée. | `derivative('x^2', 'x')` | expression (chaîne ou nœud), variable (chaîne) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Compte les nœuds feuilles (symboles ou constantes) dans l'arbre d'une expression. | `leafCount('x^2 + y')` | expression (chaîne ou nœud) | `3` |
| **lsolve** | Résout un système linéaire en utilisant la substitution directe (forward substitution). | `lsolve([[1,2],[3,4]], [5,6])` | L (Tableau ou Matrice), b (Tableau ou Matrice) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Trouve toutes les solutions d'un système linéaire en utilisant la substitution directe. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Tableau ou Matrice), b (Tableau ou Matrice) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Effectue une décomposition LU avec pivotage partiel. | `lup([[1,2],[3,4]])` | A (Tableau ou Matrice) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Résout un système linéaire A*x = b où A est une matrice n×n. | `lusolve([[1,2],[3,4]], [5,6])` | A (Tableau ou Matrice), b (Tableau ou Matrice) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Calcule la décomposition QR d'une matrice. | `qr([[1,2],[3,4]])` | A (Tableau ou Matrice) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Convertit une expression rationalisable en fraction rationnelle. | `rationalize('1/(x+1)')` | expression (chaîne ou nœud) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Remplace les symboles d'une expression par les valeurs fournies dans la portée (scope). | `resolve('x + y', {x:2, y:3})` | expression (chaîne ou nœud), portée (objet) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Simplifie l'arbre d'une expression (combine les termes semblables, etc.). | `simplify('2x + 3x')` | expression (chaîne ou nœud) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Effectue une simplification en une seule passe, souvent utilisée dans des cas sensibles aux performances. | `simplifyCore('x+x')` | expression (chaîne ou nœud) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Calcule une décomposition LU creuse (sparse) avec pivotage complet. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Tableau ou Matrice), ordre (chaîne), seuil (nombre) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Vérifie si deux expressions sont symboliquement égales. | `symbolicEqual('x+x', '2x')` | expression1 (chaîne ou nœud), expression2 (chaîne ou nœud) | `true` |
| **usolve** | Résout un système linéaire en utilisant la substitution inverse (back substitution). | `usolve([[1,2],[0,1]], [3,4])` | U (Tableau ou Matrice), b (Tableau ou Matrice) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Trouve toutes les solutions d'un système linéaire en utilisant la substitution inverse. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Tableau ou Matrice), b (Tableau ou Matrice) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Arithmétique

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **abs** | Calcule la valeur absolue d'un nombre. | `abs(-3.2)` | x (nombre, Complexe, Tableau ou Matrice) | `3.2` |
| **add** | Additionne deux valeurs ou plus (x + y). | `add(2, 3)` | x, y, ... (nombre, Tableau ou Matrice) | `5` |
| **cbrt** | Calcule la racine cubique d'un nombre, avec l'option de retourner toutes les racines cubiques. | `cbrt(8)` | x (nombre ou Complexe), allRoots (booléen, optionnel) | `2` |
| **ceil** | Arrondit vers l'infini positif (pour les nombres Complexes, chaque partie est arrondie séparément). | `ceil(3.2)` | x (nombre, Complexe, Tableau ou Matrice) | `4` |
| **cube** | Calcule le cube d'une valeur (x*x*x). | `cube(3)` | x (nombre, Complexe, Tableau ou Matrice) | `27` |
| **divide** | Divise deux valeurs (x / y). | `divide(6, 2)` | x (nombre, Tableau ou Matrice), y (nombre, Tableau ou Matrice) | `3` |
| **dotDivide** | Divise deux matrices ou tableaux élément par élément. | `dotDivide([6,8],[2,4])` | x (Tableau ou Matrice), y (Tableau ou Matrice) | `[  3,  2]` |
| **dotMultiply** | Multiplie deux matrices ou tableaux élément par élément. | `dotMultiply([2,3],[4,5])` | x (Tableau ou Matrice), y (Tableau ou Matrice) | `[  8,  15]` |
| **dotPow** | Calcule x^y élément par élément. | `dotPow([2,3],[2,3])` | x (Tableau ou Matrice), y (Tableau ou Matrice) | `[  4,  27]` |
| **exp** | Calcule e^x. | `exp(1)` | x (nombre, Complexe, Tableau ou Matrice) | `2.718281828459045` |
| **expm1** | Calcule e^x - 1. | `expm1(1)` | x (nombre ou Complexe) | `1.718281828459045` |
| **fix** | Arrondit vers zéro (tronquage). | `fix(3.7)` | x (nombre, Complexe, Tableau ou Matrice) | `3` |
| **floor** | Arrondit vers l'infini négatif. | `floor(3.7)` | x (nombre, Complexe, Tableau ou Matrice) | `3` |
| **gcd** | Calcule le plus grand commun diviseur de deux nombres ou plus. | `gcd(8, 12)` | a, b, ... (nombre ou BigNumber) | `4` |
| **hypot** | Calcule la racine carrée de la somme des carrés des arguments (Pythagore). | `hypot(3, 4)` | a, b, ... (nombre ou BigNumber) | `5` |
| **invmod** | Calcule l'inverse multiplicatif modulaire de a modulo b. | `invmod(3, 11)` | a, b (nombre ou BigNumber) | `4` |
| **lcm** | Calcule le plus petit commun multiple de deux nombres ou plus. | `lcm(4, 6)` | a, b, ... (nombre ou BigNumber) | `12` |
| **log** | Calcule un logarithme avec une base optionnelle. | `log(100, 10)` | x (nombre ou Complexe), base (nombre ou Complexe, optionnel) | `2` |
| **log10** | Calcule le logarithme décimal d'un nombre. | `log10(100)` | x (nombre ou Complexe) | `2` |
| **log1p** | Calcule ln(1 + x). | `log1p(1)` | x (nombre ou Complexe) | `0.6931471805599453` |
| **log2** | Calcule le logarithme binaire d'un nombre. | `log2(8)` | x (nombre ou Complexe) | `3` |
| **mod** | Calcule le reste de x ÷ y (x mod y). | `mod(8,3)` | x, y (nombre ou BigNumber) | `2` |
| **multiply** | Multiplie deux valeurs ou plus (x * y). | `multiply(2, 3)` | x, y, ... (nombre, Tableau ou Matrice) | `6` |
| **norm** | Calcule la norme d'un nombre, d'un vecteur ou d'une matrice avec p optionnel. | `norm([3,4])` | x (Tableau ou Matrice), p (nombre ou chaîne, optionnel) | `5` |
| **nthRoot** | Calcule la racine n-ième (racine principale) d'un nombre. | `nthRoot(16, 4)` | a (nombre, BigNumber ou Complexe), racine (nombre, optionnel) | `2` |
| **nthRoots** | Calcule toutes les racines n-ièmes d'un nombre, potentiellement complexes. | `nthRoots(1,3)` | x (nombre ou Complexe), racine (nombre) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Élève x à la puissance y. | `pow(2, 3)` | x (nombre, Complexe, Tableau ou Matrice), y (nombre, Complexe, Tableau ou Matrice) | `8` |
| **round** | Arrondit à un nombre spécifié de décimales. | `round(3.14159, 2)` | x (nombre, Complexe, Tableau ou Matrice), n (nombre, optionnel) | `3.14` |
| **sign** | Retourne le signe d'un nombre (-1, 0 ou 1). | `sign(-3)` | x (nombre, BigNumber ou Complexe) | `-1` |
| **sqrt** | Calcule la racine carrée d'un nombre. | `sqrt(9)` | x (nombre, Complexe, Tableau ou Matrice) | `3` |
| **square** | Calcule le carré d'une valeur (x*x). | `square(3)` | x (nombre, Complexe, Tableau ou Matrice) | `9` |
| **subtract** | Soustrait une valeur d'une autre (x - y). | `subtract(8, 3)` | x, y (nombre, Tableau ou Matrice) | `5` |
| **unaryMinus** | Applique une négation unaire à une valeur. | `unaryMinus(3)` | x (nombre, Complexe, Tableau ou Matrice) | `-3` |
| **unaryPlus** | Applique un plus unaire (laisse généralement la valeur inchangée). | `unaryPlus(-3)` | x (nombre, Complexe, Tableau ou Matrice) | `-3` |
| **xgcd** | Calcule le plus grand commun diviseur étendu de deux nombres. | `xgcd(8, 12)` | a, b (nombre ou BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Opérations bit à bit

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **bitAnd** | Effectue un ET bit à bit (x & y). | `bitAnd(5, 3)` | x, y (nombre ou BigNumber) | `1` |
| **bitNot** | Effectue un NON bit à bit (~x). | `bitNot(5)` | x (nombre ou BigNumber) | `-6` |
| **bitOr** | Effectue un OU bit à bit (x \| y). | `bitOr(5, 3)` | x, y (nombre ou BigNumber) | `7` |
| **bitXor** | Effectue un OU exclusif bit à bit (x ^ y). | `bitXor(5, 3)` | x, y (nombre ou BigNumber) | `6` |
| **leftShift** | Décale x à gauche de y bits (x << y). | `leftShift(5, 1)` | x, y (nombre ou BigNumber) | `10` |
| **rightArithShift** | Effectue un décalage arithmétique à droite sur x (x >> y). | `rightArithShift(5, 1)` | x, y (nombre ou BigNumber) | `2` |
| **rightLogShift** | Effectue un décalage logique à droite sur x (x >>> y). | `rightLogShift(5, 1)` | x, y (nombre ou BigNumber) | `2` |

### Combinatoire

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Compte les partitions de n éléments distincts. | `bellNumbers(3)` | n (nombre) | `5` |
| **catalan** | Calcule le n-ième nombre de Catalan pour de nombreuses structures combinatoires. | `catalan(5)` | n (nombre) | `42` |
| **composition** | Compte les compositions de n en k parties. | `composition(5, 3)` | n, k (nombre) | `6` |
| **stirlingS2** | Calcule le nombre de façons de partitionner n éléments étiquetés en k sous-ensembles non vides (nombres de Stirling de seconde espèce). | `stirlingS2(5, 3)` | n, k (nombre) | `25` |

### Nombres complexes

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **arg** | Calcule l'argument (phase) d'un nombre complexe. | `arg(complex('2 + 2i'))` | x (Complexe ou nombre) | `0.785398163` |
| **conj** | Calcule le conjugué complexe. | `conj(complex('2 + 2i'))` | x (Complexe ou nombre) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Retourne la partie imaginaire d'un nombre complexe. | `im(complex('2 + 3i'))` | x (Complexe ou nombre) | `3` |
| **re** | Retourne la partie réelle d'un nombre complexe. | `re(complex('2 + 3i'))` | x (Complexe ou nombre) | `2` |

### Géométrie

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **distance** | Calcule la distance euclidienne entre deux points dans un espace à N dimensions. | `distance([0,0],[3,4])` | point1 (Tableau), point2 (Tableau) | `5` |
| **intersect** | Trouve l'intersection de deux lignes (2D/3D) ou d'une ligne et d'un plan (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | extrémités de la ligne 1, extrémités de la ligne 2, ... | `[  1,  1]` |

### Logique

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **and** | Effectue un ET logique. | `and(true, false)` | x, y (booléen ou nombre) | `false` |
| **not** | Effectue un NON logique. | `not(true)` | x (booléen ou nombre) | `false` |
| **or** | Effectue un OU logique. | `or(true, false)` | x, y (booléen ou nombre) | `true` |
| **xor** | Effectue un OU exclusif logique. | `xor(1, 0)` | x, y (booléen ou nombre) | `true` |

### Matrice

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **column** | Retourne la colonne spécifiée d'une matrice. | `column([[1,2],[3,4]], 1)` | valeur (Matrice ou Tableau), index (nombre) | `[  [    1  ],  [    3  ]]` |
| **concat** | Concatène plusieurs matrices/tableaux le long d'une dimension. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Tableau ou Matrice), dim (nombre, optionnel) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Compte le nombre d'éléments dans une matrice, un tableau ou une chaîne. | `count([1,2,3,'hello'])` | x (Tableau, Matrice ou chaîne) | `4` |
| **cross** | Calcule le produit vectoriel de deux vecteurs 3D. | `cross([1,2,3], [4,5,6])` | x, y (Tableau ou Matrice de longueur 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Calcule la transposée conjuguée d'une matrice. | `ctranspose([[1,2],[3,4]])` | x (Matrice ou Tableau) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Calcule le déterminant d'une matrice. | `det([[1,2],[3,4]])` | x (Matrice ou Tableau) | `-2` |
| **diag** | Crée une matrice diagonale ou extrait la diagonale d'une matrice. | `diag([1,2,3])` | X (Tableau ou Matrice) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Calcule la différence entre les éléments adjacents le long d'une dimension. | `diff([1,4,9,16])` | arr (Tableau ou Matrice), dim (nombre, optionnel) | `[  3,  5,  7]` |
| **dot** | Calcule le produit scalaire de deux vecteurs. | `dot([1,2,3],[4,5,6])` | x, y (Tableau ou Matrice) | `32` |
| **eigs** | Calcule les valeurs propres et optionnellement les vecteurs propres d'une matrice carrée. | `eigs([[1,2],[3,4]])` | x (Matrice ou Tableau), codec (nombre, optionnel) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Calcule l'exponentielle de matrice e^A. | `expm([[1,0],[0,1]])` | x (Matrice ou Tableau) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Calcule la transformée de Fourier rapide à N dimensions. | `fft([1,2,3,4])` | arr (Tableau ou Matrice) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Pas encore supporté) Filtre un tableau ou une matrice 1D avec une fonction de test. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Tableau ou Matrice), test (fonction) | `[  "23",  "100",  "55"]` |
| **flatten** | Aplatit une matrice ou un tableau multidimensionnel en 1D. | `flatten([[1,2],[3,4]])` | x (Tableau ou Matrice) | `[  1,  2,  3,  4]` |
| **forEach** | (Pas encore supporté) Itère sur chaque élément d'une matrice/tableau et invoque un rappel (callback). | `forEach([1,2,3], val => console.log(val))` | x (Tableau ou Matrice), callback (fonction) | `undefined` |
| **getMatrixDataType** | Inspecte le type de données de tous les éléments d'une matrice ou d'un tableau (ex: 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Tableau ou Matrice) | `mixed` |
| **identity** | Crée une matrice identité n x n (ou m x n). | `identity(3)` | n (nombre) ou [m, n] (Tableau) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Calcule la transformée de Fourier rapide inverse à N dimensions. | `ifft([1,2,3,4])` | arr (Tableau ou Matrice) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Calcule l'inverse d'une matrice carrée. | `inv([[1,2],[3,4]])` | x (Matrice ou Tableau) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Calcule le produit de Kronecker de deux matrices ou vecteurs. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matrice ou Tableau) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Crée un nouveau tableau/matrice en appliquant un rappel à chaque élément. | `map([1,2,3], val => val * val)` | x (Tableau ou Matrice), callback (fonction) | `[  1,  4,  9]` |
| **matrixFromColumns** | Combine des vecteurs comme colonnes séparées d'une matrice dense. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Tableau ou Matrice) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Pas encore supporté) Construit une matrice en évaluant une fonction pour chaque index. | `matrixFromFunction([5], i => math.random())` | size (Tableau), fn (fonction) | `un vecteur aléatoire` |
| **matrixFromRows** | Combine des vecteurs comme lignes séparées d'une matrice dense. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Tableau ou Matrice) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Crée une matrice remplie de uns pour les dimensions données. | `ones(2, 3)` | m, n, p... (nombre) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Retourne le k-ième plus petit élément en utilisant la sélection par partition. | `partitionSelect([3,1,4,2], 2)` | x (Tableau ou Matrice), k (nombre) | `3` |
| **pinv** | Calcule la pseudo-inverse de Moore–Penrose d'une matrice. | `pinv([[1,2],[2,4]])` | x (Matrice ou Tableau) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Crée un tableau de nombres de start à end (pas optionnel). | `range(1, 5, 2)` | start (nombre), end (nombre), step (nombre, optionnel) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Redimensionne un tableau/matrice selon les dimensions données. | `reshape([1,2,3,4,5,6], [2,3])` | x (Tableau ou Matrice), sizes (Tableau) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Redimensionne une matrice selon de nouvelles dimensions, en remplissant avec une valeur par défaut si fournie. | `resize([1,2,3], [5], 0)` | x (Tableau ou Matrice), size (Tableau), defaultValue (optionnel) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Fait pivoter un vecteur 1x2 dans le sens antihoraire ou fait pivoter un vecteur 1x3 autour d'un axe. | `rotate([1, 0], Math.PI / 2)` | w (Tableau ou Matrice), theta (nombre[, axe]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Crée une matrice de rotation 2x2 pour un angle donné en radians. | `rotationMatrix(Math.PI / 2)` | theta (nombre) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Retourne la ligne spécifiée d'une matrice. | `row([[1,2],[3,4]], 1)` | valeur (Matrice ou Tableau), index (nombre) | `[  [    3,    4  ]]` |
| **size** | Calcule la taille (dimensions) d'une matrice, d'un tableau ou d'un scalaire. | `size([[1,2,3],[4,5,6]])` | x (Tableau, Matrice ou nombre) | `[  2,  3]` |
| **sort** | Trie une matrice ou un tableau par ordre croissant. | `sort([3,1,2])` | x (Tableau ou Matrice) | `[  1,  2,  3]` |
| **sqrtm** | Calcule la racine carrée principale d'une matrice carrée. | `sqrtm([[4,0],[0,4]])` | A (Matrice ou Tableau) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Supprime les dimensions unitaires à l'intérieur ou à l'extérieur d'une matrice. | `squeeze([[[1],[2],[3]]])` | x (Matrice ou Tableau) | `[  1,  2,  3]` |
| **subset** | Récupère ou remplace un sous-ensemble d'une matrice ou d'une chaîne. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matrice, Tableau ou chaîne), index (Index), replacement (optionnel) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Calcule la trace (somme des éléments diagonaux) d'une matrice carrée. | `trace([[1,2],[3,4]])` | x (Matrice ou Tableau) | `5` |
| **transpose** | Transpose une matrice. | `transpose([[1,2],[3,4]])` | x (Matrice ou Tableau) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Crée une matrice remplie de zéros pour les dimensions données. | `zeros(2, 3)` | m, n, p... (nombre) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Probabilités

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **combinations** | Compte les combinaisons lors de la sélection de k éléments non ordonnés parmi n. | `combinations(5, 2)` | n (nombre), k (nombre) | `10` |
| **combinationsWithRep** | Compte les combinaisons lorsque les sélections peuvent se répéter. | `combinationsWithRep(5, 2)` | n (nombre), k (nombre) | `15` |
| **factorial** | Calcule n! pour un entier n. | `factorial(5)` | n (entier) | `120` |
| **gamma** | Approxime la fonction gamma. | `gamma(5)` | n (nombre) | `24` |
| **kldivergence** | Calcule la divergence KL entre deux distributions. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Tableau ou Matrice), y (Tableau ou Matrice) | `0.036690014034750584` |
| **lgamma** | Calcule le logarithme de la fonction gamma. | `lgamma(5)` | n (nombre) | `3.178053830347945` |
| **multinomial** | Calcule un coefficient multinomial à partir d'un ensemble de comptes. | `multinomial([1, 2, 3])` | a (Tableau) | `60` |
| **permutations** | Compte les permutations ordonnées de la sélection de k éléments parmi n. | `permutations(5, 2)` | n (nombre), k (nombre, optionnel) | `20` |
| **pickRandom** | Choisit une ou plusieurs valeurs aléatoires dans un tableau 1D. | `pickRandom([10, 20, 30])` | tableau | `20` |
| **random** | Retourne un nombre aléatoire distribué uniformément. | `random(1, 10)` | min (optionnel), max (optionnel) | `3.6099423753668143` |
| **randomInt** | Retourne un entier aléatoire distribué uniformément. | `randomInt(1, 10)` | min (optionnel), max (optionnel) | `5` |

### Nombres rationnels

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **compare** | Compare deux valeurs, retournant -1, 0 ou 1. | `compare(2, 3)` | x, y (tout type) | `-1` |
| **compareNatural** | Compare des valeurs arbitraires dans un ordre naturel et répétable. | `compareNatural('2', '10')` | x, y (tout type) | `-1` |
| **compareText** | Compare deux chaînes de caractères par ordre lexicographique. | `compareText('apple', 'banana')` | x (chaîne), y (chaîne) | `-1` |
| **deepEqual** | Compare l'égalité de deux matrices/tableaux élément par élément. | `deepEqual([[1, 2]], [[1, 2]])` | x (Tableau/Matrice), y (Tableau/Matrice) | `true` |
| **equal** | Teste si deux valeurs sont égales. | `equal(2, 2)` | x, y (tout type) | `true` |
| **equalText** | Teste si deux chaînes sont identiques. | `equalText('hello', 'hello')` | x (chaîne), y (chaîne) | `true` |
| **larger** | Vérifie si x est plus grand que y. | `larger(3, 2)` | x, y (nombre ou BigNumber) | `true` |
| **largerEq** | Vérifie si x est plus grand ou égal à y. | `largerEq(3, 3)` | x, y (nombre ou BigNumber) | `true` |
| **smaller** | Vérifie si x est plus petit que y. | `smaller(2, 3)` | x, y (nombre ou BigNumber) | `true` |
| **smallerEq** | Vérifie si x est plus petit ou égal à y. | `smallerEq(2, 2)` | x, y (nombre ou BigNumber) | `true` |
| **unequal** | Vérifie si deux valeurs ne sont pas égales. | `unequal(2, 3)` | x, y (tout type) | `true` |

### Ensembles

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **setCartesian** | Produit le produit cartésien de deux (ou plusieurs) ensembles. | `setCartesian([1, 2], [3, 4])` | set1 (Tableau), set2 (Tableau) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Retourne la différence de deux ensembles (éléments dans set1 mais pas dans set2). | `setDifference([1, 2, 3], [2])` | set1 (Tableau), set2 (Tableau) | `[  1,  3]` |
| **setDistinct** | Retourne les éléments uniques à l'intérieur d'un (multi)ensemble. | `setDistinct([1, 2, 2, 3])` | set (Tableau) | `[  1,  2,  3]` |
| **setIntersect** | Retourne l'intersection de deux (ou plusieurs) ensembles. | `setIntersect([1, 2], [2, 3])` | set1 (Tableau), set2 (Tableau) | `[  2]` |
| **setIsSubset** | Vérifie si set1 est un sous-ensemble de set2. | `setIsSubset([1, 2], [1, 2, 3])` | set1 (Tableau), set2 (Tableau) | `true` |
| **setMultiplicity** | Compte combien de fois un élément apparaît dans un multiensemble. | `setMultiplicity(2, [1, 2, 2, 3])` | élément (tout type), set (Tableau) | `2` |
| **setPowerset** | Retourne l'ensemble des parties (tous les sous-ensembles) d'un (multi)ensemble. | `setPowerset([1, 2])` | set (Tableau) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Compte tous les éléments d'un (multi)ensemble. | `setSize([1, 2, 3])` | set (Tableau) | `3` |
| **setSymDifference** | Retourne la différence symétrique de deux (ou plusieurs) ensembles. | `setSymDifference([1, 2], [2, 3])` | set1 (Tableau), set2 (Tableau) | `[  1,  3]` |
| **setUnion** | Retourne l'union de deux (ou plusieurs) ensembles. | `setUnion([1, 2], [2, 3])` | set1 (Tableau), set2 (Tableau) | `[  1,  3,  2]` |

### Spécial

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **erf** | Calcule la fonction d'erreur en utilisant une approximation rationnelle de Chebyshev. | `erf(0.5)` | entrée x (nombre) | `0.5204998778130465` |

### Statistiques

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **cumsum** | Calcule la somme cumulative d'une liste ou d'une matrice. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Calcule l'écart absolu médian (median absolute deviation). | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Retourne la valeur maximale d'une liste ou d'une matrice. | `max([1, 2, 3])` |  | `3` |
| **mean** | Calcule la valeur moyenne. | `mean([2, 4, 6])` |  | `4` |
| **median** | Calcule la médiane. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Retourne la valeur minimale d'une liste ou d'une matrice. | `min([1, 2, 3])` |  | `1` |
| **mode** | Calcule le mode (valeur la plus fréquente). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Calcule le produit de tous les nombres d'une liste ou d'une matrice. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Calcule le quantile à la probabilité `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Calcule l'écart type des données. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Calcule la somme de tous les nombres d'une liste ou d'une matrice. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Calcule la variance des données. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Chaînes de caractères

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **bin** | Formate un nombre en binaire. | `bin(13)` |  | `13` |
| **format** | Formate n'importe quelle valeur en chaîne avec une précision spécifiée. | `format(123.456, 2)` |  | `120` |
| **hex** | Formate un nombre en hexadécimal. | `hex(255)` |  | `255` |
| **oct** | Formate un nombre en octal. | `oct(64)` |  | `64` |
| **print** | Interpole plusieurs valeurs dans un modèle de chaîne. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonométrie

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **acos** | Calcule l'arccosinus. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Calcule l'argument cosinus hyperbolique. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Calcule l'arccotangente. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Calcule l'argument cotangente hyperbolique. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Calcule l'arccosécante. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Calcule l'argument cosécante hyperbolique. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Calcule l'arcsécante. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Calcule l'argument sécante hyperbolique. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Calcule l'arcsinus. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Calcule l'argument sinus hyperbolique. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Calcule l'arctangente. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Calcule l'arctangente avec deux arguments. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Calcule l'argument tangente hyperbolique. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Calcule le cosinus de x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Calcule le cosinus hyperbolique de x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Calcule la cotangente de x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Calcule la cotangente hyperbolique de x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Calcule la cosécante de x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Calcule la cosécante hyperbolique de x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Calcule la sécante de x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Calcule la sécante hyperbolique de x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Calcule le sinus de x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Calcule le sinus hyperbolique de x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Calcule la tangente de x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Calcule la tangente hyperbolique de x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Unités

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **to** | Convertit une valeur numérique vers l'unité spécifiée. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Utilitaires

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| --- | --- | --- | --- | --- |
| **clone** | Effectue une copie profonde (deep clone) de la valeur d'entrée. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Vérifie si l'entrée contient une valeur numérique. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Vérifie si l'entrée est un entier. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Vérifie si l'entrée est NaN. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Vérifie si l'entrée est négative. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Vérifie si l'entrée est de type numérique. | `isNumeric('123')` |  | `false` |
| **isPositive** | Vérifie si l'entrée est positive. | `isPositive(2)` |  | `true` |
| **isPrime** | Vérifie si l'entrée est un nombre premier. | `isPrime(7)` |  | `true` |
| **isZero** | Vérifie si l'entrée est zéro. | `isZero(0)` |  | `true` |
| **numeric** | Convertit l'entrée en un type numérique (number, BigNumber, etc.). | `numeric('123')` |  | `123` |
| **typeOf** | Retourne le nom du type de la valeur d'entrée. | `typeOf([1, 2, 3])` |  | `Array` |