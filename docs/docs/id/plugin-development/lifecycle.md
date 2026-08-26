---
title: "Siklus Hidup Plugin"
description: "Hook siklus hidup plugin NocoBase: install, enable, disable, uninstall, load, loadAsync, waktu mounting server dan client."
keywords: "siklus hidup plugin,load,loadAsync,install,enable,disable,uninstall,NocoBase"
---

# Siklus Hidup

Merangkum hook siklus hidup plugin di sisi server dan client, untuk membantu developer mendaftarkan dan melepaskan resource dengan benar.

Dapat dibandingkan dengan siklus hidup FlowModel, untuk menonjolkan konsep yang umum.

## Konten yang Disarankan

- Callback yang dipicu saat instalasi, aktivasi, deaktivasi, dan uninstall plugin.
- Waktu mounting, update, dan destruksi component client.
- Saran untuk menangani tugas asinkron dan error dalam siklus hidup.
