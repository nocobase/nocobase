:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

### تنسيق المصفوفات

#### 1. :arrayJoin(separator, index, count)

##### شرح الصيغة
تدمج هذه الدالة مصفوفة من السلاسل النصية أو الأرقام في سلسلة نصية واحدة.  
المعلمات:
- `separator`: الفاصل (القيمة الافتراضية هي فاصلة `,`).
- `index`: اختياري، يحدد الفهرس الذي تبدأ منه عملية الدمج.
- `count`: اختياري، يحدد عدد العناصر المراد دمجها بدءًا من `index` (يمكن أن تكون قيمة سالبة للعد من النهاية).

##### مثال
```
['homer','bart','lisa']:arrayJoin()              // Outputs "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Outputs "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Outputs "homerbartlisa"
[10,50]:arrayJoin()                               // Outputs "10, 50"
[]:arrayJoin()                                    // Outputs ""
null:arrayJoin()                                  // Outputs null
{}:arrayJoin()                                    // Outputs {}
20:arrayJoin()                                    // Outputs 20
undefined:arrayJoin()                             // Outputs undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Outputs "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Outputs "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Outputs "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Outputs "homerbart"
```

##### النتيجة
تكون النتيجة سلسلة نصية تم إنشاؤها بدمج عناصر المصفوفة وفقًا للمعلمات المحددة.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### شرح الصيغة
تحول هذه الدالة مصفوفة من الكائنات إلى سلسلة نصية. لا تعالج الكائنات أو المصفوفات المتداخلة.  
المعلمات:
- `objSeparator`: الفاصل بين الكائنات (القيمة الافتراضية هي `, `).
- `attSeparator`: الفاصل بين سمات الكائنات (القيمة الافتراضية هي `:`).
- `attributes`: اختياري، قائمة بسمات الكائن المراد إخراجها.

##### مثال
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Outputs "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Outputs "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Outputs "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Outputs "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Outputs "2:homer"

['homer','bart','lisa']:arrayMap()    // Outputs "homer, bart, lisa"
[10,50]:arrayMap()                    // Outputs "10, 50"
[]:arrayMap()                         // Outputs ""
null:arrayMap()                       // Outputs null
{}:arrayMap()                         // Outputs {}
20:arrayMap()                         // Outputs 20
undefined:arrayMap()                  // Outputs undefined
```

##### النتيجة
تكون النتيجة سلسلة نصية تم إنشاؤها عن طريق ربط عناصر المصفوفة وتجاهل المحتوى المتداخل للكائنات.

#### 3. :count(start)

##### شرح الصيغة
تحسب هذه الدالة رقم الصف في المصفوفة وتخرج رقم الصف الحالي.  
على سبيل المثال:
```
{d[i].id:count()}
```  
بغض النظر عن قيمة `id`، فإنها تخرج عدد الصفوف الحالي.  
اعتبارًا من الإصدار v4.0.0، تم استبدال هذا المنسق داخليًا بـ `:cumCount`.

المعلمة:
- `start`: اختياري، القيمة الأولية للعد.

##### مثال ونتيجة
عند الاستخدام، ستعرض النتيجة رقم الصف وفقًا لترتيب عناصر المصفوفة.