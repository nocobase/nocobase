# Node Karyawan AI

## Pengantar

Node Karyawan AI digunakan dalam Workflow untuk menugaskan Karyawan AI menyelesaikan tugas tertentu kemudian menghasilkan output informasi terstruktur.

Setelah membuat Workflow, dapat memilih Node Karyawan AI saat menambahkan Node Workflow.

![20260420142250](https://static-docs.nocobase.com/20260420142250.png)

## Konfigurasi Node
### Persiapan

Sebelum mengonfigurasi Node Karyawan AI, perlu memahami terlebih dahulu cara membangun Workflow, cara mengonfigurasi LLM Service, serta peran Karyawan AI bawaan dan cara membuat Karyawan AI.

Dapat melihat dokumentasi berikut:
  - [Workflow](/workflow)
  - [Konfigurasi LLM Service](/ai-employees/features/llm-service)
  - [Karyawan AI Bawaan](/ai-employees/features/built-in-employee)
  - [Buat Karyawan AI](/ai-employees/features/new-ai-employees)

### Tugas
#### Pilih Karyawan AI

Pilih satu Karyawan AI untuk bertanggung jawab atas tugas Node ini. Pilih dari daftar dropdown satu Karyawan AI bawaan yang sudah diaktifkan dalam sistem atau Karyawan AI yang Anda buat sendiri.

![20260420143554](https://static-docs.nocobase.com/20260420143554.png)

#### Pilih Model

Pilih model bahasa besar yang menggerakkan Karyawan AI. Pilih dari daftar dropdown satu model yang disediakan oleh LLM Service yang sudah dikonfigurasi dalam sistem.

![20260420145057](https://static-docs.nocobase.com/20260420145057.png)

#### Pilih Operator

Pilih satu Pengguna dalam sistem untuk memberikan Permission akses data ke Karyawan AI, saat Karyawan AI mengakses data akan dibatasi dalam cakupan Permission Pengguna tersebut.

Jika trigger menyediakan operator (seperti `Custom action event`), maka prioritaskan menggunakan Permission operator tersebut.

![20260420145244](https://static-docs.nocobase.com/20260420145244.png)

#### Prompt dan Deskripsi Tugas

`Background` akan menjadi prompt sistem yang dikirim ke AI, biasanya digunakan untuk mendeskripsikan informasi latar belakang tugas dan kondisi kendala.

`Default user message` adalah prompt Pengguna yang dikirim ke AI, biasanya mendeskripsikan konten tugas, memberi tahu AI apa yang harus dilakukan.

![20260420174515](https://static-docs.nocobase.com/20260420174515.png)

#### Attachment

`Attachments` akan dikirim bersama dengan `Default user message` ke AI. Biasanya adalah dokumen atau gambar yang perlu diproses tugas.

Attachment mendukung dua tipe:

1. `File(load via Files collection)` Menggunakan primary key untuk mendapatkan data dari tabel file tertentu sebagai attachment yang dikirim ke AI.

![20260420150933](https://static-docs.nocobase.com/20260420150933.png)

2. `File via URL` Mendapatkan file dari URL tertentu dan menggunakannya sebagai attachment yang dikirim ke AI.

![20260420151702](https://static-docs.nocobase.com/20260420151702.png)

#### Skills dan Tools

Biasanya satu Karyawan AI akan terikat dengan beberapa Skills dan tools, di sini dapat membatasi hanya menggunakan beberapa Skills atau tools dalam tugas saat ini.

Default adalah `Preset`, menggunakan Skills dan tools preset Karyawan AI. Atur sebagai `Customer` dapat memilih hanya menggunakan beberapa Skills atau tools Karyawan AI.

![20260426231701](https://static-docs.nocobase.com/20260426231701.png)

#### Pencarian Web

Switch `Web search` mengontrol apakah AI Node saat ini menggunakan kemampuan pencarian web, tentang pencarian web Karyawan AI lihat: [Pencarian Web](/ai-employees/features/web-search)

![20260426231945](https://static-docs.nocobase.com/20260426231945.png)

### Feedback dan Notifikasi
#### Output Terstruktur

Pengguna dapat mendefinisikan struktur data output akhir Node Karyawan AI sesuai standar [JSON Schema](https://json-schema.org/).

![20260426232117](https://static-docs.nocobase.com/20260426232117.png)

Node lain dalam Workflow saat mendapatkan data Node Karyawan AI juga akan menghasilkan opsi sesuai `JSON Schema` ini.

![20260426232509](https://static-docs.nocobase.com/20260426232509.png)

##### Nilai Default

Secara default disediakan definisi `JSON Schema` berikut, ini mendefinisikan satu objek, objek berisi satu properti bernama result dengan tipe string. Dan properti tersebut diatur dengan satu judul: Result.

```json
{
  "type": "object",
  "properties": {
    "result": {
      "title": "Result",
      "type": "string",
      "description": "The text message sent to the user"
    }
  }
}
```

Berdasarkan definisi ini, Node Karyawan AI akan menghasilkan data struktur JSON yang sesuai dengan definisi.

```json
{
  result: "Some text generated from LLM "
}
```

#### Pengaturan Persetujuan

Node mendukung tiga mode persetujuan

- `No required` Konten output AI tidak perlu review manual. Setelah AI selesai menghasilkan output, Workflow secara otomatis melanjutkan alur.
- `Human decision` Konten output AI harus diberitahukan kepada reviewer untuk review manual, setelah review manual Workflow baru melanjutkan alur.
- `AI decision` AI memutuskan apakah memberitahu reviewer untuk melakukan review manual terhadap konten output.

![20260426232232](https://static-docs.nocobase.com/20260426232232.png)

Jika mode persetujuan bukan `No required`, maka harus mengonfigurasi satu atau lebih reviewer untuk Node.

Saat AI dalam Node Karyawan AI selesai menghasilkan semua konten, akan mengirim notifikasi ke semua reviewer yang dikonfigurasi untuk Node tersebut. Hanya perlu satu dari reviewer yang diberitahu menyelesaikan operasi persetujuan, Workflow dapat melanjutkan alur.

![20260426232319](https://static-docs.nocobase.com/20260426232319.png)
