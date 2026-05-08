[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja-JP.md) | [Français](./README.fr.md) | [Español](./README.es.md) | [Português](./README.pt.md) | Bahasa Indonesia | [Tiếng Việt](./README.vi.md) | [Deutsch](./README.de.md)

https://github.com/user-attachments/assets/3b89d965-f60f-48e0-8110-24186c2911d2

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## Daftar Isi

- [Apa itu NocoBase](#apa-itu-nocobase)
- [Catatan rilis](#catatan-rilis)
- [Fitur utama](#fitur-utama)
- [Akses AI Agent](#akses-ai-agent)
- [Instalasi](#instalasi)

## Apa itu NocoBase

NocoBase adalah platform open source AI + no-code untuk membangun sistem bisnis dengan lebih cepat. Alih-alih membuat semuanya dari nol, AI bekerja di atas infrastruktur yang sudah teruji di produksi dan antarmuka visual WYSIWYG, sehingga Anda mendapatkan kecepatan sekaligus keandalan.

Situs resmi:  
https://www.nocobase.com/id

Demo online:  
https://demo.nocobase.com/new

Dokumentasi:  
https://docs.nocobase.com/

Forum:  
https://forum.nocobase.com/

Cerita pelanggan:  
https://www.nocobase.com/id/blog/tags/customer-stories

## Catatan rilis

[Catatan rilis](https://www.nocobase.com/id/blog/timeline) diperbarui secara berkala di blog.

## Fitur utama

### 1. Kolaboratif: AI dan manusia membangun bersama

Coding agent mendapatkan CLI dan skill yang lengkap, sementara manusia memakai antarmuka visual WYSIWYG. Keduanya bisa berkolaborasi dengan efisien.

#### Bangun dengan AI coding agent yang sudah Anda kenal

Dari deployment hingga sistem berjalan, semuanya bisa ditempuh dalam hitungan menit dengan agent populer.

- Kompatibel dengan agen populer seperti Claude Code, Cursor, Codex, OpenCode, dan TRAE
- Agen dapat menangani setup, pengembangan, migrasi, dan rilis dari awal sampai akhir

![coding-agent](https://static-docs.nocobase.com/coding-agent.png)

#### Bangun secara manual di antarmuka no-code WYSIWYG

Tanpa AI pun, tim tetap bisa membangun dan menyesuaikan semuanya secara visual.

- Beralih antara mode penggunaan dan mode konfigurasi hanya dengan satu klik
- Tinjau dan konfigurasikan model data, halaman, workflow, dan permission secara visual
- Dirancang untuk pengguna biasa, bukan hanya developer

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

#### Gabungkan pengembangan dengan AI dan pembangunan manual sesuai kebutuhan

Bagi pekerjaan dengan fleksibel: manusia menyempurnakan hasil AI, dan AI melanjutkan dari konfigurasi manusia.

- AI dapat dengan cepat membuat model data, halaman, dan workflow
- Manusia dapat dengan cepat menyempurnakan UI dan interaksi
- Berkolaborasi sesuai kebutuhan dan terus beriterasi

![ai-no-coding](https://static-docs.nocobase.com/ai-no-coding.png)

### 2. Cerdas: AI membantu menjalankan bisnis, bukan hanya membangun sistem

NocoBase memiliki pegawai AI bawaan, sehingga AI bisa bekerja langsung di dalam sistem.

#### Pegawai AI yang terintegrasi ke workflow bisnis

Pegawai AI otomatis memahami konteks bisnis dan mengeksekusi tugas langsung di dalam sistem.

- Di front-end, membantu analisis, tanya jawab, pengisian formulir, dan banyak lagi
- Di back-end, menangani pengenalan dokumen, pemantauan risiko, dan perutean tugas secara otomatis
- Terintegrasi dengan workflow, pegawai AI dapat ikut mengambil keputusan dan mengeksekusi pekerjaan

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

#### Antarmuka terbuka untuk ekosistem agent

MCP, HTTP API, CLI, dan skill yang kaya memungkinkan agent eksternal terhubung dengan aman.

- Platform seperti OpenClaw, Hermes, Dify, Coze, dan n8n terhubung melalui protokol standar
- Terhubung dengan Telegram, WhatsApp, Slack, dan Gmail untuk mengambil data, memicu aksi, dan menjalankan workflow bisnis
- Satu model antarmuka menjaga agen internal dan eksternal tetap berada dalam batas yang sama

![agents](https://static-docs.nocobase.com/f-agents-logos.jpeg)

#### Kontrol permission menjaga perilaku AI tetap terkendali

Setiap tindakan AI mengikuti aturan permission granular yang sama seperti pengguna manusia.

- Setiap pegawai AI memiliki role sendiri, dengan izin baca dan tulis hingga level field
- Audit log membuat setiap perubahan data dan pemicu workflow dapat ditelusuri
- Admin dapat menyesuaikan izin AI kapan saja agar batasnya tetap jelas

![permission](https://static-docs.nocobase.com/f-permission.png)

### 3. Andal: infrastruktur siap pakai untuk bisnis nyata

Model data, permission, dan workflow itu kompleks dan sensitif terhadap kesalahan.  
NocoBase menyediakannya sebagai infrastruktur bawaan yang sudah teruji di produksi.

#### Infrastruktur lengkap, tanpa memulai dari nol

Puluhan modul bawaan sudah mencakup kebutuhan paling umum dalam sistem bisnis.

- Data models, permissions, workflows, and audit logs work out of the box
- Proven in production, instead of regenerated as black-box code each time
- Built-in guardrails keep AI output aligned with the system architecture

![core](https://static-docs.nocobase.com/f-core.png)

#### Berbasis model data, dengan data terpisah dari UI

Data bisnis tetap berada dalam struktur relasional standar, terpisah dari lapisan antarmuka.

- Use the main database, external databases, and third-party APIs as data sources
- AI and people work on the same data model, so results stay transparent
- Your data always stays in your own database, without platform lock-in

![model](https://static-docs.nocobase.com/model.png)

#### Arsitektur plugin untuk pertumbuhan yang berkelanjutan

Dengan desain microkernel, semuanya dapat berkembang lewat plugin tanpa kehilangan kendali.

- New features are added through composable plugins with shared conventions
- Mix custom and official plugins to fit your business
- The same architecture applies to both AI-built and manually built plugins

![plugins](https://static-docs.nocobase.com/plugins.png)

## Akses AI Agent

Cara paling sederhana agar AI Agent bisa langsung ikut membangun dan mengoperasikan NocoBase adalah memasang NocoBase CLI, menyelesaikan inisialisasi, lalu memulai atau me-restart sesi agent di direktori kerja tersebut.

- NocoBase CLI bertanggung jawab untuk menginstal, menghubungkan, dan mengelola aplikasi NocoBase
- Saat inisialisasi, CLI akan otomatis memasang NocoBase Skills agar agent memahami model data, halaman, workflow, permission, dan plugin
- Setelah inisialisasi selesai, AI Agent bisa langsung bekerja selama workspace-nya menunjuk ke direktori itu

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
cd my-nocobase && codex
```

Detail:  
https://docs.nocobase.com/cn/ai/quick-start

## Instalasi

NocoBase mendukung tiga metode instalasi:

- <a target="_blank" href="https://docs.nocobase.com/id/welcome/getting-started/installation/docker-compose">Instal dengan Docker (disarankan)</a>

  Metode ini paling cocok untuk skenario no-code dan tidak memerlukan penulisan kode. Untuk upgrade, cukup ambil image terbaru lalu restart.

- <a target="_blank" href="https://docs.nocobase.com/id/welcome/getting-started/installation/create-nocobase-app">Instal dengan create-nocobase-app</a>

  Kode bisnis proyek Anda tetap sepenuhnya terpisah dan cocok untuk pengembangan low-code.

- <a target="_blank" href="https://docs.nocobase.com/id/welcome/getting-started/installation/git-clone">Instal dari source code Git</a>

  Jika Anda ingin mencoba versi terbaru yang belum dirilis, atau berkontribusi dengan memodifikasi dan melakukan debug langsung pada source code, metode ini paling disarankan. Cara ini membutuhkan kemampuan pengembangan yang lebih tinggi, dan Anda dapat menarik update terbaru melalui Git saat kodenya berubah.
