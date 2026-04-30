---
pkg: '@nocobase/plugin-app-supervisor'
title: "Manajemen Multi-app NocoBase"
description: "AppSupervisor manajemen multi-app: aplikasi tunggal, multi-app shared memory, deployment campuran multi-environment, skenario SaaS/multi-tenant, pembuatan, startup, stop, dan manajemen lifecycle aplikasi."
keywords: "multi-app,Multi App,AppSupervisor,shared memory,multi-environment deployment,SaaS,multi-tenant,NocoBase"
---
# Manajemen Multi-app

## Ikhtisar Fitur

Manajemen multi-app adalah solusi manajemen aplikasi terpadu yang disediakan NocoBase, untuk membuat dan mengelola beberapa instance aplikasi NocoBase yang terisolasi secara fisik dalam satu atau lebih environment runtime. Melalui Application Supervisor (AppSupervisor), pengguna dapat membuat dan memelihara beberapa aplikasi melalui entry point terpadu, memenuhi kebutuhan bisnis yang berbeda dan tahap skala yang berbeda.

## Aplikasi Tunggal

Pada fase awal proyek, sebagian besar pengguna akan memulai dengan aplikasi tunggal.

Dalam mode ini, sistem hanya perlu men-deploy satu instance NocoBase, semua fitur bisnis, data, dan pengguna berjalan di aplikasi yang sama. Deployment sederhana dan biaya konfigurasi rendah, sangat cocok untuk validasi prototipe, proyek kecil, atau tool internal.

Namun seiring kompleksitas bisnis yang berkembang, aplikasi tunggal akan menghadapi beberapa keterbatasan alami:

- Fitur yang terus bertumpuk membuat sistem menjadi gemuk
- Sulit melakukan isolasi antar bisnis yang berbeda
- Biaya ekspansi dan maintenance aplikasi terus meningkat

Pada saat ini, pengguna akan ingin memisahkan bisnis ke beberapa aplikasi, untuk meningkatkan maintainability dan skalabilitas sistem.

## Multi-app Shared Memory

Saat pengguna ingin memisahkan bisnis tetapi tidak ingin memperkenalkan arsitektur deployment dan operasi yang kompleks, dapat upgrade ke mode multi-app shared memory.

Dalam mode ini, satu instance NocoBase dapat menjalankan beberapa aplikasi secara bersamaan. Setiap aplikasi independen, dapat terhubung ke database independen, dapat dibuat, dijalankan, dan dihentikan secara terpisah, tetapi mereka berbagi proses dan ruang memory yang sama, pengguna tetap hanya perlu memelihara satu instance NocoBase.

![](https://static-docs.nocobase.com/202512231055907.png)

Pendekatan ini memberikan peningkatan yang jelas:

- Bisnis dapat dipisahkan berdasarkan dimensi aplikasi
- Fitur dan konfigurasi antar aplikasi menjadi lebih jelas
- Dibandingkan dengan solusi multi-process atau multi-container, penggunaan resource lebih rendah

Namun, karena semua aplikasi berjalan di proses yang sama, mereka akan berbagi resource seperti CPU dan memory. Anomali atau beban tinggi pada satu aplikasi dapat memengaruhi stabilitas aplikasi lain.

Saat jumlah aplikasi terus meningkat, atau ada kebutuhan yang lebih tinggi untuk isolasi dan stabilitas, perlu upgrade arsitektur lebih lanjut.

## Deployment Campuran Multi-Environment

Saat skala bisnis dan kompleksitas mencapai tingkat tertentu dan jumlah aplikasi perlu diperluas secara skala, mode multi-app shared memory akan menghadapi tantangan resource contention, stabilitas, dan keamanan. Pada tahap skala besar, pengguna dapat mempertimbangkan pendekatan deployment campuran multi-environment, untuk mendukung skenario bisnis yang lebih kompleks.

Inti dari arsitektur ini adalah memperkenalkan aplikasi entry point, yaitu men-deploy satu NocoBase sebagai pusat manajemen terpadu, sekaligus men-deploy beberapa NocoBase sebagai environment runtime aplikasi, untuk benar-benar menjalankan aplikasi bisnis.

Aplikasi entry point bertanggung jawab untuk:

- Pembuatan, konfigurasi, dan manajemen lifecycle aplikasi
- Distribusi command manajemen dan agregasi status

Environment instance aplikasi bertanggung jawab untuk:

- Benar-benar menampung dan menjalankan aplikasi bisnis melalui mode multi-app shared memory

Bagi pengguna, beberapa aplikasi tetap dapat dibuat dan dikelola melalui satu entry point, tetapi secara internal:

- Aplikasi yang berbeda dapat berjalan di node atau cluster yang berbeda
- Setiap aplikasi dapat menggunakan database dan middleware independen
- Dapat melakukan scaling atau mengisolasi aplikasi dengan beban tinggi sesuai kebutuhan

![](https://static-docs.nocobase.com/202512231215186.png)

Pendekatan ini cocok untuk platform SaaS, environment Demo dalam jumlah besar, atau skenario multi-tenant. Selain memastikan fleksibilitas, juga meningkatkan stabilitas dan operability sistem.
