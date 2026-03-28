:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) es una biblioteca matemática rica en funciones para JavaScript y Node.js.

## Referencia de funciones

### Expresiones

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **compile** | Analiza y compila una expresión (solo realiza el análisis y no devuelve un resultado directamente). | `compile('2 + 3')` | expresión (cadena) | `{}` |
| **evaluate** | Evalúa una expresión y devuelve el resultado. | `evaluate('2 + 3')` | expresión (cadena), ámbito (opcional) | `5` |
| **help** | Recupera la documentación de una función o tipo de dato. | `help('evaluate')` | palabra clave de búsqueda (cadena) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Crea un analizador (parser) para operaciones personalizadas. | `parser()` | Ninguno | `{}` |

### Álgebra

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **derivative** | Diferencia una expresión con respecto a una variable especificada. | `derivative('x^2', 'x')` | expresión (cadena o Nodo), variable (cadena) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Cuenta los nodos hoja (símbolos o constantes) en un árbol de expresión. | `leafCount('x^2 + y')` | expresión (cadena o Nodo) | `3` |
| **lsolve** | Resuelve un sistema lineal mediante sustitución hacia adelante. | `lsolve([[1,2],[3,4]], [5,6])` | L (Arreglo o Matriz), b (Arreglo o Matriz) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Encuentra todas las soluciones de un sistema lineal mediante sustitución hacia adelante. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Arreglo o Matriz), b (Arreglo o Matriz) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Realiza una descomposición LU con pivoteo parcial. | `lup([[1,2],[3,4]])` | A (Arreglo o Matriz) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Resuelve un sistema lineal A*x = b donde A es una matriz n×n. | `lusolve([[1,2],[3,4]], [5,6])` | A (Arreglo o Matriz), b (Arreglo o Matriz) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Calcula la descomposición QR de una matriz. | `qr([[1,2],[3,4]])` | A (Arreglo o Matriz) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Convierte una expresión racionalizable en una fracción racional. | `rationalize('1/(x+1)')` | expresión (cadena o Nodo) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Reemplaza los símbolos de una expresión con los valores del ámbito (scope) proporcionado. | `resolve('x + y', {x:2, y:3})` | expresión (cadena o Nodo), ámbito (objeto) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Simplifica un árbol de expresión (combina términos semejantes, etc.). | `simplify('2x + 3x')` | expresión (cadena o Nodo) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Realiza una simplificación de una sola pasada, utilizada a menudo en casos sensibles al rendimiento. | `simplifyCore('x+x')` | expresión (cadena o Nodo) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Calcula una descomposición LU dispersa con pivoteo completo. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Arreglo o Matriz), orden (cadena), umbral (número) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Comprueba si dos expresiones son simbólicamente iguales. | `symbolicEqual('x+x', '2x')` | expresión1 (cadena o Nodo), expresión2 (cadena o Nodo) | `true` |
| **usolve** | Resuelve un sistema lineal mediante sustitución hacia atrás. | `usolve([[1,2],[0,1]], [3,4])` | U (Arreglo o Matriz), b (Arreglo o Matriz) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Encuentra todas las soluciones de un sistema lineal mediante sustitución hacia atrás. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Arreglo o Matriz), b (Arreglo o Matriz) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Aritmética

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **abs** | Calcula el valor absoluto de un número. | `abs(-3.2)` | x (número, Complejo, Arreglo o Matriz) | `3.2` |
| **add** | Suma dos o más valores (x + y). | `add(2, 3)` | x, y, ... (número, Arreglo o Matriz) | `5` |
| **cbrt** | Calcula la raíz cúbica de un número, devolviendo opcionalmente todas las raíces cúbicas. | `cbrt(8)` | x (número o Complejo), allRoots (booleano, opcional) | `2` |
| **ceil** | Redondea hacia el infinito positivo (para números complejos, cada parte se redondea por separado). | `ceil(3.2)` | x (número, Complejo, Arreglo o Matriz) | `4` |
| **cube** | Calcula el cubo de un valor (x*x*x). | `cube(3)` | x (número, Complejo, Arreglo o Matriz) | `27` |
| **divide** | Divide dos valores (x / y). | `divide(6, 2)` | x (número, Arreglo o Matriz), y (número, Arreglo o Matriz) | `3` |
| **dotDivide** | Divide dos matrices o arreglos elemento por elemento. | `dotDivide([6,8],[2,4])` | x (Arreglo o Matriz), y (Arreglo o Matriz) | `[  3,  2]` |
| **dotMultiply** | Multiplica dos matrices o arreglos elemento por elemento. | `dotMultiply([2,3],[4,5])` | x (Arreglo o Matriz), y (Arreglo o Matriz) | `[  8,  15]` |
| **dotPow** | Calcula x^y elemento por elemento. | `dotPow([2,3],[2,3])` | x (Arreglo o Matriz), y (Arreglo o Matriz) | `[  4,  27]` |
| **exp** | Calcula e^x. | `exp(1)` | x (número, Complejo, Arreglo o Matriz) | `2.718281828459045` |
| **expm1** | Calcula e^x - 1. | `expm1(1)` | x (número o Complejo) | `1.718281828459045` |
| **fix** | Redondea hacia cero (truncamiento). | `fix(3.7)` | x (número, Complejo, Arreglo o Matriz) | `3` |
| **floor** | Redondea hacia el infinito negativo. | `floor(3.7)` | x (número, Complejo, Arreglo o Matriz) | `3` |
| **gcd** | Calcula el máximo común divisor de dos o más números. | `gcd(8, 12)` | a, b, ... (número o BigNumber) | `4` |
| **hypot** | Calcula la raíz cuadrada de la suma de los cuadrados de los argumentos (Pitágoras). | `hypot(3, 4)` | a, b, ... (número o BigNumber) | `5` |
| **invmod** | Calcula el inverso multiplicativo modular de a módulo b. | `invmod(3, 11)` | a, b (número o BigNumber) | `4` |
| **lcm** | Calcula el mínimo común múltiplo de dos o más números. | `lcm(4, 6)` | a, b, ... (número o BigNumber) | `12` |
| **log** | Calcula un logaritmo con una base opcional. | `log(100, 10)` | x (número o Complejo), base (número o Complejo, opcional) | `2` |
| **log10** | Calcula el logaritmo en base 10 de un número. | `log10(100)` | x (número o Complejo) | `2` |
| **log1p** | Calcula ln(1 + x). | `log1p(1)` | x (número o Complejo) | `0.6931471805599453` |
| **log2** | Calcula el logaritmo en base 2 de un número. | `log2(8)` | x (número o Complejo) | `3` |
| **mod** | Calcula el resto de x ÷ y (x mod y). | `mod(8,3)` | x, y (número o BigNumber) | `2` |
| **multiply** | Multiplica dos o más valores (x * y). | `multiply(2, 3)` | x, y, ... (número, Arreglo o Matriz) | `6` |
| **norm** | Calcula la norma de un número, vector o matriz con p opcional. | `norm([3,4])` | x (Arreglo o Matriz), p (número o cadena, opcional) | `5` |
| **nthRoot** | Calcula la n-ésima raíz (raíz principal) de un número. | `nthRoot(16, 4)` | a (número, BigNumber o Complejo), raíz (número, opcional) | `2` |
| **nthRoots** | Calcula todas las n-ésimas raíces de un número, potencialmente complejas. | `nthRoots(1,3)` | x (número o Complejo), raíz (número) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Eleva x a la potencia y. | `pow(2, 3)` | x (número, Complejo, Arreglo o Matriz), y (número, Complejo, Arreglo o Matriz) | `8` |
| **round** | Redondea a un número específico de decimales. | `round(3.14159, 2)` | x (número, Complejo, Arreglo o Matriz), n (número, opcional) | `3.14` |
| **sign** | Devuelve el signo de un número (-1, 0 o 1). | `sign(-3)` | x (número, BigNumber o Complejo) | `-1` |
| **sqrt** | Calcula la raíz cuadrada de un número. | `sqrt(9)` | x (número, Complejo, Arreglo o Matriz) | `3` |
| **square** | Calcula el cuadrado de un valor (x*x). | `square(3)` | x (número, Complejo, Arreglo o Matriz) | `9` |
| **subtract** | Resta un valor de otro (x - y). | `subtract(8, 3)` | x, y (número, Arreglo o Matriz) | `5` |
| **unaryMinus** | Aplica la negación unaria a un valor. | `unaryMinus(3)` | x (número, Complejo, Arreglo o Matriz) | `-3` |
| **unaryPlus** | Aplica el signo más unario (normalmente deja el valor sin cambios). | `unaryPlus(-3)` | x (número, Complejo, Arreglo o Matriz) | `-3` |
| **xgcd** | Calcula el máximo común divisor extendido de dos números. | `xgcd(8, 12)` | a, b (número o BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Operaciones de bits

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **bitAnd** | Realiza un AND a nivel de bits (x & y). | `bitAnd(5, 3)` | x, y (número o BigNumber) | `1` |
| **bitNot** | Realiza un NOT a nivel de bits (~x). | `bitNot(5)` | x (número o BigNumber) | `-6` |
| **bitOr** | Realiza un OR a nivel de bits (x \| y). | `bitOr(5, 3)` | x, y (número o BigNumber) | `7` |
| **bitXor** | Realiza un XOR a nivel de bits (x ^ y). | `bitXor(5, 3)` | x, y (número o BigNumber) | `6` |
| **leftShift** | Desplaza x a la izquierda y bits (x << y). | `leftShift(5, 1)` | x, y (número o BigNumber) | `10` |
| **rightArithShift** | Realiza un desplazamiento aritmético a la derecha en x (x >> y). | `rightArithShift(5, 1)` | x, y (número o BigNumber) | `2` |
| **rightLogShift** | Realiza un desplazamiento lógico a la derecha en x (x >>> y). | `rightLogShift(5, 1)` | x, y (número o BigNumber) | `2` |

### Combinatoria

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Cuenta las particiones de n elementos distintos. | `bellNumbers(3)` | n (número) | `5` |
| **catalan** | Calcula el n-ésimo número de Catalan para diversas estructuras combinatorias. | `catalan(5)` | n (número) | `42` |
| **composition** | Cuenta las composiciones de n en k partes. | `composition(5, 3)` | n, k (número) | `6` |
| **stirlingS2** | Calcula el número de formas de particionar n elementos etiquetados en k subconjuntos no vacíos (números de Stirling de segunda clase). | `stirlingS2(5, 3)` | n, k (número) | `25` |

### Números complejos

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **arg** | Calcula el argumento (fase) de un número complejo. | `arg(complex('2 + 2i'))` | x (Complejo o número) | `0.785398163` |
| **conj** | Calcula el conjugado complejo. | `conj(complex('2 + 2i'))` | x (Complejo o número) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Devuelve la parte imaginaria de un número complejo. | `im(complex('2 + 3i'))` | x (Complejo o número) | `3` |
| **re** | Devuelve la parte real de un número complejo. | `re(complex('2 + 3i'))` | x (Complejo o número) | `2` |

### Geometría

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **distance** | Calcula la distancia euclidiana entre dos puntos en un espacio N-dimensional. | `distance([0,0],[3,4])` | punto1 (Arreglo), punto2 (Arreglo) | `5` |
| **intersect** | Encuentra la intersección de dos líneas (2D/3D) o de una línea y un plano (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | puntos finales de la línea 1, puntos finales de la línea 2, ... | `[  1,  1]` |

### Lógica

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **and** | Realiza un AND lógico. | `and(true, false)` | x, y (booleano o número) | `false` |
| **not** | Realiza un NOT lógico. | `not(true)` | x (booleano o número) | `false` |
| **or** | Realiza un OR lógico. | `or(true, false)` | x, y (booleano o número) | `true` |
| **xor** | Realiza un XOR lógico. | `xor(1, 0)` | x, y (booleano o número) | `true` |

### Matrices

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **column** | Devuelve la columna especificada de una matriz. | `column([[1,2],[3,4]], 1)` | valor (Matriz o Arreglo), índice (número) | `[  [    1  ],  [    3  ]]` |
| **concat** | Concatena múltiples matrices/arreglos a lo largo de una dimensión. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Arreglo o Matriz), dim (número, opcional) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Cuenta el número de elementos en una matriz, arreglo o cadena. | `count([1,2,3,'hello'])` | x (Arreglo, Matriz o cadena) | `4` |
| **cross** | Calcula el producto vectorial de dos vectores 3D. | `cross([1,2,3], [4,5,6])` | x, y (Arreglo o Matriz de longitud 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Calcula la transpuesta conjugada de una matriz. | `ctranspose([[1,2],[3,4]])` | x (Matriz o Arreglo) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Calcula el determinante de una matriz. | `det([[1,2],[3,4]])` | x (Matriz o Arreglo) | `-2` |
| **diag** | Crea una matriz diagonal o extrae la diagonal de una matriz. | `diag([1,2,3])` | X (Arreglo o Matriz) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Calcula la diferencia entre elementos adyacentes a lo largo de una dimensión. | `diff([1,4,9,16])` | arr (Arreglo o Matriz), dim (número, opcional) | `[  3,  5,  7]` |
| **dot** | Calcula el producto punto de dos vectores. | `dot([1,2,3],[4,5,6])` | x, y (Arreglo o Matriz) | `32` |
| **eigs** | Calcula los autovalores y, opcionalmente, los autovectores de una matriz cuadrada. | `eigs([[1,2],[3,4]])` | x (Matriz o Arreglo), codec (número, opcional) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Calcula la matriz exponencial e^A. | `expm([[1,0],[0,1]])` | x (Matriz o Arreglo) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Calcula la transformada rápida de Fourier N-dimensional. | `fft([1,2,3,4])` | arr (Arreglo o Matriz) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Aún no soportado) Filtra un arreglo o matriz 1D con una función de prueba. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Arreglo o Matriz), test (función) | `[  "23",  "100",  "55"]` |
| **flatten** | Aplana una matriz o arreglo multidimensional a 1D. | `flatten([[1,2],[3,4]])` | x (Arreglo o Matriz) | `[  1,  2,  3,  4]` |
| **forEach** | (Aún no soportado) Itera sobre cada elemento de una matriz/arreglo e invoca una función de retorno (callback). | `forEach([1,2,3], val => console.log(val))` | x (Arreglo o Matriz), callback (función) | `undefined` |
| **getMatrixDataType** | Inspecciona el tipo de datos de todos los elementos en una matriz o arreglo (ej. 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Arreglo o Matriz) | `mixed` |
| **identity** | Crea una matriz identidad n x n (o m x n). | `identity(3)` | n (número) o [m, n] (Arreglo) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Calcula la transformada rápida de Fourier inversa N-dimensional. | `ifft([1,2,3,4])` | arr (Arreglo o Matriz) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Calcula la inversa de una matriz cuadrada. | `inv([[1,2],[3,4]])` | x (Matriz o Arreglo) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Calcula el producto de Kronecker de dos matrices o vectores. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matriz o Arreglo) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Crea un nuevo arreglo/matriz aplicando una función de retorno a cada elemento. | `map([1,2,3], val => val * val)` | x (Arreglo o Matriz), callback (función) | `[  1,  4,  9]` |
| **matrixFromColumns** | Combina vectores como columnas separadas de una matriz densa. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Arreglo o Matriz) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Aún no soportado) Construye una matriz evaluando una función para cada índice. | `matrixFromFunction([5], i => math.random())` | size (Arreglo), fn (función) | `un vector aleatorio` |
| **matrixFromRows** | Combina vectores como filas separadas de una matriz densa. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Arreglo o Matriz) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Crea una matriz de unos para las dimensiones dadas. | `ones(2, 3)` | m, n, p... (número) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Devuelve el k-ésimo elemento más pequeño utilizando la selección por partición. | `partitionSelect([3,1,4,2], 2)` | x (Arreglo o Matriz), k (número) | `3` |
| **pinv** | Calcula la pseudoinversa de Moore-Penrose de una matriz. | `pinv([[1,2],[2,4]])` | x (Matriz o Arreglo) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Crea un arreglo de números desde el inicio hasta el final (paso opcional). | `range(1, 5, 2)` | inicio (número), fin (número), paso (número, opcional) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Cambia la forma de un arreglo/matriz a las dimensiones dadas. | `reshape([1,2,3,4,5,6], [2,3])` | x (Arreglo o Matriz), tamaños (Arreglo) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Cambia el tamaño de una matriz a nuevas dimensiones, rellenando con un valor predeterminado si se proporciona. | `resize([1,2,3], [5], 0)` | x (Arreglo o Matriz), tamaño (Arreglo), valorPredeterminado (opcional) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Rota un vector 1x2 en sentido antihorario o rota un vector 1x3 alrededor de un eje. | `rotate([1, 0], Math.PI / 2)` | w (Arreglo o Matriz), theta (número[, eje]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Crea una matriz de rotación 2x2 para un ángulo dado en radianes. | `rotationMatrix(Math.PI / 2)` | theta (número) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Devuelve la fila especificada de una matriz. | `row([[1,2],[3,4]], 1)` | valor (Matriz o Arreglo), índice (número) | `[  [    3,    4  ]]` |
| **size** | Calcula el tamaño (dimensiones) de una matriz, arreglo o escalar. | `size([[1,2,3],[4,5,6]])` | x (Arreglo, Matriz o número) | `[  2,  3]` |
| **sort** | Ordena una matriz o arreglo en orden ascendente. | `sort([3,1,2])` | x (Arreglo o Matriz) | `[  1,  2,  3]` |
| **sqrtm** | Calcula la raíz cuadrada principal de una matriz cuadrada. | `sqrtm([[4,0],[0,4]])` | A (Matriz o Arreglo) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Elimina las dimensiones unitarias del interior o exterior de una matriz. | `squeeze([[[1],[2],[3]]])` | x (Matriz o Arreglo) | `[  1,  2,  3]` |
| **subset** | Obtiene o reemplaza un subconjunto de una matriz o cadena. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matriz, Arreglo o cadena), índice (Índice), reemplazo (opcional) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Calcula la traza (suma de los elementos de la diagonal) de una matriz cuadrada. | `trace([[1,2],[3,4]])` | x (Matriz o Arreglo) | `5` |
| **transpose** | Transpone una matriz. | `transpose([[1,2],[3,4]])` | x (Matriz o Arreglo) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Crea una matriz de ceros para las dimensiones dadas. | `zeros(2, 3)` | m, n, p... (número) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Probabilidad

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **combinations** | Cuenta las combinaciones al seleccionar k elementos no ordenados de n. | `combinations(5, 2)` | n (número), k (número) | `10` |
| **combinationsWithRep** | Cuenta las combinaciones cuando las selecciones pueden repetirse. | `combinationsWithRep(5, 2)` | n (número), k (número) | `15` |
| **factorial** | Calcula n! para un entero n. | `factorial(5)` | n (entero) | `120` |
| **gamma** | Aproxima la función gamma. | `gamma(5)` | n (número) | `24` |
| **kldivergence** | Calcula la divergencia KL entre dos distribuciones. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Arreglo o Matriz), y (Arreglo o Matriz) | `0.036690014034750584` |
| **lgamma** | Calcula el logaritmo de la función gamma. | `lgamma(5)` | n (número) | `3.178053830347945` |
| **multinomial** | Calcula un coeficiente multinomial a partir de un conjunto de conteos. | `multinomial([1, 2, 3])` | a (Arreglo) | `60` |
| **permutations** | Cuenta las permutaciones ordenadas al seleccionar k elementos de n. | `permutations(5, 2)` | n (número), k (número, opcional) | `20` |
| **pickRandom** | Elige uno o más valores aleatorios de un arreglo 1D. | `pickRandom([10, 20, 30])` | arreglo | `20` |
| **random** | Devuelve un número aleatorio distribuido uniformemente. | `random(1, 10)` | min (opcional), max (opcional) | `3.6099423753668143` |
| **randomInt** | Devuelve un número entero aleatorio distribuido uniformemente. | `randomInt(1, 10)` | min (opcional), max (opcional) | `5` |

### Números racionales

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **compare** | Compara dos valores, devolviendo -1, 0 o 1. | `compare(2, 3)` | x, y (cualquier tipo) | `-1` |
| **compareNatural** | Compara valores arbitrarios en un orden natural y repetible. | `compareNatural('2', '10')` | x, y (cualquier tipo) | `-1` |
| **compareText** | Compara dos cadenas lexicográficamente. | `compareText('apple', 'banana')` | x (cadena), y (cadena) | `-1` |
| **deepEqual** | Compara dos matrices/arreglos elemento por elemento para verificar la igualdad. | `deepEqual([[1, 2]], [[1, 2]])` | x (Arreglo/Matriz), y (Arreglo/Matriz) | `true` |
| **equal** | Comprueba si dos valores son iguales. | `equal(2, 2)` | x, y (cualquier tipo) | `true` |
| **equalText** | Comprueba si dos cadenas son idénticas. | `equalText('hello', 'hello')` | x (cadena), y (cadena) | `true` |
| **larger** | Comprueba si x es mayor que y. | `larger(3, 2)` | x, y (número o BigNumber) | `true` |
| **largerEq** | Comprueba si x es mayor o igual que y. | `largerEq(3, 3)` | x, y (número o BigNumber) | `true` |
| **smaller** | Comprueba si x es menor que y. | `smaller(2, 3)` | x, y (número o BigNumber) | `true` |
| **smallerEq** | Comprueba si x es menor o igual que y. | `smallerEq(2, 2)` | x, y (número o BigNumber) | `true` |
| **unequal** | Comprueba si dos valores no son iguales. | `unequal(2, 3)` | x, y (cualquier tipo) | `true` |

### Conjuntos

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **setCartesian** | Produce el producto cartesiano de dos (o más) conjuntos. | `setCartesian([1, 2], [3, 4])` | set1 (Arreglo), set2 (Arreglo) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Devuelve la diferencia de dos conjuntos (elementos en set1 pero no en set2). | `setDifference([1, 2, 3], [2])` | set1 (Arreglo), set2 (Arreglo) | `[  1,  3]` |
| **setDistinct** | Devuelve los elementos únicos dentro de un (multi)conjunto. | `setDistinct([1, 2, 2, 3])` | set (Arreglo) | `[  1,  2,  3]` |
| **setIntersect** | Devuelve la intersección de dos (o más) conjuntos. | `setIntersect([1, 2], [2, 3])` | set1 (Arreglo), set2 (Arreglo) | `[  2]` |
| **setIsSubset** | Comprueba si set1 es un subconjunto de set2. | `setIsSubset([1, 2], [1, 2, 3])` | set1 (Arreglo), set2 (Arreglo) | `true` |
| **setMultiplicity** | Cuenta cuántas veces aparece un elemento en un multiconjunto. | `setMultiplicity(2, [1, 2, 2, 3])` | elemento (cualquier tipo), set (Arreglo) | `2` |
| **setPowerset** | Devuelve el conjunto potencia (todos los subconjuntos) de un (multi)conjunto. | `setPowerset([1, 2])` | set (Arreglo) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Cuenta todos los elementos en un (multi)conjunto. | `setSize([1, 2, 3])` | set (Arreglo) | `3` |
| **setSymDifference** | Devuelve la diferencia simétrica de dos (o más) conjuntos. | `setSymDifference([1, 2], [2, 3])` | set1 (Arreglo), set2 (Arreglo) | `[  1,  3]` |
| **setUnion** | Devuelve la unión de dos (o más) conjuntos. | `setUnion([1, 2], [2, 3])` | set1 (Arreglo), set2 (Arreglo) | `[  1,  3,  2]` |

### Especial

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **erf** | Calcula la función de error utilizando una aproximación racional de Chebyshev. | `erf(0.5)` | entrada x (número) | `0.5204998778130465` |

### Estadística

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **cumsum** | Calcula la suma acumulada de una lista o matriz. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Calcula la desviación absoluta de la mediana. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Devuelve el valor máximo de una lista o matriz. | `max([1, 2, 3])` |  | `3` |
| **mean** | Calcula el valor medio. | `mean([2, 4, 6])` |  | `4` |
| **median** | Calcula la mediana. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Devuelve el valor mínimo de una lista o matriz. | `min([1, 2, 3])` |  | `1` |
| **mode** | Calcula la moda (el valor más frecuente). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Calcula el producto de todos los números en una lista o matriz. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Calcula el cuantil en la probabilidad `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Calcula la desviación estándar de los datos. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Calcula la suma de todos los números en una lista o matriz. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Calcula la varianza de los datos. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Cadenas

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **bin** | Formatea un número como binario. | `bin(13)` |  | `13` |
| **format** | Formatea cualquier valor como una cadena con la precisión especificada. | `format(123.456, 2)` |  | `120` |
| **hex** | Formatea un número como hexadecimal. | `hex(255)` |  | `255` |
| **oct** | Formatea un número como octal. | `oct(64)` |  | `64` |
| **print** | Interpola múltiples valores en una plantilla de cadena. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometría

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **acos** | Calcula el arcocoseno. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Calcula el coseno hiperbólico inverso. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Calcula la arcocotangente. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Calcula la cotangente hiperbólica inversa. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Calcula la arcocosecante. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Calcula la cosecante hiperbólica inversa. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Calcula la arcosecante. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Calcula la secante hiperbólica inversa. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Calcula el arcoseno. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Calcula el seno hiperbólico inverso. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Calcula la arcotangente. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Calcula la arcotangente con dos argumentos. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Calcula la tangente hiperbólica inversa. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Calcula el coseno de x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Calcula el coseno hiperbólico de x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Calcula la cotangente de x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Calcula la cotangente hiperbólica de x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Calcula la cosecante de x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Calcula la cosecante hiperbólica de x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Calcula la secante de x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Calcula la secante hiperbólica de x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Calcula el seno de x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Calcula el seno hiperbólico de x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Calcula la tangente de x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Calcula la tangente hiperbólica de x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Unidades

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **to** | Convierte un valor numérico a la unidad especificada. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Utilidades

| Función | Definición | Llamada de ejemplo | Parámetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **clone** | Realiza una clonación profunda del valor de entrada. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Comprueba si la entrada contiene un valor numérico. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Comprueba si la entrada es un entero. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Comprueba si la entrada es NaN. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Comprueba si la entrada es negativa. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Comprueba si la entrada es numérica. | `isNumeric('123')` |  | `false` |
| **isPositive** | Comprueba si la entrada es positiva. | `isPositive(2)` |  | `true` |
| **isPrime** | Comprueba si la entrada es prima. | `isPrime(7)` |  | `true` |
| **isZero** | Comprueba si la entrada es cero. | `isZero(0)` |  | `true` |
| **numeric** | Convierte la entrada a un tipo numérico (número, BigNumber, etc.). | `numeric('123')` |  | `123` |
| **typeOf** | Devuelve el nombre del tipo del valor de entrada. | `typeOf([1, 2, 3])` |  | `Array` |