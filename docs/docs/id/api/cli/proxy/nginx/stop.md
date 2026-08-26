---
title: "nb proxy nginx stop"
description: "Referensi perintah nb proxy nginx stop: hentikan proxy Nginx dengan driver saat ini."
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,stop"
---

# nb proxy nginx stop

Menghentikan proxy Nginx dengan driver saat ini.

## Penggunaan

```bash
nb proxy nginx stop
```

## Contoh

```bash
nb proxy nginx stop
```

## Catatan

- Dengan driver `local`, perintah ini menghentikan proses Nginx lokal
- Dengan driver `docker`, perintah ini menghentikan container proxy
- Jika proxy sudah berhenti, perintah akan memberi tahu bahwa proxy sudah berhenti

## Perintah terkait

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
