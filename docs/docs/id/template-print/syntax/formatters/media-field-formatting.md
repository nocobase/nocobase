---
title: "Template Print - Format Field Media"
description: "Formatter Format Field Media Template Print: attachment dan signature digunakan untuk output gambar lampiran dan gambar tanda tangan tulisan tangan dalam Template."
keywords: "Template Print,Field Media,attachment,signature,NocoBase"
---

### Format Field Media

#### 1. :attachment

##### Penjelasan Sintaks

Output gambar dari field lampiran. Biasanya dapat langsung menyalin variabel dari "Field List".

##### Contoh

```text
{d.contractFiles[0].id:attachment()}
```

##### Hasil

Output gambar lampiran yang sesuai.

#### 2. :signature

##### Penjelasan Sintaks

Output gambar tanda tangan yang terkait dengan field tanda tangan tulisan tangan. Biasanya dapat langsung menyalin variabel dari "Field List".

##### Contoh

```text
{d.customerSignature:signature()}
```

##### Hasil

Output gambar tanda tangan tulisan tangan yang sesuai.

> **Perhatian:** Untuk field lampiran dan field tanda tangan tulisan tangan, disarankan untuk langsung menyalin variabel dari Field List di "Konfigurasi Template", untuk menghindari kesalahan penulisan manual.
