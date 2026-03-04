:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/window).
:::

# window

يمكن الوصول إلى الخصائص التالية مباشرة عبر `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (يُسمح فقط بـ `http:` أو `https:` أو `about:blank`)
* `location` (للقراءة فقط، يدعم التنقل الآمن)
* `navigator`

يتم دعم إمكانيات إنشاء واستعلام DOM الأساسية والآمنة فقط:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`