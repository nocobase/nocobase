---
title: "Variabel Konteks"
description: "Gunakan kembali variabel konteks seperti ctx.user, ctx.page, nilai filter pada query data, konfigurasi Chart, dan event interaksi untuk merender dan terhubung berdasarkan konteks."
keywords: "variabel konteks,ctx.user,ctx.page,variabel filter,{{variabel}},data visualization,NocoBase"
---

# Menggunakan Variabel Konteks

Melalui variabel konteks, Anda dapat langsung menggunakan kembali informasi seperti halaman/pengguna/waktu/kondisi filter saat ini, untuk merender Chart dan linkage berdasarkan konteks.

## Cakupan Penggunaan
- Pada kondisi filter mode Builder query data, pilih variabel untuk digunakan.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Pada penulisan statement mode SQL query data, pilih variabel, sisipkan ekspresi (misalnya `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Pada mode Custom opsi Chart, langsung tulis ekspresi JS.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Pada event interaksi (misalnya klik drill-down untuk membuka popup dan meneruskan data), langsung tulis ekspresi JS.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Perhatian:**
- Jangan menambahkan tanda petik tunggal/ganda pada `{{ ... }}`; saat binding, sistem akan menangani dengan aman berdasarkan tipe variabel (string, number, time, NULL).
- Saat variabel adalah `NULL` atau tidak terdefinisi, gunakan `COALESCE(...)` atau `IS NULL` pada SQL untuk menangani logika nilai null secara eksplisit.
