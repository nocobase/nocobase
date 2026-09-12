---
title: "Đối tượng toàn cục window trong RunJS"
description: "Trong RunJS, window cung cấp các API cơ bản như setTimeout, setInterval, console, createElement, bị giới hạn bởi sandbox an toàn, một số khả năng không khả dụng."
keywords: "window,setTimeout,console,createElement,sandbox RunJS,đối tượng toàn cục,NocoBase"
---

# window

Các thuộc tính sau có thể truy cập trực tiếp qua `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (chỉ cho phép `http:` / `https:` / `about:blank`)
* `location` (chỉ đọc, hỗ trợ điều hướng an toàn)
* `navigator`

Chỉ hỗ trợ khả năng truy vấn và tạo DOM cơ bản, an toàn:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`
