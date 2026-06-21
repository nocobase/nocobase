---
title: "RunJS window 全局对象"
description: "RunJS 中 window 提供 setTimeout、setInterval、console、createElement 等基础 API，受安全沙箱限制，部分能力不可用。"
keywords: "window,setTimeout,console,createElement,RunJS 沙箱,全局对象,NocoBase"
---

# window

以下属性可直接通过 `window` 访问：

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open`（仅允许 `http:` / `https:` / `about:blank`）
* `location`（只读，支持安全导航）
* `navigator`

仅支持基础、安全的 DOM 查询与创建能力：

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`
