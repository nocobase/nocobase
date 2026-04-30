---
title: "Ikhtisar Node Workflow"
description: "Node Workflow: 29 tipe Node seperti kontrol alur, komputasi, operasi data, kecerdasan buatan, kondisi, loop, pemrosesan manual, LLM."
keywords: "Node Workflow,kontrol alur,kondisi,loop,pemrosesan manual,operasi data,NocoBase"
---

# Ikhtisar

Sebuah workflow biasanya tersusun dari beberapa langkah operasi yang saling terhubung. Setiap Node mewakili satu langkah operasi dan merupakan unit logika dasar dalam alur. Seperti dalam bahasa pemrograman, tipe Node yang berbeda mewakili instruksi yang berbeda, yang menentukan perilaku Node tersebut. Saat alur dijalankan, sistem akan masuk ke setiap Node secara berurutan dan mengeksekusi instruksi pada Node tersebut.

:::info{title=Tips}
Trigger pada workflow bukan termasuk Node, hanya ditampilkan dalam diagram alur sebagai Node entry, tetapi merupakan konsep yang berbeda dari Node. Untuk detailnya silakan merujuk ke dokumentasi [Trigger](../triggers/index.md).
:::

Dari sudut pandang fungsi, Node yang sudah diimplementasikan saat ini dapat dibagi menjadi beberapa kategori (total 29 tipe Node):

- Kecerdasan Buatan
  - [Large Language Model](../../ai-employees/workflow/nodes/llm/chat.md) (disediakan oleh plugin @nocobase/plugin-workflow-llm)
- Kontrol Alur
  - [Kondisi](./condition.md)
  - [Cabang Multi-Kondisi](./multi-conditions.md)
  - [Loop](./loop.md) (disediakan oleh plugin @nocobase/plugin-workflow-loop)
  - [Variable](./variable.md) (disediakan oleh plugin @nocobase/plugin-workflow-variable)
  - [Cabang Paralel](./parallel.md) (disediakan oleh plugin @nocobase/plugin-workflow-parallel)
  - [Panggil Workflow](./subflow.md) (disediakan oleh plugin @nocobase/plugin-workflow-subflow)
  - [Output Alur](./output.md) (disediakan oleh plugin @nocobase/plugin-workflow-subflow)
  - [Pemetaan Variable JSON](./json-variable-mapping.md) (disediakan oleh plugin @nocobase/plugin-workflow-json-variable-mapping)
  - [Penundaan](./delay.md) (disediakan oleh plugin @nocobase/plugin-workflow-delay)
  - [Akhiri Alur](./end.md)
- Komputasi
  - [Komputasi](./calculation.md)
  - [Komputasi Tanggal](./date-calculation.md) (disediakan oleh plugin @nocobase/plugin-workflow-date-calculation)
  - [Komputasi JSON](./json-query.md) (disediakan oleh plugin @nocobase/plugin-workflow-json-query)
- Operasi Tabel Data
  - [Tambah Data](./create.md)
  - [Update Data](./update.md)
  - [Hapus Data](./destroy.md)
  - [Query Data](./query.md)
  - [Query Agregasi](./aggregate.md) (disediakan oleh plugin @nocobase/plugin-workflow-aggregate)
  - [Operasi SQL](./sql.md) (disediakan oleh plugin @nocobase/plugin-workflow-sql)
- Pemrosesan Manual
  - [Pemrosesan Manual](./manual.md) (disediakan oleh plugin @nocobase/plugin-workflow-manual)
  - [Persetujuan](./approval.md) (disediakan oleh plugin @nocobase/plugin-workflow-approval)
  - [CC](./cc.md) (disediakan oleh plugin @nocobase/plugin-workflow-cc)
- Ekstensi Lainnya
  - [HTTP Request](./request.md) (disediakan oleh plugin @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (disediakan oleh plugin @nocobase/plugin-workflow-javascript)
  - [Kirim Email](./mailer.md) (disediakan oleh plugin @nocobase/plugin-workflow-mailer)
  - [Notifikasi](../../notification-manager/index.md#工作流通知节点) (disediakan oleh plugin @nocobase/plugin-workflow-notification)
  - [Response](./response.md) (disediakan oleh plugin @nocobase/plugin-workflow-webhook)
  - [Pesan Response](./response-message.md) (disediakan oleh plugin @nocobase/plugin-workflow-response-message)
