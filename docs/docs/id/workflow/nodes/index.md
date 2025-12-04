:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Gambaran Umum

Sebuah alur kerja biasanya terdiri dari beberapa langkah operasional yang saling terhubung. Setiap node merepresentasikan satu langkah operasional dan berfungsi sebagai unit logis dasar dalam proses. Sama seperti dalam bahasa pemrograman, berbagai jenis node merepresentasikan instruksi yang berbeda, yang menentukan perilaku node tersebut. Ketika alur kerja berjalan, sistem akan masuk ke setiap node secara berurutan dan menjalankan instruksinya.

:::info{title=Catatan}
Pemicu alur kerja bukanlah sebuah node. Pemicu hanya ditampilkan sebagai titik masuk dalam diagram alur, tetapi merupakan konsep yang berbeda dari node. Untuk detail lebih lanjut, silakan lihat konten [Pemicu](../triggers/index.md).
:::

Dari perspektif fungsional, node yang saat ini telah diimplementasikan dapat dibagi menjadi beberapa kategori utama (total 29 jenis node):

- Kecerdasan Buatan
  - [Model Bahasa Besar](../../ai-employees/workflow/nodes/llm/chat.md) (disediakan oleh plugin @nocobase/plugin-workflow-llm)
- Kontrol Alur
  - [Kondisi](./condition.md)
  - [Multi-kondisi](./multi-conditions.md)
  - [Perulangan](./loop.md) (disediakan oleh plugin @nocobase/plugin-workflow-loop)
  - [Variabel](./variable.md) (disediakan oleh plugin @nocobase/plugin-workflow-variable)
  - [Cabang Paralel](./parallel.md) (disediakan oleh plugin @nocobase/plugin-workflow-parallel)
  - [Panggil Alur Kerja](./subflow.md) (disediakan oleh plugin @nocobase/plugin-workflow-subflow)
  - [Output Alur Kerja](./output.md) (disediakan oleh plugin @nocobase/plugin-workflow-subflow)
  - [Pemetaan Variabel JSON](./json-variable-mapping.md) (disediakan oleh plugin @nocobase/plugin-workflow-json-variable-mapping)
  - [Penundaan](./delay.md) (disediakan oleh plugin @nocobase/plugin-workflow-delay)
  - [Akhiri Alur Kerja](./end.md)
- Perhitungan
  - [Perhitungan](./calculation.md)
  - [Perhitungan Tanggal](./date-calculation.md) (disediakan oleh plugin @nocobase/plugin-workflow-date-calculation)
  - [Perhitungan JSON](./json-query.md) (disediakan oleh plugin @nocobase/plugin-workflow-json-query)
- Aksi Koleksi
  - [Buat Data](./create.md)
  - [Perbarui Data](./update.md)
  - [Hapus Data](./destroy.md)
  - [Kueri Data](./query.md)
  - [Kueri Agregat](./aggregate.md) (disediakan oleh plugin @nocobase/plugin-workflow-aggregate)
  - [Aksi SQL](./sql.md) (disediakan oleh plugin @nocobase/plugin-workflow-sql)
- Penanganan Manual
  - [Penanganan Manual](./manual.md) (disediakan oleh plugin @nocobase/plugin-workflow-manual)
  - [Persetujuan](./approval.md) (disediakan oleh plugin @nocobase/plugin-workflow-approval)
  - [CC](./cc.md) (disediakan oleh plugin @nocobase/plugin-workflow-cc)
- Ekstensi Lainnya
  - [Permintaan HTTP](./request.md) (disediakan oleh plugin @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (disediakan oleh plugin @nocobase/plugin-workflow-javascript)
  - [Kirim Email](./mailer.md) (disediakan oleh plugin @nocobase/plugin-workflow-mailer)
  - [Notifikasi](../../notification-manager/index.md#工作流通知节点) (disediakan oleh plugin @nocobase/plugin-workflow-notification)
  - [Respons](./response.md) (disediakan oleh plugin @nocobase/plugin-workflow-webhook)
  - [Pesan Respons](./response-message.md) (disediakan oleh plugin @nocobase/plugin-workflow-response-message)