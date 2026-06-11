---
pkg: "@nocobase/plugin-ai"
title: "Node LLM Workflow - Dialog Multimodal"
description: "Node dialog multimodal LLM Workflow: mengirim gambar ke model, mendukung format URL atau base64, pilih Field attachment atau record tabel file."
keywords: "Workflow,Node LLM,Multimodal,Input Gambar,NocoBase"
---

# Dialog Multimodal

<PluginInfo name="ai-ee" licenseBundled="true"></PluginInfo>

## Gambar

Dengan syarat model mendukung, Node LLM dapat mengirim gambar ke model. Saat menggunakan perlu memilih Field attachment melalui variabel, atau mengaitkan record tabel file. Saat memilih record tabel file dapat memilih hingga level objek record saja, juga dapat memilih hingga Field URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Format pengiriman gambar memiliki dua opsi:

- Kirim melalui URL - Selain gambar yang disimpan secara lokal, semua akan dikirim dalam bentuk URL, gambar yang disimpan secara lokal akan dikonversi ke format base64 untuk dikirim.
- Kirim melalui base64 - Tidak peduli storage lokal atau cloud, semua dikirim dalam format base64. Cocok untuk situasi di mana URL gambar tidak dapat diakses langsung oleh LLM Service online.

![](https://static-docs.nocobase.com/202503041200638.png)
