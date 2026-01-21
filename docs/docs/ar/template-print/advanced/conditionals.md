:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

## العبارات الشرطية

تتيح لك العبارات الشرطية التحكم ديناميكيًا في إظهار محتوى المستند أو إخفائه بناءً على قيم البيانات. تتوفر ثلاث طرق رئيسية لكتابة الشروط:

- **الشروط المضمنة (Inline conditions)**: تقوم بإخراج النص مباشرةً (أو استبداله بنص آخر).
- **الكتل الشرطية (Conditional blocks)**: لإظهار أو إخفاء قسم من المستند، وهي مناسبة لعدة وسوم (tags) أو فقرات أو جداول وما إلى ذلك.
- **الشروط الذكية (Smart conditions)**: لإزالة العناصر المستهدفة أو الاحتفاظ بها مباشرةً (مثل الصفوف أو الفقرات أو الصور وما إلى ذلك) باستخدام وسم واحد، مما يوفر بناء جملة أكثر إيجازًا.

تبدأ جميع الشروط بمُنسِّق تقييم منطقي (مثل ifEQ، ifGT، إلخ)، يتبعه مُنسِّقات الإجراءات (مثل show، elseShow، drop، keep، إلخ).

### نظرة عامة

تتضمن عوامل التشغيل المنطقية ومُنسِّقات الإجراءات المدعومة في العبارات الشرطية ما يلي:

- **عوامل التشغيل المنطقية (Logical Operators)**
  - **ifEQ(value)**: يتحقق مما إذا كانت البيانات تساوي القيمة المحددة.
  - **ifNE(value)**: يتحقق مما إذا كانت البيانات لا تساوي القيمة المحددة.
  - **ifGT(value)**: يتحقق مما إذا كانت البيانات أكبر من القيمة المحددة.
  - **ifGTE(value)**: يتحقق مما إذا كانت البيانات أكبر من أو تساوي القيمة المحددة.
  - **ifLT(value)**: يتحقق مما إذا كانت البيانات أصغر من القيمة المحددة.
  - **ifLTE(value)**: يتحقق مما إذا كانت البيانات أصغر من أو تساوي القيمة المحددة.
  - **ifIN(value)**: يتحقق مما إذا كانت البيانات موجودة في مصفوفة أو سلسلة نصية.
  - **ifNIN(value)**: يتحقق مما إذا كانت البيانات غير موجودة في مصفوفة أو سلسلة نصية.
  - **ifEM()**: يتحقق مما إذا كانت البيانات فارغة (مثل `null`، `undefined`، سلسلة نصية فارغة، مصفوفة فارغة، أو كائن فارغ).
  - **ifNEM()**: يتحقق مما إذا كانت البيانات غير فارغة.
  - **ifTE(type)**: يتحقق مما إذا كان نوع البيانات يساوي النوع المحدد (على سبيل المثال، "string"، "number"، "boolean"، إلخ).
  - **and(value)**: المنطق "و" (and)، يُستخدم لربط شروط متعددة.
  - **or(value)**: المنطق "أو" (or)، يُستخدم لربط شروط متعددة.

- **مُنسِّقات الإجراءات (Action Formatters)**
  - **:show(text) / :elseShow(text)**: تُستخدم في الشروط المضمنة لإخراج النص المحدد مباشرةً.
  - **:hideBegin / :hideEnd** و **:showBegin / :showEnd**: تُستخدم في الكتل الشرطية لإخفاء أو إظهار أقسام المستند.
  - **:drop(element) / :keep(element)**: تُستخدم في الشروط الذكية لإزالة عناصر المستند المحددة أو الاحتفاظ بها.

ستقدم الأقسام التالية بناء الجملة المفصل، والأمثلة، والنتائج لكل استخدام على حدة.

### الشروط المضمنة

#### 1. :show(text) / :elseShow(text)

##### بناء الجملة
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### مثال
لنفترض أن البيانات هي:
```json
{
  "val2": 2,
  "val5": 5
}
```
القالب كالتالي:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### النتيجة
```
val2 = 2
val2 = low
val5 = high
```

#### 2. حالة التبديل (Switch Case) (الشروط المتعددة)

##### بناء الجملة
استخدم مُنسِّقات الشروط المتتالية لبناء هيكل مشابه لحالة التبديل (switch-case):
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
أو حقق نفس الشيء باستخدام عامل التشغيل `or`:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
```

##### مثال
البيانات:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
القالب:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### النتيجة
```
val1 = A
val2 = B
val3 = C
```

#### 3. الشروط متعددة المتغيرات

##### بناء الجملة
استخدم عوامل التشغيل المنطقية `and`/`or` لاختبار متغيرات متعددة:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
```

##### مثال
البيانات:
```json
{
  "val2": 2,
  "val5": 5
}
```
القالب:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### النتيجة
```
and = KO
or = OK
```

### عوامل التشغيل المنطقية والمُنسِّقات

في الأقسام التالية، تستخدم المُنسِّقات الموصوفة بناء جملة الشروط المضمنة بالشكل التالي:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. :and(value)

##### بناء الجملة
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### مثال
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### النتيجة
إذا كانت قيمة `d.car` تساوي `'delorean'` و `d.speed` أكبر من 80، فسيكون الإخراج `TravelInTime`؛ وإلا، فسيكون الإخراج `StayHere`.

#### 2. :or(value)

##### بناء الجملة
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### مثال
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### النتيجة
إذا كانت قيمة `d.car` تساوي `'delorean'` أو `d.speed` أكبر من 80، فسيكون الإخراج `TravelInTime`؛ وإلا، فسيكون الإخراج `StayHere`.

#### 3. :ifEM()

##### بناء الجملة
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### مثال
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### النتيجة
بالنسبة لـ `null` أو مصفوفة فارغة، يكون الإخراج `Result true`؛ وإلا، فسيكون `Result false`.

#### 4. :ifNEM()

##### بناء الجملة
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### مثال
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### النتيجة
بالنسبة للبيانات غير الفارغة (مثل الرقم 0 أو السلسلة النصية 'homer')، يكون الإخراج `Result true`؛ أما بالنسبة للبيانات الفارغة، فسيكون الإخراج `Result false`.

#### 5. :ifEQ(value)

##### بناء الجملة
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### مثال
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### النتيجة
إذا كانت البيانات تساوي القيمة المحددة، فسيكون الإخراج `Result true`؛ وإلا، فسيكون `Result false`.

#### 6. :ifNE(value)

##### بناء الجملة
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### مثال
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### النتيجة
يُخرج المثال الأول `Result false`، بينما يُخرج المثال الثاني `Result true`.

#### 7. :ifGT(value)

##### بناء الجملة
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### مثال
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### النتيجة
يُخرج المثال الأول `Result true`، بينما يُخرج المثال الثاني `Result false`.

#### 8. :ifGTE(value)

##### بناء الجملة
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### مثال
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### النتيجة
يُخرج المثال الأول `Result true`، بينما يُخرج المثال الثاني `Result false`.

#### 9. :ifLT(value)

##### بناء الجملة
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### مثال
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### النتيجة
يُخرج المثال الأول `Result true`، بينما يُخرج المثال الثاني `Result false`.

#### 10. :ifLTE(value)

##### بناء الجملة
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### مثال
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### النتيجة
يُخرج المثال الأول `Result true`، بينما يُخرج المثال الثاني `Result false`.

#### 11. :ifIN(value)

##### بناء الجملة
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### مثال
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### النتيجة
يُخرج كلا المثالين `Result true` (لأن السلسلة النصية تحتوي على 'is'، والمصفوفة تحتوي على 2).

#### 12. :ifNIN(value)

##### بناء الجملة
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### مثال
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### النتيجة
يُخرج المثال الأول `Result false` (لأن السلسلة النصية تحتوي على 'is')، ويُخرج المثال الثاني `Result false` (لأن المصفوفة تحتوي على 2).

#### 13. :ifTE(type)

##### بناء الجملة
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### مثال
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### النتيجة
يُخرج المثال الأول `Result true` (بما أن 'homer' هي سلسلة نصية)، ويُخرج المثال الثاني `Result true` (بما أن 10.5 هو رقم).

### الكتل الشرطية

تُستخدم الكتل الشرطية لإظهار أو إخفاء قسم من المستند، وعادةً ما تُستخدم لتضمين عدة وسوم (tags) أو كتلة نصية كاملة.

#### 1. :showBegin / :showEnd

##### بناء الجملة
```
{data:ifEQ(condition):showBegin}
Document block content
{data:showEnd}
```

##### مثال
البيانات:
```json
{
  "toBuy": true
}
```
القالب:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### النتيجة
عندما يتم استيفاء الشرط، يتم عرض المحتوى الموجود بينهما:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### بناء الجملة
```
{data:ifEQ(condition):hideBegin}
Document block content
{data:hideEnd}
```

##### مثال
البيانات:
```json
{
  "toBuy": true
}
```
القالب:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### النتيجة
عندما يتم استيفاء الشرط، يتم إخفاء المحتوى الموجود بينهما، وتكون النتيجة:
```
Banana
Grapes
```