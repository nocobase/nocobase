:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/calculation-engine/math).
:::

# Mathjs

[Math.js](https://mathjs.org/) to bogata w funkcje biblioteka matematyczna dla JavaScript i Node.js.

## Dokumentacja funkcji

### Wyrażenia

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| --- | --- | --- | --- | --- |
| **compile** | Analizuje i kompiluje wyrażenie (odpowiada za analizę, nie zwraca bezpośrednio wyniku). | `compile('2 + 3')` | wyrażenie (ciąg znaków) | `{}` |
| **evaluate** | Oblicza wyrażenie i zwraca wynik. | `evaluate('2 + 3')` | wyrażenie (ciąg znaków), zakres (opcjonalnie) | `5` |
| **help** | Pobiera dokumentację dla funkcji lub typu danych. | `help('evaluate')` | słowo kluczowe wyszukiwania (ciąg znaków) | `{  "name": "evaluate",  "category": "Excodession",  "syntax": [    "evaluate(excodession)",    "evaluate(excodession, scope)",    "evaluate([expr1, expr2, expr3, ...])",    "evaluate([expr1, expr2, expr3, ...], scope)"  ],  "description": "Evaluate an excodession or an array with excodessions.",  "examples": [    "evaluate(\"2 + 3\")",    "evaluate(\"sqrt(16)\")",    "evaluate(\"2 inch to cm\")",    "evaluate(\"sin(x * pi)\", { \"x\": 1/2 })",    "evaluate([\"width=2\", \"height=4\",\"width*height\"])"  ],  "seealso": [],  "mathjs": "Help"}` |
| **parser** | Tworzy parser dla niestandardowych operacji. | `parser()` | Brak | `{}` |

### Algebra

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| --- | --- | --- | --- | --- |
| **derivative** | Oblicza pochodną wyrażenia względem określonej zmiennej. | `derivative('x^2', 'x')` | wyrażenie (ciąg znaków lub węzeł), zmienna (ciąg znaków) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **leafCount** | Liczy węzły liści (symbole lub stałe) w drzewie wyrażeń. | `leafCount('x^2 + y')` | wyrażenie (ciąg znaków lub węzeł) | `3` |
| **lsolve** | Rozwiązuje układ równań liniowych metodą podstawiania w przód. | `lsolve([[1,2],[3,4]], [5,6])` | L (tablica lub macierz), b (tablica lub macierz) | `[  [    5  ],  [    -2.25  ]]` |
| **lsolveAll** | Znajduje wszystkie rozwiązania układu równań liniowych metodą podstawiania w przód. | `lsolveAll([[1,2],[3,4]], [5,6])` | L (tablica lub macierz), b (tablica lub macierz) | `[  [    [      5    ],    [      -2.25    ]  ]]` |
| **lup** | Wykonuje dekompozycję LU z częściowym wyborem elementu głównego (pivoting). | `lup([[1,2],[3,4]])` | A (tablica lub macierz) | `{  "L": [    [      1,      0    ],    [      0.3333333333333333,      1    ]  ],  "U": [    [      3,      4    ],    [      0,      0.6666666666666667    ]  ],  "p": [    1,    0  ]}` |
| **lusolve** | Rozwiązuje układ równań liniowych A*x = b, gdzie A jest macierzą n×n. | `lusolve([[1,2],[3,4]], [5,6])` | A (tablica lub macierz), b (tablica lub macierz) | `[  [    -3.9999999999999987  ],  [    4.499999999999999  ]]` |
| **qr** | Oblicza rozkład QR macierzy. | `qr([[1,2],[3,4]])` | A (tablica lub macierz) | `{  "Q": [    [      0.316227766016838,      0.9486832980505138    ],    [      0.9486832980505138,      -0.316227766016838    ]  ],  "R": [    [      3.162277660168379,      4.427188724235731    ],    [      0,      0.6324555320336751    ]  ]}` |
| **rationalize** | Przekształca wyrażenie wymierne na ułamek prosty. | `rationalize('1/(x+1)')` | wyrażenie (ciąg znaków lub węzeł) | `{  "mathjs": "OperatorNode",  "op": "/",  "fn": "divide",  "args": [    {      "mathjs": "ConstantNode",      "value": 1    },    {      "mathjs": "OperatorNode",      "op": "+",      "fn": "add",      "args": [        {          "mathjs": "SymbolNode",          "name": "x"        },        {          "mathjs": "ConstantNode",          "value": 1        }      ],      "implicit": false,      "isPercentage": false    }  ],  "implicit": false,  "isPercentage": false}` |
| **resolve** | Zastępuje symbole w wyrażeniu wartościami z podanego zakresu. | `resolve('x + y', {x:2, y:3})` | wyrażenie (ciąg znaków lub węzeł), zakres (obiekt) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "ConstantNode",      "value": 2    },    {      "mathjs": "ConstantNode",      "value": 3    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplify** | Upraszcza drzewo wyrażeń (łączy wyrazy podobne itp.). | `simplify('2x + 3x')` | wyrażenie (ciąg znaków lub węzeł) | `{  "mathjs": "OperatorNode",  "op": "*",  "fn": "multiply",  "args": [    {      "mathjs": "ConstantNode",      "value": 5    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **simplifyCore** | Wykonuje jednoprzebiegowe uproszczenie, często stosowane w sytuacjach wymagających wysokiej wydajności. | `simplifyCore('x+x')` | wyrażenie (ciąg znaków lub węzeł) | `{  "mathjs": "OperatorNode",  "op": "+",  "fn": "add",  "args": [    {      "mathjs": "SymbolNode",      "name": "x"    },    {      "mathjs": "SymbolNode",      "name": "x"    }  ],  "implicit": false,  "isPercentage": false}` |
| **slu** | Oblicza rzadki rozkład LU z pełnym wyborem elementu głównego. | `slu(sparse([[4,3], [6, 3]]), 1, 0.001)` | A (tablica lub macierz), porządek (ciąg znaków), próg (liczba) | `{  "L": {    "mathjs": "SparseMatrix",    "values": [      1,      1.5,      1    ],    "index": [      0,      1,      1    ],    "ptr": [      0,      2,      3    ],    "size": [      2,      2    ]  },  "U": {    "mathjs": "SparseMatrix",    "values": [      4,      3,      -1.5    ],    "index": [      0,      0,      1    ],    "ptr": [      0,      1,      3    ],    "size": [      2,      2    ]  },  "p": [    0,    1  ],  "q": [    0,    1  ]}` |
| **symbolicEqual** | Sprawdza, czy dwa wyrażenia są symbolicznie równe. | `symbolicEqual('x+x', '2x')` | wyrażenie1 (ciąg znaków lub węzeł), wyrażenie2 (ciąg znaków lub węzeł) | `true` |
| **usolve** | Rozwiązuje układ równań liniowych metodą podstawiania wstecz. | `usolve([[1,2],[0,1]], [3,4])` | U (tablica lub macierz), b (tablica lub macierz) | `[  [    -5  ],  [    4  ]]` |
| **usolveAll** | Znajduje wszystkie rozwiązania układu równań liniowych metodą podstawiania wstecz. | `usolveAll([[1,2],[0,1]], [3,4])` | U (tablica lub macierz), b (tablica lub macierz) | `[  [    [      -5    ],    [      4    ]  ]]` |

### Arytmetyka

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| --- | --- | --- | --- | --- |
| **abs** | Oblicza wartość bezwzględną liczby. | `abs(-3.2)` | x (liczba, Complex, tablica lub macierz) | `3.2` |
| **add** | Dodaje dwie lub więcej wartości (x + y). | `add(2, 3)` | x, y, ... (liczba, tablica lub macierz) | `5` |
| **cbrt** | Oblicza pierwiastek sześcienny liczby, opcjonalnie zwracając wszystkie pierwiastki.