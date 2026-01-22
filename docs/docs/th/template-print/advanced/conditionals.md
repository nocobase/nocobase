:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


## การกำหนดเงื่อนไข

การกำหนดเงื่อนไขช่วยให้คุณสามารถควบคุมการแสดงผลหรือซ่อนเนื้อหาในเอกสารได้แบบไดนามิก โดยอิงตามค่าของข้อมูลครับ/ค่ะ มีวิธีการเขียนเงื่อนไขหลักๆ อยู่ 3 แบบดังนี้:

- **เงื่อนไขแบบอินไลน์ (Inline conditions)**: ใช้สำหรับแสดงผลข้อความโดยตรง (หรือแทนที่ด้วยข้อความอื่น) ครับ/ค่ะ
- **บล็อกเงื่อนไข (Conditional blocks)**: ใช้สำหรับแสดงผลหรือซ่อนเนื้อหาในส่วนต่างๆ ของเอกสาร เหมาะสำหรับแท็ก, ย่อหน้า, ตาราง หรือองค์ประกอบอื่นๆ จำนวนมากครับ/ค่ะ
- **เงื่อนไขอัจฉริยะ (Smart conditions)**: ใช้สำหรับลบหรือเก็บองค์ประกอบเป้าหมายโดยตรง (เช่น แถว, ย่อหน้า, รูปภาพ เป็นต้น) ด้วยแท็กเดียว ทำให้มีไวยากรณ์ที่กระชับกว่าครับ/ค่ะ

เงื่อนไขทั้งหมดจะเริ่มต้นด้วยตัวจัดรูปแบบการประเมินตรรกะ (เช่น `ifEQ`, `ifGT` เป็นต้น) และตามด้วยตัวจัดรูปแบบการดำเนินการ (เช่น `show`, `elseShow`, `drop`, `keep` เป็นต้น) ครับ/ค่ะ

### ภาพรวม

ตัวดำเนินการเชิงตรรกะและตัวจัดรูปแบบการดำเนินการที่รองรับในการกำหนดเงื่อนไข ได้แก่:

- **ตัวดำเนินการเชิงตรรกะ (Logical Operators)**
  - **`ifEQ(value)`**: ตรวจสอบว่าข้อมูลเท่ากับค่าที่ระบุหรือไม่
  - **`ifNE(value)`**: ตรวจสอบว่าข้อมูลไม่เท่ากับค่าที่ระบุหรือไม่
  - **`ifGT(value)`**: ตรวจสอบว่าข้อมูลมากกว่าค่าที่ระบุหรือไม่
  - **`ifGTE(value)`**: ตรวจสอบว่าข้อมูลมากกว่าหรือเท่ากับค่าที่ระบุหรือไม่
  - **`ifLT(value)`**: ตรวจสอบว่าข้อมูลน้อยกว่าค่าที่ระบุหรือไม่
  - **`ifLTE(value)`**: ตรวจสอบว่าข้อมูลน้อยกว่าหรือเท่ากับค่าที่ระบุหรือไม่
  - **`ifIN(value)`**: ตรวจสอบว่าข้อมูลมีอยู่ในอาร์เรย์หรือสตริงหรือไม่
  - **`ifNIN(value)`**: ตรวจสอบว่าข้อมูลไม่มีอยู่ในอาร์เรย์หรือสตริงหรือไม่
  - **`ifEM()`**: ตรวจสอบว่าข้อมูลว่างเปล่าหรือไม่ (เช่น `null`, `undefined`, สตริงว่าง, อาร์เรย์ว่าง หรืออ็อบเจกต์ว่าง)
  - **`ifNEM()`**: ตรวจสอบว่าข้อมูลไม่ว่างเปล่าหรือไม่
  - **`ifTE(type)`**: ตรวจสอบว่าประเภทข้อมูลเท่ากับประเภทที่ระบุหรือไม่ (เช่น `"string"`, `"number"`, `"boolean"` เป็นต้น)
  - **`and(value)`**: ตรรกะ "และ" ใช้สำหรับเชื่อมเงื่อนไขหลายรายการ
  - **`or(value)`**: ตรรกะ "หรือ" ใช้สำหรับเชื่อมเงื่อนไขหลายรายการ

- **ตัวจัดรูปแบบการดำเนินการ (Action Formatters)**
  - **`:show(text)` / `:elseShow(text)`**: ใช้ในเงื่อนไขแบบอินไลน์ เพื่อแสดงผลข้อความที่ระบุโดยตรง
  - **`:hideBegin` / `:hideEnd`** และ **`:showBegin` / `:showEnd`**: ใช้ในบล็อกเงื่อนไข เพื่อซ่อนหรือแสดงบล็อกเอกสาร
  - **`:drop(element)` / `:keep(element)`**: ใช้ในเงื่อนไขอัจฉริยะ เพื่อลบหรือเก็บองค์ประกอบเอกสารที่ระบุ

ในส่วนถัดไป เราจะมาดูไวยากรณ์โดยละเอียด ตัวอย่าง และผลลัพธ์ของการใช้งานแต่ละแบบกันครับ/ค่ะ

### เงื่อนไขแบบอินไลน์ (Inline Conditions)

#### 1. `:show(text)` / `:elseShow(text)`

##### ไวยากรณ์
```
{数据:条件:show(文本)}
{数据:条件:show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
สมมติว่าข้อมูลคือ:
```json
{
  "val2": 2,
  "val5": 5
}
```
เทมเพลตมีดังนี้:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### ผลลัพธ์
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (การกำหนดเงื่อนไขหลายรายการ)

##### ไวยากรณ์
ใช้ตัวจัดรูปแบบเงื่อนไขต่อเนื่องกันเพื่อสร้างโครงสร้างที่คล้ายกับ `switch-case`:
```
{数据:ifEQ(值1):show(结果1):ifEQ(值2):show(结果2):elseShow(默认结果)}
```
หรือใช้ตัวดำเนินการ `or` เพื่อให้ได้ผลลัพธ์เดียวกัน:
```
{数据:ifEQ(值1):show(结果1):or(数据):ifEQ(值2):show(结果2):elseShow(默认结果)}
```

##### ตัวอย่าง
ข้อมูล:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
เทมเพลต:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### ผลลัพธ์
```
val1 = A
val2 = B
val3 = C
```

#### 3. การกำหนดเงื่อนไขแบบหลายตัวแปร

##### ไวยากรณ์
ใช้ตัวดำเนินการเชิงตรรกะ `and`/`or` เพื่อทดสอบหลายตัวแปรได้:
```
{数据1:ifEQ(条件1):and(.数据2):ifEQ(条件2):show(结果):elseShow(替代结果)}
{数据1:ifEQ(条件1):or(.数据2):ifEQ(条件2):show(结果):elseShow(替代结果)}
```

##### ตัวอย่าง
ข้อมูล:
```json
{
  "val2": 2,
  "val5": 5
}
```
เทมเพลต:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### ผลลัพธ์
```
and = KO
or = OK
```

### ตัวดำเนินการเชิงตรรกะและตัวจัดรูปแบบ

ในส่วนถัดไป ตัวจัดรูปแบบที่อธิบายไว้จะใช้รูปแบบเงื่อนไขแบบอินไลน์ โดยมีไวยากรณ์ดังนี้:
```
{数据:格式器(参数):show(文本):elseShow(替代文本)}
```

#### 1. `:and(value)`

##### ไวยากรณ์
```
{数据:ifEQ(值):and(ข้อมูลใหม่หรือเงื่อนไข):ifGT(ค่าอื่น):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### ผลลัพธ์
หาก `d.car` เท่ากับ `'delorean'` และ `d.speed` มากกว่า 80 จะแสดงผลเป็น `TravelInTime` ครับ/ค่ะ มิฉะนั้นจะแสดงผลเป็น `StayHere`

#### 2. `:or(value)`

##### ไวยากรณ์
```
{数据:ifEQ(值):or(ข้อมูลใหม่หรือเงื่อนไข):ifGT(ค่าอื่น):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### ผลลัพธ์
หาก `d.car` เท่ากับ `'delorean'` หรือ `d.speed` มากกว่า 80 จะแสดงผลเป็น `TravelInTime` ครับ/ค่ะ มิฉะนั้นจะแสดงผลเป็น `StayHere`

#### 3. `:ifEM()`

##### ไวยากรณ์
```
{数据:ifEM():show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
สำหรับ `null` หรืออาร์เรย์ว่างเปล่า จะแสดงผลเป็น `Result true` ครับ/ค่ะ มิฉะนั้นจะแสดงผลเป็น `Result false`

#### 4. `:ifNEM()`

##### ไวยากรณ์
```
{数据:ifNEM():show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
สำหรับข้อมูลที่ไม่ว่างเปล่า (เช่น ตัวเลข 0 หรือสตริง 'homer') จะแสดงผลเป็น `Result true` ครับ/ค่ะ สำหรับข้อมูลที่ว่างเปล่าจะแสดงผลเป็น `Result false`

#### 5. `:ifEQ(value)`

##### ไวยากรณ์
```
{数据:ifEQ(值):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
หากข้อมูลเท่ากับค่าที่ระบุ จะแสดงผลเป็น `Result true` ครับ/ค่ะ มิฉะนั้นจะแสดงผลเป็น `Result false`

#### 6. `:ifNE(value)`

##### ไวยากรณ์
```
{数据:ifNE(值):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
ตัวอย่างแรกจะแสดงผลเป็น `Result false` ครับ/ค่ะ ส่วนตัวอย่างที่สองจะแสดงผลเป็น `Result true`

#### 7. `:ifGT(value)`

##### ไวยากรณ์
```
{数据:ifGT(值):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
ตัวอย่างแรกจะแสดงผลเป็น `Result true` ครับ/ค่ะ ส่วนตัวอย่างที่สองจะแสดงผลเป็น `Result false`

#### 8. `:ifGTE(value)`

##### ไวยากรณ์
```
{数据:ifGTE(值):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
ตัวอย่างแรกจะแสดงผลเป็น `Result true` ครับ/ค่ะ ส่วนตัวอย่างที่สองจะแสดงผลเป็น `Result false`

#### 9. `:ifLT(value)`

##### ไวยากรณ์
```
{数据:ifLT(值):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
ตัวอย่างแรกจะแสดงผลเป็น `Result true` ครับ/ค่ะ ส่วนตัวอย่างที่สองจะแสดงผลเป็น `Result false`

#### 10. `:ifLTE(value)`

##### ไวยากรณ์
```
{数据:ifLTE(值):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
ตัวอย่างแรกจะแสดงผลเป็น `Result true` ครับ/ค่ะ ส่วนตัวอย่างที่สองจะแสดงผลเป็น `Result false`

#### 11. `:ifIN(value)`

##### ไวยากรณ์
```
{数据:ifIN(值):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
ทั้งสองตัวอย่างจะแสดงผลเป็น `Result true` ครับ/ค่ะ (เนื่องจากสตริงมี 'is' และอาร์เรย์มี 2)

#### 12. `:ifNIN(value)`

##### ไวยากรณ์
```
{数据:ifNIN(值):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
ตัวอย่างแรกจะแสดงผลเป็น `Result false` ครับ/ค่ะ (เนื่องจากสตริงมี 'is') และตัวอย่างที่สองจะแสดงผลเป็น `Result false` (เนื่องจากอาร์เรย์มี 2)

#### 13. `:ifTE(type)`

##### ไวยากรณ์
```
{数据:ifTE('类型'):show(文本):elseShow(替代文本)}
```

##### ตัวอย่าง
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### ผลลัพธ์
ตัวอย่างแรกจะแสดงผลเป็น `Result true` ครับ/ค่ะ (เนื่องจาก 'homer' เป็นสตริง) และตัวอย่างที่สองจะแสดงผลเป็น `Result true` (เนื่องจาก 10.5 เป็นตัวเลข)

### บล็อกเงื่อนไข (Conditional Blocks)

บล็อกเงื่อนไขใช้สำหรับแสดงผลหรือซ่อนเนื้อหาในส่วนต่างๆ ของเอกสารครับ/ค่ะ มักใช้เพื่อครอบคลุมแท็กหลายรายการหรือข้อความทั้งบล็อก

#### 1. `:showBegin` / `:showEnd`

##### ไวยากรณ์
```
{ข้อมูล:ifEQ(เงื่อนไข):showBegin}
เนื้อหาบล็อกเอกสาร
{ข้อมูล:showEnd}
```

##### ตัวอย่าง
ข้อมูล:
```json
{
  "toBuy": true
}
```
เทมเพลต:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### ผลลัพธ์
เมื่อเงื่อนไขเป็นจริง เนื้อหาที่อยู่ตรงกลางจะแสดงผล:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. `:hideBegin` / `:hideEnd`

##### ไวยากรณ์
```
{ข้อมูล:ifEQ(เงื่อนไข):hideBegin}
เนื้อหาบล็อกเอกสาร
{ข้อมูล:hideEnd}
```

##### ตัวอย่าง
ข้อมูล:
```json
{
  "toBuy": true
}
```
เทมเพลต:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### ผลลัพธ์
เมื่อเงื่อนไขเป็นจริง เนื้อหาที่อยู่ตรงกลางจะถูกซ่อนไว้ ทำให้ได้ผลลัพธ์ดังนี้:
```
Banana
Grapes
```