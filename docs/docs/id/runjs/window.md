---
title: "Objek Global window RunJS"
description: "Pada RunJS, window menyediakan API dasar seperti setTimeout, setInterval, console, createElement, dibatasi oleh sandbox keamanan dengan beberapa kemampuan yang tidak tersedia."
keywords: "window,setTimeout,console,createElement,sandbox RunJS,objek global,NocoBase"
---

# window

Properti berikut dapat diakses langsung melalui `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (hanya mengizinkan `http:` / `https:` / `about:blank`)
* `location` (read-only, mendukung navigasi aman)
* `navigator`

Hanya mendukung kemampuan kueri dan pembuatan DOM dasar dan aman:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`
