---
title: "Internasionalisasi Plugin Karyawan AI"
description: "Menjelaskan file internasionalisasi, templat terjemahan, dan batasan saat ini untuk Tool, Skill, dan profil karyawan bawaan pada plugin Karyawan AI NocoBase."
keywords: "NocoBase,internasionalisasi plugin karyawan AI,pengenalan Tool,pengenalan Skill,locale"
---

# Internasionalisasi Plugin Karyawan AI

Teks antarmuka pengelolaan dalam plugin karyawan AI harus mengikuti bahasa antarmuka saat ini. Tool dan Skill dapat menggunakan file locale milik plugin melalui `introduction`, sedangkan kolom profil karyawan AI ditangani dengan cara berbeda.

## Konten yang perlu diinternasionalisasi

Biasanya, Anda perlu menginternasionalisasi teks yang ditampilkan kepada administrator atau pengguna:

- `introduction.title` dan `introduction.about` untuk Tool
- `introduction.title` dan `introduction.about` untuk Skill
- Teks pada kartu frontend, modal, dan tombol tindakan

`definition.name`, `definition.description`, deskripsi schema, isi Skill, dan system prompt karyawan AI terutama ditujukan untuk model. Jangan mengubah nama stabil Tool atau isi workflow hanya untuk menerjemahkan antarmuka.

## Menerjemahkan teks antarmuka pengelolaan Tool dan Skill

`introduction` pada Tool dapat menggunakan templat terjemahan `{{t(...)}}`:

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Gunakan format yang sama pada frontmatter `SKILLS.md` milik Skill:

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

Nilai `ns` harus sama dengan namespace internasionalisasi yang benar-benar digunakan plugin.

## Menambahkan file bahasa

File locale plugin disimpan di `src/locale/`. Gunakan key yang sama untuk setiap bahasa dan ubah hanya teks yang sesuai.

### Menambahkan teks bahasa Inggris

Tambahkan konten berikut ke `src/locale/en-US.json`:

```json
{
  "ai.tools.greetDeveloper.title": "Developer name check",
  "ai.tools.greetDeveloper.about": "Validate the developer name before writing a welcome message.",
  "ai.tools.developerChoice.title": "Developer choices",
  "ai.tools.developerChoice.about": "Ask the developer to choose the next plugin capability.",
  "ai.skills.welcomeDeveloper.title": "Developer welcome",
  "ai.skills.welcomeDeveloper.about": "Welcome a developer and ask what plugin capability they want to build."
}
```

### Menambahkan teks bahasa Tionghoa

Tambahkan konten berikut ke `src/locale/zh-CN.json`:

```json
{
  "ai.tools.greetDeveloper.title": "开发者姓名确认",
  "ai.tools.greetDeveloper.about": "在生成欢迎语之前确认开发者姓名。",
  "ai.tools.developerChoice.title": "开发方向选择",
  "ai.tools.developerChoice.about": "让开发者选择下一步要实现的插件能力。",
  "ai.skills.welcomeDeveloper.title": "欢迎开发者",
  "ai.skills.welcomeDeveloper.about": "欢迎开发者，并询问接下来要实现的插件能力。"
}
```

## Batasan profil karyawan AI saat ini

Kolom `nickname`, `position`, `bio`, dan `greeting` pada profil karyawan AI tidak menggunakan mekanisme templat `{{t(...)}}` di atas. Saat runtime, karyawan bawaan saat ini menerjemahkan string mentah tersebut dalam namespace `@nocobase/plugin-ai`, sehingga plugin pihak ketiga tidak boleh menganggap namespace kustom akan berlaku secara otomatis.

Jika Anda tidak menambahkan logika pelokalan terpisah, pilih satu bahasa default untuk profil karyawan dan letakkan teks antarmuka Tool, Skill, serta interaksi frontend dalam file locale milik plugin.

## Tautan terkait

- [Pengembangan Plugin Karyawan AI](./index.md) — Kembali ke ikhtisar panduan pengembangan
- [Mendefinisikan Tool Sisi Server](./define-tool.md) — Menggunakan templat terjemahan pada pengantar Tool
- [Mendefinisikan Skill](./define-skill.md) — Menggunakan templat terjemahan pada frontmatter Skill
- [Mendefinisikan Karyawan AI Bawaan](./define-ai-employee.md) — Mempelajari kolom profil karyawan
- [Menambahkan Interaksi Frontend ke Tool](./frontend-tool-ui.md) — Menambahkan terjemahan antarmuka pada kartu dan modal frontend
