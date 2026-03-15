:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/window).
:::

# window

ניתן לגשת למאפיינים הבאים ישירות דרך `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (מותרים רק `http:`, `https:` או `about:blank`)
* `location` (לקריאה בלבד, תומך בניווט מאובטח)
* `navigator`

נתמכות רק יכולות בסיסיות ומאובטחות של שאילתות ויצירת DOM:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`