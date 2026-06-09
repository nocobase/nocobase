---
title: "nb proxy caddy stop"
description: "Referensi perintah nb proxy caddy stop: hentikan proxy Caddy dengan driver saat ini."
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,stop"
---

# nb proxy caddy stop

Menghentikan proxy Caddy dengan driver saat ini.

## Penggunaan

```bash
nb proxy caddy stop
```

## Contoh

```bash
nb proxy caddy stop
```

## Catatan

- Dengan driver `local`, perintah ini menghentikan proses Caddy lokal
- Dengan driver `docker`, perintah ini menghentikan container proxy
- Jika proxy sudah berhenti, perintah akan memberi tahu bahwa proxy sudah berhenti

## Perintah terkait

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
