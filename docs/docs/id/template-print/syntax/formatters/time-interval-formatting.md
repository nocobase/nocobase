---
title: "Template Print - Format Interval Waktu"
description: "Formatter Format Interval Waktu Template Print: formatI memformat durasi, mendukung format output human, second, minute, dll."
keywords: "Template Print,Interval Waktu,formatI,NocoBase"
---

### Format Interval Waktu

#### 1. :formatI(patternOut, patternIn)

##### Penjelasan Sintaks
Memformat durasi atau interval, format output yang didukung termasuk:
- `human+`, `human` (cocok untuk tampilan yang manusiawi)
- Serta `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)`, dll. (atau singkatannya).

Parameter:
- patternOut: Format output (contoh `'second'`, `'human+'`, dll.)
- patternIn: Opsional, unit input (contoh `'milliseconds'`, `'s'`, dll.)

##### Contoh
```
2000:formatI('second')       // Output 2
2000:formatI('seconds')      // Output 2
2000:formatI('s')            // Output 2
3600000:formatI('minute')    // Output 60
3600000:formatI('hour')      // Output 1
2419200000:formatI('days')   // Output 28

// Tampilan manusiawi:
2000:formatI('human')        // Output "a few seconds"
2000:formatI('human+')       // Output "in a few seconds"
-2000:formatI('human+')      // Output "a few seconds ago"

// Contoh konversi unit:
60:formatI('ms', 'minute')   // Output 3600000
4:formatI('ms', 'weeks')      // Output 2419200000
'P1M':formatI('ms')          // Output 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Output 10296.085
```

##### Hasil
Hasil output ditampilkan sebagai durasi atau interval yang sesuai berdasarkan nilai input dan konversi unit.


