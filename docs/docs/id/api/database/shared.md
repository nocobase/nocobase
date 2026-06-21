---
title: "Parameter Bersama Repository"
description: "Parameter bersama dari method Repository NocoBase: values, whitelist, blacklist, transaction, dll."
keywords: "Repository,parameter bersama,CreateOptions,UpdateOptions,NocoBase"
---

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ---------------------- | ------------- | ------ | ----------------------------------------------- |
| `options.values` | `M` | `{}` | Objek data yang dimasukkan |
| `options.whitelist?` | `string[]` | - | Whitelist field `values`, hanya field di dalam whitelist yang akan disimpan |
| `options.blacklist?` | `string[]` | - | Blacklist field `values`, field di dalam blacklist tidak akan disimpan |
| `options.transaction?` | `Transaction` | - | Transaction |
