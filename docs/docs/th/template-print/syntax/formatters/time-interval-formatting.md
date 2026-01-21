:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


### การจัดรูปแบบระยะเวลา

#### 1. :formatI(patternOut, patternIn)

##### คำอธิบายรูปแบบการใช้งาน
ใช้สำหรับจัดรูปแบบระยะเวลาหรือช่วงเวลา โดยรองรับรูปแบบเอาต์พุตดังต่อไปนี้ครับ/ค่ะ:
- `human+` หรือ `human` (เหมาะสำหรับการแสดงผลที่อ่านง่ายสำหรับมนุษย์)
- รวมถึงหน่วยต่าง ๆ เช่น `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (หรือตัวย่อของหน่วยเหล่านั้น) ครับ/ค่ะ

พารามิเตอร์:
- **patternOut:** รูปแบบเอาต์พุตที่ต้องการ (เช่น `'second'` หรือ `'human+'`) ครับ/ค่ะ
- **patternIn:** (ไม่บังคับ) หน่วยของค่าอินพุต (เช่น `'milliseconds'` หรือ `'s'`) ครับ/ค่ะ

##### ตัวอย่างการใช้งาน
```
// สภาพแวดล้อมตัวอย่าง: ตัวเลือก API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Outputs 2
2000:formatI('seconds')      // Outputs 2
2000:formatI('s')            // Outputs 2
3600000:formatI('minute')    // Outputs 60
3600000:formatI('hour')      // Outputs 1
2419200000:formatI('days')   // Outputs 28

// ตัวอย่างภาษาฝรั่งเศส:
2000:formatI('human')        // Outputs "quelques secondes"
2000:formatI('human+')       // Outputs "dans quelques secondes"
-2000:formatI('human+')      // Outputs "il y a quelques secondes"

// ตัวอย่างภาษาอังกฤษ:
2000:formatI('human')        // Outputs "a few seconds"
2000:formatI('human+')       // Outputs "in a few seconds"
-2000:formatI('human+')      // Outputs "a few seconds ago"

// ตัวอย่างการแปลงหน่วย:
60:formatI('ms', 'minute')   // Outputs 3600000
4:formatI('ms', 'weeks')      // Outputs 2419200000
'P1M':formatI('ms')          // Outputs 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Outputs 10296.085
```

##### ผลลัพธ์
ผลลัพธ์ที่ได้จะแสดงเป็นระยะเวลาหรือช่วงเวลาที่เหมาะสม โดยอิงจากค่าอินพุตและการแปลงหน่วยครับ/ค่ะ