---
title: "nb portal"
description: "Referensi perintah nb portal: mengelola workspace Portal, termasuk konfigurasi, pembuatan, pengembangan, sinkronisasi source, deployment, dan penghapusan."
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` mengelola workspace Portal. Portal dapat memiliki source frontend, jalur masuk, dan output deployment sendiri; grup perintah ini menghubungkan record Portal di NocoBase dengan workspace lokal dan source storage.

Alur umum adalah membuat workspace lokal, menjalankan mode pengembangan, mendorong perubahan source ke source storage, lalu build dan deploy. Jika mengambil alih Portal yang sudah ada, jalankan `pull` terlebih dahulu.

## Penggunaan

```bash
nb portal <command>
```

## Subperintah

| Perintah | Deskripsi |
| --- | --- |
| [`nb portal config`](./config.md) | Update portal source configuration |
| [`nb portal create`](./create.md) | Membuat workspace Portal lokal dari template dan membuat atau memperbarui record Portal |
| [`nb portal deploy`](./deploy.md) | Build dan deploy workspace Portal yang ditentukan |
| [`nb portal destroy`](./destroy.md) | Menghapus record Portal dan workspace lokal |
| [`nb portal dev`](./dev.md) | Memulai mode pengembangan untuk workspace Portal yang ditentukan |
| [`nb portal info`](./info.md) | Menampilkan detail record Portal dan workspace lokal yang ditentukan |
| [`nb portal list`](./list.md) | List portal records and development paths |
| [`nb portal pull`](./pull.md) | Menarik source Portal dari source storage ke workspace lokal |
| [`nb portal push`](./push.md) | Mendorong perubahan source Portal lokal ke source storage |

## Alur Umum

Membuat Portal bernama `customer`:

```bash
nb portal create customer -e dev --yes
```

Menjalankan mode pengembangan lokal:

```bash
nb portal dev customer -e dev --yes
```

Memeriksa workspace lokal dan record remote:

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

Push source dan deploy:

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

Mengambil alih Portal yang sudah ada:

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

Mengganti source storage:

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

Saat membuat Portal, pilih tempat source code dikelola:

| Mode | Deskripsi |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the Portal source should be reviewed, versioned, or built through an existing team workflow.

`nb portal config` updates source storage and Git settings in the remote portal record. The development workspace path is stored separately in the CLI env config as `portals.<portal>.path`, maintained by `create`, `pull --path`, or `config --path`.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Mode | Deskripsi |
| --- | --- |
| `local` | The workspace and app storage are on the current machine. `pull` writes source to the development path, and `deploy` builds from that path before syncing deployment output. |
| `docker` | The workspace is shared with the app through a Docker volume. `pull` writes source to the development path, and `deploy` builds from that path before syncing deployment output. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal management in the current version.

## Development And Deployment Paths

Portal development workspaces are created under the current working directory by default:

```text
./<portal>
```

Use `--path` with `create`, `pull`, or `config` to choose a different development path. Deployment output is still stored under the target app storage:

```text
<storagePath>/portals/<app>/<portal>
```

The main app access path is usually:

```text
<appPublicPath>/x/<portal>/
```

A sub-app access path is usually:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

## Env Confirmation

Most `nb portal` subcommands support `--env` and `--yes`:

| Parameter | Deskripsi |
| --- | --- |
| `--env`, `-e` | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | Skip cross-env confirmation when an explicit `--env` targets a different env from the current env. |

In scripts or AI agent workflows, pass `--env` and `--yes` explicitly to avoid stopping at an interactive confirmation.

## Perintah terkait

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
