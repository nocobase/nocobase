## Условные выражения

Условные выражения позволяют динамически управлять отображением или скрытием контента в документе на основе значений данных. Есть три основных способа задавать условия:

- **Встроенные условия**: выводить текст напрямую (или заменять его другим текстом).
- **Блоки условий**: показывать или скрывать участок документа; подходит для нескольких тегов, абзацев, таблиц и т. п.
- **Умные условия**: одной меткой удалять или сохранять целевые элементы документа (строки, абзацы, изображения и т. д.) — более лаконичный синтаксис.

Все условия начинаются с форматтера для логической проверки (например, `ifEQ`, `ifGT` и т. д.), после которого идут форматтеры действия (например `show`, `elseShow`, `drop`, `keep` и т. п.).

### Обзор

В условных выражениях поддерживаются следующие логические операторы и форматтеры действия:

- **Логические операторы**
  - **ifEQ(value)**: проверяет, что значение данных равно указанному.
  - **ifNE(value)**: проверяет, что значение данных не равно указанному.
  - **ifGT(value)**: проверяет, что значение данных больше указанного.
  - **ifGTE(value)**: проверяет, что значение данных больше или равно указанному.
  - **ifLT(value)**: проверяет, что значение данных меньше указанного.
  - **ifLTE(value)**: проверяет, что значение данных меньше или равно указанному.
  - **ifIN(value)**: проверяет, что значение данных содержится в массиве или строке.
  - **ifNIN(value)**: проверяет, что значение данных не содержится в массиве или строке.
  - **ifEM()**: проверяет, что значение пустое (например `null`, `undefined`, пустая строка, пустой массив или пустой объект).
  - **ifNEM()**: проверяет, что значение непустое.
  - **ifTE(type)**: проверяет, что тип данных равен указанному (например `string`, `number`, `boolean` и т. д.).
  - **and(value)**: логическое «И», используется для объединения нескольких условий.
  - **or(value)**: логическое «ИЛИ», используется для объединения нескольких условий.

- **Форматтеры действий**
  - **:show(text) / :elseShow(text)**: используются во встроенных условиях для прямого вывода указанного текста.
  - **:hideBegin / :hideEnd** и **:showBegin / :showEnd**: используются в блоках условий, чтобы скрывать или показывать части документа.
  - **:drop(element) / :keep(element)**: используются в умных условиях, чтобы удалять или сохранять указанные элементы документа.

В следующих разделах приведены подробный синтаксис, примеры и результаты для каждого способа использования.

### Встроенные условия

#### 1. :show(text) / :elseShow(text)

##### Синтаксис
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### Пример
Предположим, данные такие:
```json
{
  "val2": 2,
  "val5": 5
}
```
Шаблон:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Результат
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Несколько условий (switch-case)

##### Синтаксис
Используйте последовательные форматтеры условий, чтобы собрать структуру, похожую на switch-case:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
Или добейтесь того же с помощью оператора `or`:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
```

##### Пример
Данные:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Шаблон:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Результат
```
val1 = A
val2 = B
val3 = C
```

#### 3. Условия по нескольким переменным

##### Синтаксис
Используйте логические операторы `and`/`or`, чтобы проверять несколько переменных:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
```

##### Пример
Данные:
```json
{
  "val2": 2,
  "val5": 5
}
```
Шаблон:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Результат
```
and = KO
or = OK
```

### Логические операторы и форматтеры

В следующих разделах описанные форматтеры используют синтаксис встроенных условий в таком формате:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. :and(value)

##### Синтаксис
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Пример
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Результат
Если `d.car` равно `'delorean'` и `d.speed` больше 80, вывод будет `TravelInTime`; иначе — `StayHere`.

#### 2. :or(value)

##### Синтаксис
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Пример
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Результат
Если `d.car` равно `'delorean'` или `d.speed` больше 80, вывод будет `TravelInTime`; иначе — `StayHere`.

#### 3. :ifEM()

##### Синтаксис
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### Пример
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Результат
Для `null` или пустого массива вывод будет `Result true`; иначе — `Result false`.

#### 4. :ifNEM()

##### Синтаксис
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### Пример
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Результат
Для непустых данных (например числа 0 или строки `'homer'`) вывод будет `Result true`; для пустых данных — `Result false`.

#### 5. :ifEQ(value)

##### Синтаксис
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### Пример
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Результат
Если значение данных равно указанному, вывод будет `Result true`; иначе — `Result false`.

#### 6. :ifNE(value)

##### Синтаксис
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### Пример
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Результат
В первом примере выводится `Result false`, во втором — `Result true`.

#### 7. :ifGT(value)

##### Синтаксис
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### Пример
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Результат
В первом примере выводится `Result true`, во втором — `Result false`.

#### 8. :ifGTE(value)

##### Синтаксис
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### Пример
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Результат
В первом примере выводится `Result true`, во втором — `Result false`.

#### 9. :ifLT(value)

##### Синтаксис
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### Пример
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Результат
В первом примере выводится `Result true`, во втором — `Result false`.

#### 10. :ifLTE(value)

##### Синтаксис
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### Пример
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Результат
В первом примере выводится `Result true`, во втором — `Result false`.

#### 11. :ifIN(value)

##### Синтаксис
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### Пример
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Результат
Оба примера выводят `Result true` (потому что строка содержит `'is'`, а массив содержит 2).

#### 12. :ifNIN(value)

##### Синтаксис
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### Пример
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Результат
Первый пример выводит `Result false` (потому что строка содержит `'is'`), и второй пример тоже выводит `Result false` (потому что массив содержит 2).

#### 13. :ifTE(type)

##### Синтаксис
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### Пример
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Результат
В первом примере выводится `Result true` (так как `'homer'` — строка), во втором — `Result true` (так как 10.5 — число).

### Блоки условий

Блоки условий используются, чтобы показывать или скрывать участок документа. Обычно ими «оборачивают» несколько тегов или целый блок текста.

#### 1. :showBegin / :showEnd

##### Синтаксис
```
{data:ifEQ(condition):showBegin}
Document block content
{data:showEnd}
```

##### Пример
Данные:
```json
{
  "toBuy": true
}
```
Шаблон:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Результат
Если условие выполняется, содержимое между маркерами отображается:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Синтаксис
```
{data:ifEQ(condition):hideBegin}
Document block content
{data:hideEnd}
```

##### Пример
Данные:
```json
{
  "toBuy": true
}
```
Шаблон:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Результат
Если условие выполняется, содержимое между маркерами скрывается, в результате получится:
```
Banana
Grapes
```