:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

### Pemformatan Interval Waktu

#### 1. :formatI(patternOut, patternIn)

##### Penjelasan Sintaksis
Memformat durasi atau interval. Format output yang didukung meliputi:
- `human+` atau `human` (cocok untuk tampilan yang mudah dibaca manusia)
- Satuan seperti `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (atau singkatannya).

Parameter:
- **patternOut:** Format output (misalnya, `'second'` atau `'human+'`).
- **patternIn:** Opsional, satuan input (misalnya, `'milliseconds'` atau `'s'`).

##### Contoh
```
// Lingkungan contoh: Opsi API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Menghasilkan 2
2000:formatI('seconds')      // Menghasilkan 2
2000:formatI('s')            // Menghasilkan 2
3600000:formatI('minute')    // Menghasilkan 60
3600000:formatI('hour')      // Menghasilkan 1
2419200000:formatI('days')   // Menghasilkan 28

// Contoh bahasa Prancis:
2000:formatI('human')        // Menghasilkan "quelques secondes"
2000:formatI('human+')       // Menghasilkan "dans quelques secondes"
-2000:formatI('human+')      // Menghasilkan "il y a quelques secondes"

// Contoh bahasa Inggris:
2000:formatI('human')        // Menghasilkan "a few seconds"
2000:formatI('human+')       // Menghasilkan "in a few seconds"
-2000:formatI('human+')      // Menghasilkan "a few seconds ago"

// Contoh konversi satuan:
60:formatI('ms', 'minute')   // Menghasilkan 3600000
4:formatI('ms', 'weeks')      // Menghasilkan 2419200000
'P1M':formatI('ms')          // Menghasilkan 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Menghasilkan 10296.085
```

##### Hasil
Hasil output ditampilkan sebagai durasi atau interval yang sesuai berdasarkan nilai input dan konversi satuan.