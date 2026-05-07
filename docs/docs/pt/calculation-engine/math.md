:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) é uma biblioteca de matemática rica em recursos para JavaScript e Node.js.

## Referência de Funções

### Expressões

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **compile** | Analisa e compila uma expressão (apenas analisa e não retorna um resultado diretamente). | `compile('2 + 3')` | expressão (string) | `{}` |
| **evaluate** | Avalia uma expressão e retorna o resultado. | `evaluate('2 + 3')` | expressão (string), escopo (opcional) | `5` |
| **help** | Recupera a documentação de uma função ou tipo de dado. | `help('evaluate')` | palavra-chave de busca (string) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Cria um analisador (parser) para operações personalizadas. | `parser()` | Nenhum | `{}` |

### Álgebra

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **derivative** | Diferencia uma expressão em relação a uma variável especificada. | `derivative('x^2', 'x')` | expressão (string ou Node), variável (string) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Conta os nós folha (símbolos ou constantes) em uma árvore de expressão. | `leafCount('x^2 + y')` | expressão (string ou Node) | `3` |
| **lsolve** | Resolve um sistema linear usando substituição direta (forward substitution). | `lsolve([[1,2],[3,4]], [5,6])` | L (Array ou Matriz), b (Array ou Matriz) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Encontra todas as soluções de um sistema linear usando substituição direta. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Array ou Matriz), b (Array ou Matriz) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Realiza uma decomposição LU com pivoteamento parcial. | `lup([[1,2],[3,4]])` | A (Array ou Matriz) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Resolve um sistema linear A*x = b onde A é uma matriz n×n. | `lusolve([[1,2],[3,4]], [5,6])` | A (Array ou Matriz), b (Array ou Matriz) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Calcula a decomposição QR de uma matriz. | `qr([[1,2],[3,4]])` | A (Array ou Matriz) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Converte uma expressão racionalizável em uma fração racional. | `rationalize('1/(x+1)')` | expressão (string ou Node) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Substitui símbolos em uma expressão por valores do escopo fornecido. | `resolve('x + y', {x:2, y:3})` | expressão (string ou Node), escopo (objeto) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Simplifica uma árvore de expressão (combina termos semelhantes, etc.). | `simplify('2x + 3x')` | expressão (string ou Node) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Realiza uma simplificação de passagem única (one-pass), frequentemente usada em casos sensíveis ao desempenho. | `simplifyCore('x+x')` | expressão (string ou Node) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Calcula uma decomposição LU esparsa com pivoteamento total. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Array ou Matriz), ordem (string), limiar (number) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Verifica se duas expressões são simbolicamente iguais. | `symbolicEqual('x+x', '2x')` | expressão1 (string ou Node), expressão2 (string ou Node) | `true` |
| **usolve** | Resolve um sistema linear usando substituição reversa (back substitution). | `usolve([[1,2],[0,1]], [3,4])` | U (Array ou Matriz), b (Array ou Matriz) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Encontra todas as soluções de um sistema linear usando substituição reversa. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Array ou Matriz), b (Array ou Matriz) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Aritmética

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **abs** | Calcula o valor absoluto de um número. | `abs(-3.2)` | x (number, Complex, Array ou Matriz) | `3.2` |
| **add** | Soma dois ou mais valores (x + y). | `add(2, 3)` | x, y, ... (number, Array ou Matriz) | `5` |
| **cbrt** | Calcula a raiz cúbica de um número, opcionalmente retornando todas as raízes cúbicas. | `cbrt(8)` | x (number ou Complex), allRoots (boolean, opcional) | `2` |
| **ceil** | Arredonda em direção ao infinito positivo (para números complexos, cada parte é arredondada separadamente). | `ceil(3.2)` | x (number, Complex, Array ou Matriz) | `4` |
| **cube** | Calcula o cubo de um valor (x*x*x). | `cube(3)` | x (number, Complex, Array ou Matriz) | `27` |
| **divide** | Divide dois valores (x / y). | `divide(6, 2)` | x (number, Array ou Matriz), y (number, Array ou Matriz) | `3` |
| **dotDivide** | Divide duas matrizes ou arrays elemento a elemento. | `dotDivide([6,8],[2,4])` | x (Array ou Matriz), y (Array ou Matriz) | `[  3,  2]` |
| **dotMultiply** | Multiplica duas matrizes ou arrays elemento a elemento. | `dotMultiply([2,3],[4,5])` | x (Array ou Matriz), y (Array ou Matriz) | `[  8,  15]` |
| **dotPow** | Calcula x^y elemento a elemento. | `dotPow([2,3],[2,3])` | x (Array ou Matriz), y (Array ou Matriz) | `[  4,  27]` |
| **exp** | Calcula e^x. | `exp(1)` | x (number, Complex, Array ou Matriz) | `2.718281828459045` |
| **expm1** | Calcula e^x - 1. | `expm1(1)` | x (number ou Complex) | `1.718281828459045` |
| **fix** | Arredonda em direção a zero (truncamento). | `fix(3.7)` | x (number, Complex, Array ou Matriz) | `3` |
| **floor** | Arredonda em direção ao infinito negativo. | `floor(3.7)` | x (number, Complex, Array ou Matriz) | `3` |
| **gcd** | Calcula o máximo divisor comum (MDC) de dois ou mais números. | `gcd(8, 12)` | a, b, ... (number ou BigNumber) | `4` |
| **hypot** | Calcula a raiz quadrada da soma dos quadrados dos argumentos (Pitagórico). | `hypot(3, 4)` | a, b, ... (number ou BigNumber) | `5` |
| **invmod** | Calcula o inverso multiplicativo modular de a módulo b. | `invmod(3, 11)` | a, b (number ou BigNumber) | `4` |
| **lcm** | Calcula o mínimo múltiplo comum (MMC) de dois ou mais números. | `lcm(4, 6)` | a, b, ... (number ou BigNumber) | `12` |
| **log** | Calcula o logaritmo com uma base opcional. | `log(100, 10)` | x (number ou Complex), base (number ou Complex, opcional) | `2` |
| **log10** | Calcula o logaritmo de base 10 de um número. | `log10(100)` | x (number ou Complex) | `2` |
| **log1p** | Calcula ln(1 + x). | `log1p(1)` | x (number ou Complex) | `0.6931471805599453` |
| **log2** | Calcula o logaritmo de base 2 de um número. | `log2(8)` | x (number ou Complex) | `3` |
| **mod** | Calcula o resto de x ÷ y (x mod y). | `mod(8,3)` | x, y (number ou BigNumber) | `2` |
| **multiply** | Multiplica dois ou mais valores (x * y). | `multiply(2, 3)` | x, y, ... (number, Array ou Matriz) | `6` |
| **norm** | Calcula a norma de um número, vetor ou matriz com p opcional. | `norm([3,4])` | x (Array ou Matriz), p (number ou string, opcional) | `5` |
| **nthRoot** | Calcula a enésima raiz (raiz principal) de um número. | `nthRoot(16, 4)` | a (number, BigNumber ou Complex), root (number, opcional) | `2` |
| **nthRoots** | Calcula todas as enésimas raízes de um número, potencialmente complexas. | `nthRoots(1,3)` | x (number ou Complex), root (number) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Eleva x à potência y. | `pow(2, 3)` | x (number, Complex, Array ou Matriz), y (number, Complex, Array ou Matriz) | `8` |
| **round** | Arredonda para um número especificado de casas decimais. | `round(3.14159, 2)` | x (number, Complex, Array ou Matriz), n (number, opcional) | `3.14` |
| **sign** | Retorna o sinal de um número (-1, 0 ou 1). | `sign(-3)` | x (number, BigNumber ou Complex) | `-1` |
| **sqrt** | Calcula a raiz quadrada de um número. | `sqrt(9)` | x (number, Complex, Array ou Matriz) | `3` |
| **square** | Calcula o quadrado de um valor (x*x). | `square(3)` | x (number, Complex, Array ou Matriz) | `9` |
| **subtract** | Subtrai um valor de outro (x - y). | `subtract(8, 3)` | x, y (number, Array ou Matriz) | `5` |
| **unaryMinus** | Aplica a negação unária a um valor. | `unaryMinus(3)` | x (number, Complex, Array ou Matriz) | `-3` |
| **unaryPlus** | Aplica o sinal de mais unário (geralmente deixa o valor inalterado). | `unaryPlus(-3)` | x (number, Complex, Array ou Matriz) | `-3` |
| **xgcd** | Calcula o máximo divisor comum estendido de dois números. | `xgcd(8, 12)` | a, b (number ou BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Operações de Bits

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **bitAnd** | Realiza o AND bit a bit (x & y). | `bitAnd(5, 3)` | x, y (number ou BigNumber) | `1` |
| **bitNot** | Realiza o NOT bit a bit (~x). | `bitNot(5)` | x (number ou BigNumber) | `-6` |
| **bitOr** | Realiza o OR bit a bit (x \| y). | `bitOr(5, 3)` | x, y (number ou BigNumber) | `7` |
| **bitXor** | Realiza o XOR bit a bit (x ^ y). | `bitXor(5, 3)` | x, y (number ou BigNumber) | `6` |
| **leftShift** | Desloca x para a esquerda em y bits (x << y). | `leftShift(5, 1)` | x, y (number ou BigNumber) | `10` |
| **rightArithShift** | Realiza um deslocamento aritmético para a direita em x (x >> y). | `rightArithShift(5, 1)` | x, y (number ou BigNumber) | `2` |
| **rightLogShift** | Realiza um deslocamento lógico para a direita em x (x >>> y). | `rightLogShift(5, 1)` | x, y (number ou BigNumber) | `2` |

### Combinatória

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Conta as partições de n elementos distintos. | `bellNumbers(3)` | n (number) | `5` |
| **catalan** | Calcula o enésimo número de Catalan para diversas estruturas combinatórias. | `catalan(5)` | n (number) | `42` |
| **composition** | Conta as composições de n em k partes. | `composition(5, 3)` | n, k (number) | `6` |
| **stirlingS2** | Calcula o número de maneiras de particionar n itens rotulados em k subconjuntos não vazios (números de Stirling de segunda espécie). | `stirlingS2(5, 3)` | n, k (number) | `25` |

### Números Complexos

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **arg** | Calcula o argumento (fase) de um número complexo. | `arg(complex('2 + 2i'))` | x (Complex ou number) | `0.785398163` |
| **conj** | Calcula o conjugado complexo. | `conj(complex('2 + 2i'))` | x (Complex ou number) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Retorna a parte imaginária de um número complexo. | `im(complex('2 + 3i'))` | x (Complex ou number) | `3` |
| **re** | Retorna a parte real de um número complexo. | `re(complex('2 + 3i'))` | x (Complex ou number) | `2` |

### Geometria

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **distance** | Calcula a distância euclidiana entre dois pontos em um espaço N-dimensional. | `distance([0,0],[3,4])` | ponto1 (Array), ponto2 (Array) | `5` |
| **intersect** | Encontra a interseção de duas retas (2D/3D) ou de uma reta e um plano (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | extremidades da reta 1, extremidades da reta 2, ... | `[  1,  1]` |

### Lógica

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **and** | Realiza um AND lógico. | `and(true, false)` | x, y (boolean ou number) | `false` |
| **not** | Realiza um NOT lógico. | `not(true)` | x (boolean ou number) | `false` |
| **or** | Realiza um OR lógico. | `or(true, false)` | x, y (boolean ou number) | `true` |
| **xor** | Realiza um XOR lógico. | `xor(1, 0)` | x, y (boolean ou number) | `true` |

### Matriz

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **column** | Retorna a coluna especificada de uma matriz. | `column([[1,2],[3,4]], 1)` | valor (Matriz ou Array), índice (number) | `[  [    1  ],  [    3  ]]` |
| **concat** | Concatena múltiplas matrizes/arrays ao longo de uma dimensão. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Array ou Matriz), dim (number, opcional) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Conta o número de elementos em uma matriz, array ou string. | `count([1,2,3,'hello'])` | x (Array, Matriz ou string) | `4` |
| **cross** | Calcula o produto vetorial de dois vetores 3D. | `cross([1,2,3], [4,5,6])` | x, y (Array ou Matriz de comprimento 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Calcula a transposta conjugada de uma matriz. | `ctranspose([[1,2],[3,4]])` | x (Matriz ou Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Calcula o determinante de uma matriz. | `det([[1,2],[3,4]])` | x (Matriz ou Array) | `-2` |
| **diag** | Cria uma matriz diagonal ou extrai a diagonal de uma matriz. | `diag([1,2,3])` | X (Array ou Matriz) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Calcula a diferença entre elementos adjacentes ao longo de uma dimensão. | `diff([1,4,9,16])` | arr (Array ou Matriz), dim (number, opcional) | `[  3,  5,  7]` |
| **dot** | Calcula o produto escalar de dois vetores. | `dot([1,2,3],[4,5,6])` | x, y (Array ou Matriz) | `32` |
| **eigs** | Calcula autovalores e, opcionalmente, autovetores de uma matriz quadrada. | `eigs([[1,2],[3,4]])` | x (Matriz ou Array), codec (number, opcional) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Calcula a exponencial da matriz e^A. | `expm([[1,0],[0,1]])` | x (Matriz ou Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Calcula a transformada rápida de Fourier N-dimensional. | `fft([1,2,3,4])` | arr (Array ou Matriz) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Ainda não suportado) Filtra um array ou matriz 1D com uma função de teste. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Array ou Matriz), teste (função) | `[  "23",  "100",  "55"]` |
| **flatten** | Achata uma matriz ou array multidimensional em 1D. | `flatten([[1,2],[3,4]])` | x (Array ou Matriz) | `[  1,  2,  3,  4]` |
| **forEach** | (Ainda não suportado) Itera sobre cada elemento de uma matriz/array e invoca um callback. | `forEach([1,2,3], val => console.log(val))` | x (Array ou Matriz), callback (função) | `undefined` |
| **getMatrixDataType** | Inspeciona o tipo de dado de todos os elementos em uma matriz ou array (ex: 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Array ou Matriz) | `mixed` |
| **identity** | Cria uma matriz identidade n x n (ou m x n). | `identity(3)` | n (number) ou [m, n] (Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Calcula a FFT inversa N-dimensional. | `ifft([1,2,3,4])` | arr (Array ou Matriz) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Calcula a inversa de uma matriz quadrada. | `inv([[1,2],[3,4]])` | x (Matriz ou Array) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Calcula o produto de Kronecker de duas matrizes ou vetores. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matriz ou Array) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Cria um novo array/matriz aplicando um callback a cada elemento. | `map([1,2,3], val => val * val)` | x (Array ou Matriz), callback (função) | `[  1,  4,  9]` |
| **matrixFromColumns** | Combina vetores como colunas separadas de uma matriz densa. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Array ou Matriz) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Ainda não suportado) Constrói uma matriz avaliando uma função para cada índice. | `matrixFromFunction([5], i => math.random())` | tamanho (Array), fn (função) | `um vetor aleatório` |
| **matrixFromRows** | Combina vetores como linhas separadas de uma matriz densa. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Array ou Matriz) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Cria uma matriz preenchida com o número um para as dimensões dadas. | `ones(2, 3)` | m, n, p... (number) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Retorna o k-ésimo menor elemento usando seleção por partição. | `partitionSelect([3,1,4,2], 2)` | x (Array ou Matriz), k (number) | `3` |
| **pinv** | Calcula a pseudoinversa de Moore–Penrose de uma matriz. | `pinv([[1,2],[2,4]])` | x (Matriz ou Array) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Cria um array de números de start até end (passo opcional). | `range(1, 5, 2)` | início (number), fim (number), passo (number, opcional) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Altera a forma de um array/matriz para as dimensões dadas. | `reshape([1,2,3,4,5,6], [2,3])` | x (Array ou Matriz), tamanhos (Array) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Redimensiona uma matriz para novas dimensões, preenchendo com um valor padrão se fornecido. | `resize([1,2,3], [5], 0)` | x (Array ou Matriz), tamanho (Array), valorPadrão (opcional) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Rotaciona um vetor 1x2 no sentido anti-horário ou rotaciona um vetor 1x3 em torno de um eixo. | `rotate([1, 0], Math.PI / 2)` | w (Array ou Matriz), theta (number[, eixo]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Cria uma matriz de rotação 2x2 para um dado ângulo em radianos. | `rotationMatrix(Math.PI / 2)` | theta (number) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Retorna a linha especificada de uma matriz. | `row([[1,2],[3,4]], 1)` | valor (Matriz ou Array), índice (number) | `[  [    3,    4  ]]` |
| **size** | Calcula o tamanho (dimensões) de uma matriz, array ou escalar. | `size([[1,2,3],[4,5,6]])` | x (Array, Matriz ou number) | `[  2,  3]` |
| **sort** | Ordena uma matriz ou array em ordem crescente. | `sort([3,1,2])` | x (Array ou Matriz) | `[  1,  2,  3]` |
| **sqrtm** | Calcula a raiz quadrada principal de uma matriz quadrada. | `sqrtm([[4,0],[0,4]])` | A (Matriz ou Array) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Remove dimensões unitárias de dentro ou de fora de uma matriz. | `squeeze([[[1],[2],[3]]])` | x (Matriz ou Array) | `[  1,  2,  3]` |
| **subset** | Obtém ou substitui um subconjunto de uma matriz ou string. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matriz, Array ou string), índice (Index), substituição (opcional) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Calcula o traço (soma dos elementos da diagonal) de uma matriz quadrada. | `trace([[1,2],[3,4]])` | x (Matriz ou Array) | `5` |
| **transpose** | Transpõe uma matriz. | `transpose([[1,2],[3,4]])` | x (Matriz ou Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Cria uma matriz preenchida com zeros para as dimensões dadas. | `zeros(2, 3)` | m, n, p... (number) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Probabilidade

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **combinations** | Conta combinações ao selecionar k itens não ordenados de n. | `combinations(5, 2)` | n (number), k (number) | `10` |
| **combinationsWithRep** | Conta combinações quando as seleções podem se repetir. | `combinationsWithRep(5, 2)` | n (number), k (number) | `15` |
| **factorial** | Calcula n! para um inteiro n. | `factorial(5)` | n (inteiro) | `120` |
| **gamma** | Aproxima a função gama. | `gamma(5)` | n (number) | `24` |
| **kldivergence** | Calcula a divergência KL entre duas distribuições. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Array ou Matriz), y (Array ou Matriz) | `0.036690014034750584` |
| **lgamma** | Calcula o logaritmo da função gama. | `lgamma(5)` | n (number) | `3.178053830347945` |
| **multinomial** | Calcula um coeficiente multinomial a partir de um conjunto de contagens. | `multinomial([1, 2, 3])` | a (Array) | `60` |
| **permutations** | Conta permutações ordenadas ao selecionar k itens de n. | `permutations(5, 2)` | n (number), k (number, opcional) | `20` |
| **pickRandom** | Escolhe um ou mais valores aleatórios de um array 1D. | `pickRandom([10, 20, 30])` | array | `20` |
| **random** | Retorna um número aleatório uniformemente distribuído. | `random(1, 10)` | min (opcional), max (opcional) | `3.6099423753668143` |
| **randomInt** | Retorna um número inteiro aleatório uniformemente distribuído. | `randomInt(1, 10)` | min (opcional), max (opcional) | `5` |

### Números Racionais

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **compare** | Compara dois valores, retornando -1, 0 ou 1. | `compare(2, 3)` | x, y (qualquer tipo) | `-1` |
| **compareNatural** | Compara valores arbitrários em ordem natural e repetível. | `compareNatural('2', '10')` | x, y (qualquer tipo) | `-1` |
| **compareText** | Compara duas strings lexicograficamente. | `compareText('apple', 'banana')` | x (string), y (string) | `-1` |
| **deepEqual** | Compara duas matrizes/arrays elemento a elemento para verificar igualdade. | `deepEqual([[1, 2]], [[1, 2]])` | x (Array/Matriz), y (Array/Matriz) | `true` |
| **equal** | Testa se dois valores são iguais. | `equal(2, 2)` | x, y (qualquer tipo) | `true` |
| **equalText** | Testa se duas strings são idênticas. | `equalText('hello', 'hello')` | x (string), y (string) | `true` |
| **larger** | Verifica se x é maior que y. | `larger(3, 2)` | x, y (number ou BigNumber) | `true` |
| **largerEq** | Verifica se x é maior ou igual a y. | `largerEq(3, 3)` | x, y (number ou BigNumber) | `true` |
| **smaller** | Verifica se x é menor que y. | `smaller(2, 3)` | x, y (number ou BigNumber) | `true` |
| **smallerEq** | Verifica se x é menor ou igual a y. | `smallerEq(2, 2)` | x, y (number ou BigNumber) | `true` |
| **unequal** | Verifica se dois valores não são iguais. | `unequal(2, 3)` | x, y (qualquer tipo) | `true` |

### Conjuntos

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **setCartesian** | Produz o produto cartesiano de dois (ou mais) conjuntos. | `setCartesian([1, 2], [3, 4])` | conjunto1 (Array), conjunto2 (Array) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Retorna a diferença de dois conjuntos (elementos no conjunto1, mas não no conjunto2). | `setDifference([1, 2, 3], [2])` | conjunto1 (Array), conjunto2 (Array) | `[  1,  3]` |
| **setDistinct** | Retorna os elementos únicos dentro de um (multi)conjunto. | `setDistinct([1, 2, 2, 3])` | conjunto (Array) | `[  1,  2,  3]` |
| **setIntersect** | Retorna a interseção de dois (ou mais) conjuntos. | `setIntersect([1, 2], [2, 3])` | conjunto1 (Array), conjunto2 (Array) | `[  2]` |
| **setIsSubset** | Verifica se o conjunto1 é um subconjunto do conjunto2. | `setIsSubset([1, 2], [1, 2, 3])` | conjunto1 (Array), conjunto2 (Array) | `true` |
| **setMultiplicity** | Conta quantas vezes um elemento aparece em um multiconjunto. | `setMultiplicity(2, [1, 2, 2, 3])` | elemento (qualquer tipo), conjunto (Array) | `2` |
| **setPowerset** | Retorna o conjunto das partes (todos os subconjuntos) de um (multi)conjunto. | `setPowerset([1, 2])` | conjunto (Array) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Conta todos os elementos em um (multi)conjunto. | `setSize([1, 2, 3])` | conjunto (Array) | `3` |
| **setSymDifference** | Retorna a diferença simétrica de dois (ou mais) conjuntos. | `setSymDifference([1, 2], [2, 3])` | conjunto1 (Array), conjunto2 (Array) | `[  1,  3]` |
| **setUnion** | Retorna a união de dois (ou mais) conjuntos. | `setUnion([1, 2], [2, 3])` | conjunto1 (Array), conjunto2 (Array) | `[  1,  3,  2]` |

### Especial

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **erf** | Calcula a função de erro usando uma aproximação racional de Chebyshev. | `erf(0.5)` | entrada x (number) | `0.5204998778130465` |

### Estatística

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **cumsum** | Calcula a soma cumulativa de uma lista ou matriz. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Calcula o desvio absoluto mediano. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Retorna o valor máximo de uma lista ou matriz. | `max([1, 2, 3])` |  | `3` |
| **mean** | Calcula o valor médio. | `mean([2, 4, 6])` |  | `4` |
| **median** | Calcula a mediana. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Retorna o valor mínimo de uma lista ou matriz. | `min([1, 2, 3])` |  | `1` |
| **mode** | Calcula a moda (valor mais frequente). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Calcula o produto de todos os números em uma lista ou matriz. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Calcula o quantil na probabilidade `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Calcula o desvio padrão dos dados. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Calcula a soma de todos os números em uma lista ou matriz. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Calcula a variância dos dados. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Strings

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **bin** | Formata um número como binário. | `bin(13)` |  | `13` |
| **format** | Formata qualquer valor como uma string com precisão especificada. | `format(123.456, 2)` |  | `120` |
| **hex** | Formata um número como hexadecimal. | `hex(255)` |  | `255` |
| **oct** | Formata um número como octal. | `oct(64)` |  | `64` |
| **print** | Interpola múltiplos valores em um modelo de string. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometria

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **acos** | Calcula o arco cosseno. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Calcula o arco cosseno hiperbólico inverso. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Calcula o arco cotangente. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Calcula o arco cotangente hiperbólico inverso. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Calcula o arco cossecante. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Calcula o arco cossecante hiperbólico inverso. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Calcula o arco secante. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Calcula o arco secante hiperbólico inverso. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Calcula o arco seno. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Calcula o arco seno hiperbólico inverso. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Calcula o arco tangente. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Calcula o arco tangente com dois argumentos. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Calcula o arco tangente hiperbólico inverso. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Calcula o cosseno de x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Calcula o cosseno hiperbólico de x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Calcula a cotangente de x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Calcula a cotangente hiperbólica de x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Calcula a cossecante de x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Calcula a cossecante hiperbólica de x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Calcula a secante de x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Calcula a secante hiperbólica de x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Calcula o seno de x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Calcula o seno hiperbólico de x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Calcula a tangente de x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Calcula a tangente hiperbólica de x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Unidades

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **to** | Converte um valor numérico para a unidade especificada. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Utilitários

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| --- | --- | --- | --- | --- |
| **clone** | Realiza uma cópia profunda (deep clone) do valor de entrada. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Verifica se a entrada contém um valor numérico. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Verifica se a entrada é um número inteiro. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Verifica se a entrada é NaN. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Verifica se a entrada é negativa. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Verifica se a entrada é numérica. | `isNumeric('123')` |  | `false` |
| **isPositive** | Verifica se a entrada é positiva. | `isPositive(2)` |  | `true` |
| **isPrime** | Verifica se a entrada é um número primo. | `isPrime(7)` |  | `true` |
| **isZero** | Verifica se a entrada é zero. | `isZero(0)` |  | `true` |
| **numeric** | Converte a entrada para um tipo numérico (number, BigNumber, etc.). | `numeric('123')` |  | `123` |
| **typeOf** | Retorna o nome do tipo do valor de entrada. | `typeOf([1, 2, 3])` |  | `Array` |