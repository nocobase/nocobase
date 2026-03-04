:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) là một thư viện toán học phong phú tính năng dành cho JavaScript và Node.js.

## Danh mục hàm

### Biểu thức (Expressions)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **compile** | Phân tích và biên dịch một biểu thức (chỉ thực hiện phân tích và không trực tiếp trả về kết quả). | `compile('2 + 3')` | biểu thức (chuỗi) | `{}` |
| **evaluate** | Tính toán một biểu thức và trả về kết quả. | `evaluate('2 + 3')` | biểu thức (chuỗi), phạm vi (tùy chọn) | `5` |
| **help** | Truy xuất tài liệu hướng dẫn cho một hàm hoặc kiểu dữ liệu. | `help('evaluate')` | từ khóa tìm kiếm (chuỗi) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Tạo một trình phân tích cú pháp (parser) cho các thao tác tùy chỉnh. | `parser()` | Không có | `{}` |

### Đại số (Algebra)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **derivative** | Tính đạo hàm của một biểu thức đối với một biến xác định. | `derivative('x^2', 'x')` | biểu thức (chuỗi hoặc Node), biến (chuỗi) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Đếm số lượng nút lá (ký hiệu hoặc hằng số) trong cây biểu thức. | `leafCount('x^2 + y')` | biểu thức (chuỗi hoặc Node) | `3` |
| **lsolve** | Giải hệ phương trình tuyến tính bằng phương pháp thế tiến (forward substitution). | `lsolve([[1,2],[3,4]], [5,6])` | L (Mảng hoặc Ma trận), b (Mảng hoặc Ma trận) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Tìm tất cả các nghiệm của hệ phương trình tuyến tính bằng phương pháp thế tiến. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Mảng hoặc Ma trận), b (Mảng hoặc Ma trận) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Thực hiện phân rã LU với phép chọn phần tử trụ bán phần (partial pivoting). | `lup([[1,2],[3,4]])` | A (Mảng hoặc Ma trận) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Giải hệ phương trình tuyến tính A*x = b trong đó A là ma trận n×n. | `lusolve([[1,2],[3,4]], [5,6])` | A (Mảng hoặc Ma trận), b (Mảng hoặc Ma trận) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Tính toán phân rã QR của một ma trận. | `qr([[1,2],[3,4]])` | A (Mảng hoặc Ma trận) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Chuyển đổi một biểu thức có thể hữu tỷ hóa thành một phân số hữu tỷ. | `rationalize('1/(x+1)')` | biểu thức (chuỗi hoặc Node) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Thay thế các ký hiệu trong một biểu thức bằng các giá trị từ phạm vi (scope) được cung cấp. | `resolve('x + y', {x:2, y:3})` | biểu thức (chuỗi hoặc Node), phạm vi (đối tượng) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Đơn giản hóa cây biểu thức (kết hợp các hạng tử đồng dạng, v.v.). | `simplify('2x + 3x')` | biểu thức (chuỗi hoặc Node) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Thực hiện đơn giản hóa một lần duy nhất (one-pass), thường được dùng trong các trường hợp nhạy cảm về hiệu suất. | `simplifyCore('x+x')` | biểu thức (chuỗi hoặc Node) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Tính toán phân rã LU thưa với phép chọn phần tử trụ toàn phần (full pivoting). | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Mảng hoặc Ma trận), thứ tự (chuỗi), ngưỡng (số) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Kiểm tra xem hai biểu thức có bằng nhau về mặt ký hiệu hay không. | `symbolicEqual('x+x', '2x')` | biểu thức 1 (chuỗi hoặc Node), biểu thức 2 (chuỗi hoặc Node) | `true` |
| **usolve** | Giải hệ phương trình tuyến tính bằng phương pháp thế lùi (back substitution). | `usolve([[1,2],[0,1]], [3,4])` | U (Mảng hoặc Ma trận), b (Mảng hoặc Ma trận) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Tìm tất cả các nghiệm của hệ phương trình tuyến tính bằng phương pháp thế lùi. | `usolveAll([[1,2],[0,1]], [3,4])` | U (Mảng hoặc Ma trận), b (Mảng hoặc Ma trận) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Số học (Arithmetic)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **abs** | Tính giá trị tuyệt đối của một số. | `abs(-3.2)` | x (số, Số phức, Mảng, hoặc Ma trận) | `3.2` |
| **add** | Cộng hai hoặc nhiều giá trị (x + y). | `add(2, 3)` | x, y, ... (số, Mảng, hoặc Ma trận) | `5` |
| **cbrt** | Tính căn bậc ba của một số, tùy chọn trả về tất cả các căn bậc ba. | `cbrt(8)` | x (số hoặc Số phức), allRoots (boolean, tùy chọn) | `2` |
| **ceil** | Làm tròn về phía dương vô cực (đối với Số phức, mỗi phần được làm tròn riêng biệt). | `ceil(3.2)` | x (số, Số phức, Mảng, hoặc Ma trận) | `4` |
| **cube** | Tính lập phương của một giá trị (x*x*x). | `cube(3)` | x (số, Số phức, Mảng, hoặc Ma trận) | `27` |
| **divide** | Chia hai giá trị (x / y). | `divide(6, 2)` | x (số, Mảng, hoặc Ma trận), y (số, Mảng, hoặc Ma trận) | `3` |
| **dotDivide** | Chia từng phần tử của hai ma trận hoặc mảng. | `dotDivide([6,8],[2,4])` | x (Mảng hoặc Ma trận), y (Mảng hoặc Ma trận) | `[  3,  2]` |
| **dotMultiply** | Nhân từng phần tử của hai ma trận hoặc mảng. | `dotMultiply([2,3],[4,5])` | x (Mảng hoặc Ma trận), y (Mảng hoặc Ma trận) | `[  8,  15]` |
| **dotPow** | Tính x^y theo từng phần tử. | `dotPow([2,3],[2,3])` | x (Mảng hoặc Ma trận), y (Mảng hoặc Ma trận) | `[  4,  27]` |
| **exp** | Tính e^x. | `exp(1)` | x (số, Số phức, Mảng, hoặc Ma trận) | `2.718281828459045` |
| **expm1** | Tính e^x - 1. | `expm1(1)` | x (số hoặc Số phức) | `1.718281828459045` |
| **fix** | Làm tròn về phía số 0 (cắt bỏ phần thập phân). | `fix(3.7)` | x (số, Số phức, Mảng, hoặc Ma trận) | `3` |
| **floor** | Làm tròn về phía âm vô cực. | `floor(3.7)` | x (số, Số phức, Mảng, hoặc Ma trận) | `3` |
| **gcd** | Tìm ước chung lớn nhất của hai hoặc nhiều số. | `gcd(8, 12)` | a, b, ... (số hoặc BigNumber) | `4` |
| **hypot** | Tính căn bậc hai của tổng các bình phương (định lý Pythagoras). | `hypot(3, 4)` | a, b, ... (số hoặc BigNumber) | `5` |
| **invmod** | Tính nghịch đảo nhân modulo của a theo modulo b. | `invmod(3, 11)` | a, b (số hoặc BigNumber) | `4` |
| **lcm** | Tìm bội chung lớn nhất của hai hoặc nhiều số. | `lcm(4, 6)` | a, b, ... (số hoặc BigNumber) | `12` |
| **log** | Tính logarit với cơ số tùy chọn. | `log(100, 10)` | x (số hoặc Số phức), base (số hoặc Số phức, tùy chọn) | `2` |
| **log10** | Tính logarit cơ số 10 của một số. | `log10(100)` | x (số hoặc Số phức) | `2` |
| **log1p** | Tính ln(1 + x). | `log1p(1)` | x (số hoặc Số phức) | `0.6931471805599453` |
| **log2** | Tính logarit cơ số 2 của một số. | `log2(8)` | x (số hoặc Số phức) | `3` |
| **mod** | Tính số dư của phép chia x ÷ y (x mod y). | `mod(8,3)` | x, y (số hoặc BigNumber) | `2` |
| **multiply** | Nhân hai hoặc nhiều giá trị (x * y). | `multiply(2, 3)` | x, y, ... (số, Mảng, hoặc Ma trận) | `6` |
| **norm** | Tính chuẩn (norm) của một số, vectơ hoặc ma trận với p tùy chọn. | `norm([3,4])` | x (Mảng hoặc Ma trận), p (số hoặc chuỗi, tùy chọn) | `5` |
| **nthRoot** | Tính căn bậc n (căn chính) của một số. | `nthRoot(16, 4)` | a (số, BigNumber, hoặc Số phức), root (số, tùy chọn) | `2` |
| **nthRoots** | Tính tất cả các căn bậc n của một số, có thể bao gồm số phức. | `nthRoots(1,3)` | x (số hoặc Số phức), root (số) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | Tính x lũy thừa y. | `pow(2, 3)` | x (số, Số phức, Mảng, hoặc Ma trận), y (số, Số phức, Mảng, hoặc Ma trận) | `8` |
| **round** | Làm tròn đến một số chữ số thập phân xác định. | `round(3.14159, 2)` | x (số, Số phức, Mảng, hoặc Ma trận), n (số, tùy chọn) | `3.14` |
| **sign** | Trả về dấu của một số (-1, 0, hoặc 1). | `sign(-3)` | x (số, BigNumber, hoặc Số phức) | `-1` |
| **sqrt** | Tính căn bậc hai của một số. | `sqrt(9)` | x (số, Số phức, Mảng, hoặc Ma trận) | `3` |
| **square** | Tính bình phương của một giá trị (x*x). | `square(3)` | x (số, Số phức, Mảng, hoặc Ma trận) | `9` |
| **subtract** | Trừ một giá trị cho một giá trị khác (x - y). | `subtract(8, 3)` | x, y (số, Mảng, hoặc Ma trận) | `5` |
| **unaryMinus** | Thực hiện phép phủ định một ngôi (đổi dấu). | `unaryMinus(3)` | x (số, Số phức, Mảng, hoặc Ma trận) | `-3` |
| **unaryPlus** | Thực hiện phép cộng một ngôi (thường không làm thay đổi giá trị). | `unaryPlus(-3)` | x (số, Số phức, Mảng, hoặc Ma trận) | `-3` |
| **xgcd** | Tính ước chung lớn nhất mở rộng của hai số. | `xgcd(8, 12)` | a, b (số hoặc BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Thao tác bit (Bitwise)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **bitAnd** | Thực hiện phép AND bit (x & y). | `bitAnd(5, 3)` | x, y (số hoặc BigNumber) | `1` |
| **bitNot** | Thực hiện phép NOT bit (~x). | `bitNot(5)` | x (số hoặc BigNumber) | `-6` |
| **bitOr** | Thực hiện phép OR bit (x \| y). | `bitOr(5, 3)` | x, y (số hoặc BigNumber) | `7` |
| **bitXor** | Thực hiện phép XOR bit (x ^ y). | `bitXor(5, 3)` | x, y (số hoặc BigNumber) | `6` |
| **leftShift** | Dịch trái x đi y bit (x << y). | `leftShift(5, 1)` | x, y (số hoặc BigNumber) | `10` |
| **rightArithShift** | Thực hiện phép dịch phải số học trên x (x >> y). | `rightArithShift(5, 1)` | x, y (số hoặc BigNumber) | `2` |
| **rightLogShift** | Thực hiện phép dịch phải logic trên x (x >>> y). | `rightLogShift(5, 1)` | x, y (số hoặc BigNumber) | `2` |

### Tổ hợp (Combinatorics)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **bellNumbers** | Tính số Bell (số cách phân hoạch một tập hợp có n phần tử phân biệt). | `bellNumbers(3)` | n (số) | `5` |
| **catalan** | Tính số Catalan thứ n cho nhiều cấu trúc tổ hợp. | `catalan(5)` | n (số) | `42` |
| **composition** | Tính số cách phân tích n thành tổng của k phần. | `composition(5, 3)` | n, k (số) | `6` |
| **stirlingS2** | Tính số cách phân hoạch n phần tử có nhãn thành k tập con không rỗng (số Stirling loại hai). | `stirlingS2(5, 3)` | n, k (số) | `25` |

### Số phức (Complex Numbers)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **arg** | Tính argument (pha) của một số phức. | `arg(complex('2 + 2i'))` | x (Số phức hoặc số) | `0.785398163` |
| **conj** | Tính số phức liên hợp. | `conj(complex('2 + 2i'))` | x (Số phức hoặc số) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | Trả về phần ảo của một số phức. | `im(complex('2 + 3i'))` | x (Số phức hoặc số) | `3` |
| **re** | Trả về phần thực của một số phức. | `re(complex('2 + 3i'))` | x (Số phức hoặc số) | `2` |

### Hình học (Geometry)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **distance** | Tính khoảng cách Euclid giữa hai điểm trong không gian N chiều. | `distance([0,0],[3,4])` | điểm 1 (Mảng), điểm 2 (Mảng) | `5` |
| **intersect** | Tìm giao điểm của hai đường thẳng (2D/3D) hoặc một đường thẳng và một mặt phẳng (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | các điểm đầu cuối của đường 1, các điểm đầu cuối của đường 2, ... | `[  1,  1]` |

### Logic

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **and** | Thực hiện phép AND logic. | `and(true, false)` | x, y (boolean hoặc số) | `false` |
| **not** | Thực hiện phép NOT logic. | `not(true)` | x (boolean hoặc số) | `false` |
| **or** | Thực hiện phép OR logic. | `or(true, false)` | x, y (boolean hoặc số) | `true` |
| **xor** | Thực hiện phép XOR logic. | `xor(1, 0)` | x, y (boolean hoặc số) | `true` |

### Ma trận (Matrix)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **column** | Trả về cột xác định từ một ma trận. | `column([[1,2],[3,4]], 1)` | giá trị (Ma trận hoặc Mảng), chỉ số (số) | `[  [    1  ],  [    3  ]]` |
| **concat** | Nối nhiều ma trận/mảng dọc theo một chiều. | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Mảng hoặc Ma trận), dim (số, tùy chọn) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | Đếm số lượng phần tử trong một ma trận, mảng hoặc chuỗi. | `count([1,2,3,'hello'])` | x (Mảng, Ma trận, hoặc chuỗi) | `4` |
| **cross** | Tính tích có hướng của hai vectơ 3D. | `cross([1,2,3], [4,5,6])` | x, y (Mảng hoặc Ma trận có độ dài 3) | `[  -3,  6,  -3]` |
| **ctranspose** | Tính chuyển vị liên hợp của một ma trận. | `ctranspose([[1,2],[3,4]])` | x (Ma trận hoặc Mảng) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | Tính định thức của một ma trận. | `det([[1,2],[3,4]])` | x (Ma trận hoặc Mảng) | `-2` |
| **diag** | Tạo một ma trận đường chéo hoặc trích xuất đường chéo của một ma trận. | `diag([1,2,3])` | X (Mảng hoặc Ma trận) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | Tính hiệu giữa các phần tử liền kề dọc theo một chiều. | `diff([1,4,9,16])` | arr (Mảng hoặc Ma trận), dim (số, tùy chọn) | `[  3,  5,  7]` |
| **dot** | Tính tích vô hướng của hai vectơ. | `dot([1,2,3],[4,5,6])` | x, y (Mảng hoặc Ma trận) | `32` |
| **eigs** | Tính các giá trị riêng và tùy chọn các vectơ riêng của một ma trận vuông. | `eigs([[1,2],[3,4]])` | x (Ma trận hoặc Mảng), codec (số, tùy chọn) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | Tính hàm mũ ma trận e^A. | `expm([[1,0],[0,1]])` | x (Ma trận hoặc Mảng) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | Tính biến đổi Fourier nhanh N chiều. | `fft([1,2,3,4])` | arr (Mảng hoặc Ma trận) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (Chưa hỗ trợ) Lọc một mảng hoặc ma trận 1D bằng một hàm kiểm tra. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Mảng hoặc Ma trận), test (hàm) | `[  "23",  "100",  "55"]` |
| **flatten** | Làm phẳng một ma trận hoặc mảng đa chiều thành 1D. | `flatten([[1,2],[3,4]])` | x (Mảng hoặc Ma trận) | `[  1,  2,  3,  4]` |
| **forEach** | (Chưa hỗ trợ) Lặp qua từng phần tử của ma trận/mảng và gọi một hàm callback. | `forEach([1,2,3], val => console.log(val))` | x (Mảng hoặc Ma trận), callback (hàm) | `undefined` |
| **getMatrixDataType** | Kiểm tra kiểu dữ liệu của tất cả các phần tử trong ma trận hoặc mảng (ví dụ: 'number', 'Complex'). | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Mảng hoặc Ma trận) | `mixed` |
| **identity** | Tạo một ma trận đơn vị n x n (hoặc m x n). | `identity(3)` | n (số) hoặc [m, n] (Mảng) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | Tính biến đổi Fourier nhanh ngược N chiều. | `ifft([1,2,3,4])` | arr (Mảng hoặc Ma trận) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | Tính ma trận nghịch đảo của một ma trận vuông. | `inv([[1,2],[3,4]])` | x (Ma trận hoặc Mảng) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | Tính tích Kronecker của hai ma trận hoặc vectơ. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Ma trận hoặc Mảng) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | Tạo một mảng/ma trận mới bằng cách áp dụng một hàm callback cho từng phần tử. | `map([1,2,3], val => val * val)` | x (Mảng hoặc Ma trận), callback (hàm) | `[  1,  4,  9]` |
| **matrixFromColumns** | Kết hợp các vectơ thành các cột riêng biệt của một ma trận đặc. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Mảng hoặc Ma trận) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (Chưa hỗ trợ) Xây dựng một ma trận bằng cách tính toán một hàm cho mỗi chỉ số. | `matrixFromFunction([5], i => math.random())` | size (Mảng), fn (hàm) | `a random vector` |
| **matrixFromRows** | Kết hợp các vectơ thành các hàng riêng biệt của một ma trận đặc. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Mảng hoặc Ma trận) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | Tạo một ma trận toàn số 1 với các kích thước đã cho. | `ones(2, 3)` | m, n, p... (số) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | Trả về phần tử nhỏ thứ k bằng phương pháp chọn phân hoạch (partition selection). | `partitionSelect([3,1,4,2], 2)` | x (Mảng hoặc Ma trận), k (số) | `3` |
| **pinv** | Tính nghịch đảo giả Moore–Penrose của một ma trận. | `pinv([[1,2],[2,4]])` | x (Ma trận hoặc Mảng) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | Tạo một mảng các số từ start đến end (bước nhảy step tùy chọn). | `range(1, 5, 2)` | start (số), end (số), step (số, tùy chọn) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | Thay đổi hình dạng của một mảng/ma trận theo các kích thước đã cho. | `reshape([1,2,3,4,5,6], [2,3])` | x (Mảng hoặc Ma trận), sizes (Mảng) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | Thay đổi kích thước ma trận, điền các giá trị mặc định nếu được cung cấp. | `resize([1,2,3], [5], 0)` | x (Mảng hoặc Ma trận), size (Mảng), defaultValue (tùy chọn) | `[  1,  2,  3,  0,  0]` |
| **rotate** | Quay một vectơ 1x2 ngược chiều kim đồng hồ hoặc quay một vectơ 1x3 quanh một trục. | `rotate([1, 0], Math.PI / 2)` | w (Mảng hoặc Ma trận), theta (số[, trục]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | Tạo một ma trận quay 2x2 cho một góc cho trước tính bằng radian. | `rotationMatrix(Math.PI / 2)` | theta (số) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | Trả về hàng xác định từ một ma trận. | `row([[1,2],[3,4]], 1)` | giá trị (Ma trận hoặc Mảng), chỉ số (số) | `[  [    3,    4  ]]` |
| **size** | Tính kích thước (các chiều) của một ma trận, mảng hoặc vô hướng. | `size([[1,2,3],[4,5,6]])` | x (Mảng, Ma trận, hoặc số) | `[  2,  3]` |
| **sort** | Sắp xếp một ma trận hoặc mảng theo thứ tự tăng dần. | `sort([3,1,2])` | x (Mảng hoặc Ma trận) | `[  1,  2,  3]` |
| **sqrtm** | Tính căn bậc hai chính của một ma trận vuông. | `sqrtm([[4,0],[0,4]])` | A (Ma trận hoặc Mảng) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | Loại bỏ các chiều đơn lẻ (singleton dimensions) bên trong hoặc bên ngoài một ma trận. | `squeeze([[[1],[2],[3]]])` | x (Ma trận hoặc Mảng) | `[  1,  2,  3]` |
| **subset** | Lấy hoặc thay thế một tập con của một ma trận hoặc chuỗi. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Ma trận, Mảng, hoặc chuỗi), index (Chỉ số), replacement (tùy chọn) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | Tính vết (tổng các phần tử trên đường chéo chính) của một ma trận vuông. | `trace([[1,2],[3,4]])` | x (Ma trận hoặc Mảng) | `5` |
| **transpose** | Chuyển vị một ma trận. | `transpose([[1,2],[3,4]])` | x (Ma trận hoặc Mảng) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | Tạo một ma trận toàn số 0 với các kích thước đã cho. | `zeros(2, 3)` | m, n, p... (số) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Xác suất (Probability)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **combinations** | Tính số tổ hợp khi chọn k phần tử không thứ tự từ n. | `combinations(5, 2)` | n (số), k (số) | `10` |
| **combinationsWithRep** | Tính số tổ hợp khi các lựa chọn có thể lặp lại. | `combinationsWithRep(5, 2)` | n (số), k (số) | `15` |
| **factorial** | Tính n! cho một số nguyên n. | `factorial(5)` | n (số nguyên) | `120` |
| **gamma** | Tính xấp xỉ hàm gamma. | `gamma(5)` | n (số) | `24` |
| **kldivergence** | Tính độ chệch KL (Kullback-Leibler divergence) giữa hai phân phối. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Mảng hoặc Ma trận), y (Mảng hoặc Ma trận) | `0.036690014034750584` |
| **lgamma** | Tính logarit của hàm gamma. | `lgamma(5)` | n (số) | `3.178053830347945` |
| **multinomial** | Tính hệ số đa thức từ một tập hợp các số đếm. | `multinomial([1, 2, 3])` | a (Mảng) | `60` |
| **permutations** | Tính số chỉnh hợp khi chọn k phần tử có thứ tự từ n. | `permutations(5, 2)` | n (số), k (số, tùy chọn) | `20` |
| **pickRandom** | Chọn ngẫu nhiên một hoặc nhiều giá trị từ một mảng 1D. | `pickRandom([10, 20, 30])` | mảng | `20` |
| **random** | Trả về một số ngẫu nhiên phân phối đều. | `random(1, 10)` | min (tùy chọn), max (tùy chọn) | `3.6099423753668143` |
| **randomInt** | Trả về một số nguyên ngẫu nhiên phân phối đều. | `randomInt(1, 10)` | min (tùy chọn), max (tùy chọn) | `5` |

### Số hữu tỷ và So sánh (Rational Numbers)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **compare** | So sánh hai giá trị, trả về -1, 0, hoặc 1. | `compare(2, 3)` | x, y (bất kỳ kiểu nào) | `-1` |
| **compareNatural** | So sánh các giá trị bất kỳ theo thứ tự tự nhiên, có thể lặp lại. | `compareNatural('2', '10')` | x, y (bất kỳ kiểu nào) | `-1` |
| **compareText** | So sánh hai chuỗi theo thứ tự từ điển. | `compareText('apple', 'banana')` | x (chuỗi), y (chuỗi) | `-1` |
| **deepEqual** | So sánh từng phần tử của hai ma trận/mảng để kiểm tra sự bằng nhau. | `deepEqual([[1, 2]], [[1, 2]])` | x (Mảng/Ma trận), y (Mảng/Ma trận) | `true` |
| **equal** | Kiểm tra xem hai giá trị có bằng nhau không. | `equal(2, 2)` | x, y (bất kỳ kiểu nào) | `true` |
| **equalText** | Kiểm tra xem hai chuỗi có giống hệt nhau không. | `equalText('hello', 'hello')` | x (chuỗi), y (chuỗi) | `true` |
| **larger** | Kiểm tra xem x có lớn hơn y không. | `larger(3, 2)` | x, y (số hoặc BigNumber) | `true` |
| **largerEq** | Kiểm tra xem x có lớn hơn hoặc bằng y không. | `largerEq(3, 3)` | x, y (số hoặc BigNumber) | `true` |
| **smaller** | Kiểm tra xem x có nhỏ hơn y không. | `smaller(2, 3)` | x, y (số hoặc BigNumber) | `true` |
| **smallerEq** | Kiểm tra xem x có nhỏ hơn hoặc bằng y không. | `smallerEq(2, 2)` | x, y (số hoặc BigNumber) | `true` |
| **unequal** | Kiểm tra xem hai giá trị có không bằng nhau không. | `unequal(2, 3)` | x, y (bất kỳ kiểu nào) | `true` |

### Tập hợp (Sets)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **setCartesian** | Tạo tích Descartes của hai (hoặc nhiều) tập hợp. | `setCartesian([1, 2], [3, 4])` | set1 (Mảng), set2 (Mảng) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | Trả về hiệu của hai tập hợp (các phần tử có trong set1 nhưng không có trong set2). | `setDifference([1, 2, 3], [2])` | set1 (Mảng), set2 (Mảng) | `[  1,  3]` |
| **setDistinct** | Trả về các phần tử duy nhất bên trong một (đa) tập hợp. | `setDistinct([1, 2, 2, 3])` | set (Mảng) | `[  1,  2,  3]` |
| **setIntersect** | Trả về giao của hai (hoặc nhiều) tập hợp. | `setIntersect([1, 2], [2, 3])` | set1 (Mảng), set2 (Mảng) | `[  2]` |
| **setIsSubset** | Kiểm tra xem set1 có phải là tập con của set2 không. | `setIsSubset([1, 2], [1, 2, 3])` | set1 (Mảng), set2 (Mảng) | `true` |
| **setMultiplicity** | Đếm số lần một phần tử xuất hiện trong một đa tập hợp. | `setMultiplicity(2, [1, 2, 2, 3])` | phần tử (bất kỳ kiểu nào), set (Mảng) | `2` |
| **setPowerset** | Trả về tập lũy thừa (tất cả các tập con) của một (đa) tập hợp. | `setPowerset([1, 2])` | set (Mảng) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | Đếm tất cả các phần tử trong một (đa) tập hợp. | `setSize([1, 2, 3])` | set (Mảng) | `3` |
| **setSymDifference** | Trả về hiệu đối xứng của hai (hoặc nhiều) tập hợp. | `setSymDifference([1, 2], [2, 3])` | set1 (Mảng), set2 (Mảng) | `[  1,  3]` |
| **setUnion** | Trả về hợp của hai (hoặc nhiều) tập hợp. | `setUnion([1, 2], [2, 3])` | set1 (Mảng), set2 (Mảng) | `[  1,  3,  2]` |

### Đặc biệt (Special)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **erf** | Tính hàm lỗi (error function) bằng cách sử dụng xấp xỉ Chebyshev hữu tỷ. | `erf(0.5)` | đầu vào x (số) | `0.5204998778130465` |

### Thống kê (Statistics)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **cumsum** | Tính tổng tích lũy của một danh sách hoặc ma trận. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | Tính độ lệch tuyệt đối trung vị (median absolute deviation). | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | Trả về giá trị lớn nhất của một danh sách hoặc ma trận. | `max([1, 2, 3])` |  | `3` |
| **mean** | Tính giá trị trung bình. | `mean([2, 4, 6])` |  | `4` |
| **median** | Tính trung vị. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | Trả về giá trị nhỏ nhất của một danh sách hoặc ma trận. | `min([1, 2, 3])` |  | `1` |
| **mode** | Tính yếu vị (giá trị xuất hiện thường xuyên nhất). | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | Tính tích của tất cả các số trong một danh sách hoặc ma trận. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | Tính phân vị tại xác suất `prob`. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | Tính độ lệch chuẩn của dữ liệu. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | Tính tổng của tất cả các số trong một danh sách hoặc ma trận. | `sum([1, 2, 3])` |  | `6` |
| **variance** | Tính phương sai của dữ liệu. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Chuỗi (Strings)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **bin** | Định dạng một số dưới dạng nhị phân. | `bin(13)` |  | `13` |
| **format** | Định dạng bất kỳ giá trị nào thành một chuỗi với độ chính xác xác định. | `format(123.456, 2)` |  | `120` |
| **hex** | Định dạng một số dưới dạng thập lục phân. | `hex(255)` |  | `255` |
| **oct** | Định dạng một số dưới dạng bát phân. | `oct(64)` |  | `64` |
| **print** | Chèn nhiều giá trị vào một chuỗi mẫu (template). | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Lượng giác (Trigonometry)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **acos** | Tính arc-cosin. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | Tính arc-cosin hyperbolic nghịch đảo. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | Tính arc-cotang. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | Tính arc-cotang hyperbolic nghịch đảo. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | Tính arc-cosecant. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | Tính arc-cosecant hyperbolic nghịch đảo. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | Tính arc-secant. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | Tính arc-secant hyperbolic nghịch đảo. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | Tính arc-sin. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | Tính arc-sin hyperbolic nghịch đảo. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | Tính arc-tang. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | Tính arc-tang với hai đối số. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | Tính arc-tang hyperbolic nghịch đảo. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | Tính cosin của x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | Tính cosin hyperbolic của x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | Tính cotang của x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | Tính cotang hyperbolic của x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | Tính cosecant của x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | Tính cosecant hyperbolic của x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | Tính secant của x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | Tính secant hyperbolic của x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | Tính sin của x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | Tính sin hyperbolic của x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | Tính tang của x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | Tính tang hyperbolic của x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Đơn vị (Units)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **to** | Chuyển đổi một giá trị số sang đơn vị xác định. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Tiện ích (Utilities)

| Hàm | Định nghĩa | Ví dụ gọi hàm | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **clone** | Sao chép sâu (deep clone) giá trị đầu vào. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | Kiểm tra xem đầu vào có chứa giá trị số hay không. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | Kiểm tra xem đầu vào có phải là số nguyên hay không. | `isInteger(3.0)` |  | `true` |
| **isNaN** | Kiểm tra xem đầu vào có phải là NaN hay không. | `isNaN(NaN)` |  | `true` |
| **isNegative** | Kiểm tra xem đầu vào có phải là số âm hay không. | `isNegative(-5)` |  | `true` |
| **isNumeric** | Kiểm tra xem đầu vào có phải là kiểu số hay không. | `isNumeric('123')` |  | `false` |
| **isPositive** | Kiểm tra xem đầu vào có phải là số dương hay không. | `isPositive(2)` |  | `true` |
| **isPrime** | Kiểm tra xem đầu vào có phải là số nguyên tố hay không. | `isPrime(7)` |  | `true` |
| **isZero** | Kiểm tra xem đầu vào có phải là số không hay không. | `isZero(0)` |  | `true` |
| **numeric** | Chuyển đổi đầu vào thành một kiểu số (number, BigNumber, v.v.). | `numeric('123')` |  | `123` |
| **typeOf** | Trả về tên kiểu của giá trị đầu vào. | `typeOf([1, 2, 3])` |  | `Array` |