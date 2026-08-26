---
pkg: '@nocobase/plugin-notification-manager'
title: "Ikhtisar Notification Manager"
description: "Notification Manager NocoBase: pusat notifikasi multi-channel, mendukung in-app message, email, WeCom, konfigurasi channel terpadu, manajemen pengiriman, log notifikasi, dapat diperluas dengan SMS, DingTalk, Feishu, dan channel lainnya."
keywords: "notification manager,in-app message,notifikasi email,WeCom,konfigurasi channel,log notifikasi,notifikasi workflow,NocoBase"
---

# Notification Manager

## Pengantar

Notification Manager adalah service terpusat yang mengintegrasikan berbagai channel notifikasi, menyediakan konfigurasi channel terpadu, manajemen pengiriman, dan pencatatan log, mendukung ekstensi yang fleksibel.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- Bagian ungu: Notification Manager, menyediakan service manajemen terpadu, mencakup fitur seperti konfigurasi channel, pencatatan log, channel notifikasi dapat diperluas;
- Bagian hijau: In-App Message, channel built-in, mendukung user menerima notifikasi pesan di dalam aplikasi;
- Bagian merah: Email, channel ekstensi, mendukung user menerima notifikasi melalui email.

## Manajemen Channel

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Saat ini channel yang didukung adalah:

- [In-App Message](/notification-manager/notification-in-app-message)
- [Email](/notification-manager/notification-email) (built-in transport SMTP)

Anda juga dapat memperluas lebih banyak channel notifikasi, lihat dokumen [Ekstensi Channel](/notification-manager/development/extension)

## Log Notifikasi

Mencatat secara detail status dan detail pengiriman setiap notifikasi, memudahkan analisis dan troubleshooting.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Node Notifikasi Workflow

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)
