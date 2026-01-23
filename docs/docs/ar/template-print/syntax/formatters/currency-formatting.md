:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

### تنسيق العملات

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### شرح الصيغة
تُستخدم هذه الدالة لتنسيق الأرقام المالية، ويمكنك من خلالها تحديد عدد المنازل العشرية أو تنسيق إخراج معين.

المعاملات:
- `precisionOrFormat`: معامل اختياري يمكن أن يكون رقمًا (لتحديد عدد المنازل العشرية) أو مُحدِّد تنسيق:
  - عدد صحيح: لتغيير دقة المنازل العشرية الافتراضية.
  - `'M'`: لإخراج اسم العملة الرئيسي فقط.
  - `'L'`: لإخراج الرقم مع رمز العملة (هذا هو التنسيق الافتراضي).
  - `'LL'`: لإخراج الرقم مع اسم العملة الرئيسي.
- `targetCurrency`: اختياري، رمز العملة المستهدفة (بالأحرف الكبيرة، مثل USD، EUR)، ويتجاوز هذا الإعدادات العامة.

##### مثال
```
// Example environment: API options { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Outputs "$2,000.91"
'1000.456':formatC('M')    // Outputs "dollars"
'1':formatC('M')           // Outputs "dollar"
'1000':formatC('L')        // Outputs "$2,000.00"
'1000':formatC('LL')       // Outputs "2,000.00 dollars"

// French example (when environment settings differ):
'1000.456':formatC()      // Outputs "2 000,91 ..."  
'1000.456':formatC()      // When the source and target currencies are the same, outputs "1 000,46 €"
```

##### النتيجة
تعتمد النتيجة على خيارات الـ API وإعدادات سعر الصرف.

#### 2. :convCurr(target, source)

##### شرح الصيغة
تحوّل هذه الدالة رقمًا من عملة إلى أخرى. يمكن تمرير سعر الصرف عبر خيارات الـ API أو تحديده عالميًا.
إذا لم يتم تحديد أي معاملات، فسيتم التحويل تلقائيًا من `options.currencySource` إلى `options.currencyTarget`.

المعاملات:
- `target`: اختياري، رمز العملة المستهدفة (القيمة الافتراضية هي `options.currencyTarget`).
- `source`: اختياري، رمز العملة المصدر (القيمة الافتراضية هي `options.currencySource`).

##### مثال
```
// Example environment: API options { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Outputs 20
1000:convCurr()            // Outputs 2000
1000:convCurr('EUR')        // Outputs 1000
1000:convCurr('USD')        // Outputs 2000
1000:convCurr('USD', 'USD') // Outputs 1000
```

##### النتيجة
النتيجة هي القيمة المالية المحوّلة.