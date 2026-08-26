---
title: "nb proxy nginx info"
description: "Referensi perintah nb proxy nginx info: tampilkan driver provider Nginx saat ini, path konfigurasi, dan detail runtime."
keywords: "nb proxy nginx info,NocoBase CLI,nginx,path,konfigurasi"
---

# nb proxy nginx info

Menampilkan driver provider Nginx saat ini, path konfigurasi, dan detail runtime.

## Penggunaan

```bash
nb proxy nginx info
```

## Output

Output biasanya mencakup field berikut:

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBinary` atau `container`
- `image`

Di mana:

- dengan driver `local`, output menampilkan `nginxBinary`
- dengan driver `docker`, output menampilkan `container` dan `image`

## Contoh

```bash
nb proxy nginx info
```

## Perintah terkait

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
