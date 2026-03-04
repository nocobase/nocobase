:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/window)
:::

# window

คุณสมบัติต่อไปนี้สามารถเข้าถึงได้โดยตรงผ่าน `window` ครับ:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (อนุญาตเฉพาะ `http:`, `https:` หรือ `about:blank` เท่านั้น)
* `location` (อ่านอย่างเดียว และรองรับการนำทางที่ปลอดภัย)
* `navigator`

รองรับเฉพาะความสามารถในการสอบถาม (query) และสร้าง DOM พื้นฐานที่มีความปลอดภัยเท่านั้นครับ:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`