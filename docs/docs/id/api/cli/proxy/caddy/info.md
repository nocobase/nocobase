---
title: "nb proxy caddy info"
description: "Referensi perintah nb proxy caddy info: tampilkan driver provider Caddy saat ini, path konfigurasi, dan detail runtime."
keywords: "nb proxy caddy info,NocoBase CLI,caddy,path,konfigurasi"
---

# nb proxy caddy info

Menampilkan driver provider Caddy saat ini, path konfigurasi, dan detail runtime.

## Penggunaan

```bash
nb proxy caddy info
```

## Output

Output biasanya mencakup field berikut:

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBinary` atau `container`
- `image`

Di mana:

- dengan driver `local`, output menampilkan `caddyBinary`
- dengan driver `docker`, output menampilkan `container` dan `image`

## Contoh

```bash
nb proxy caddy info
```

## Perintah terkait

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
