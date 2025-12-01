# Mathjs

[Math.js](https://mathjs.org/) 是一个功能丰富的 JavaScript 和 Node.js 数学库。

## 函数参考

### 表达式

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **compile** | 解析并编译表达式（负责解析，不直接返回结果）。 | `compile('2 + 3')` | 表达式（字符串） | `{}` |
| **evaluate** | 计算表达式并返回结果。 | `evaluate('2 + 3')` | 表达式（字符串），作用域（可选） | `5` |
| **help** | 检索函数或数据类型的使用说明。 | `help('evaluate')` | 搜索关键字（字符串） | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | 创建自定义操作用的解析器。 | `parser()` | 无 | `{}` |

### 代数计算

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **derivative** | 对表达式进行求导，并指定变量。 | `derivative('x^2', 'x')` | 表达式（字符串或节点），变量（字符串） | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | 统计表达式解析树中的叶节点数量（符号或常量）。 | `leafCount('x^2 + y')` | 表达式（字符串或节点） | `3` |
| **lsolve** | 使用前向替换法求解线性方程组的一个解。 | `lsolve([[1,2],[3,4]], [5,6])` | L（数组或矩阵），b（数组或矩阵） | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | 使用前向替换法求解线性方程组的所有解。 | `lsolveAll([[1,2],[3,4]], [5,6])` | L（数组或矩阵），b（数组或矩阵） | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | 对矩阵执行部分主元LU分解。 | `lup([[1,2],[3,4]])` | A（数组或矩阵） | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | 求解线性方程 A*x=b（A 为 n×n 矩阵）。 | `lusolve([[1,2],[3,4]], [5,6])` | A（数组或矩阵），b（数组或矩阵） | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | 对矩阵执行 QR 分解。 | `qr([[1,2],[3,4]])` | A（数组或矩阵） | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | 将可有理化的表达式转换为有理分式。 | `rationalize('1/(x+1)')` | 表达式（字符串或节点） | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | 用给定作用域中的值替换表达式中的变量。 | `resolve('x + y', {x:2, y:3})` | 表达式（字符串或节点），作用域（对象） | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | 简化表达式解析树（合并同类项等）。 | `simplify('2x + 3x')` | 表达式（字符串或节点） | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | 单次传递（one-pass）简化表达式，多用于性能敏感场景。 | `simplifyCore('x+x')` | 表达式（字符串或节点） | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | 以完全主元方式计算稀疏 LU 分解。 | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A（数组或矩阵），分解顺序（字符串），阈值（数字） | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | 检测两个表达式在符号意义上是否相等。 | `symbolicEqual('x+x', '2x')` | 表达式1（字符串或节点），表达式2（字符串或节点） | `true` |
| **usolve** | 使用回代法求解线性方程组的一个解。 | `usolve([[1,2],[0,1]], [3,4])` | U（数组或矩阵），b（数组或矩阵） | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | 使用回代法求解线性方程组的所有解。 | `usolveAll([[1,2],[0,1]], [3,4])` | U（数组或矩阵），b（数组或矩阵） | `[  [    [      -5    ],    [      4    ]  ]]` |

### 算术计算

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **abs** | 计算一个数的绝对值。 | `abs(-3.2)` | x（数字、复数、数组或矩阵） | `3.2` |
| **add** | 将两个或更多数值相加（x + y）。 | `add(2, 3)` | x、y、…（数字、数组或矩阵） | `5` |
| **cbrt** | 计算一个数的立方根，可选地计算所有立方根。 | `cbrt(8)` | x（数字或复数），allRoots（布尔，可选） | `2` |
| **ceil** | 向正无穷方向取整（对于复数则对实部和虚部分别取整）。 | `ceil(3.2)` | x（数字、复数、数组或矩阵） | `4` |
| **cube** | 计算一个数的立方 (x*x*x)。 | `cube(3)` | x（数字、复数、数组或矩阵） | `27` |
| **divide** | 两个值相除 (x / y)。 | `divide(6, 2)` | x（数字、数组或矩阵），y（数字、数组或矩阵） | `3` |
| **dotDivide** | 逐元素地对两个矩阵或数组执行除法。 | `dotDivide([6,8],[2,4])` | x（数组或矩阵），y（数组或矩阵） | `[  3,  2]` |
| **dotMultiply** | 逐元素地对两个矩阵或数组执行乘法。 | `dotMultiply([2,3],[4,5])` | x（数组或矩阵），y（数组或矩阵） | `[  8,  15]` |
| **dotPow** | 逐元素地对 x^y 求幂。 | `dotPow([2,3],[2,3])` | x（数组或矩阵），y（数组或矩阵） | `[  4,  27]` |
| **exp** | 计算 e^x。 | `exp(1)` | x（数字、复数、数组或矩阵） | `2.718281828459045` |
| **expm1** | 计算 e^x - 1。 | `expm1(1)` | x（数字或复数） | `1.718281828459045` |
| **fix** | 向零方向取整（截断）。 | `fix(3.7)` | x（数字、复数、数组或矩阵） | `3` |
| **floor** | 向负无穷方向取整。 | `floor(3.7)` | x（数字、复数、数组或矩阵） | `3` |
| **gcd** | 求两个或更多数的最大公约数。 | `gcd(8, 12)` | a, b, ...（数字或大数） | `4` |
| **hypot** | 计算多个数的平方和的平方根（如勾股定理）。 | `hypot(3, 4)` | a, b, …（数字或大数） | `5` |
| **invmod** | 计算 a 在模 b 意义下的乘法逆元。 | `invmod(3, 11)` | a, b（数字或大数） | `4` |
| **lcm** | 求两个或更多数的最小公倍数。 | `lcm(4, 6)` | a, b, ...（数字或大数） | `12` |
| **log** | 计算对数（可指定底）。 | `log(100, 10)` | x（数字或复数），base（可选，数字或复数） | `2` |
| **log10** | 计算一个数的 10 进制对数。 | `log10(100)` | x（数字或复数） | `2` |
| **log1p** | 计算 ln(1 + x)。 | `log1p(1)` | x（数字或复数） | `0.6931471805599453` |
| **log2** | 计算一个数的 2 进制对数。 | `log2(8)` | x（数字或复数） | `3` |
| **mod** | 计算 x ÷ y 的余数（x mod y）。 | `mod(8,3)` | x, y（数字或大数） | `2` |
| **multiply** | 将两个或更多数值相乘（x * y）。 | `multiply(2, 3)` | x、y、…（数字、数组或矩阵） | `6` |
| **norm** | 计算数字、向量或矩阵的范数，可选 p。 | `norm([3,4])` | x（数组或矩阵），p（数字或字符串，可选） | `5` |
| **nthRoot** | 计算一个数的 n 次方根（主根）。 | `nthRoot(16, 4)` | a（数字、大数或复数），root（可选，数字） | `2` |
| **nthRoots** | 计算一个数的所有 n 次方根，可能包含复数解。 | `nthRoots(1,3)` | x（数字或复数），root（数字） | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | 计算 x^y。 | `pow(2, 3)` | x（数字、复数、数组或矩阵），y（数字、复数、数组或矩阵） | `8` |
| **round** | 四舍五入到指定的小数位数。 | `round(3.14159, 2)` | x（数字、复数、数组或矩阵），n（可选，数字） | `3.14` |
| **sign** | 计算数值的符号（-1、0 或 1）。 | `sign(-3)` | x（数字、大数或复数） | `-1` |
| **sqrt** | 计算一个数的平方根。 | `sqrt(9)` | x（数字、复数、数组或矩阵） | `3` |
| **square** | 计算一个数的平方 (x*x)。 | `square(3)` | x（数字、复数、数组或矩阵） | `9` |
| **subtract** | 两个数相减 (x - y)。 | `subtract(8, 3)` | x, y（数字、数组或矩阵） | `5` |
| **unaryMinus** | 对值执行一元负操作（取反）。 | `unaryMinus(3)` | x（数字、复数、数组或矩阵） | `-3` |
| **unaryPlus** | 对值执行一元加操作（通常无实际变化）。 | `unaryPlus(-3)` | x（数字、复数、数组或矩阵） | `-3` |
| **xgcd** | 计算两个数的扩展最大公约数。 | `xgcd(8, 12)` | a, b（数字或大数） | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### 位运算

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bitAnd** | 对两个值进行按位与 (x & y)。 | `bitAnd(5, 3)` | x, y（数字或大数） | `1` |
| **bitNot** | 对值执行按位取反 (~x)。 | `bitNot(5)` | x（数字或大数） | `-6` |
| **bitOr** | 对两个值进行按位或 (x \ | `y)。` | bitOr(5, 3) | `x, y（数字或大数）` |
| **bitXor** | 对两个值进行按位异或 (x ^ y)。 | `bitXor(5, 3)` | x, y（数字或大数） | `6` |
| **leftShift** | 将 x 的二进制位左移 y 位 (x << y)。 | `leftShift(5, 1)` | x, y（数字或大数） | `10` |
| **rightArithShift** | 对 x 的二进制位进行算术右移 (x >> y)。 | `rightArithShift(5, 1)` | x, y（数字或大数） | `2` |
| **rightLogShift** | 对 x 的二进制位进行逻辑右移 (x >>> y)。 | `rightLogShift(5, 1)` | x, y（数字或大数） | `2` |

### 组合学

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bellNumbers** | 计算 n 个互异元素的所有划分方式数量。 | `bellNumbers(3)` | n（数字） | `5` |
| **catalan** | 计算 n 的卡塔兰数，对应多种组合结构计数。 | `catalan(5)` | n（数字） | `42` |
| **composition** | 计算将 n 拆分成 k 部分的组合数。 | `composition(5, 3)` | n, k（数字） | `6` |
| **stirlingS2** | 计算将 n 个有标签的元素划分为 k 个非空子集的方式（第二类斯特林数）。 | `stirlingS2(5, 3)` | n, k（数字） | `25` |

### 复数

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **arg** | 计算复数的幅角（相位）。 | `arg(complex('2 + 2i'))` | x（复数或数字） | `0.785398163` |
| **conj** | 计算复数的共轭。 | `conj(complex('2 + 2i'))` | x（复数或数字） | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | 获取复数的虚部。 | `im(complex('2 + 3i'))` | x（复数或数字） | `3` |
| **re** | 获取复数的实部。 | `re(complex('2 + 3i'))` | x（复数或数字） | `2` |

### 几何

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **distance** | 计算 N 维空间中两点之间的欧几里得距离。 | `distance([0,0],[3,4])` | point1（数组），point2（数组） | `5` |
| **intersect** | 求两条线（二维/三维）或一条线与一个平面（三维）的交点。 | `intersect([0,0],[2,2],[0,2],[2,0])` | 直线1的起点与终点，直线2的起点与终点，... | `[  1,  1]` |

### 逻辑

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **and** | 执行逻辑与运算。 | `and(true, false)` | x, y（布尔值或数字） | `false` |
| **not** | 执行逻辑非运算。 | `not(true)` | x（布尔值或数字） | `false` |
| **or** | 执行逻辑或运算。 | `or(true, false)` | x, y（布尔值或数字） | `true` |
| **xor** | 执行逻辑异或运算。 | `xor(1, 0)` | x, y（布尔值或数字） | `true` |

### 矩阵

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **column** | 从矩阵中返回指定列。 | `column([[1,2],[3,4]], 1)` | value（矩阵或数组），index（数字） | `[  [    1  ],  [    3  ]]` |
| **concat** | 沿指定维度拼接多个矩阵/数组。 | `concat([1,2], [3,4], [5,6])` | a, b, c, ...（数组或矩阵），dim（数字，可选） | `[  1,  2,  3,  4,  5,  6]` |
| **count** | 统计矩阵、数组或字符串的元素数量。 | `count([1,2,3,'hello'])` | x（数组、矩阵或字符串） | `4` |
| **cross** | 计算两个三维向量的叉积。 | `cross([1,2,3], [4,5,6])` | x, y（长度为3的数组或矩阵） | `[  -3,  6,  -3]` |
| **ctranspose** | 对矩阵进行转置并取共轭。 | `ctranspose([[1,2],[3,4]])` | x（矩阵或数组） | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | 计算矩阵的行列式。 | `det([[1,2],[3,4]])` | x（矩阵或数组） | `-2` |
| **diag** | 创建对角矩阵或提取矩阵的对角线。 | `diag([1,2,3])` | X（数组或矩阵） | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | 计算指定维度上相邻元素之间的差值。 | `diff([1,4,9,16])` | arr（数组或矩阵），dim（数字，可选） | `[  3,  5,  7]` |
| **dot** | 计算两个向量的点积。 | `dot([1,2,3],[4,5,6])` | x, y（数组或矩阵） | `32` |
| **eigs** | 计算方阵的特征值和（可选）特征向量。 | `eigs([[1,2],[3,4]])` | x（矩阵或数组），codec（数值，可选） | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | 计算矩阵的指数 e^A。 | `expm([[1,0],[0,1]])` | x（矩阵或数组） | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | 计算 N 维快速傅里叶变换。 | `fft([1,2,3,4])` | arr（数组或矩阵） | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | （暂不支持）使用测试函数过滤数组或一维矩阵。 | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x（数组或矩阵），test（函数） | `[  "23",  "100",  "55"]` |
| **flatten** | 将多维矩阵或数组展开为一维。 | `flatten([[1,2],[3,4]])` | x（数组或矩阵） | `[  1,  2,  3,  4]` |
| **forEach** | （暂不支持）遍历矩阵/数组的每个元素并执行回调。 | `forEach([1,2,3], val => console.log(val))` | x（数组或矩阵），callback（函数） | `undefined` |
| **getMatrixDataType** | 查看矩阵或数组所有元素的数据类型，例如 'number' 或 'Complex'。 | `getMatrixDataType([[1,2.2],[3,'hello']])` | x（数组或矩阵） | `mixed` |
| **identity** | 创建 n x n（或 m x n）的单位矩阵。 | `identity(3)` | n（数字）或 [m, n]（数组） | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | 计算 N 维逆快速傅里叶变换。 | `ifft([1,2,3,4])` | arr（数组或矩阵） | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | 计算方阵的逆矩阵。 | `inv([[1,2],[3,4]])` | x（矩阵或数组） | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | 计算两个矩阵或向量的克罗内克积。 | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y（矩阵或数组） | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | 通过对每个元素应用回调创建新的数组/矩阵。 | `map([1,2,3], val => val * val)` | x（数组或矩阵），callback（函数） | `[  1,  4,  9]` |
| **matrixFromColumns** | 将多个向量作为单独列组合成一个稠密矩阵。 | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr（数组或矩阵） | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (暂不支持) 根据函数对矩阵每个索引进行求值来生成矩阵。 | `matrixFromFunction([5], i => math.random())` | size（数组），fn（函数） | `a random vector` |
| **matrixFromRows** | 将多个向量作为单独行组合成一个稠密矩阵。 | `matrixFromRows([1,2,3],[4,5,6])` | ...arr（数组或矩阵） | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | 创建给定维度的全 1 矩阵。 | `ones(2, 3)` | m, n, p...（数字） | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | 基于分区选择法，从数组或一维矩阵返回第 k 小的元素。 | `partitionSelect([3,1,4,2], 2)` | x（数组或矩阵），k（数字） | `3` |
| **pinv** | 计算矩阵的 Moore–Penrose 伪逆。 | `pinv([[1,2],[2,4]])` | x（矩阵或数组） | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | 从 start 到 end 生成一个数字数组（step 可选）。 | `range(1, 5, 2)` | start（数字），end（数字），step（数字，可选） | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | 将数组/矩阵重塑为指定维度。 | `reshape([1,2,3,4,5,6], [2,3])` | x（数组或矩阵），sizes（数组） | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | 将矩阵调整为新维度，可用默认值填充缺失元素。 | `resize([1,2,3], [5], 0)` | x（数组或矩阵），size（数组），defaultValue（可选） | `[  1,  2,  3,  0,  0]` |
| **rotate** | 将 1x2 向量逆时针旋转一定角度，或对 1x3 向量绕给定轴旋转。 | `rotate([1, 0], Math.PI / 2)` | w（数组或矩阵），theta（数字[, 轴]） | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | 创建给定弧度的 2x2 旋转矩阵。 | `rotationMatrix(Math.PI / 2)` | theta（数字） | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | 从矩阵中返回指定行。 | `row([[1,2],[3,4]], 1)` | value（矩阵或数组），index（数字） | `[  [    3,    4  ]]` |
| **size** | 计算矩阵、数组或标量的尺寸（维度）。 | `size([[1,2,3],[4,5,6]])` | x（数组、矩阵或数字） | `[  2,  3]` |
| **sort** | 对矩阵或数组进行升序排序。 | `sort([3,1,2])` | x（数组或矩阵） | `[  1,  2,  3]` |
| **sqrtm** | 计算方阵的主平方根。 | `sqrtm([[4,0],[0,4]])` | A（矩阵或数组） | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | 移除矩阵中内部和外部的单一维度。 | `squeeze([[[1],[2],[3]]])` | x（矩阵或数组） | `[  1,  2,  3]` |
| **subset** | 获取或替换矩阵或字符串的子集。 | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x（矩阵、数组或字符串），index（索引），replacement（可选） | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | 计算方阵的迹（对角线元素之和）。 | `trace([[1,2],[3,4]])` | x（矩阵或数组） | `5` |
| **transpose** | 对矩阵进行转置。 | `transpose([[1,2],[3,4]])` | x（矩阵或数组） | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | 创建给定维度的全 0 矩阵。 | `zeros(2, 3)` | m, n, p...（数字） | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### 概率

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **combinations** | 计算从 n 个元素中取 k 个无序组合的数量。 | `combinations(5, 2)` | n（数值），k（数值） | `10` |
| **combinationsWithRep** | 计算可重复元素的组合数量。 | `combinationsWithRep(5, 2)` | n（数值），k（数值） | `15` |
| **factorial** | 计算整数 n 的阶乘。 | `factorial(5)` | n（整数） | `120` |
| **gamma** | 使用近似算法计算 gamma 函数值。 | `gamma(5)` | n（数值） | `24` |
| **kldivergence** | 计算两个分布的 KL 散度。 | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x（数组或矩阵），y（数组或矩阵） | `0.036690014034750584` |
| **lgamma** | 计算 gamma 函数的对数（扩展近似）。 | `lgamma(5)` | n（数值） | `3.178053830347945` |
| **multinomial** | 根据一组计数计算多项式系数。 | `multinomial([1, 2, 3])` | a（数组） | `60` |
| **permutations** | 计算 n 个元素中，取 k 个有序排列的数量。 | `permutations(5, 2)` | n（数值），k（数值，可选） | `20` |
| **pickRandom** | 从一维数组中随机选取一个或多个值。 | `pickRandom([10, 20, 30])` | 数组 | `20` |
| **random** | 获取一个均匀分布的随机数。 | `random(1, 10)` | 最小值（可选），最大值（可选） | `3.6099423753668143` |
| **randomInt** | 获取一个均匀分布的随机整数。 | `randomInt(1, 10)` | 最小值（可选），最大值（可选） | `5` |

### 有理数

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **compare** | 比较两个值，可返回 -1、0 或 1。 | `compare(2, 3)` | x，y（任意类型） | `-1` |
| **compareNatural** | 以自然、可重复的方式比较任意类型的值。 | `compareNatural('2', '10')` | x，y（任意类型） | `-1` |
| **compareText** | 以字典序方式比较两个字符串。 | `compareText('apple', 'banana')` | x（字符串），y（字符串） | `-1` |
| **deepEqual** | 逐元素比较两个矩阵/数组是否相同。 | `deepEqual([[1, 2]], [[1, 2]])` | x（数组/矩阵），y（数组/矩阵） | `true` |
| **equal** | 判断两个值是否相等。 | `equal(2, 2)` | x，y（任意类型） | `true` |
| **equalText** | 判断两个字符串是否相同。 | `equalText('hello', 'hello')` | x（字符串），y（字符串） | `true` |
| **larger** | 判断 x 是否大于 y。 | `larger(3, 2)` | x，y（数字或大数） | `true` |
| **largerEq** | 判断 x 是否大于等于 y。 | `largerEq(3, 3)` | x，y（数字或大数） | `true` |
| **smaller** | 判断 x 是否小于 y。 | `smaller(2, 3)` | x，y（数字或大数） | `true` |
| **smallerEq** | 判断 x 是否小于等于 y。 | `smallerEq(2, 2)` | x，y（数字或大数） | `true` |
| **unequal** | 判断两个值是否不相等。 | `unequal(2, 3)` | x，y（任意类型） | `true` |

### 集合

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **setCartesian** | 生成两个（多）集合的笛卡尔积。 | `setCartesian([1, 2], [3, 4])` | 第一个集合（数组），第二个集合（数组） | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | 生成两个（多）集合的差集（set1 中有但 set2 中没有的元素）。 | `setDifference([1, 2, 3], [2])` | 第一个集合（数组），第二个集合（数组） | `[  1,  3]` |
| **setDistinct** | 获取（多）集合中的唯一元素。 | `setDistinct([1, 2, 2, 3])` | 集合（数组） | `[  1,  2,  3]` |
| **setIntersect** | 生成两个（多）集合的交集。 | `setIntersect([1, 2], [2, 3])` | 第一个集合（数组），第二个集合（数组） | `[  2]` |
| **setIsSubset** | 判断 set1 是否是 set2 的子集。 | `setIsSubset([1, 2], [1, 2, 3])` | 第一个集合（数组），第二个集合（数组） | `true` |
| **setMultiplicity** | 统计在多重集合中某个元素出现的次数。 | `setMultiplicity(2, [1, 2, 2, 3])` | 元素（任意类型），集合（数组） | `2` |
| **setPowerset** | 生成一个（多）集合的所有子集，即幂集。 | `setPowerset([1, 2])` | 集合（数组） | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | 统计（多）集合中所有元素的数量。 | `setSize([1, 2, 3])` | 集合（数组） | `3` |
| **setSymDifference** | 生成两个（多）集合的对称差（只在其中一个集合中的元素）。 | `setSymDifference([1, 2], [2, 3])` | 第一个集合（数组），第二个集合（数组） | `[  1,  3]` |
| **setUnion** | 生成两个（多）集合的并集。 | `setUnion([1, 2], [2, 3])` | 第一个集合（数组），第二个集合（数组） | `[  1,  3,  2]` |

### 特殊

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **erf** | 使用有理切比雪夫近似来计算误差函数。 | `erf(0.5)` | 输入值 x（数字） | `0.5204998778130465` |

### 统计

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **cumsum** | 计算列表或矩阵的累加和。 | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | 计算数据的中位绝对偏差。 | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | 返回列表或矩阵的最大值。 | `max([1, 2, 3])` |  | `3` |
| **mean** | 计算平均值。 | `mean([2, 4, 6])` |  | `4` |
| **median** | 计算中位数。 | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | 返回列表或矩阵的最小值。 | `min([1, 2, 3])` |  | `1` |
| **mode** | 计算众数（最常出现的值）。 | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | 计算列表或矩阵中所有数的乘积。 | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | 计算列表或矩阵在 prob 位置上的分位数。 | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | 计算数据的标准差。 | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | 计算列表或矩阵所有数的和。 | `sum([1, 2, 3])` |  | `6` |
| **variance** | 计算数据的方差。 | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### 字符串

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bin** | 将数字格式化为二进制。 | `bin(13)` |  | `13` |
| **format** | 将任意类型的值转为指定精度的字符串。 | `format(123.456, 2)` |  | `120` |
| **hex** | 将数字格式化为十六进制。 | `hex(255)` |  | `255` |
| **oct** | 将数字格式化为八进制。 | `oct(64)` |  | `64` |
| **print** | 将多个数值插入到字符串模板中。 | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### 三角函数

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **acos** | 计算反余弦值。 | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | 计算双曲反余弦值。 | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | 计算反余切值。 | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | 计算双曲反余切值。 | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | 计算反余割值。 | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | 计算双曲反余割值。 | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | 计算反正割值。 | `asec(2)` |  | `1.0471975511965979` |
| **asech** | 计算双曲反正割值。 | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | 计算反正弦值。 | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | 计算双曲反正弦值。 | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | 计算反正切值。 | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | 计算具有两个参数的反正切值。 | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | 计算双曲反正切值。 | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | 计算 x 的余弦值。 | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | 计算 x 的双曲余弦值。 | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | 计算 x 的余切值。 | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | 计算 x 的双曲余切值。 | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | 计算 x 的余割值。 | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | 计算 x 的双曲余割值。 | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | 计算 x 的正割值。 | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | 计算 x 的双曲正割值。 | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | 计算 x 的正弦值。 | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | 计算 x 的双曲正弦值。 | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | 计算 x 的正切值。 | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | 计算 x 的双曲正切值。 | `tanh(0.5)` |  | `0.46211715726000974` |

### 单位

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **to** | 将一个数值转换为指定单位。 | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### 通用

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **clone** | 对输入值进行深拷贝。 | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | 检测输入是否包含数值。 | `hasNumericValue('123')` |  | `true` |
| **isInteger** | 检测输入是否是整数。 | `isInteger(3.0)` |  | `true` |
| **isNaN** | 检测输入是否为 NaN。 | `isNaN(NaN)` |  | `true` |
| **isNegative** | 检测输入是否为负数。 | `isNegative(-5)` |  | `true` |
| **isNumeric** | 检测输入是否为数值。 | `isNumeric('123')` |  | `false` |
| **isPositive** | 检测输入是否为正数。 | `isPositive(2)` |  | `true` |
| **isPrime** | 检测输入是否为质数。 | `isPrime(7)` |  | `true` |
| **isZero** | 检测输入是否为 0。 | `isZero(0)` |  | `true` |
| **numeric** | 将输入值转换为特定的数值类型（如 number、BigNumber 等）。 | `numeric('123')` |  | `123` |
| **typeOf** | 返回输入值的类型名称。 | `typeOf([1, 2, 3])` |  | `Array` |
