:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/calculation-engine/math) देखें।
:::

# Mathjs

[Math.js](https://mathjs.org/) JavaScript और Node.js के लिए एक फीचर-समृद्ध गणित लाइब्रेरी है।

## फ़ंक्शन संदर्भ (Function Reference)

### अभिव्यक्ति (Expressions)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **compile** | किसी अभिव्यक्ति को पार्स और कंपाइल करना (केवल पार्स करता है और सीधे परिणाम नहीं देता)। | `compile('2 + 3')` | अभिव्यक्ति (string) | `{}` |
| **evaluate** | किसी अभिव्यक्ति का मूल्यांकन करना और परिणाम वापस करना। | `evaluate('2 + 3')` | अभिव्यक्ति (string), स्कोप (वैकल्पिक) | `5` |
| **help** | किसी फ़ंक्शन या डेटा प्रकार के लिए दस्तावेज़ प्राप्त करना। | `help('evaluate')` | खोज कीवर्ड (string) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | कस्टम ऑपरेशन्स के लिए एक पार्सर बनाना। | `parser()` | कोई नहीं | `{}` |

### बीजगणित (Algebra)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **derivative** | किसी निर्दिष्ट चर (variable) के सापेक्ष अभिव्यक्ति का अवकलन (differentiate) करना। | `derivative('x^2', 'x')` | अभिव्यक्ति (string या Node), चर (string) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | एक एक्सप्रेशन ट्री में लीफ नोड्स (प्रतीक या स्थिरांक) की गणना करना। | `leafCount('x^2 + y')` | अभिव्यक्ति (string या Node) | `3` |
| **lsolve** | फॉरवर्ड सब्स्टीट्यूशन का उपयोग करके एक रैखिक प्रणाली (linear system) को हल करना। | `lsolve([[1,2],[3,4]], [5,6])` | L (Array या Matrix), b (Array या Matrix) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | फॉरवर्ड सब्स्टीट्यूशन का उपयोग करके रैखिक प्रणाली के सभी समाधान खोजना। | `lsolveAll([[1,2],[3,4]], [5,6])` | L (Array या Matrix), b (Array या Matrix) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | पार्शियल पिवोटिंग के साथ LU अपघटन (decomposition) करना। | `lup([[1,2],[3,4]])` | A (Array या Matrix) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | रैखिक प्रणाली A*x = b को हल करना जहाँ A एक n×n मैट्रिक्स है। | `lusolve([[1,2],[3,4]], [5,6])` | A (Array या Matrix), b (Array या Matrix) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | मैट्रिक्स का QR अपघटन करना। | `qr([[1,2],[3,4]])` | A (Array या Matrix) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | एक परिमेयकरण योग्य (rationalizable) अभिव्यक्ति को परिमेय अंश (rational fraction) में बदलना। | `rationalize('1/(x+1)')` | अभिव्यक्ति (string या Node) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | किसी अभिव्यक्ति में प्रतीकों को दिए गए स्कोप के मानों से बदलना। | `resolve('x + y', {x:2, y:3})` | अभिव्यक्ति (string या Node), स्कोप (object) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | एक एक्सप्रेशन ट्री को सरल बनाना (समान पदों को जोड़ना, आदि)। | `simplify('2x + 3x')` | अभिव्यक्ति (string या Node) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | एक बार में सरलीकरण (one-pass simplification) करना, अक्सर प्रदर्शन-संवेदनशील मामलों में उपयोग किया जाता है। | `simplifyCore('x+x')` | अभिव्यक्ति (string या Node) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | फुल पिवोटिंग के साथ विरल (sparse) LU अपघटन की गणना करना। | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (Array या Matrix), क्रम (string), थ्रेशोल्ड (number) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | जांचना कि क्या दो अभिव्यक्तियाँ प्रतीकात्मक रूप से समान हैं। | `symbolicEqual('x+x', '2x')` | अभिव्यक्ति1 (string या Node), अभिव्यक्ति2 (string या Node) | `true` |
| **usolve** | बैक सब्स्टीट्यूशन का उपयोग करके एक रैखिक प्रणाली को हल करना। | `usolve([[1,2],[0,1]], [3,4])` | U (Array या Matrix), b (Array या Matrix) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | बैक सब्स्टीट्यूशन का उपयोग करके रैखिक प्रणाली के सभी समाधान खोजना। | `usolveAll([[1,2],[0,1]], [3,4])` | U (Array या Matrix), b (Array या Matrix) | `[  [    [      -5    ],    [      4    ]  ]]` |

### अंकगणित (Arithmetic)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **abs** | किसी संख्या का निरपेक्ष मान (absolute value) निकालना। | `abs(-3.2)` | x (number, Complex, Array, या Matrix) | `3.2` |
| **add** | दो या अधिक मानों को जोड़ना (x + y)। | `add(2, 3)` | x, y, ... (number, Array, या Matrix) | `5` |
| **cbrt** | किसी संख्या का घनमूल (cube root) निकालना, वैकल्पिक रूप से सभी घनमूल वापस करना। | `cbrt(8)` | x (number या Complex), allRoots (boolean, वैकल्पिक) | `2` |
| **ceil** | धनात्मक अनंत की ओर पूर्णांकित करना (कॉम्प्लेक्स नंबरों के लिए, प्रत्येक भाग को अलग से पूर्णांकित किया जाता है)। | `ceil(3.2)` | x (number, Complex, Array, या Matrix) | `4` |
| **cube** | किसी मान का घन (cube) निकालना (x*x*x)। | `cube(3)` | x (number, Complex, Array, या Matrix) | `27` |
| **divide** | दो मानों को विभाजित करना (x / y)। | `divide(6, 2)` | x (number, Array, या Matrix), y (number, Array, या Matrix) | `3` |
| **dotDivide** | दो मैट्रिक्स या एरे को तत्व-वार (element-wise) विभाजित करना। | `dotDivide([6,8],[2,4])` | x (Array या Matrix), y (Array या Matrix) | `[  3,  2]` |
| **dotMultiply** | दो मैट्रिक्स या एरे को तत्व-वार गुणा करना। | `dotMultiply([2,3],[4,5])` | x (Array या Matrix), y (Array या Matrix) | `[  8,  15]` |
| **dotPow** | तत्व-वार x^y की गणना करना। | `dotPow([2,3],[2,3])` | x (Array या Matrix), y (Array या Matrix) | `[  4,  27]` |
| **exp** | e^x की गणना करना। | `exp(1)` | x (number, Complex, Array, या Matrix) | `2.718281828459045` |
| **expm1** | e^x - 1 की गणना करना। | `expm1(1)` | x (number या Complex) | `1.718281828459045` |
| **fix** | शून्य की ओर पूर्णांकित करना (काटना/truncate)। | `fix(3.7)` | x (number, Complex, Array, या Matrix) | `3` |
| **floor** | ऋणात्मक अनंत की ओर पूर्णांकित करना। | `floor(3.7)` | x (number, Complex, Array, या Matrix) | `3` |
| **gcd** | दो या अधिक संख्याओं का महत्तम समापवर्तक (greatest common divisor) निकालना। | `gcd(8, 12)` | a, b, ... (number या BigNumber) | `4` |
| **hypot** | तर्कों के वर्गों के योग का वर्गमूल निकालना (पायथागोरस)। | `hypot(3, 4)` | a, b, ... (number या BigNumber) | `5` |
| **invmod** | a मॉड्युलो b के मॉड्यूलर गुणात्मक व्युत्क्रम (multiplicative inverse) की गणना करना। | `invmod(3, 11)` | a, b (number या BigNumber) | `4` |
| **lcm** | दो या अधिक संख्याओं का लघुत्तम समापवर्त्य (least common multiple) निकालना। | `lcm(4, 6)` | a, b, ... (number या BigNumber) | `12` |
| **log** | वैकल्पिक आधार के साथ लघुगणक (logarithm) की गणना करना। | `log(100, 10)` | x (number या Complex), base (number या Complex, वैकल्पिक) | `2` |
| **log10** | किसी संख्या के आधार-10 लघुगणक की गणना करना। | `log10(100)` | x (number या Complex) | `2` |
| **log1p** | ln(1 + x) की गणना करना। | `log1p(1)` | x (number या Complex) | `0.6931471805599453` |
| **log2** | किसी संख्या के आधार-2 लघुगणक की गणना करना। | `log2(8)` | x (number या Complex) | `3` |
| **mod** | x ÷ y के शेषफल (x mod y) की गणना करना। | `mod(8,3)` | x, y (number या BigNumber) | `2` |
| **multiply** | दो या अधिक मानों को गुणा करना (x * y)। | `multiply(2, 3)` | x, y, ... (number, Array, या Matrix) | `6` |
| **norm** | वैकल्पिक p के साथ किसी संख्या, वेक्टर या मैट्रिक्स के नॉर्म की गणना करना। | `norm([3,4])` | x (Array या Matrix), p (number या string, वैकल्पिक) | `5` |
| **nthRoot** | किसी संख्या का n-वां मूल (मुख्य मूल) निकालना। | `nthRoot(16, 4)` | a (number, BigNumber, या Complex), root (number, वैकल्पिक) | `2` |
| **nthRoots** | किसी संख्या के सभी n-वें मूल निकालना, जो कॉम्प्लेक्स हो सकते हैं। | `nthRoots(1,3)` | x (number या Complex), root (number) | `[  {    "mathjs": "Complex",    "re": 1,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.4999999999999998,    "im": 0.8660254037844387  },  {    "mathjs": "Complex",    "re": -0.5000000000000004,    "im": -0.8660254037844384  }]` |
| **pow** | x की घात y निकालना। | `pow(2, 3)` | x (number, Complex, Array, या Matrix), y (number, Complex, Array, या Matrix) | `8` |
| **round** | दशमलव के निर्दिष्ट स्थानों तक पूर्णांकित करना। | `round(3.14159, 2)` | x (number, Complex, Array, या Matrix), n (number, वैकल्पिक) | `3.14` |
| **sign** | किसी संख्या का चिह्न (-1, 0, या 1) वापस करना। | `sign(-3)` | x (number, BigNumber, या Complex) | `-1` |
| **sqrt** | किसी संख्या का वर्गमूल निकालना। | `sqrt(9)` | x (number, Complex, Array, या Matrix) | `3` |
| **square** | किसी मान का वर्ग (x*x) निकालना। | `square(3)` | x (number, Complex, Array, या Matrix) | `9` |
| **subtract** | एक मान को दूसरे से घटाना (x - y)। | `subtract(8, 3)` | x, y (number, Array, या Matrix) | `5` |
| **unaryMinus** | किसी मान पर यूनरी नेगेशन (unary negation) लागू करना। | `unaryMinus(3)` | x (number, Complex, Array, या Matrix) | `-3` |
| **unaryPlus** | यूनरी प्लस लागू करना (आमतौर पर मान अपरिवर्तित रहता है)। | `unaryPlus(-3)` | x (number, Complex, Array, या Matrix) | `-3` |
| **xgcd** | दो संख्याओं के विस्तारित महत्तम समापवर्तक (extended greatest common divisor) की गणना करना। | `xgcd(8, 12)` | a, b (number या BigNumber) | `{  "mathjs": "DenseMatrix",  "data": [    4,    -1,    1  ],  "size": [    3  ]}` |

### बिटवाइज़ (Bitwise)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bitAnd** | बिटवाइज़ AND (x & y) करना। | `bitAnd(5, 3)` | x, y (number या BigNumber) | `1` |
| **bitNot** | बिटवाइज़ NOT (~x) करना। | `bitNot(5)` | x (number या BigNumber) | `-6` |
| **bitOr** | बिटवाइज़ OR (x \| y) करना। | `bitOr(5, 3)` | x, y (number या BigNumber) | `7` |
| **bitXor** | बिटवाइज़ XOR (x ^ y) करना। | `bitXor(5, 3)` | x, y (number या BigNumber) | `6` |
| **leftShift** | x को y बिट्स से लेफ्ट शिफ्ट करना (x << y)। | `leftShift(5, 1)` | x, y (number या BigNumber) | `10` |
| **rightArithShift** | x पर अरिथमेटिक राइट शिफ्ट करना (x >> y)। | `rightArithShift(5, 1)` | x, y (number या BigNumber) | `2` |
| **rightLogShift** | x पर लॉजिकल राइट शिफ्ट करना (x >>> y)। | `rightLogShift(5, 1)` | x, y (number या BigNumber) | `2` |

### क्रमचय-संचय (Combinatorics)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bellNumbers** | n अलग-अलग तत्वों के विभाजनों (partitions) की गणना करना। | `bellNumbers(3)` | n (number) | `5` |
| **catalan** | कई कॉम्बिनेटरियल संरचनाओं के लिए n-वीं कैटलन संख्या की गणना करना। | `catalan(5)` | n (number) | `42` |
| **composition** | n को k भागों में विभाजित करने के तरीकों (compositions) की गणना करना। | `composition(5, 3)` | n, k (number) | `6` |
| **stirlingS2** | n लेबल वाली वस्तुओं को k गैर-खाली उपसमुच्चयों में विभाजित करने के तरीकों की संख्या की गणना करना (दूसरी तरह की स्टर्लिंग संख्याएँ)। | `stirlingS2(5, 3)` | n, k (number) | `25` |

### मिश्रित संख्याएँ (Complex Numbers)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **arg** | एक कॉम्प्लेक्स नंबर के कोणांक (phase/argument) की गणना करना। | `arg(complex('2 + 2i'))` | x (Complex या number) | `0.785398163` |
| **conj** | कॉम्प्लेक्स कंजुगेट की गणना करना। | `conj(complex('2 + 2i'))` | x (Complex या number) | `{  "mathjs": "Complex",  "re": 2,  "im": -2}` |
| **im** | कॉम्प्लेक्स नंबर का काल्पनिक (imaginary) भाग वापस करना। | `im(complex('2 + 3i'))` | x (Complex या number) | `3` |
| **re** | कॉम्प्लेक्स नंबर का वास्तविक (real) भाग वापस करना। | `re(complex('2 + 3i'))` | x (Complex या number) | `2` |

### ज्यामिति (Geometry)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **distance** | N-आयामी स्थान में दो बिंदुओं के बीच यूक्लिडियन दूरी की गणना करना। | `distance([0,0],[3,4])` | point1 (Array), point2 (Array) | `5` |
| **intersect** | दो रेखाओं (2D/3D) या एक रेखा और एक समतल (3D) का प्रतिच्छेदन (intersection) खोजना। | `intersect([0,0],[2,2],[0,2],[2,0])` | रेखा 1 के अंत बिंदु, रेखा 2 के अंत बिंदु, ... | `[  1,  1]` |

### तर्क (Logic)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **and** | लॉजिकल AND करना। | `and(true, false)` | x, y (boolean या number) | `false` |
| **not** | लॉजिकल NOT करना। | `not(true)` | x (boolean या number) | `false` |
| **or** | लॉजिकल OR करना। | `or(true, false)` | x, y (boolean या number) | `true` |
| **xor** | लॉजिकल XOR करना। | `xor(1, 0)` | x, y (boolean या number) | `true` |

### मैट्रिक्स (Matrix)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **column** | मैट्रिक्स से निर्दिष्ट कॉलम वापस करना। | `column([[1,2],[3,4]], 1)` | मान (Matrix या Array), इंडेक्स (number) | `[  [    1  ],  [    3  ]]` |
| **concat** | एक आयाम के साथ कई मैट्रिक्स/एरे को जोड़ना। | `concat([1,2], [3,4], [5,6])` | a, b, c, ... (Array या Matrix), dim (number, वैकल्पिक) | `[  1,  2,  3,  4,  5,  6]` |
| **count** | मैट्रिक्स, एरे या स्ट्रिंग में तत्वों की संख्या गिनना। | `count([1,2,3,'hello'])` | x (Array, Matrix, या string) | `4` |
| **cross** | दो 3D वेक्टरों के क्रॉस प्रोडक्ट की गणना करना। | `cross([1,2,3], [4,5,6])` | x, y (लंबाई 3 का Array या Matrix) | `[  -3,  6,  -3]` |
| **ctranspose** | मैट्रिक्स के कंजुगेट ट्रांसपोज़ की गणना करना। | `ctranspose([[1,2],[3,4]])` | x (Matrix या Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **det** | मैट्रिक्स के सारणिक (determinant) की गणना करना। | `det([[1,2],[3,4]])` | x (Matrix या Array) | `-2` |
| **diag** | एक विकर्ण मैट्रिक्स (diagonal matrix) बनाना या मैट्रिक्स का विकर्ण निकालना। | `diag([1,2,3])` | X (Array या Matrix) | `[  [    1,    0,    0  ],  [    0,    2,    0  ],  [    0,    0,    3  ]]` |
| **diff** | एक आयाम के साथ आसन्न तत्वों के बीच अंतर की गणना करना। | `diff([1,4,9,16])` | arr (Array या Matrix), dim (number, वैकल्पिक) | `[  3,  5,  7]` |
| **dot** | दो वेक्टरों के डॉट प्रोडक्ट की गणना करना। | `dot([1,2,3],[4,5,6])` | x, y (Array या Matrix) | `32` |
| **eigs** | एक वर्ग मैट्रिक्स के आइगेनवैल्यू (eigenvalues) और वैकल्पिक रूप से आइगेनवेक्टर (eigenvectors) की गणना करना। | `eigs([[1,2],[3,4]])` | x (Matrix या Array), codec (number, वैकल्पिक) | `{  "values": [    -0.37228132326901653,    5.372281323269014  ],  "eigenvectors": [    {      "value": -0.37228132326901653,      "vector": [        -4.505883335311908,        3.091669772938812      ]    },    {      "value": 5.372281323269014,      "vector": [        0.4438641329939267,        0.9703494293791691      ]    }  ]}` |
| **expm** | मैट्रिक्स घातांक (exponential) e^A की गणना करना। | `expm([[1,0],[0,1]])` | x (Matrix या Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      2.7182818284590424,      0    ],    [      0,      2.7182818284590424    ]  ],  "size": [    2,    2  ]}` |
| **fft** | N-आयामी फास्ट फूरियर ट्रांसफॉर्म (FFT) की गणना करना। | `fft([1,2,3,4])` | arr (Array या Matrix) | `[  {    "mathjs": "Complex",    "re": 10,    "im": 0  },  {    "mathjs": "Complex",    "re": -2,    "im": 2  },  {    "mathjs": "Complex",    "re": -2,    "im": 0  },  {    "mathjs": "Complex",    "re": -1.9999999999999998,    "im": -2  }]` |
| **filter** | (अभी समर्थित नहीं है) टेस्ट फ़ंक्शन के साथ एरे या 1D मैट्रिक्स को फ़िल्टर करना। | `filter(['23', 'foo', '100', '55', 'bar'], /[0-9]+/)` | x (Array या Matrix), test (function) | `[  "23",  "100",  "55"]` |
| **flatten** | बहु-आयामी मैट्रिक्स या एरे को 1D में बदलना। | `flatten([[1,2],[3,4]])` | x (Array या Matrix) | `[  1,  2,  3,  4]` |
| **forEach** | (अभी समर्थित नहीं है) मैट्रिक्स/एरे के प्रत्येक तत्व पर पुनरावृत्ति करना और कॉलबैक को कॉल करना। | `forEach([1,2,3], val => console.log(val))` | x (Array या Matrix), callback (function) | `undefined` |
| **getMatrixDataType** | मैट्रिक्स या एरे के सभी तत्वों के डेटा प्रकार का निरीक्षण करना (जैसे, 'number', 'Complex')। | `getMatrixDataType([[1,2.2],[3,'hello']])` | x (Array या Matrix) | `mixed` |
| **identity** | n x n (या m x n) आइडेंटिटी मैट्रिक्स बनाना। | `identity(3)` | n (number) या [m, n] (Array) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      0,      0    ],    [      0,      1,      0    ],    [      0,      0,      1    ]  ],  "size": [    3,    3  ]}` |
| **ifft** | N-आयामी व्युत्क्रम (inverse) FFT की गणना करना। | `ifft([1,2,3,4])` | arr (Array या Matrix) | `[  {    "mathjs": "Complex",    "re": 2.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.5,    "im": -0.5  },  {    "mathjs": "Complex",    "re": -0.5,    "im": 0  },  {    "mathjs": "Complex",    "re": -0.49999999999999994,    "im": 0.5  }]` |
| **inv** | एक वर्ग मैट्रिक्स के व्युत्क्रम (inverse) की गणना करना। | `inv([[1,2],[3,4]])` | x (Matrix या Array) | `[  [    -2,    1  ],  [    1.5,    -0.5  ]]` |
| **kron** | दो मैट्रिक्स या वेक्टरों के क्रोनेकर उत्पाद (Kronecker product) की गणना करना। | `kron([[1,1],[0,1]], [[2,0],[0,2]])` | x, y (Matrix या Array) | `[  [    2,    0,    2,    0  ],  [    0,    2,    0,    2  ],  [    0,    0,    2,    0  ],  [    0,    0,    0,    2  ]]` |
| **map** | प्रत्येक तत्व पर कॉलबैक लागू करके एक नया एरे/मैट्रिक्स बनाना। | `map([1,2,3], val => val * val)` | x (Array या Matrix), callback (function) | `[  1,  4,  9]` |
| **matrixFromColumns** | वेक्टरों को एक डेंस मैट्रिक्स के अलग-अलग कॉलम के रूप में संयोजित करना। | `matrixFromColumns([1,4],[2,5],[3,6])` | ...arr (Array या Matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **matrixFromFunction** | (अभी समर्थित नहीं है) प्रत्येक इंडेक्स के लिए फ़ंक्शन का मूल्यांकन करके मैट्रिक्स बनाना। | `matrixFromFunction([5], i => math.random())` | size (Array), fn (function) | `a random vector` |
| **matrixFromRows** | वेक्टरों को एक डेंस मैट्रिक्स की अलग-अलग पंक्तियों (rows) के रूप में संयोजित करना। | `matrixFromRows([1,2,3],[4,5,6])` | ...arr (Array या Matrix) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **ones** | दिए गए आयामों के लिए सभी 1 वाला मैट्रिक्स बनाना। | `ones(2, 3)` | m, n, p... (number) | `{  "mathjs": "DenseMatrix",  "data": [    [      1,      1,      1    ],    [      1,      1,      1    ]  ],  "size": [    2,    3  ]}` |
| **partitionSelect** | पार्टीशन सिलेक्शन का उपयोग करके k-वां सबसे छोटा तत्व वापस करना। | `partitionSelect([3,1,4,2], 2)` | x (Array या Matrix), k (number) | `3` |
| **pinv** | मैट्रिक्स के मूर-पेनरोस स्यूडोइनवर्स (Moore–Penrose pseudoinverse) की गणना करना। | `pinv([[1,2],[2,4]])` | x (Matrix या Array) | `[  [    0.04000000000000001,    0.08000000000000002  ],  [    0.08000000000000002,    0.16000000000000003  ]]` |
| **range** | स्टार्ट से एंड तक संख्याओं का एक एरे बनाना (वैकल्पिक स्टेप के साथ)। | `range(1, 5, 2)` | start (number), end (number), step (number, वैकल्पिक) | `{  "mathjs": "DenseMatrix",  "data": [    1,    3  ],  "size": [    2  ]}` |
| **reshape** | एरे/मैट्रिक्स को दिए गए आयामों में फिर से आकार देना। | `reshape([1,2,3,4,5,6], [2,3])` | x (Array या Matrix), sizes (Array) | `[  [    1,    2,    3  ],  [    4,    5,    6  ]]` |
| **resize** | मैट्रिक्स को नए आयामों में फिर से आकार देना, यदि प्रदान किया गया हो तो डिफ़ॉल्ट मान से भरना। | `resize([1,2,3], [5], 0)` | x (Array या Matrix), size (Array), defaultValue (वैकल्पिक) | `[  1,  2,  3,  0,  0]` |
| **rotate** | 1x2 वेक्टर को वामावर्त (counterclockwise) घुमाना या अक्ष के चारों ओर 1x3 वेक्टर को घुमाना। | `rotate([1, 0], Math.PI / 2)` | w (Array या Matrix), theta (number[, axis]) | `[  6.123233995736766e-17,  1]` |
| **rotationMatrix** | रेडियन में दिए गए कोण के लिए 2x2 रोटेशन मैट्रिक्स बनाना। | `rotationMatrix(Math.PI / 2)` | theta (number) | `{  "mathjs": "DenseMatrix",  "data": [    [      6.123233995736766e-17,      -1    ],    [      1,      6.123233995736766e-17    ]  ],  "size": [    2,    2  ]}` |
| **row** | मैट्रिक्स से निर्दिष्ट पंक्ति (row) वापस करना। | `row([[1,2],[3,4]], 1)` | मान (Matrix या Array), इंडेक्स (number) | `[  [    3,    4  ]]` |
| **size** | मैट्रिक्स, एरे या स्केलर के आकार (आयाम) की गणना करना। | `size([[1,2,3],[4,5,6]])` | x (Array, Matrix, या number) | `[  2,  3]` |
| **sort** | मैट्रिक्स या एरे को आरोही क्रम (ascending order) में सॉर्ट करना। | `sort([3,1,2])` | x (Array या Matrix) | `[  1,  2,  3]` |
| **sqrtm** | एक वर्ग मैट्रिक्स के मुख्य वर्गमूल की गणना करना। | `sqrtm([[4,0],[0,4]])` | A (Matrix या Array) | `[  [    2.000000000000002,    0  ],  [    0,    2.000000000000002  ]]` |
| **squeeze** | मैट्रिक्स के अंदर या बाहर से सिंगलटन आयामों को हटाना। | `squeeze([[[1],[2],[3]]])` | x (Matrix या Array) | `[  1,  2,  3]` |
| **subset** | मैट्रिक्स या स्ट्रिंग के सबसेट को प्राप्त करना या बदलना। | `subset([[1, 2], [3, 4]], index(1, 1),2)` | x (Matrix, Array, या string), index (Index), replacement (वैकल्पिक) | `[  [    2,    2  ],  [    3,    4  ]]` |
| **trace** | एक वर्ग मैट्रिक्स के ट्रेस (विकर्ण तत्वों का योग) की गणना करना। | `trace([[1,2],[3,4]])` | x (Matrix या Array) | `5` |
| **transpose** | मैट्रिक्स का ट्रांसपोज़ करना। | `transpose([[1,2],[3,4]])` | x (Matrix या Array) | `[  [    1,    3  ],  [    2,    4  ]]` |
| **zeros** | दिए गए आयामों के लिए सभी शून्य वाला मैट्रिक्स बनाना। | `zeros(2, 3)` | m, n, p... (number) | `{  "mathjs": "DenseMatrix",  "data": [    [      0,      0,      0    ],    [      0,      0,      0    ]  ],  "size": [    2,    3  ]}` |

### प्रायिकता (Probability)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **combinations** | n में से k अव्यवस्थित वस्तुओं का चयन करते समय संयोजनों (combinations) की गणना करना। | `combinations(5, 2)` | n (number), k (number) | `10` |
| **combinationsWithRep** | पुनरावृत्ति संभव होने पर संयोजनों की गणना करना। | `combinationsWithRep(5, 2)` | n (number), k (number) | `15` |
| **factorial** | पूर्णांक n के लिए n! की गणना करना। | `factorial(5)` | n (integer) | `120` |
| **gamma** | गामा फ़ंक्शन का अनुमान लगाना। | `gamma(5)` | n (number) | `24` |
| **kldivergence** | दो वितरणों (distributions) के बीच KL डाइवर्जेंस की गणना करना। | `kldivergence([0.1, 0.9], [0.2, 0.8])` | x (Array या Matrix), y (Array या Matrix) | `0.036690014034750584` |
| **lgamma** | गामा फ़ंक्शन के लघुगणक की गणना करना। | `lgamma(5)` | n (number) | `3.178053830347945` |
| **multinomial** | गणनाओं के एक सेट से बहुपद गुणांक (multinomial coefficient) की गणना करना। | `multinomial([1, 2, 3])` | a (Array) | `60` |
| **permutations** | n में से k वस्तुओं के चयन के क्रमबद्ध क्रमचयों (permutations) की गणना करना। | `permutations(5, 2)` | n (number), k (number, वैकल्पिक) | `20` |
| **pickRandom** | 1D एरे से एक या अधिक यादृच्छिक (random) मान चुनना। | `pickRandom([10, 20, 30])` | array | `20` |
| **random** | समान रूप से वितरित यादृच्छिक संख्या वापस करना। | `random(1, 10)` | min (वैकल्पिक), max (वैकल्पिक) | `3.6099423753668143` |
| **randomInt** | समान रूप से वितरित यादृच्छिक पूर्णांक वापस करना। | `randomInt(1, 10)` | min (वैकल्पिक), max (वैकल्पिक) | `5` |

### तुलना (Rational Numbers)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **compare** | दो मानों की तुलना करना, -1, 0, या 1 वापस करना। | `compare(2, 3)` | x, y (किसी भी प्रकार का) | `-1` |
| **compareNatural** | प्राकृतिक, दोहराने योग्य क्रम में मनमाने मानों की तुलना करना। | `compareNatural('2', '10')` | x, y (किसी भी प्रकार का) | `-1` |
| **compareText** | दो स्ट्रिंग्स की लेक्सिकोग्राफ़िक रूप से तुलना करना। | `compareText('apple', 'banana')` | x (string), y (string) | `-1` |
| **deepEqual** | समानता के लिए दो मैट्रिक्स/एरे की तत्व-वार तुलना करना। | `deepEqual([[1, 2]], [[1, 2]])` | x (Array/Matrix), y (Array/Matrix) | `true` |
| **equal** | परीक्षण करना कि क्या दो मान समान हैं। | `equal(2, 2)` | x, y (किसी भी प्रकार का) | `true` |
| **equalText** | परीक्षण करना कि क्या दो स्ट्रिंग्स समान हैं। | `equalText('hello', 'hello')` | x (string), y (string) | `true` |
| **larger** | जांचना कि क्या x, y से बड़ा है। | `larger(3, 2)` | x, y (number या BigNumber) | `true` |
| **largerEq** | जांचना कि क्या x, y से बड़ा या उसके बराबर है। | `largerEq(3, 3)` | x, y (number या BigNumber) | `true` |
| **smaller** | जांचना कि क्या x, y से छोटा है। | `smaller(2, 3)` | x, y (number या BigNumber) | `true` |
| **smallerEq** | जांचना कि क्या x, y से छोटा या उसके बराबर है। | `smallerEq(2, 2)` | x, y (number या BigNumber) | `true` |
| **unequal** | जांचना कि क्या दो मान समान नहीं हैं। | `unequal(2, 3)` | x, y (किसी भी प्रकार का) | `true` |

### सेट (Sets)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **setCartesian** | दो (या अधिक) सेटों का कार्टेशियन उत्पाद (Cartesian product) तैयार करना। | `setCartesian([1, 2], [3, 4])` | set1 (Array), set2 (Array) | `[  [    1,    3  ],  [    1,    4  ],  [    2,    3  ],  [    2,    4  ]]` |
| **setDifference** | दो सेटों का अंतर वापस करना (वे तत्व जो set1 में हैं लेकिन set2 में नहीं)। | `setDifference([1, 2, 3], [2])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setDistinct** | एक (मल्टी)सेट के अंदर अद्वितीय तत्व वापस करना। | `setDistinct([1, 2, 2, 3])` | set (Array) | `[  1,  2,  3]` |
| **setIntersect** | दो (या अधिक) सेटों का प्रतिच्छेदन (intersection) वापस करना। | `setIntersect([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  2]` |
| **setIsSubset** | जांचना कि क्या set1, set2 का उपसमुच्चय (subset) है। | `setIsSubset([1, 2], [1, 2, 3])` | set1 (Array), set2 (Array) | `true` |
| **setMultiplicity** | गिनना कि एक मल्टीसेट में कोई तत्व कितनी बार आता है। | `setMultiplicity(2, [1, 2, 2, 3])` | तत्व (किसी भी प्रकार का), set (Array) | `2` |
| **setPowerset** | एक (मल्टी)सेट का पावरसेट (सभी उपसमुच्चय) वापस करना। | `setPowerset([1, 2])` | set (Array) | `[  [],  [    1  ],  [    2  ],  [    1,    2  ]]` |
| **setSize** | एक (मल्टी)सेट में सभी तत्वों को गिनना। | `setSize([1, 2, 3])` | set (Array) | `3` |
| **setSymDifference** | दो (या अधिक) सेटों का सममित अंतर (symmetric difference) वापस करना। | `setSymDifference([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3]` |
| **setUnion** | दो (या अधिक) सेटों का संघ (union) वापस करना। | `setUnion([1, 2], [2, 3])` | set1 (Array), set2 (Array) | `[  1,  3,  2]` |

### विशेष (Special)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **erf** | परिमेय चेबीशेव सन्निकटन (rational Chebyshev approximation) का उपयोग करके एरर फ़ंक्शन की गणना करना। | `erf(0.5)` | इनपुट x (number) | `0.5204998778130465` |

### सांख्यिकी (Statistics)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **cumsum** | सूची या मैट्रिक्स के संचयी योग (cumulative sum) की गणना करना। | `cumsum([1, 2, 3, 4])` |  | `[  1,  3,  6,  10]` |
| **mad** | माध्यिका निरपेक्ष विचलन (median absolute deviation) की गणना करना। | `mad([1, 2, 3, 4])` |  | `1` |
| **max** | सूची या मैट्रिक्स का अधिकतम मान वापस करना। | `max([1, 2, 3])` |  | `3` |
| **mean** | माध्य (mean) मान की गणना करना। | `mean([2, 4, 6])` |  | `4` |
| **median** | माध्यिका (median) की गणना करना। | `median([1, 2, 3, 4, 5])` |  | `3` |
| **min** | सूची या मैट्रिक्स का न्यूनतम मान वापस करना। | `min([1, 2, 3])` |  | `1` |
| **mode** | बहुलक (mode) की गणना करना (सबसे लगातार मान)। | `mode([1, 2, 2, 3])` |  | `[  2]` |
| **prod** | सूची या मैट्रिक्स की सभी संख्याओं के गुणनफल की गणना करना। | `prod([1, 2, 3, 4])` |  | `24` |
| **quantileSeq** | प्रायिकता `prob` पर क्वांटाइल की गणना करना। | `quantileSeq([1, 2, 3, 4], 0.25)` |  | `1.75` |
| **std** | डेटा के मानक विचलन (standard deviation) की गणना करना। | `std([1, 2, 3, 4])` |  | `1.2909944487358056` |
| **sum** | सूची या मैट्रिक्स की सभी संख्याओं के योग की गणना करना। | `sum([1, 2, 3])` |  | `6` |
| **variance** | डेटा के प्रसरण (variance) की गणना करना। | `variance([1, 2, 3, 4])` |  | `1.6666666666666667` |

### स्ट्रिंग्स (Strings)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **bin** | संख्या को बाइनरी के रूप में फॉर्मेट करना। | `bin(13)` |  | `13` |
| **format** | किसी भी मान को निर्दिष्ट सटीकता के साथ स्ट्रिंग के रूप में फॉर्मेट करना। | `format(123.456, 2)` |  | `120` |
| **hex** | संख्या को हेक्साडेसिमल के रूप में फॉर्मेट करना। | `hex(255)` |  | `255` |
| **oct** | संख्या को ऑक्टल के रूप में फॉर्मेट करना। | `oct(64)` |  | `64` |
| **print** | स्ट्रिंग टेम्पलेट में कई मानों को इंटरपोलेट करना। | `print('x = $x, y = $y', {x: 3, y: 4}, 2)` |  | `x = 3, y = 4` |

### त्रिकोणमिति (Trigonometry)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **acos** | आर्ककोसाइन की गणना करना। | `acos(0.5)` |  | `1.0471975511965979` |
| **acosh** | प्रतिलोम अतिपरवलयिक कोसाइन (inverse hyperbolic cosine) की गणना करना। | `acosh(2)` |  | `1.3169578969248166` |
| **acot** | आर्ककोटिंजेंट की गणना करना। | `acot(1)` |  | `0.7853981633974483` |
| **acoth** | प्रतिलोम अतिपरवलयिक कोटिंजेंट की गणना करना। | `acoth(2)` |  | `0.5493061443340548` |
| **acsc** | आर्ककोसेकेंट की गणना करना। | `acsc(2)` |  | `0.5235987755982989` |
| **acsch** | प्रतिलोम अतिपरवलयिक कोसेकेंट की गणना करना। | `acsch(2)` |  | `0.48121182505960347` |
| **asec** | आर्कसेकेंट की गणना करना। | `asec(2)` |  | `1.0471975511965979` |
| **asech** | प्रतिलोम अतिपरवलयिक सेकेंट की गणना करना। | `asech(0.5)` |  | `1.3169578969248166` |
| **asin** | आर्कसाइन की गणना करना। | `asin(0.5)` |  | `0.5235987755982989` |
| **asinh** | प्रतिलोम अतिपरवलयिक साइन की गणना करना। | `asinh(1.5)` |  | `1.1947632172871094` |
| **atan** | आर्कटेंजेंट की गणना करना। | `atan(1)` |  | `0.7853981633974483` |
| **atan2** | दो तर्कों के साथ आर्कटेंजेंट की गणना करना। | `atan2(1, 2)` |  | `0.4636476090008061` |
| **atanh** | प्रतिलोम अतिपरवलयिक टेंजेंट की गणना करना। | `atanh(0.5)` |  | `0.5493061443340548` |
| **cos** | x के कोसाइन की गणना करना। | `cos(0.5)` |  | `0.8775825618903728` |
| **cosh** | x के अतिपरवलयिक कोसाइन की गणना करना। | `cosh(0.5)` |  | `1.1276259652063807` |
| **cot** | x के कोटिंजेंट की गणना करना। | `cot(0.5)` |  | `1.830487721712452` |
| **coth** | x के अतिपरवलयिक कोटिंजेंट की गणना करना। | `coth(0.5)` |  | `2.163953413738653` |
| **csc** | x के कोसेकेंट की गणना करना। | `csc(0.5)` |  | `2.085829642933488` |
| **csch** | x के अतिपरवलयिक कोसेकेंट की गणना करना। | `csch(0.5)` |  | `1.9190347513349437` |
| **sec** | x के सेकेंट की गणना करना। | `sec(0.5)` |  | `1.139493927324549` |
| **sech** | x के अतिपरवलयिक सेकेंट की गणना करना। | `sech(0.5)` |  | `0.886818883970074` |
| **sin** | x के साइन की गणना करना। | `sin(0.5)` |  | `0.479425538604203` |
| **sinh** | x के अतिपरवलयिक साइन की गणना करना। | `sinh(0.5)` |  | `0.5210953054937474` |
| **tan** | x के टेंजेंट की गणना करना। | `tan(0.5)` |  | `0.5463024898437905` |
| **tanh** | x के अतिपरवलयिक टेंजेंट की गणना करना। | `tanh(0.5)` |  | `0.46211715726000974` |

### इकाइयाँ (Units)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **to** | एक संख्यात्मक मान को निर्दिष्ट इकाई में बदलना। | `to(unit('2 inch'), 'cm')` |  | `{  "mathjs": "Unit",  "value": 5.08,  "unit": "cm",  "fixcodefix": true}` |

### उपयोगिताएँ (Utilities)

| Function | Definition | Example call | Parameters | Expected result |
| --- | --- | --- | --- | --- |
| **clone** | इनपुट मान का डीप क्लोन बनाना। | `clone([1, 2, 3])` |  | `[  1,  2,  3]` |
| **hasNumericValue** | जांचना कि क्या इनपुट में संख्यात्मक मान है। | `hasNumericValue('123')` |  | `true` |
| **isInteger** | जांचना कि क्या इनपुट एक पूर्णांक है। | `isInteger(3.0)` |  | `true` |
| **isNaN** | जांचना कि क्या इनपुट NaN है। | `isNaN(NaN)` |  | `true` |
| **isNegative** | जांचना कि क्या इनपुट ऋणात्मक है। | `isNegative(-5)` |  | `true` |
| **isNumeric** | जांचना कि क्या इनपुट संख्यात्मक है। | `isNumeric('123')` |  | `false` |
| **isPositive** | जांचना कि क्या इनपुट धनात्मक है। | `isPositive(2)` |  | `true` |
| **isPrime** | जांचना कि क्या इनपुट अभाज्य (prime) है। | `isPrime(7)` |  | `true` |
| **isZero** | जांचना कि क्या इनपुट शून्य है। | `isZero(0)` |  | `true` |
| **numeric** | इनपुट को संख्यात्मक प्रकार (number, BigNumber, आदि) में बदलना। | `numeric('123')` |  | `123` |
| **typeOf** | इनपुट मान के प्रकार का नाम वापस करना। | `typeOf([1, 2, 3])` |  | `Array` |