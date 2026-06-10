---
title: "Proxy sumber daya statis Caddy"
description: "Gunakan Caddy sebagai proxy sumber daya statis NocoBase untuk menyederhanakan HTTPS dan konfigurasi entry di produksi."
keywords: "Caddy,proxy sumber daya statis,reverse proxy,HTTPS otomatis,produksi,NocoBase"
---

# Caddy

Jika Anda sedang mencari cara mengatur proxy produksi untuk aplikasi NocoBase, sebaiknya mulai dari [Reverse proxy di produksi](../../../quickstart/production/reverse-proxy/index.md), lalu lanjut ke halaman [Caddy](../../../quickstart/production/reverse-proxy/caddy.md).

Bagian lama ini sebelumnya dipakai sebagai titik masuk untuk proxy sumber daya statis. Dokumentasi saat ini sudah disusun ulang di sekitar `nb proxy caddy`, yang secara terpadu mencakup pembuatan konfigurasi, runtime lokal atau Docker, entry HTTPS, serta rute `uploads`, `dist`, `api`, `ws`, dan SPA.
