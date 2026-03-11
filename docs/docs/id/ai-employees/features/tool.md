:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/ai-employees/features/tool).
:::

# Menggunakan Skill

Skill (Alat) menentukan apa yang dapat dilakukan oleh AI Employee.

## Struktur Skill

Halaman Skill terbagi menjadi tiga bagian:

1. `General skills`: dibagikan ke semua AI Employee, bersifat baca-saja (read-only).
2. `Employee-specific skills`: khusus untuk karyawan saat ini, biasanya bersifat baca-saja.
3. `Custom skills`: skill kustom yang dapat ditambah/dihapus dan dikonfigurasi dengan izin default.

![skills-three-sections-general-specific-custom.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-three-sections-general-specific-custom.png)

## Izin Skill

Izin skill diseragamkan menjadi:

- `Ask`: meminta konfirmasi sebelum dijalankan.
- `Allow`: mengizinkan pemanggilan langsung.

Rekomendasi: gunakan `Ask` secara default untuk skill yang memodifikasi data.

![skills-permission-ask-allow-segmented.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-permission-ask-allow-segmented.png)

## Menambah dan Mengelola

Klik `Add skill` pada bagian `Custom skills` untuk menambahkan skill dan mengonfigurasi izin berdasarkan risiko bisnis.