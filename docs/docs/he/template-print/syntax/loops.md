:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

## עיבוד לולאות

עיבוד לולאות משמש לעיבוד חוזר של נתונים ממערכים או אובייקטים, על ידי הגדרת סמני התחלה וסיום לזיהוי התוכן שיש לחזור עליו. להלן מתוארים מספר תרחישים נפוצים.

### מעבר על מערכים

#### 1. תיאור תחביר

- השתמשו בתג `{d.array[i].property}` כדי להגדיר את פריט הלולאה הנוכחי, ובתג `{d.array[i+1].property}` כדי לציין את הפריט הבא שיסמן את אזור הלולאה.
- במהלך הלולאה, השורה הראשונה (חלק ה-`[i]`) משמשת אוטומטית כתבנית לחזרה; יש לכתוב את דוגמת הלולאה פעם אחת בלבד בתבנית.

פורמט תחביר לדוגמה:
```
{d.arrayName[i].property}
{d.arrayName[i+1].property}
```

#### 2. דוגמה: לולאת מערך פשוטה

##### נתונים
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

##### תבנית
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### תוצאה
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. דוגמה: לולאת מערך מקוננת

מתאים למקרים שבהם מערך מכיל מערכים מקוננים; הקינון יכול להיות ברמות אינסופיות.

##### נתונים
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

##### תבנית
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### תוצאה
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. דוגמה: לולאה דו-כיוונית (תכונה מתקדמת, v4.8.0+)

לולאות דו-כיווניות מאפשרות איטרציה בו-זמנית על שורות ועמודות, מה שמתאים ליצירת טבלאות השוואה ופריסות מורכבות אחרות (הערה: נכון לעכשיו, חלק מהפורמטים נתמכים רשמית רק בתבניות DOCX, HTML ו-MD).

##### נתונים
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

##### תבנית
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### תוצאה
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. דוגמה: גישה לערכי איטרטור הלולאה (v4.0.0+)

בתוך לולאה, ניתן לגשת ישירות לאינדקס של האיטרציה הנוכחית, מה שמסייע לעמוד בדרישות עיצוב מיוחדות.

##### דוגמת תבנית
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> הערה: מספר הנקודות מציין את רמת האינדקס (לדוגמה, `.i` מייצג את הרמה הנוכחית, בעוד ש-`..i` מייצג את הרמה הקודמת). קיימת כרגע בעיה עם סדר הפוך; אנא עיינו בתיעוד הרשמי לפרטים.

### מעבר על אובייקטים

#### 1. תיאור תחביר

- עבור מאפיינים באובייקט, השתמשו ב-`.att` כדי לקבל את שם המאפיין וב-`.val` כדי לקבל את ערך המאפיין.
- במהלך האיטרציה, כל פריט מאפיין נסרק אחד אחד.

פורמט תחביר לדוגמה:
```
{d.objectName[i].att}  // property name
{d.objectName[i].val}  // property value
```

#### 2. דוגמה: איטרציה על מאפייני אובייקט

##### נתונים
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### תבנית
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### תוצאה
```
People namePeople age
paul10
jack20
bob30
```

### מיון

באמצעות תכונת המיון, ניתן למיין נתוני מערך ישירות בתוך התבנית.

#### 1. תיאור תחביר: מיון בסדר עולה

- השתמשו במאפיין כקריטריון מיון בתג הלולאה. פורמט התחביר הוא:
  ```
  {d.array[sortingAttribute, i].property}
  {d.array[sortingAttribute+1, i+1].property}
  ```
- לצורך קריטריוני מיון מרובים, הפרידו את המאפיינים בפסיקים בתוך הסוגריים המרובעים.

#### 2. דוגמה: מיון לפי מאפיין מספרי

##### נתונים
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

##### תבנית
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### תוצאה
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. דוגמה: מיון לפי מספר מאפיינים

##### נתונים
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

##### תבנית
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### תוצאה
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### סינון

סינון משמש לסינון שורות בלולאה בהתבסס על תנאים ספציפיים.

#### 1. תיאור תחביר: סינון מספרי

- הוסיפו תנאים בתג הלולאה (לדוגמה, `age > 19`). פורמט התחביר הוא:
  ```
  {d.array[i, condition].property}
  ```

#### 2. דוגמה: סינון מספרי

##### נתונים
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### תבנית
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### תוצאה
```
People
John
Bob
```

#### 3. תיאור תחביר: סינון מחרוזות

- ציינו תנאי מחרוזת באמצעות גרשים בודדים. לדוגמה:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. דוגמה: סינון מחרוזות

##### נתונים
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### תבנית
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### תוצאה
```
People
Falcon 9
Falcon Heavy
```

#### 5. תיאור תחביר: סינון N הפריטים הראשונים

- ניתן להשתמש באינדקס הלולאה `i` כדי לסנן את N האלמנטים הראשונים. לדוגמה:
  ```
  {d.array[i, i < N].property}
  ```

#### 6. דוגמה: סינון שני הפריטים הראשונים

##### נתונים
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### תבנית
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### תוצאה
```
People
Falcon 9
Model S
```

#### 7. תיאור תחביר: החרגת N הפריטים האחרונים

- השתמשו באינדקס שלילי `i` כדי לייצג פריטים מהסוף. לדוגמה:
  - `{d.array[i=-1].property}` מאחזר את הפריט האחרון.
  - `{d.array[i, i!=-1].property}` מדיר את הפריט האחרון.

#### 8. דוגמה: החרגת הפריט האחרון ושני הפריטים האחרונים

##### נתונים
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### תבנית
```
Last item: {d[i=-1].name}

Excluding the last item:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Excluding the last two items:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### תוצאה
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

#### 9. תיאור תחביר: סינון חכם

- באמצעות בלוקי תנאים חכמים, ניתן להסתיר שורה שלמה בהתבסס על תנאים מורכבים. לדוגמה:
  ```
  {d.array[i].property:ifIN('keyword'):drop(row)}
  ```

#### 10. דוגמה: סינון חכם

##### נתונים
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### תבנית
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### תוצאה
```
People
Model S
Model 3
```
(הערה: שורות המכילות "Falcon" בתבנית הוסרו על ידי תנאי הסינון החכם.)

### הסרת כפילויות

#### 1. תיאור תחביר

- באמצעות איטרטור מותאם אישית, ניתן לקבל פריטים ייחודיים (שאינם כפולים) בהתבסס על ערך מאפיין. התחביר דומה ללולאה רגילה אך מתעלם אוטומטית מפריטים כפולים.

פורמט לדוגמה:
```
{d.array[property].property}
{d.array[property+1].property}
```

#### 2. דוגמה: בחירת נתונים ייחודיים

##### נתונים
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### תבנית
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### תוצאה
```
Vehicles
Hyundai
Airbus
```