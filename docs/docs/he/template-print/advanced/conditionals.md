:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

## הצהרות תנאי

הצהרות תנאי מאפשרות לכם לשלוט באופן דינמי בהצגה או הסתרה של תוכן במסמך, בהתבסס על ערכי נתונים. קיימות שלוש דרכים עיקריות לכתיבת תנאים:

- **תנאים מוטבעים (Inline)**: פלט טקסט ישירות (או מחליף אותו בטקסט אחר).
- **בלוקי תנאי**: מציגים או מסתירים קטע במסמך, מתאימים למספר תגיות, פסקאות, טבלאות ועוד.
- **תנאים חכמים**: מסירים או משאירים אלמנטים ממוקדים (כמו שורות, פסקאות, תמונות וכו') ישירות באמצעות תגית אחת, עם תחביר תמציתי יותר.

כל התנאים מתחילים במעצב (formatter) של הערכה לוגית (לדוגמה, `ifEQ`, `ifGT` וכו'), ולאחר מכן מגיעים מעצבי פעולה (כגון `show`, `elseShow`, `drop`, `keep` וכו').

### סקירה כללית

האופרטורים הלוגיים ומעצבי הפעולה הנתמכים בהצהרות תנאי כוללים:

- **אופרטורים לוגיים**
  - **`ifEQ(value)`**: בודק אם הנתונים שווים לערך שצוין.
  - **`ifNE(value)`**: בודק אם הנתונים אינם שווים לערך שצוין.
  - **`ifGT(value)`**: בודק אם הנתונים גדולים מהערך שצוין.
  - **`ifGTE(value)`**: בודק אם הנתונים גדולים או שווים לערך שצוין.
  - **`ifLT(value)`**: בודק אם הנתונים קטנים מהערך שצוין.
  - **`ifLTE(value)`**: בודק אם הנתונים קטנים או שווים לערך שצוין.
  - **`ifIN(value)`**: בודק אם הנתונים כלולים במערך או במחרוזת.
  - **`ifNIN(value)`**: בודק אם הנתונים אינם כלולים במערך או במחרוזת.
  - **`ifEM()`**: בודק אם הנתונים ריקים (לדוגמה, `null`, `undefined`, מחרוזת ריקה, מערך ריק או אובייקט ריק).
  - **`ifNEM()`**: בודק אם הנתונים אינם ריקים.
  - **`ifTE(type)`**: בודק אם סוג הנתונים שווה לסוג שצוין (לדוגמה, "string", "number", "boolean" וכו').
  - **`and(value)`**: אופרטור לוגי "וגם", המשמש לחיבור מספר תנאים.
  - **`or(value)`**: אופרטור לוגי "או", המשמש לחיבור מספר תנאים.

- **מעצבי פעולה**
  - **`:show(text)` / `:elseShow(text)`**: משמשים בתנאים מוטבעים לפלט ישיר של הטקסט שצוין.
  - **`:hideBegin` / `:hideEnd`** ו- **`:showBegin` / `:showEnd`**: משמשים בבלוקי תנאי להסתרה או הצגה של קטעי מסמך.
  - **`:drop(element)` / `:keep(element)`**: משמשים בתנאים חכמים להסרה או שמירה של אלמנטים ספציפיים במסמך.

הסעיפים הבאים מציגים את התחביר המפורט, דוגמאות ותוצאות עבור כל שימוש.

### תנאים מוטבעים

#### 1. `:show(text)` / `:elseShow(text)`

##### תחביר
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### דוגמה
נניח שהנתונים הם:
```json
{
  "val2": 2,
  "val5": 5
}
```
התבנית היא כדלקמן:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### תוצאה
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (תנאים מרובים)

##### תחביר
השתמשו במעצבי תנאי רציפים כדי לבנות מבנה הדומה ל-switch-case:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
או השיגו זאת באמצעות אופרטור ה-`or`:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
```

##### דוגמה
נתונים:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
תבנית:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### תוצאה
```
val1 = A
val2 = B
val3 = C
```

#### 3. תנאים מרובי משתנים

##### תחביר
השתמשו באופרטורים הלוגיים `and`/`or` כדי לבדוק מספר משתנים:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
```

##### דוגמה
נתונים:
```json
{
  "val2": 2,
  "val5": 5
}
```
תבנית:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### תוצאה
```
and = KO
or = OK
```

### אופרטורים לוגיים ומעצבים

בסעיפים הבאים, המעצבים המתוארים משתמשים בתחביר תנאי מוטבע בפורמט הבא:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. `:and(value)`

##### תחביר
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### תוצאה
אם `d.car` שווה ל-`'delorean'` וגם `d.speed` גדול מ-80, הפלט יהיה `TravelInTime`; אחרת, הפלט יהיה `StayHere`.

#### 2. `:or(value)`

##### תחביר
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### תוצאה
אם `d.car` שווה ל-`'delorean'` או `d.speed` גדול מ-80, הפלט יהיה `TravelInTime`; אחרת, הפלט יהיה `StayHere`.

#### 3. `:ifEM()`

##### תחביר
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### דוגמה
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### תוצאה
עבור `null` או מערך ריק, הפלט הוא `Result true`; אחרת, הפלט הוא `Result false`.

#### 4. `:ifNEM()`

##### תחביר
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### דוגמה
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### תוצאה
עבור נתונים שאינם ריקים (כגון המספר 0 או המחרוזת 'homer'), הפלט הוא `Result true`; עבור נתונים ריקים, הפלט הוא `Result false`.

#### 5. `:ifEQ(value)`

##### תחביר
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### תוצאה
אם הנתונים שווים לערך שצוין, הפלט הוא `Result true`; אחרת, הפלט הוא `Result false`.

#### 6. `:ifNE(value)`

##### תחביר
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### תוצאה
הדוגמה הראשונה מפיקה `Result false`, בעוד שהדוגמה השנייה מפיקה `Result true`.

#### 7. `:ifGT(value)`

##### תחביר
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### תוצאה
הדוגמה הראשונה מפיקה `Result true`, והשנייה מפיקה `Result false`.

#### 8. `:ifGTE(value)`

##### תחביר
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### תוצאה
הדוגמה הראשונה מפיקה `Result true`, בעוד שהשנייה מפיקה `Result false`.

#### 9. `:ifLT(value)`

##### תחביר
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### תוצאה
הדוגמה הראשונה מפיקה `Result true`, והשנייה מפיקה `Result false`.

#### 10. `:ifLTE(value)`

##### תחביר
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### תוצאה
הדוגמה הראשונה מפיקה `Result true`, והשנייה מפיקה `Result false`.

#### 11. `:ifIN(value)`

##### תחביר
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### תוצאה
שתי הדוגמאות מפיקות `Result true` (מכיוון שהמחרוזת מכילה 'is', והמערך מכיל 2).

#### 12. `:ifNIN(value)`

##### תחביר
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### דוגמה
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### תוצאה
הדוגמה הראשונה מפיקה `Result false` (מכיוון שהמחרוזת מכילה 'is'), והדוגמה השנייה מפיקה `Result false` (מכיוון שהמערך מכיל 2).

#### 13. `:ifTE(type)`

##### תחביר
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### דוגמה
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### תוצאה
הדוגמה הראשונה מפיקה `Result true` (מכיוון ש-'homer' היא מחרוזת), והשנייה מפיקה `Result true` (מכיוון ש-10.5 הוא מספר).

### בלוקי תנאי

בלוקי תנאי משמשים להצגה או הסתרה של קטע במסמך, ובדרך כלל עוטפים מספר תגיות או בלוק טקסט שלם.

#### 1. `:showBegin` / `:showEnd`

##### תחביר
```
{data:ifEQ(condition):showBegin}
Document block content
{data:showEnd}
```

##### דוגמה
נתונים:
```json
{
  "toBuy": true
}
```
תבנית:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### תוצאה
כאשר התנאי מתקיים, התוכן שבין התגיות מוצג:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. `:hideBegin` / `:hideEnd`

##### תחביר
```
{data:ifEQ(condition):hideBegin}
Document block content
{data:hideEnd}
```

##### דוגמה
נתונים:
```json
{
  "toBuy": true
}
```
תבנית:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### תוצאה
כאשר התנאי מתקיים, התוכן שבין התגיות מוסתר, והפלט הוא:
```
Banana
Grapes
```