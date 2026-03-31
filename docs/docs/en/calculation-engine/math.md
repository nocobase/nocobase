# Mathjs

[Math.js](https://mathjs.org/) is a feature-rich mathematics library for JavaScript and Node.js.

## Function Reference

### Expressions

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **compile** | Parse and compile an expression (parses only and does not directly return a result). | `compile('2 + 3')` | expression (string) | `{}` |
| **evaluate** | Evaluate an expression and return the result. | `evaluate('2 + 3')` | expression (string), scope (optional) | `5` |
| **help** | Retrieve documentation for a function or data type. | `help('evaluate')` | search keyword (string) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Create a parser for custom operations. | `parser()` | None | `{}` |

### Algebra

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **derivative** | Differentiate an expression with respect to a specified variable. | `derivative('x^2', 'x')` | expression (string or Node), variable (string) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Count the leaf nodes (symbols or constants) in an expression tree. | `leafCount('x^2 + y')` | expression (string or Node) | `3` |
| **lsolve** | Solve a linear system using forward substitution. | `lsolve([[1,2],[3,4]], [5,6])` | L (Array or Matrix), b (Array or Matrix) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Find all solutions of a linear system using forward substitution. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Array or Matrix), b (Array or Matrix) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Perform an LU decomposition with partial pivoting. | `lup([[1,2],[3,4]])` | A (Array or Matrix) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Solve a linear system A*x = b where A is an n×n matrix. | `lusolve([[1,2],[3,4]], [5,6])` | A (Array or Matrix), b (Array or Matrix) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Compute the QR decomposition of a matrix. | `qr([[1,2],[3,4]])` | A (Array or Matrix) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Convert a rationalizable expression into a rational fraction. | `rationalize('1/(x+1)')` | expression (string or Node) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Replace symbols in an expression with values from the provided scope. | `resolve('x + y', {x:2, y:3})` | expression (string or Node), scope (object) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Simplify an expression tree (combine like terms, etc.). | `simplify('2x + 3x')` | expression (string or Node) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Perform a one-pass simplification, often used in performance-sensitive cases. | `simplifyCore('x+x')` | expression (string or Node) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Compute a sparse LU decomposition with full pivoting. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Array or Matrix), order (string), threshold (number) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Check whether two expressions are symbolically equal. | `symbolicEqual('x+x', '2x')` | expression1 (string or Node), expression2 (string or Node) | `true` |
| **usolve** | Solve a linear system using back substitution. | `usolve([[1,2],[0,1]], [3,4])` | U (Array or Matrix), b (Array or Matrix) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Find all solutions of a linear system using back substitution. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Array or Matrix), b (Array or Matrix) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Arithmetic

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **abs** | Compute the absolute value of a number. | `abs(-3.2)` | x (number, Complex, Array, or Matrix) | `3.2` |
| **add** | Add two or more values (x + y). | `add(2, 3)` | x, y, ... (number, Array, or Matrix) | `5` |
| **cbrt** | Compute the cube root of a number, optionally returning all cube roots. | `cbrt(8)` | x (number or Complex), allRoots (boolean, optional) | `2` |
| **ceil** | Round toward positive infinity (for Complex numbers, each part is rounded separately). | `ceil(3.2)` | x (number, Complex, Array, or Matrix) | `4` |
| **cube** | Compute the cube of a value (x*x*x). | `cube(3)` | x (number, Complex, Array, or Matrix) | `27` |
| **divide** | Divide two values (x / y). | `divide(6, 2)` | x (number, Array, or Matrix), y (number, Array, or Matrix) | `3` |
| **dotDivide** | Divide two matrices or arrays element-wise. | `dotDivide([6,8],[2,4])` | x (Array or Matrix), y (Array or Matrix) | `[  3,  2]` |
| **dotMultiply** | Multiply two matrices or arrays element-wise. | `dotMultiply([2,3],[4,5])` | x (Array or Matrix), y (Array or Matrix) | `[  8,  15]` |
| **dotPow** | Compute x^y element-wise. | `dotPow([2,3],[2,3])` | x (Array or Matrix), y (Array or Matrix) | `[  4,  27]` |
| **exp** | Compute e^x. | `exp(1)` | x (number, Complex, Array, or Matrix) | `2.718281828459045` |
| **expm1** | Compute e^x - 1. | `expm1(1)` | x (number or Complex) | `1.718281828459045` |
| **fix** | Round toward zero (truncate). | `fix(3.7)` | x (number, Complex, Array, or Matrix) | `3` |
| **floor** | Round toward negative infinity. | `floor(3.7)` | x (number, Complex, Array, or Matrix) | `3` |
| **gcd** | Compute the greatest common divisor of two or more numbers. | `gcd(8, 12)` | a, b, ... (number or BigNumber) | `4` |
| **hypot** | Compute the square root of the sum of squared arguments (Pythagorean). | `hypot(3, 4)` | a, b, ... (number or BigNumber) | `5` |
| **invmod** | Compute the modular multiplicative inverse of a modulo b. | `invmod(3, 11)` | a, b (number or BigNumber) | `4` |
| **lcm** | Compute the least common multiple of two or more numbers. | `lcm(4, 6)` | a, b, ... (number or BigNumber) | `12` |
| **log** | Compute a logarithm with an optional base. | `log(100, 10)` | x (number or Complex), base (number or Complex, optional) | `2` |
| **log10** | Compute the base-10 logarithm of a number. | `log10(100)` | x (number or Complex) | `2` |
| **log1p** | Compute ln(1 + x). | `log1p(1)` | x (number or Complex) | `0.6931471805599453` |
| **log2** | Compute the base-2 logarithm of a number. | `log2(8)` | x (number or Complex) | `3` |
| **mod** | Compute the remainder of x ÷ y (x mod y). | `mod(8,3)` | x, y (number or BigNumber) | `2` |
| **multiply** | Multiply two or more values (x * y). | `multiply(2, 3)` | x, y, ... (number, Array, or Matrix) | `6` |
| **norm** | Compute the norm of a number, vector, or matrix with optional p. | `norm([3,4])` | x (Array or Matrix), p (number or string, optional) | `5` |
| **nthRoot** | Compute the nth root (principal root) of a number. | `nthRoot(16, 4)` | a (number, BigNumber, or Complex), root (number, optional) | `2` |
| **nthRoots** | Compute all nth roots of a number, potentially complex. | `nthRoots(1,3)` | x (number or Complex), root (number) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Raise x to the power y. | `pow(2, 3)` | x (number, Complex, Array, or Matrix), y (number, Complex, Array, or Matrix) | `8` |
| **round** | Round to a specified number of decimals. | `round(3.14159, 2)` | x (number, Complex, Array, or Matrix), n (number, optional) | `3.14` |
| **sign** | Return the sign of a number (-1, 0, or 1). | `sign(-3)` | x (number, BigNumber, or Complex) | `-1` |
| **sqrt** | Compute the square root of a number. | `sqrt(9)` | x (number, Complex, Array, or Matrix) | `3` |
| **square** | Compute the square of a value (x*x). | `square(3)` | x (number, Complex, Array, or Matrix) | `9` |
| **subtract** | Subtract one value from another (x - y). | `subtract(8, 3)` | x, y (number, Array, or Matrix) | `5` |
| **unaryMinus** | Apply unary negation to a value. | `unaryMinus(3)` | x (number, Complex, Array, or Matrix) | `-3` |
| **unaryPlus** | Apply unary plus (usually leaves the value unchanged). | `unaryPlus(-3)` | x (number, Complex, Array, or Matrix) | `-3` |
| **xgcd** | Compute the extended greatest common divisor of two numbers. | `xgcd(8, 12)` | a, b (number or BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Bitwise

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bitAnd** | Perform bitwise AND (x & y). | `bitAnd(5, 3)` | x, y (number or BigNumber) | `1` |
| **bitNot** | Perform bitwise NOT (~x). | `bitNot(5)` | x (number or BigNumber) | `-6` |
| **bitOr** | Perform bitwise OR (x \| y). | `bitOr(5, 3)` | x, y (number or BigNumber) | `7` |
| **bitXor** | Perform bitwise XOR (x ^ y). | `bitXor(5, 3)` | x, y (number or BigNumber) | `6` |
| **leftShift** | Left shift x by y bits (x << y). | `leftShift(5, 1)` | x, y (number or BigNumber) | `10` |
| **rightArithShift** | Perform an arithmetic right shift on x (x >> y). | `rightArithShift(5, 1)` | x, y (number or BigNumber) | `2` |
| **rightLogShift** | Perform a logical right shift on x (x >>> y). | `rightLogShift(5, 1)` | x, y (number or BigNumber) | `2` |

### Combinatorics

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Count the partitions of n distinct elements. | `bellNumbers(3)` | n (number) | `5` |
| **catalan** | Compute the nth Catalan number for many combinatorial structures. | `catalan(5)` | n (number) | `42` |
| **composition** | Count the compositions of n into k parts. | `composition(5, 3)` | n, k (number) | `6` |
| **stirlingS2** | Compute the number of ways to partition n labeled items into k non-empty subsets (Stirling numbers of the second kind). | `stirlingS2(5, 3)` | n, k (number) | `25` |

### Complex Numbers

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **arg** | Compute the argument (phase) of a complex number. | `arg(complex('2 + 2i'))` | x (Complex or number) | `0.785398163` |
| **conj** | Compute the complex conjugate. | `conj(complex('2 + 2i'))` | x (Complex or number) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Return the imaginary part of a complex number. | `im(complex('2 + 3i'))` | x (Complex or number) | `3` |
| **re** | Return the real part of a complex number. | `re(complex('2 + 3i'))` | x (Complex or number) | `2` |

### Geometry

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **distance** | Compute the Euclidean distance between two points in N-dimensional space. | `distance([0,0],[3,4])` | point1 (Array), point2 (Array) | `5` |
| **intersect** | Find the intersection of two lines (2D/3D) or a line and a plane (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | endpoints of line 1, endpoints of line 2, ... | `[  1,  1]` |

### Logic

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **and** | Perform a logical AND. | `and(true, false)` | x, y (boolean or number) | `false` |
| **not** | Perform a logical NOT. | `not(true)` | x (boolean or number) | `false` |
| **or** | Perform a logical OR. | `or(true, false)` | x, y (boolean or number) | `true` |
| **xor** | Perform a logical XOR. | `xor(1, 0)` | x, y (boolean or number) | `true` |

### Matrix

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **column** | Return the specified column from a matrix. | `column([[1,2],[3,4]], 1)` | value (Matrix or Array), index (number) | `[  [    1  ],  [    3  ]]` |
| **concat** | Concatenate multiple matrices/arrays along a dimension. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Array or Matrix), dim (number, optional) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Count the number of elements in a matrix, array, or string. | `count([1,2,3,'hello'])` | x (Array, Matrix, or string) | `4` |
| **cross** | Compute the cross product of two 3D vectors. | `cross([1,2,3], [4,5,6])` | x, y (Array or Matrix of length 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Compute the conjugate transpose of a matrix. | `ctranspose([[1,2],[3,4]])` | x (Matrix or Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Compute the determinant of a matrix. | `det([[1,2],[3,4]])` | x (Matrix or Array) | `-2` |
| **diag** | Create a diagonal matrix or extract the diagonal of a matrix. | `diag([1,2,3])` | X (Array or Matrix) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Compute the difference between adjacent elements along a dimension. | `diff([1,4,9,16])` | arr (Array or Matrix), dim (number, optional) | `[  3,  5,  7]` |
| **dot** | Compute the dot product of two vectors. | `dot([1,2,3],[4,5,6])` | x, y (Array or Matrix) | `32` |
| **eigs** | Compute eigenvalues and optionally eigenvectors of a square matrix. | `eigs([[1,2],[3,4]])` | x (Matrix or Array), codec (number, optional) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Compute the matrix exponential e^A. | `expm([[1,0],[0,1]])` | x (Matrix or Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Compute the N-dimensional fast Fourier transform. | `fft([1,2,3,4])` | arr (Array or Matrix) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Not supported yet) Filter an array or 1D matrix with a test function. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Array or Matrix), test (function) | `[  "23",  "100",  "55"]` |
| **flatten** | Flatten a multi-dimensional matrix or array into 1D. | `flatten([[1,2],[3,4]])` | x (Array or Matrix) | `[  1,  2,  3,  4]` |
| **forEach** | (Not supported yet) Iterate over each element of a matrix/array and invoke a callback. | `forEach([1,2,3], val => console.log(val))` | x (Array or Matrix), callback (function) | `undefined` |
| **getMatrixDataType** | Inspect the data type of all elements in a matrix or array (e.g., 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Array or Matrix) | `mixed` |
| **identity** | Create an n x n (or m x n) identity matrix. | `identity(3)` | n (number) or [m, n] (Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Compute the N-dimensional inverse FFT. | `ifft([1,2,3,4])` | arr (Array or Matrix) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Compute the inverse of a square matrix. | `inv([[1,2],[3,4]])` | x (Matrix or Array) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Compute the Kronecker product of two matrices or vectors. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matrix or Array) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Create a new array/matrix by applying a callback to each element. | `map([1,2,3], val => val * val)` | x (Array or Matrix), callback (function) | `[  1,  4,  9]` |
| **matrixFromColumns** | Combine vectors as separate columns of a dense matrix. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Array or Matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Not supported yet) Build a matrix by evaluating a function for each index. | `matrixFromFunction([5], i => math.random())` | size (Array), fn (function) | `a random vector` |
| **matrixFromRows** | Combine vectors as separate rows of a dense matrix. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Array or Matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Create a matrix of all ones for the given dimensions. | `ones(2, 3)` | m, n, p... (number) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Return the kth smallest element using partition selection. | `partitionSelect([3,1,4,2], 2)` | x (Array or Matrix), k (number) | `3` |
| **pinv** | Compute the Moore–Penrose pseudoinverse of a matrix. | `pinv([[1,2],[2,4]])` | x (Matrix or Array) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Create an array of numbers from start to end (optional step). | `range(1, 5, 2)` | start (number), end (number), step (number, optional) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Reshape an array/matrix to given dimensions. | `reshape([1,2,3,4,5,6], [2,3])` | x (Array or Matrix), sizes (Array) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Resize a matrix to new dimensions, filling with a default value if provided. | `resize([1,2,3], [5], 0)` | x (Array or Matrix), size (Array), defaultValue (optional) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Rotate a 1x2 vector counterclockwise or rotate a 1x3 vector around an axis. | `rotate([1, 0], Math.PI / 2)` | w (Array or Matrix), theta (number[, axis]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Create a 2x2 rotation matrix for a given angle in radians. | `rotationMatrix(Math.PI / 2)` | theta (number) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Return the specified row from a matrix. | `row([[1,2],[3,4]], 1)` | value (Matrix or Array), index (number) | `[  [    3,    4  ]]` |
| **size** | Compute the size (dimensions) of a matrix, array, or scalar. | `size([[1,2,3],[4,5,6]])` | x (Array, Matrix, or number) | `[  2,  3]` |
| **sort** | Sort a matrix or array in ascending order. | `sort([3,1,2])` | x (Array or Matrix) | `[  1,  2,  3]` |
| **sqrtm** | Compute the principal square root of a square matrix. | `sqrtm([[4,0],[0,4]])` | A (Matrix or Array) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Remove singleton dimensions from inside or outside a matrix. | `squeeze([[[1],[2],[3]]])` | x (Matrix or Array) | `[  1,  2,  3]` |
| **subset** | Get or replace a subset of a matrix or string. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matrix, Array, or string), index (Index), replacement (optional) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Compute the trace (sum of diagonal elements) of a square matrix. | `trace([[1,2],[3,4]])` | x (Matrix or Array) | `5` |
| **transpose** | Transpose a matrix. | `transpose([[1,2],[3,4]])` | x (Matrix or Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Create an all-zero matrix for the given dimensions. | `zeros(2, 3)` | m, n, p... (number) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Probability

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **combinations** | Count combinations when selecting k unordered items from n. | `combinations(5, 2)` | n (number), k (number) | `10` |
| **combinationsWithRep** | Count combinations when selections can repeat. | `combinationsWithRep(5, 2)` | n (number), k (number) | `15` |
| **factorial** | Compute n! for an integer n. | `factorial(5)` | n (integer) | `120` |
| **gamma** | Approximate the gamma function. | `gamma(5)` | n (number) | `24` |
| **kldivergence** | Compute the KL divergence between two distributions. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Array or Matrix), y (Array or Matrix) | `0.036690014034750584` |
| **lgamma** | Compute the logarithm of the gamma function. | `lgamma(5)` | n (number) | `3.178053830347945` |
| **multinomial** | Compute a multinomial coefficient from a set of counts. | `multinomial([1, 2, 3])` | a (Array) | `60` |
| **permutations** | Count ordered permutations of selecting k items from n. | `permutations(5, 2)` | n (number), k (number, optional) | `20` |
| **pickRandom** | Pick one or more random values from a 1D array. | `pickRandom([10, 20, 30])` | array | `20` |
| **random** | Return a uniformly distributed random number. | `random(1, 10)` | min (optional), max (optional) | `3.6099423753668143` |
| **randomInt** | Return a uniformly distributed random integer. | `randomInt(1, 10)` | min (optional), max (optional) | `5` |

### Rational Numbers

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **compare** | Compare two values, returning -1, 0, or 1. | `compare(2, 3)` | x, y (any type) | `-1` |
| **compareNatural** | Compare arbitrary values in natural, repeatable order. | `compareNatural('2', '10')` | x, y (any type) | `-1` |
| **compareText** | Compare two strings lexicographically. | `compareText('apple', 'banana')` | x (string), y (string) | `-1` |
| **deepEqual** | Compare two matrices/arrays element-wise for equality. | `deepEqual([[1, 2]], [[1, 2]])` | x (Array/Matrix), y (Array/Matrix) | `true` |
| **equal** | Test if two values are equal. | `equal(2, 2)` | x, y (any type) | `true` |
| **equalText** | Test if two strings are identical. | `equalText('hello', 'hello')` | x (string), y (string) | `true` |
| **larger** | Check whether x is greater than y. | `larger(3, 2)` | x, y (number or BigNumber) | `true` |
| **largerEq** | Check whether x is greater than or equal to y. | `largerEq(3, 3)` | x, y (number or BigNumber) | `true` |
| **smaller** | Check whether x is less than y. | `smaller(2, 3)` | x, y (number or BigNumber) | `true` |
| **smallerEq** | Check whether x is less than or equal to y. | `smallerEq(2, 2)` | x, y (number or BigNumber) | `true` |
| **unequal** | Check whether two values are not equal. | `unequal(2, 3)` | x, y (any type) | `true` |

### Sets

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **setCartesian** | Produce the Cartesian product of two (or more) sets. | `setCartesian([1, 2], [3, 4])` | set1 (Array), set2 (Array) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Return the difference of two sets (elements in set1 but not set2). | `setDifference([1, 2, 3], [2])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setDistinct** | Return the unique elements inside a (multi)set. | `setDistinct([1, 2, 2, 3])` | set (Array) | `[  1,  2,  3]` |
| **setIntersect** | Return the intersection of two (or more) sets. | `setIntersect([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  2]` |
| **setIsSubset** | Check if set1 is a subset of set2. | `setIsSubset([1, 2], [1, 2, 3])` | set1 (Array), set2 (Array) | `true` |
| **setMultiplicity** | Count how many times an element appears in a multiset. | `setMultiplicity(2, [1, 2, 2, 3])` | element (any type), set (Array) | `2` |
| **setPowerset** | Return the powerset (all subsets) of a (multi)set. | `setPowerset([1, 2])` | set (Array) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Count all elements in a (multi)set. | `setSize([1, 2, 3])` | set (Array) | `3` |
| **setSymDifference** | Return the symmetric difference of two (or more) sets. | `setSymDifference([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setUnion** | Return the union of two (or more) sets. | `setUnion([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3,  2]` |

### Special

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **erf** | Compute the error function using a rational Chebyshev approximation. | `erf(0.5)` | input x (number) | `0.5204998778130465` |

### Statistics

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **cumsum** | Compute the cumulative sum of a list or matrix. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Compute the median absolute deviation. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Return the maximum value of a list or matrix. | `max([1, 2, 3])` |  | `3` |
| **mean** | Compute the mean value. | `mean([2, 4, 6])` |  | `4` |
| **median** | Compute the median. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Return the minimum value of a list or matrix. | `min([1, 2, 3])` |  | `1` |
| **mode** | Compute the mode (most frequent value). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Compute the product of all numbers in a list or matrix. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Compute the quantile at probability `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Compute the standard deviation of data. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Compute the sum of all numbers in a list or matrix. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Compute the variance of data. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Strings

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bin** | Format a number as binary. | `bin(13)` |  | `13` |
| **format** | Format any value as a string with specified precision. | `format(123.456, 2)` |  | `120` |
| **hex** | Format a number as hexadecimal. | `hex(255)` |  | `255` |
| **oct** | Format a number as octal. | `oct(64)` |  | `64` |
| **print** | Interpolate multiple values into a string template. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Trigonometry

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **acos** | Compute the arccosine. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Compute the inverse hyperbolic cosine. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Compute the arccotangent. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Compute the inverse hyperbolic cotangent. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Compute the arccosecant. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Compute the inverse hyperbolic cosecant. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Compute the arcsecant. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Compute the inverse hyperbolic secant. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Compute the arcsine. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Compute the inverse hyperbolic sine. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Compute the arctangent. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Compute the arctangent with two arguments. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Compute the inverse hyperbolic tangent. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Compute the cosine of x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Compute the hyperbolic cosine of x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Compute the cotangent of x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Compute the hyperbolic cotangent of x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Compute the cosecant of x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Compute the hyperbolic cosecant of x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Compute the secant of x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Compute the hyperbolic secant of x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Compute the sine of x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Compute the hyperbolic sine of x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Compute the tangent of x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Compute the hyperbolic tangent of x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Units

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **to** | Convert a numeric value to the specified unit. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Utilities

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **clone** | Deep clone the input value. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Check whether the input contains a numeric value. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Check whether the input is an integer. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Check whether the input is NaN. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Check whether the input is negative. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Check whether the input is numeric. | `isNumeric('123')` |  | `false` |
| **isPositive** | Check whether the input is positive. | `isPositive(2)` |  | `true` |
| **isPrime** | Check whether the input is prime. | `isPrime(7)` |  | `true` |
| **isZero** | Check whether the input is zero. | `isZero(0)` |  | `true` |
| **numeric** | Convert the input to a numeric type (number, BigNumber, etc.). | `numeric('123')` |  | `123` |
| **typeOf** | Return the type name of the input value. | `typeOf([1, 2, 3])` |  | `Array` |
