---
pkg: "@nocobase/preset-cluster"
title: "Cluster Mode"
description: "Cluster mode NocoBase: deployment multi-instance, load balancing, shared storage, Redis cache dan message queue, distributed lock, deployment Kubernetes, untuk meningkatkan kemampuan pemrosesan high-concurrency."
keywords: "cluster mode,deployment multi-instance,load balancing,shared storage,Redis,Kubernetes,distributed lock,message queue,NocoBase"
---

# Cluster Mode

## Pengantar

NocoBase mendukung menjalankan aplikasi dalam cluster mode mulai dari versi v1.6.0. Saat aplikasi berjalan dalam cluster mode, aplikasi dapat menggunakan multiple instance dan multi-core mode untuk meningkatkan performa dalam menangani concurrent access.

## Arsitektur Sistem

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

* Application cluster: Cluster yang terdiri dari beberapa instance aplikasi NocoBase, dapat di-deploy di beberapa server, atau menjalankan beberapa proses dalam multi-core mode pada satu server.
* Database: Menyimpan data aplikasi, dapat berupa database single-node atau distributed database.
* Shared storage: Digunakan untuk menyimpan file dan data aplikasi, mendukung akses baca/tulis dari multiple instance.
* Middleware: Termasuk komponen cache, sync signal, message queue, dan distributed lock, mendukung komunikasi dan koordinasi antar application cluster.
* Load balancer: Bertanggung jawab mendistribusikan request client ke berbagai instance dalam application cluster, serta melakukan health check dan failover.

## Pelajari Lebih Lanjut

Dokumen ini hanya memperkenalkan konsep dasar dan komponen penyusun cluster mode NocoBase. Untuk deployment spesifik dan opsi konfigurasi lebih lanjut, Anda dapat merujuk ke dokumentasi berikut:

- Deployment
  - [Persiapan](./preparations)
  - [Deployment Kubernetes](./kubernetes)
  - [Alur Operasi](./operations)
- Lanjutan
  - [Pemisahan Service](./services-splitting)
- [Referensi Pengembangan](./development)
