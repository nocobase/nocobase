:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

## معالجة الحلقات التكرارية

تُستخدم معالجة الحلقات التكرارية لعرض البيانات بشكل متكرر من المصفوفات أو الكائنات، وذلك بتحديد علامات بداية ونهاية الحلقة لتحديد المحتوى الذي يحتاج إلى التكرار. فيما يلي، سنستعرض عدة حالات شائعة.

### التكرار عبر المصفوفات

#### 1. شرح بناء الجملة

- استخدم الوسم `{d.array[i].property}` لتعريف العنصر الحالي في الحلقة، واستخدم `{d.array[i+1].property}` لتحديد العنصر التالي لتمييز منطقة الحلقة.
- أثناء التكرار، تُستخدم السطر الأول (الجزء `[i]`) تلقائيًا كقالب للتكرار؛ تحتاج فقط لكتابة مثال الحلقة مرة واحدة في القالب.

مثال على تنسيق بناء الجملة:
```
{d.arrayName[i].property}
{d.arrayName[i+1].property}
```

#### 2. مثال: حلقة مصفوفة بسيطة

##### البيانات
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### القالب
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### النتيجة
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. مثال: حلقة مصفوفة متداخلة

مناسب للحالات التي تحتوي فيها المصفوفة على مصفوفات متداخلة؛ يمكن أن يكون التداخل على مستويات غير محدودة.

##### البيانات
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### القالب
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### النتيجة
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. مثال: حلقة ثنائية الاتجاه (ميزة متقدمة، v4.8.0+)

تتيح الحلقات ثنائية الاتجاه التكرار عبر الصفوف والأعمدة في آن واحد، مما يجعلها مناسبة لإنشاء جداول المقارنة والتخطيطات المعقدة الأخرى (ملاحظة: حاليًا، بعض التنسيقات مدعومة رسميًا فقط في قوالب DOCX و HTML و MD).

##### البيانات
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### القالب
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### النتيجة
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. مثال: الوصول إلى قيم مُكرِّر الحلقة (v4.0.0+)

يمكنك الوصول مباشرة إلى فهرس التكرار الحالي داخل الحلقة، مما يساعد في تلبية متطلبات التنسيق الخاصة.

##### مثال القالب
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> ملاحظة: يشير عدد النقاط إلى مستوى الفهرس (على سبيل المثال، `.i` يمثل المستوى الحالي، بينما `..i` يمثل المستوى السابق). توجد حاليًا مشكلة في الترتيب العكسي؛ يُرجى الرجوع إلى الوثائق الرسمية للحصول على التفاصيل.

### التكرار عبر الكائنات

#### 1. شرح بناء الجملة

- بالنسبة للخصائص في الكائن، يمكنك استخدام `.att` للحصول على اسم الخاصية، واستخدام `.val` للحصول على قيمة الخاصية.
- أثناء التكرار، يتم المرور على كل عنصر خاصية على حدة.

مثال على تنسيق بناء الجملة:
```
{d.objectName[i].att}  // اسم الخاصية
{d.objectName[i].val}  // قيمة الخاصية
```

#### 2. مثال: التكرار عبر خصائص الكائن

##### البيانات
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### القالب
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### النتيجة
```
People namePeople age
paul10
jack20
bob30
```

### معالجة الفرز

باستخدام ميزة الفرز، يمكنك فرز بيانات المصفوفة مباشرة داخل القالب.

#### 1. شرح بناء الجملة: الفرز التصاعدي

- استخدم خاصية كمعيار للفرز في وسم الحلقة. تنسيق بناء الجملة هو:
  ```
  {d.array[sortingAttribute, i].property}
  {d.array[sortingAttribute+1, i+1].property}
  ```
- لعدة معايير فرز، افصل الخصائص بفاصلات داخل الأقواس المربعة.

#### 2. مثال: الفرز حسب خاصية رقمية

##### البيانات
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### القالب
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### النتيجة
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. مثال: الفرز حسب خصائص متعددة

##### البيانات
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### القالب
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### النتيجة
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### معالجة التصفية

تُستخدم معالجة التصفية لاستبعاد صفوف البيانات في حلقة بناءً على شروط محددة.

#### 1. شرح بناء الجملة: التصفية الرقمية

- أضف شروطًا في وسم الحلقة (على سبيل المثال، `age > 19`). تنسيق بناء الجملة هو:
  ```
  {d.array[i, condition].property}
  ```

#### 2. مثال: التصفية الرقمية

##### البيانات
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### القالب
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### النتيجة
```
People
John
Bob
```

#### 3. شرح بناء الجملة: التصفية النصية

- حدد الشروط النصية باستخدام علامات اقتباس مفردة. على سبيل المثال:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. مثال: التصفية النصية

##### البيانات
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### القالب
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### النتيجة
```
People
Falcon 9
Falcon Heavy
```

#### 5. شرح بناء الجملة: تصفية أول N عنصر

- يمكنك استخدام فهرس الحلقة `i` لتصفية أول N عنصر. على سبيل المثال:
  ```
  {d.array[i, i < N].property}
  ```

#### 6. مثال: تصفية أول عنصرين

##### البيانات
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### القالب
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### النتيجة
```
People
Falcon 9
Model S
```

#### 7. شرح بناء الجملة: استبعاد آخر N عنصر

- استخدم الفهرسة السالبة `i` لتمثيل العناصر من النهاية. على سبيل المثال:
  - `{d.array[i=-1].property}` يسترجع العنصر الأخير.
  - `{d.array[i, i!=-1].property}` يستبعد العنصر الأخير.

#### 8. مثال: استبعاد العنصر الأخير وآخر عنصرين

##### البيانات
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### القالب
```
Last item: {d[i=-1].name}

Excluding the last item:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Excluding the last two items:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### النتيجة
```
Last item: Falcon Heavy

Excluding the last item:
Falcon 9
Model S
Model 3

Excluding the last two items:
Falcon 9
Model S
```

#### 9. شرح بناء الجملة: التصفية الذكية

- باستخدام كتل الشروط الذكية، يمكنك إخفاء صف كامل بناءً على شروط معقدة. على سبيل المثال:
  ```
  {d.array[i].property:ifIN('keyword'):drop(row)}
  ```

#### 10. مثال: التصفية الذكية

##### البيانات
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### القالب
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### النتيجة
```
People
Model S
Model 3
```
(ملاحظة: تم حذف الصفوف التي تحتوي على "Falcon" في القالب بواسطة شرط التصفية الذكية.)

### معالجة إزالة التكرار

#### 1. شرح بناء الجملة

- باستخدام مُكرِّر مخصص، يمكنك الحصول على عناصر فريدة (غير مكررة) بناءً على قيمة خاصية معينة. بناء الجملة مشابه للحلقة العادية ولكنه يتجاهل العناصر المكررة تلقائيًا.

مثال على التنسيق:
```
{d.array[property].property}
{d.array[property+1].property}
```

#### 2. مثال: اختيار بيانات فريدة

##### البيانات
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### القالب
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### النتيجة
```
Vehicles
Hyundai
Airbus
```