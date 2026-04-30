---
title: "Math.js"
description: "Math.js thư viện toán học: phân tích biểu thức, đại số, số học, ma trận, số phức, lượng giác, thống kê, chuyển đổi đơn vị, dùng cho field công thức và tính toán workflow."
keywords: "Math.js,phân tích biểu thức,ma trậnphép tính,đại sốtính,hàm thống kê,chuyển đổi đơn vị,NocoBase"
---

# Mathjs

[Math.js](https://mathjs.org/) là một thư viện toán học giàu tính năng dành cho JavaScript và Node.js.

## Tham khảo hàm

### Biểu thức

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **compile** | phân tích và biên dịch biểu thức(phụ trách phân tích, không trả về kết quả trực tiếp). | `compile('2 + 3')` | biểu thức (chuỗi) | `{}` |
| **evaluate** | tính biểu thức và trả về kết quả. | `evaluate('2 + 3')` | biểu thức (chuỗi), scope(tùy chọn) | `5` |
| **help** | truy xuất hướng dẫn sử dụng của hàm hoặc kiểu dữ liệu. | `help('evaluate')` | từ khóa tìm kiếm (chuỗi) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Tạo parser cho thao tác tùy chỉnh. | `parser()` | không có | `{}` |

### Tính toán đại số

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **derivative** | lấy đạo hàm biểu thức theo biến chỉ định. | `derivative('x^2', 'x')` | biểu thức (chuỗi hoặc nút), thànhlượng(chuỗi) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | đếm số nút lá trong cây phân tích biểu thức(ký hiệu hoặc hằng số). | `leafCount('x^2 + y')` | biểu thức (chuỗi hoặc nút) | `3` |
| **lsolve** | sử dụng phương pháp thay thế tiến để giải một nghiệm của hệ phương trình tuyến tính. | `lsolve([[1,2],[3,4]], [5,6])` | L (mảng hoặc ma trận), b (mảng hoặc ma trận) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | sử dụng phương pháp thay thế tiến để giải tất cả các nghiệm của hệ phương trình tuyến tính. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (mảng hoặc ma trận), b (mảng hoặc ma trận) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | thực hiện phân tích LU với trục một phần trên ma trận. | `lup([[1,2],[3,4]])` | A (mảng hoặc ma trận) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | giải phương trình tuyến tính A*x=b(A  là  n×n ma trận). | `lusolve([[1,2],[3,4]], [5,6])` | A (mảng hoặc ma trận), b (mảng hoặc ma trận) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | thực hiện phân tích QR trên ma trận. | `qr([[1,2],[3,4]])` | A (mảng hoặc ma trận) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | chuyển đổi biểu thức có thể hữu tỉ hóa thành phân số hữu tỉ. | `rationalize('1/(x+1)')` | biểu thức (chuỗi hoặc nút) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | thay thế biến trong biểu thức bằng giá trị trong scope đã cho. | `resolve('x + y', {x:2, y:3})` | biểu thức (chuỗi hoặc nút), scope(object) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | đơn giản hóa cây phân tích biểu thức(gộp các hạng tử đồng dạng, v.v.). | `simplify('2x + 3x')` | biểu thức (chuỗi hoặc nút) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | đơn giản hóa biểu thức một lượt (one-pass), thường dùng cho các tình huống nhạy cảm về hiệu năng. | `simplifyCore('x+x')` | biểu thức (chuỗi hoặc nút) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | tính phân tích LU thưa với trục đầy đủ. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (mảng hoặc ma trận), thứ tự phân tích (chuỗi), ngưỡng (số) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | kiểm tra hai biểu thức có bằng nhau về mặt biểu tượng hay không. | `symbolicEqual('x+x', '2x')` | biểu thức 1 (chuỗi hoặc nút), biểu thức 2 (chuỗi hoặc nút) | `true` |
| **usolve** | sử dụngphương pháp thế ngượcgiải một nghiệm của hệ phương trình tuyến tính. | `usolve([[1,2],[0,1]], [3,4])` | U (mảng hoặc ma trận), b (mảng hoặc ma trận) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | sử dụngphương pháp thế ngượcgiải tất cả các nghiệm của hệ phương trình tuyến tính. | `usolveAll([[1,2],[0,1]], [3,4])` | U (mảng hoặc ma trận), b (mảng hoặc ma trận) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Tính toán số học

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **abs** | tính giá trị tuyệt đối của một số. | `abs(-3.2)` | x(số, số phức, mảng hoặc ma trận) | `3.2` |
| **add** | cộng hai hoặc nhiều giá trị(x + y). | `add(2, 3)` | x, y, …(số, mảng hoặc ma trận) | `5` |
| **cbrt** | Tính căn bậc ba của một số, tùy chọn tính tất cả các căn bậc ba. | `cbrt(8)` | x(số hoặc số phức), allRoots(boolean, tùy chọn) | `2` |
| **ceil** | làm tròn về dương vô cùng(đối với số phức thì làm tròn riêng phần thực và phần ảo). | `ceil(3.2)` | x(số, số phức, mảng hoặc ma trận) | `4` |
| **cube** | Tính một số lập phương (x*x*x). | `cube(3)` | x(số, số phức, mảng hoặc ma trận) | `27` |
| **divide** | chia hai giá trị (x / y). | `divide(6, 2)` | x(số, mảng hoặc ma trận), y(số, mảng hoặc ma trận) | `3` |
| **dotDivide** | chia theo từng phần tử cho hai ma trận hoặc mảng. | `dotDivide([6,8],[2,4])` | x(mảng hoặc ma trận), y(mảng hoặc ma trận) | `[  3,  2]` |
| **dotMultiply** | nhân theo từng phần tử cho hai ma trận hoặc mảng. | `dotMultiply([2,3],[4,5])` | x(mảng hoặc ma trận), y(mảng hoặc ma trận) | `[  8,  15]` |
| **dotPow** | lũy thừa x^y theo từng phần tử. | `dotPow([2,3],[2,3])` | x(mảng hoặc ma trận), y(mảng hoặc ma trận) | `[  4,  27]` |
| **exp** | tính e^x. | `exp(1)` | x(số, số phức, mảng hoặc ma trận) | `2.718281828459045` |
| **expm1** | tính e^x - 1. | `expm1(1)` | x(số hoặc số phức) | `1.718281828459045` |
| **fix** | làm tròn về 0 (cắt bỏ). | `fix(3.7)` | x(số, số phức, mảng hoặc ma trận) | `3` |
| **floor** | làm tròn về âm vô cùng. | `floor(3.7)` | x(số, số phức, mảng hoặc ma trận) | `3` |
| **gcd** | tìm ước chung lớn nhất của hai hoặc nhiều số. | `gcd(8, 12)` | a, b, ...(số hoặc số lớn) | `4` |
| **hypot** | Tính căn bậc hai của tổng bình phương các số(như định lý Pythagore). | `hypot(3, 4)` | a, b, …(số hoặc số lớn) | `5` |
| **invmod** | tính nghịch đảo phép nhân của a theo modulo b. | `invmod(3, 11)` | a, b(số hoặc số lớn) | `4` |
| **lcm** | tìm bội chung nhỏ nhất của hai hoặc nhiều số. | `lcm(4, 6)` | a, b, ...(số hoặc số lớn) | `12` |
| **log** | Tính logarit (có thể chỉ định cơ số). | `log(100, 10)` | x(số hoặc số phức), base(tùy chọn, số hoặc số phức) | `2` |
| **log10** | Tính logarit cơ số 10 của một số. | `log10(100)` | x(số hoặc số phức) | `2` |
| **log1p** | tính ln(1 + x). | `log1p(1)` | x(số hoặc số phức) | `0.6931471805599453` |
| **log2** | Tính logarit cơ số 2 của một số. | `log2(8)` | x(số hoặc số phức) | `3` |
| **mod** | tính phần dư của x ÷ y(x mod y). | `mod(8,3)` | x, y(số hoặc số lớn) | `2` |
| **multiply** | nhân hai hoặc nhiều giá trị(x * y). | `multiply(2, 3)` | x, y, …(số, mảng hoặc ma trận) | `6` |
| **norm** | tính chuẩn của số, vector hoặc ma trận, p tùy chọn. | `norm([3,4])` | x(mảng hoặc ma trận), p(số hoặc chuỗi, tùy chọn) | `5` |
| **nthRoot** | tính căn bậc n của một số (căn chính). | `nthRoot(16, 4)` | a(số, số lớn hoặc số phức), root(tùy chọn, số) | `2` |
| **nthRoots** | tính tất cả các căn bậc n của một số, có thể bao gồm các nghiệm phức. | `nthRoots(1,3)` | x(số hoặc số phức), root(số) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | tính x^y. | `pow(2, 3)` | x(số, số phức, mảng hoặc ma trận), y(số, số phức, mảng hoặc ma trận) | `8` |
| **round** | làm tròn đến số chữ số thập phân chỉ định. | `round(3.14159, 2)` | x(số, số phức, mảng hoặc ma trận), n(tùy chọn, số) | `3.14` |
| **sign** | tính dấu của giá trị(-1, 0  hoặc  1). | `sign(-3)` | x(số, số lớn hoặc số phức) | `-1` |
| **sqrt** | Tính một sốcăn bậc hai. | `sqrt(9)` | x(số, số phức, mảng hoặc ma trận) | `3` |
| **square** | Tính một số bình phương (x*x). | `square(3)` | x(số, số phức, mảng hoặc ma trận) | `9` |
| **subtract** | trừ hai số (x - y). | `subtract(8, 3)` | x, y(số, mảng hoặc ma trận) | `5` |
| **unaryMinus** | thực hiện phép trừ đơn phân tử trên giá trị (đảo dấu). | `unaryMinus(3)` | x(số, số phức, mảng hoặc ma trận) | `-3` |
| **unaryPlus** | thực hiện phép cộng đơn phân tử trên giá trị (thường không thay đổi thực tế). | `unaryPlus(-3)` | x(số, số phức, mảng hoặc ma trận) | `-3` |
| **xgcd** | tính ước chung lớn nhất mở rộng của hai số. | `xgcd(8, 12)` | a, b(số hoặc số lớn) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### Phép toán bit

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **bitAnd** | thực hiện AND theo bit cho hai giá trị (x & y). | `bitAnd(5, 3)` | x, y(số hoặc số lớn) | `1` |
| **bitNot** | thực hiện NOT theo bit cho giá trị (~x). | `bitNot(5)` | x(số hoặc số lớn) | `-6` |
| **bitOr** | thực hiện OR theo bit cho hai giá trị (x \ | `y).` | bitOr(5, 3) | `x, y(số hoặc số lớn)` |
| **bitXor** | thực hiện XOR theo bit cho hai giá trị (x ^ y). | `bitXor(5, 3)` | x, y(số hoặc số lớn) | `6` |
| **leftShift** | dịch trái y bit của x (x << y). | `leftShift(5, 1)` | x, y(số hoặc số lớn) | `10` |
| **rightArithShift** | dịch phải số học các bit của x (x >> y). | `rightArithShift(5, 1)` | x, y(số hoặc số lớn) | `2` |
| **rightLogShift** | dịch phải logic các bit của x (x >>> y). | `rightLogShift(5, 1)` | x, y(số hoặc số lớn) | `2` |

### Tổ hợp

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **bellNumbers** | tính số cách chia tất cả của n phần tử khác nhau. | `bellNumbers(3)` | n(số) | `5` |
| **catalan** | tính số Catalan của n, tương ứng với việc đếm nhiều cấu trúc tổ hợp. | `catalan(5)` | n(số) | `42` |
| **composition** | tính số tổ hợp chia n thành k phần. | `composition(5, 3)` | n, k(số) | `6` |
| **stirlingS2** | tính số cách chia n phần tử có gắn nhãn thành k tập con không rỗng (số Stirling loại hai). | `stirlingS2(5, 3)` | n, k(số) | `25` |

### Số phức

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **arg** | tính góc pha (argument) của số phức. | `arg(complex('2 + 2i'))` | x(số phức hoặc số) | `0.785398163` |
| **conj** | tính liên hợp của số phức. | `conj(complex('2 + 2i'))` | x(số phức hoặc số) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | lấy phần ảo của số phức. | `im(complex('2 + 3i'))` | x(số phức hoặc số) | `3` |
| **re** | lấy phần thực của số phức. | `re(complex('2 + 3i'))` | x(số phức hoặc số) | `2` |

### Hình học

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **distance** | tính khoảng cách Euclidean giữa hai điểm trong không gian N chiều. | `distance([0,0],[3,4])` | point1(mảng), point2(mảng) | `5` |
| **intersect** | tìm giao điểm của hai đường (2D/3D) hoặc một đường với mặt phẳng (3D). | `intersect([0,0],[2,2],[0,2],[2,0])` | điểm đầu và cuối của đường thẳng 1, điểm đầu và cuối của đường thẳng 2, ... | `[  1,  1]` |

### Logic

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **and** | thực hiện phép logic AND. | `and(true, false)` | x, y(giá trị boolean hoặc số) | `false` |
| **not** | thực hiện phép logic NOT. | `not(true)` | x(giá trị boolean hoặc số) | `false` |
| **or** | thực hiện phép logic OR. | `or(true, false)` | x, y(giá trị boolean hoặc số) | `true` |
| **xor** | thực hiện phép logic XOR. | `xor(1, 0)` | x, y(giá trị boolean hoặc số) | `true` |

### Ma trận

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **column** | trả về cột chỉ định từ ma trận. | `column([[1,2],[3,4]], 1)` | value(ma trận hoặc mảng), index(số) | `[  [    1  ],  [    3  ]]` |
| **concat** | nối nhiều ma trận/mảng dọc theo chiều chỉ định. | `concat([1,2], [3,4], [5,6])` | a, b, c, ...(mảng hoặc ma trận), dim(số, tùy chọn) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | đếm số phần tử của ma trận, mảng hoặc chuỗi. | `count([1,2,3,'hello'])` | x(mảng, ma trận hoặc chuỗi) | `4` |
| **cross** | tính tích có hướng của hai vector 3 chiều. | `cross([1,2,3], [4,5,6])` | x, y(mảng hoặc ma trận có độ dài 3) | `[  -3,  6,  -3]` |
| **ctranspose** | chuyển vị và lấy liên hợp ma trận. | `ctranspose([[1,2],[3,4]])` | x(ma trận hoặc mảng) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | tính định thức của ma trận. | `det([[1,2],[3,4]])` | x(ma trận hoặc mảng) | `-2` |
| **diag** | tạo ma trận đường chéo hoặc trích xuất đường chéo của ma trận. | `diag([1,2,3])` | X(mảng hoặc ma trận) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | tính sai phân giữa các phần tử liền kề trên chiều chỉ định. | `diff([1,4,9,16])` | arr(mảng hoặc ma trận), dim(số, tùy chọn) | `[  3,  5,  7]` |
| **dot** | tính tích vô hướng của hai vector. | `dot([1,2,3],[4,5,6])` | x, y(mảng hoặc ma trận) | `32` |
| **eigs** | tính giá trị riêng và (tùy chọn) vector riêng của ma trận vuông. | `eigs([[1,2],[3,4]])` | x(ma trận hoặc mảng), codec(giá trị số, tùy chọn) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | tính ma trận mũ e^A. | `expm([[1,0],[0,1]])` | x(ma trận hoặc mảng) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | tính biến đổi Fourier nhanh N chiều. | `fft([1,2,3,4])` | arr(mảng hoặc ma trận) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (tạm chưa hỗ trợ)lọc mảng hoặc ma trận một chiều bằng hàm kiểm tra. | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x(mảng hoặc ma trận), test(hàm) | `[  "23",  "100",  "55"]` |
| **flatten** | duỗi ma trận hoặc mảng đa chiều thành một chiều. | `flatten([[1,2],[3,4]])` | x(mảng hoặc ma trận) | `[  1,  2,  3,  4]` |
| **forEach** | (tạm chưa hỗ trợ)duyệt mỗi phần tử của ma trận/mảng và thực thi callback. | `forEach([1,2,3], val => console.log(val))` | x(mảng hoặc ma trận), callback(hàm) | `undefined` |
| **getMatrixDataType** | xem kiểu dữ liệu của tất cả các phần tử ma trận hoặc mảng, ví dụ 'number'  hoặc  'Complex'. | `getMatrixDataType([[1,2.2],[3,'hello']])` | x(mảng hoặc ma trận) | `mixed` |
| **identity** | tạo ma trận đơn vị n x n (hoặc m x n). | `identity(3)` | n(số) hoặc  [m, n](mảng) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | tính biến đổi Fourier nhanh ngược N chiều. | `ifft([1,2,3,4])` | arr(mảng hoặc ma trận) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | tính ma trận nghịch đảo của ma trận vuông. | `inv([[1,2],[3,4]])` | x(ma trận hoặc mảng) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | tính tích Kronecker của hai ma trận hoặc vector. | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y(ma trận hoặc mảng) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | tạo mảng/ma trận mới bằng cách áp dụng callback cho mỗi phần tử. | `map([1,2,3], val => val * val)` | x(mảng hoặc ma trận), callback(hàm) | `[  1,  4,  9]` |
| **matrixFromColumns** | Kết hợp nhiều vector làm cột riêng thành một ma trận đặc. | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr(mảng hoặc ma trận) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (tạm chưa hỗ trợ) sinh ma trận bằng cách đánh giá hàm cho mỗi index của ma trận. | `matrixFromFunction([5], i => math.random())` | size(mảng), fn(hàm) | `a random vector` |
| **matrixFromRows** | Kết hợp nhiều vector làm hàng riêng thành một ma trận đặc. | `matrixFromRows([1,2,3],[4,5,6])` | ...arr(mảng hoặc ma trận) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | tạo ma trận toàn 1 với chiều đã cho. | `ones(2, 3)` | m, n, p...(số) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | trả về phần tử nhỏ thứ k từ mảng hoặc ma trận một chiều dựa trên phương pháp lựa chọn phân vùng. | `partitionSelect([3,1,4,2], 2)` | x(mảng hoặc ma trận), k(số) | `3` |
| **pinv** | tính giả nghịch đảo Moore-Penrose của ma trận. | `pinv([[1,2],[2,4]])` | x(ma trận hoặc mảng) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | sinh mảng số từ start đến end(step tùy chọn). | `range(1, 5, 2)` | start(số), end(số), step(số, tùy chọn) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | định hình lại mảng/ma trận thành chiều chỉ định. | `reshape([1,2,3,4,5,6], [2,3])` | x(mảng hoặc ma trận), sizes(mảng) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | điều chỉnh ma trận thành chiều mới, có thể điền giá trị mặc định cho các phần tử thiếu. | `resize([1,2,3], [5], 0)` | x(mảng hoặc ma trận), size(mảng), defaultValue(tùy chọn) | `[  1,  2,  3,  0,  0]` |
| **rotate** | xoay vector 1x2 ngược chiều kim đồng hồ một góc nhất định, hoặc xoay vector 1x3 quanh trục đã cho. | `rotate([1, 0], Math.PI / 2)` | w(mảng hoặc ma trận), theta(số[, trục]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | tạo ma trận xoay 2x2 với radian đã cho. | `rotationMatrix(Math.PI / 2)` | theta(số) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | trả về hàng chỉ định từ ma trận. | `row([[1,2],[3,4]], 1)` | value(ma trận hoặc mảng), index(số) | `[  [    3,    4  ]]` |
| **size** | tính kích thước của ma trận, mảng hoặc scalar(chiều). | `size([[1,2,3],[4,5,6]])` | x(mảng, ma trận hoặc số) | `[  2,  3]` |
| **sort** | sắp xếp ma trận hoặc mảng theo thứ tự tăng dần. | `sort([3,1,2])` | x(mảng hoặc ma trận) | `[  1,  2,  3]` |
| **sqrtm** | Tính căn bậc hai chính của ma trận. | `sqrtm([[4,0],[0,4]])` | A(ma trận hoặc mảng) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | loại bỏ các chiều đơn lẻ bên trong và bên ngoài của ma trận. | `squeeze([[[1],[2],[3]]])` | x(ma trận hoặc mảng) | `[  1,  2,  3]` |
| **subset** | lấy hoặc thay thế tập con của ma trận hoặc chuỗi. | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x(ma trận, mảng hoặc chuỗi), index(chỉ số), replacement(tùy chọn) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | tính vết của ma trận vuông (tổng các phần tử đường chéo). | `trace([[1,2],[3,4]])` | x(ma trận hoặc mảng) | `5` |
| **transpose** | chuyển vị ma trận. | `transpose([[1,2],[3,4]])` | x(ma trận hoặc mảng) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | tạo ma trận toàn 0 với chiều đã cho. | `zeros(2, 3)` | m, n, p...(số) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### Xác suất

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **combinations** | tính số tổ hợp k phần tử không thứ tự từ n phần tử. | `combinations(5, 2)` | n(giá trị số), k(giá trị số) | `10` |
| **combinationsWithRep** | tính số tổ hợp với phần tử có thể lặp. | `combinationsWithRep(5, 2)` | n(giá trị số), k(giá trị số) | `15` |
| **factorial** | tính giai thừa của số nguyên n. | `factorial(5)` | n(số nguyên) | `120` |
| **gamma** | tính giá trị hàm gamma sử dụng thuật toán xấp xỉ. | `gamma(5)` | n(giá trị số) | `24` |
| **kldivergence** | tính phân kỳ KL của hai phân phối. | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x(mảng hoặc ma trận), y(mảng hoặc ma trận) | `0.036690014034750584` |
| **lgamma** | Tính logarit của hàm gamma (xấp xỉ mở rộng). | `lgamma(5)` | n(giá trị số) | `3.178053830347945` |
| **multinomial** | dựa trên1hệđếmTính hệ số đa thức. | `multinomial([1, 2, 3])` | a(mảng) | `60` |
| **permutations** | tính số hoán vị k phần tử có thứ tự từ n phần tử. | `permutations(5, 2)` | n(giá trị số), k(giá trị số, tùy chọn) | `20` |
| **pickRandom** | chọn ngẫu nhiên một hoặc nhiều giá trị từ mảng một chiều. | `pickRandom([10, 20, 30])` | mảng | `20` |
| **random** | lấy một số ngẫu nhiên phân phối đều. | `random(1, 10)` | giá trị nhỏ nhất(tùy chọn), giá trị lớn nhất(tùy chọn) | `3.6099423753668143` |
| **randomInt** | lấy một số nguyên ngẫu nhiên phân phối đều. | `randomInt(1, 10)` | giá trị nhỏ nhất(tùy chọn), giá trị lớn nhất(tùy chọn) | `5` |

### Số hữu tỉ

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **compare** | so sánh hai giá trị, có thể trả về -1, 0 hoặc 1. | `compare(2, 3)` | x, y(kiểu bất kỳ) | `-1` |
| **compareNatural** | so sánh các giá trị bất kỳ kiểu theo cách tự nhiên, có thể lặp lại. | `compareNatural('2', '10')` | x, y(kiểu bất kỳ) | `-1` |
| **compareText** | so sánh hai chuỗi theo thứ tự từ điển. | `compareText('apple', 'banana')` | x(chuỗi), y(chuỗi) | `-1` |
| **deepEqual** | so sánh hai ma trận/mảng theo từng phần tử có giống nhau hay không. | `deepEqual([[1, 2]], [[1, 2]])` | x(mảng/ma trận), y(mảng/ma trận) | `true` |
| **equal** | kiểm tra hai giá trị có bằng nhau hay không. | `equal(2, 2)` | x, y(kiểu bất kỳ) | `true` |
| **equalText** | kiểm tra hai chuỗi có giống nhau hay không. | `equalText('hello', 'hello')` | x(chuỗi), y(chuỗi) | `true` |
| **larger** | kiểm tra x có lớn hơn y hay không. | `larger(3, 2)` | x, y(số hoặc số lớn) | `true` |
| **largerEq** | kiểm tra x có lớn hơn hoặc bằng y hay không. | `largerEq(3, 3)` | x, y(số hoặc số lớn) | `true` |
| **smaller** | kiểm tra x có nhỏ hơn y hay không. | `smaller(2, 3)` | x, y(số hoặc số lớn) | `true` |
| **smallerEq** | kiểm tra x có nhỏ hơn hoặc bằng y hay không. | `smallerEq(2, 2)` | x, y(số hoặc số lớn) | `true` |
| **unequal** | kiểm tra hai giá trị có không bằng nhau hay không. | `unequal(2, 3)` | x, y(kiểu bất kỳ) | `true` |

### Tập hợp

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **setCartesian** | sinh tích Descartes của hai (nhiều) tập hợp. | `setCartesian([1, 2], [3, 4])` | tập hợp đầu tiên(mảng), tập hợp thứ hai(mảng) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | sinh hiệu của hai (nhiều) tập hợp (các phần tử có trong set1 nhưng không có trong set2). | `setDifference([1, 2, 3], [2])` | tập hợp đầu tiên(mảng), tập hợp thứ hai(mảng) | `[  1,  3]` |
| **setDistinct** | lấy các phần tử duy nhất trong (nhiều) tập hợp. | `setDistinct([1, 2, 2, 3])` | tập hợp(mảng) | `[  1,  2,  3]` |
| **setIntersect** | sinh giao của hai (nhiều) tập hợp. | `setIntersect([1, 2], [2, 3])` | tập hợp đầu tiên(mảng), tập hợp thứ hai(mảng) | `[  2]` |
| **setIsSubset** | kiểm tra set1 có phải là tập con của set2 hay không. | `setIsSubset([1, 2], [1, 2, 3])` | tập hợp đầu tiên(mảng), tập hợp thứ hai(mảng) | `true` |
| **setMultiplicity** | đếm số lần xuất hiện của một phần tử nào đó trong đa tập. | `setMultiplicity(2, [1, 2, 2, 3])` | phần tử(kiểu bất kỳ), tập hợp(mảng) | `2` |
| **setPowerset** | sinh tất cả các tập con của một (nhiều) tập hợp, tức tập lũy thừa. | `setPowerset([1, 2])` | tập hợp(mảng) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | đếm số lượng tất cả các phần tử trong (nhiều) tập hợp. | `setSize([1, 2, 3])` | tập hợp(mảng) | `3` |
| **setSymDifference** | sinh hiệu đối xứng của hai (nhiều) tập hợp (các phần tử chỉ có trong một tập hợp). | `setSymDifference([1, 2], [2, 3])` | tập hợp đầu tiên(mảng), tập hợp thứ hai(mảng) | `[  1,  3]` |
| **setUnion** | sinh hợp của hai (nhiều) tập hợp. | `setUnion([1, 2], [2, 3])` | tập hợp đầu tiên(mảng), tập hợp thứ hai(mảng) | `[  1,  3,  2]` |

### Đặc biệt

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **erf** | tính hàm sai số sử dụng xấp xỉ Chebyshev hữu tỉ. | `erf(0.5)` | đầu vàogiá trị x(số) | `0.5204998778130465` |

### Thống kê

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **cumsum** | tính tổng tích lũy của danh sách hoặc ma trận. | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | tính sai lệch trung vị tuyệt đối của dữ liệu. | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | trả về giá trị lớn nhất của danh sách hoặc ma trận. | `max([1, 2, 3])` |  | `3` |
| **mean** | tính giá trị trung bình. | `mean([2, 4, 6])` |  | `4` |
| **median** | tính trung vị. | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | trả về giá trị nhỏ nhất của danh sách hoặc ma trận. | `min([1, 2, 3])` |  | `1` |
| **mode** | tính số xuất hiện nhiều nhất. | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | tính tích của tất cả các số trong danh sách hoặc ma trận. | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | tính phân vị tại vị trí prob của danh sách hoặc ma trận. | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | tính độ lệch chuẩn của dữ liệu. | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | tính tổng của tất cả các số trong danh sách hoặc ma trận. | `sum([1, 2, 3])` |  | `6` |
| **variance** | tính phương sai của dữ liệu. | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### Chuỗi

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **bin** | định dạng số thành nhị phân. | `bin(13)` |  | `13` |
| **format** | chuyển đổi giá trị bất kỳ kiểu thành chuỗi với độ chính xác chỉ định. | `format(123.456, 2)` |  | `120` |
| **hex** | định dạng số thành thập lục phân. | `hex(255)` |  | `255` |
| **oct** | định dạng số thành bát phân. | `oct(64)` |  | `64` |
| **print** | chèn nhiều giá trị số vào template chuỗi. | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### Lượng giáchàm

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **acos** | tính arccos. | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | tính arccos hyperbolic. | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | tính arccot. | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | tính arccot hyperbolic. | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | tính arccsc. | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | tính arccsc hyperbolic. | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | tính arcsec. | `asec(2)` |  | `1.0471975511965979` |
| **asech** | tính arcsec hyperbolic. | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | tính arcsin. | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | tính arcsin hyperbolic. | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | tính arctan. | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | tính arctan với hai tham số. | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | tính arctan hyperbolic. | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | tính cos của x. | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | tính cos hyperbolic của x. | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | tính cot của x. | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | tính cot hyperbolic của x. | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | tính csc của x. | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | tính csc hyperbolic của x. | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | tính sec của x. | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | tính sec hyperbolic của x. | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | tính sin của x. | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | tính sin hyperbolic của x. | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | tính tan của x. | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | tính tan hyperbolic của x. | `tanh(0.5)` |  | `0.46211715726000974` |

### Đơn vị

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **to** | chuyển đổi một giá trị số thành đơn vị chỉ định. | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### Chung

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| **clone** | sao chép sâu giá trị đầu vào. | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | kiểm tra đầu vào có chứa giá trị số hay không. | `hasNumericValue('123')` |  | `true` |
| **isInteger** | kiểm tra đầu vào có phải là số nguyên hay không. | `isInteger(3.0)` |  | `true` |
| **isNaN** | kiểm tra đầu vào có phải là NaN hay không. | `isNaN(NaN)` |  | `true` |
| **isNegative** | kiểm tra đầu vào có phải là số âm hay không. | `isNegative(-5)` |  | `true` |
| **isNumeric** | kiểm tra đầu vào có phải là giá trị số hay không. | `isNumeric('123')` |  | `false` |
| **isPositive** | kiểm tra đầu vào có phải là số dương hay không. | `isPositive(2)` |  | `true` |
| **isPrime** | kiểm tra đầu vào có phải là số nguyên tố hay không. | `isPrime(7)` |  | `true` |
| **isZero** | kiểm tra đầu vào có phải là 0 hay không. | `isZero(0)` |  | `true` |
| **numeric** | chuyển đổi giá trị đầu vào thành kiểu số cụ thể(như number, BigNumber , v.v.). | `numeric('123')` |  | `123` |
| **typeOf** | trả về tên kiểu của giá trị đầu vào. | `typeOf([1, 2, 3])` |  | `Array` |
