---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

Setelah Plugin layanan NocoBase MCP diaktifkan, aplikasi NocoBase akan menyediakan antarmuka layanan MCP ke luar, untuk klien MCP mengakses dan memanggil antarmuka NocoBase.

## Alamat Layanan

- Aplikasi utama:

  `http(s)://<host>:<port>/api/mcp`

- Sub-aplikasi:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Alamat ini menggunakan protokol transport `streamable HTTP`.

## Kemampuan yang Disediakan

### Tools Umum

Dapat digunakan untuk mengoperasikan tabel data

| Nama Tool          | Deskripsi Fungsi                                       |
| ------------------ | ------------------------------------------------------ |
| `resource_list`    | Mendapatkan daftar data                                |
| `resource_get`     | Mendapatkan detail data                                |
| `resource_create`  | Membuat data                                           |
| `resource_update`  | Memperbarui data                                       |
| `resource_destroy` | Menghapus data                                         |
| `resource_query`   | Query data, mendukung kondisi query kompleks, seperti agregasi, query relasi, dll |

### Antarmuka Inti NocoBase dan Berbagai Plugin

Mendukung mengontrol package mana saja yang antarmukanya diekspos MCP melalui request header `x-mcp-packages`, contohnya:

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

Request header ini mendukung pengiriman nama package lengkap, jika tidak menyertakan scope akan secara otomatis dilengkapi menjadi `@nocobase/`.

Secara default tidak memuat antarmuka package lain selain Tools umum, lebih disarankan menggunakan cara [NocoBase CLI](../quick-start.md) untuk mengoperasikan fungsi sistem lainnya.

Penjelasan package umum:

| Nama Package                           | Deskripsi Fungsi                                    |
| -------------------------------------- | --------------------------------------------------- |
| `@nocobase/plugin-data-source-main`    | Mengelola data source utama, termasuk membuat Collection, menambahkan Field, dll |
| `@nocobase/plugin-data-source-manager` | Mengelola data source, mendapatkan informasi data source yang tersedia |
| `@nocobase/plugin-workflow`            | Mengelola Workflow                                  |
| `@nocobase/plugin-acl`                 | Mengelola role dan Permission                       |
| `@nocobase/plugin-users`               | Mengelola Pengguna                                  |

Penjelasan package dan antarmuka terkait lainnya dapat dipelajari melalui Plugin [dokumentasi API](/integration/api-doc).

## Metode Autentikasi

### Autentikasi API Key

Memanggil antarmuka layanan MCP melalui API key yang dibuat oleh Plugin [API keys](/auth-verification/api-keys/index.md), Permission ditentukan oleh role yang terikat dengan API key.

### Autentikasi OAuth

Memanggil antarmuka layanan MCP melalui access token yang diperoleh setelah otorisasi autentikasi OAuth, Permission ditentukan oleh Pengguna yang diotorisasi. Jika Pengguna memiliki beberapa role, role pemanggil dapat diatur melalui request header `x-role`.

## Mulai Cepat

### Codex

#### Menggunakan Autentikasi API Key

Aktifkan terlebih dahulu Plugin API Keys, dan buat API Key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Menggunakan Autentikasi OAuth

Aktifkan terlebih dahulu Plugin IdP: OAuth.

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Menggunakan Autentikasi API Key

Aktifkan terlebih dahulu Plugin API Keys, dan buat API Key.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Menggunakan Autentikasi OAuth

Aktifkan terlebih dahulu Plugin IdP: OAuth.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

Setelah eksekusi selesai, buka Claude, pilih layanan MCP yang sesuai untuk login:

```bash
claude
/mcp
```

### OpenCode

#### Menggunakan Autentikasi API Key

Aktifkan terlebih dahulu Plugin API Keys, dan buat API Key. Konfigurasi `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <your_api_key>"
      }
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

#### Menggunakan Autentikasi OAuth

Aktifkan terlebih dahulu Plugin IdP: OAuth. Konfigurasi `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

Login autentikasi

```bash
opencode mcp auth nocobase
```

Debug

```bash
opencode mcp debug nocobase
```
